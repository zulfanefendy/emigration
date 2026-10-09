"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { Prisma } from "@/generated/prisma/client";
import { wajibRole } from "@/lib/auth/dal";
import type { PegawaiLogin } from "@/lib/auth/dal";
import type { StateForm } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { keTanggalDb } from "@/lib/tanggal";

// Modul 2: verifikasi dokumen di loket (Flow Chart PM bagian 2).
//
// Status antrean : MENUNGGU -> DIPANGGIL -> SELESAI
//                  DIPANGGIL -> BATAL (tidak hadir) -> MENUNGGU (dikembalikan)
// Status verifikasi (baris terakhir verifikasi_cpmi milik CPMI):
//                  BELUM -> SEDANG ("Ambil") -> SUDAH_SELESAI ("Selesai")
//                                            -> PERLU_REVISI (catat revisi; antrean kembali MENUNGGU)
// Setelah revisi, "Ambil" berikutnya membuat baris verifikasi baru sehingga riwayat tetap tersimpan.

type Tx = Prisma.TransactionClient;

/** Hasil aksi tombol: sukses + pesan untuk toast, atau pesan gagal. */
type Hasil = StateForm;

const gagal = (pesan: string): Hasil => ({ sukses: false, pesan });

/**
 * Jalankan perubahan untuk satu CPMI dalam transaksi yang dikunci, supaya dua
 * verifikator yang menekan tombol bersamaan tidak saling menimpa.
 */
async function denganKunci<T>(kunci: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${kunci}))`;
    return fn(tx);
  });
}

async function ambilKeadaan(tx: Tx, idCpmi: string) {
  return tx.cpmi.findUnique({
    where: { idCpmi },
    select: {
      namaLengkap: true,
      antrian: { select: { idAntrian: true, noAntrian: true, statusAntrian: true } },
      verifikasi: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { idVerifikasi: true, statusVerifikasi: true, idVerifikator: true, verifikator: { select: { namaLengkap: true } } },
      },
    },
  });
}

function segarkan(idCpmi?: string) {
  revalidatePath("/dashboard/verifikasi");
  if (idCpmi) revalidatePath(`/dashboard/verifikasi/${idCpmi}`);
}

function bolehMengubah(pegawai: PegawaiLogin, idVerifikator: string | null) {
  return idVerifikator === pegawai.idPegawai || pegawai.roles.includes("ADMIN");
}

// ---------------------------------------------------------------------------
// Antrean
// ---------------------------------------------------------------------------

export type HasilPanggil = Hasil & { noAntrian?: string; idCpmi?: string };

/**
 * Panggil nomor MENUNGGU terkecil pada tanggal tersebut. CPMI yang sedang
 * memperbaiki berkas (pernah revisi) dilewati; mereka dipanggil manual lewat
 * tombol "Panggil" saat sudah kembali ke loket.
 */
export async function panggilBerikutnya(tanggal: string): Promise<HasilPanggil> {
  await wajibRole("VERIFIKATOR");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return gagal("Tanggal tidak valid.");

  const dipanggil = await denganKunci(`panggil:${tanggal}`, async (tx) => {
    const berikut = await tx.antrian.findFirst({
      where: {
        tanggalAntrian: keTanggalDb(tanggal),
        statusAntrian: "MENUNGGU",
        cpmi: { verifikasi: { none: { statusVerifikasi: "PERLU_REVISI" } } },
      },
      orderBy: { noAntrian: "asc" },
      select: { idAntrian: true, idCpmi: true, noAntrian: true },
    });
    if (!berikut) return null;
    await tx.antrian.update({ where: { idAntrian: berikut.idAntrian }, data: { statusAntrian: "DIPANGGIL" } });
    return berikut;
  });

  if (!dipanggil) return gagal("Tidak ada antrean yang menunggu.");
  segarkan(dipanggil.idCpmi);
  return { sukses: true, pesan: `Memanggil ${dipanggil.noAntrian}`, noAntrian: dipanggil.noAntrian, idCpmi: dipanggil.idCpmi };
}

/** Panggil nomor tertentu (mis. CPMI yang datang setelah nomornya dilewati). */
export async function panggil(idCpmi: string): Promise<HasilPanggil> {
  await wajibRole("VERIFIKATOR");
  const hasil = await denganKunci(`cpmi:${idCpmi}`, async (tx) => {
    const k = await ambilKeadaan(tx, idCpmi);
    if (!k?.antrian) return gagal("Antrean tidak ditemukan.");
    if (k.antrian.statusAntrian !== "MENUNGGU") return gagal(`${k.antrian.noAntrian} tidak sedang menunggu.`);
    await tx.antrian.update({ where: { idAntrian: k.antrian.idAntrian }, data: { statusAntrian: "DIPANGGIL" } });
    return { sukses: true, pesan: `Memanggil ${k.antrian.noAntrian}`, noAntrian: k.antrian.noAntrian };
  });
  if (hasil.sukses) segarkan(idCpmi);
  return hasil;
}

/** CPMI tidak datang saat dipanggil. */
export async function tandaiTidakHadir(idCpmi: string): Promise<Hasil> {
  await wajibRole("VERIFIKATOR");
  const hasil = await denganKunci(`cpmi:${idCpmi}`, async (tx) => {
    const k = await ambilKeadaan(tx, idCpmi);
    if (!k?.antrian) return gagal("Antrean tidak ditemukan.");
    if (k.antrian.statusAntrian !== "DIPANGGIL") return gagal("Hanya antrean yang sedang dipanggil yang bisa ditandai tidak hadir.");
    if (k.verifikasi[0]?.statusVerifikasi === "SEDANG_DIVERIFIKASI") return gagal("CPMI ini sedang diverifikasi.");
    await tx.antrian.update({ where: { idAntrian: k.antrian.idAntrian }, data: { statusAntrian: "BATAL" } });
    return { sukses: true, pesan: `${k.antrian.noAntrian} ditandai tidak hadir.` };
  });
  if (hasil.sukses) segarkan(idCpmi);
  return hasil;
}

/** CPMI yang tadi tidak hadir akhirnya datang: masukkan lagi ke antrean. */
export async function kembalikanKeAntrean(idCpmi: string): Promise<Hasil> {
  await wajibRole("VERIFIKATOR");
  const hasil = await denganKunci(`cpmi:${idCpmi}`, async (tx) => {
    const k = await ambilKeadaan(tx, idCpmi);
    if (!k?.antrian) return gagal("Antrean tidak ditemukan.");
    if (k.antrian.statusAntrian !== "BATAL") return gagal("Antrean ini tidak berstatus tidak hadir.");
    await tx.antrian.update({ where: { idAntrian: k.antrian.idAntrian }, data: { statusAntrian: "MENUNGGU" } });
    return { sukses: true, pesan: `${k.antrian.noAntrian} kembali ke antrean.` };
  });
  if (hasil.sukses) segarkan(idCpmi);
  return hasil;
}

// ---------------------------------------------------------------------------
// Verifikasi dokumen
// ---------------------------------------------------------------------------

/** "Ambil": verifikator mulai memeriksa berkas fisik CPMI yang sudah dipanggil. */
export async function ambilVerifikasi(idCpmi: string): Promise<Hasil> {
  const pegawai = await wajibRole("VERIFIKATOR");
  const hasil = await denganKunci(`cpmi:${idCpmi}`, async (tx) => {
    const k = await ambilKeadaan(tx, idCpmi);
    if (!k?.antrian) return gagal("Antrean tidak ditemukan.");
    if (k.antrian.statusAntrian !== "DIPANGGIL") return gagal("Panggil nomor antrean ini terlebih dahulu.");

    const v = k.verifikasi[0];
    const sekarang = new Date();
    const data = { statusVerifikasi: "SEDANG_DIVERIFIKASI" as const, idVerifikator: pegawai.idPegawai, waktuMulaiVerifikasi: sekarang };

    if (v?.statusVerifikasi === "SEDANG_DIVERIFIKASI") {
      return gagal(`Sudah diambil oleh ${v.verifikator?.namaLengkap ?? "verifikator lain"}.`);
    }
    if (v?.statusVerifikasi === "SUDAH_SELESAI") return gagal("CPMI ini sudah selesai diverifikasi.");

    if (v?.statusVerifikasi === "BELUM_DIVERIFIKASI") {
      await tx.verifikasiCpmi.update({ where: { idVerifikasi: v.idVerifikasi }, data });
    } else {
      // Belum pernah ada baris, atau verifikasi ulang setelah revisi.
      await tx.verifikasiCpmi.create({ data: { ...data, idCpmi } });
    }
    return { sukses: true, pesan: `Verifikasi ${k.namaLengkap} dimulai.` };
  });
  if (hasil.sukses) segarkan(idCpmi);
  return hasil;
}

/** "Selesai": berkas fisik valid. */
export async function selesaiVerifikasi(idCpmi: string, catatan?: string): Promise<Hasil> {
  const pegawai = await wajibRole("VERIFIKATOR");
  const hasil = await denganKunci(`cpmi:${idCpmi}`, async (tx) => {
    const k = await ambilKeadaan(tx, idCpmi);
    const v = k?.verifikasi[0];
    if (!k?.antrian || v?.statusVerifikasi !== "SEDANG_DIVERIFIKASI") return gagal("CPMI ini tidak sedang diverifikasi.");
    if (!bolehMengubah(pegawai, v.idVerifikator)) return gagal(`Sedang diverifikasi oleh ${v.verifikator?.namaLengkap}.`);

    await tx.verifikasiCpmi.update({
      where: { idVerifikasi: v.idVerifikasi },
      data: { statusVerifikasi: "SUDAH_SELESAI", waktuSelesaiVerifikasi: new Date(), catatanVerifikasi: catatan?.trim() || null },
    });
    await tx.antrian.update({ where: { idAntrian: k.antrian.idAntrian }, data: { statusAntrian: "SELESAI" } });
    return { sukses: true, pesan: `${k.namaLengkap} sudah diverifikasi.` };
  });
  if (hasil.sukses) segarkan(idCpmi);
  return hasil;
}

const SkemaRevisi = z.object({
  idCpmi: z.uuid(),
  catatan: z
    .string()
    .trim()
    .min(5, { error: "Tulis berkas apa yang perlu diperbaiki (minimal 5 karakter)." })
    .max(2000, { error: "Catatan maksimal 2000 karakter." }),
});

/** "Catat Revisi / Penolakan": berkas tidak valid, CPMI kembali ke antrean setelah memperbaiki. */
export async function revisiVerifikasi(_state: StateForm<"catatan"> | undefined, formData: FormData): Promise<StateForm<"catatan">> {
  const pegawai = await wajibRole("VERIFIKATOR");
  const input = SkemaRevisi.safeParse({ idCpmi: formData.get("idCpmi"), catatan: formData.get("catatan") });
  if (!input.success) return { errors: z.flattenError(input.error).fieldErrors };
  const { idCpmi, catatan } = input.data;

  const hasil = await denganKunci(`cpmi:${idCpmi}`, async (tx) => {
    const k = await ambilKeadaan(tx, idCpmi);
    const v = k?.verifikasi[0];
    if (!k?.antrian || v?.statusVerifikasi !== "SEDANG_DIVERIFIKASI") return gagal("CPMI ini tidak sedang diverifikasi.");
    if (!bolehMengubah(pegawai, v.idVerifikator)) return gagal(`Sedang diverifikasi oleh ${v.verifikator?.namaLengkap}.`);

    await tx.verifikasiCpmi.update({
      where: { idVerifikasi: v.idVerifikasi },
      data: { statusVerifikasi: "PERLU_REVISI", waktuSelesaiVerifikasi: new Date(), catatanVerifikasi: catatan },
    });
    await tx.antrian.update({ where: { idAntrian: k.antrian.idAntrian }, data: { statusAntrian: "MENUNGGU" } });
    return { sukses: true, pesan: "Catatan revisi disimpan. CPMI kembali ke daftar antrean." };
  });
  if (hasil.sukses) segarkan(idCpmi);
  return hasil;
}
