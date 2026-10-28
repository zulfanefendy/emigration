"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { wajibRole } from "@/lib/auth/dal";
import type { Role } from "@/lib/auth/role";
import { isDuplikat, teksOpsional, type StateForm } from "@/lib/form";
import { POLA_NOMOR_URUT } from "@/lib/nomor-dokumen";
import { prisma } from "@/lib/prisma";
import { dariJamDb, dariTanggalDb, hariIniWib, keJamDb, keTanggalDb, menitDariJam } from "@/lib/tanggal";
import { SKEMA_CPMI_OPP } from "@/app/(publik)/pendaftaran/pilihan";
import { UUID } from "./data";

// Flow Chart PM bagian 3: buat kegiatan & pilih tim, set kurikulum (materi +
// instruktur), daftarkan peserta, isi nomor SK/SPT. Hanya Pengelola Kelas
// (dan Admin) yang boleh mengubah; Penanggung Jawab cukup melihat.

type Tx = Prisma.TransactionClient;
type Hasil = { sukses: boolean; pesan: string };

const DAFTAR = "/dashboard/kegiatan-opp";
const PESAN_FINAL = "Kegiatan sudah final. Data kegiatan, kurikulum, dan peserta tidak bisa diubah.";
const detail = (id: string) => `${DAFTAR}/${id}`;

function segarkan(idKegiatan?: string) {
  revalidatePath(DAFTAR);
  if (idKegiatan) revalidatePath(detail(idKegiatan));
}

async function kunci(tx: Tx, kunci: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${kunci}))`;
}

async function punyaRole(tx: Tx, idPegawai: string, role: Role) {
  const n = await tx.pegawai.count({
    where: { idPegawai, isActive: true, roles: { some: { role: { namaRole: role } } } },
  });
  return n > 0;
}

const idOpsional = z
  .string()
  .regex(UUID, { error: "Pilihan tidak valid." })
  .optional();

// =============================================================================
// Kegiatan
// =============================================================================

const SkemaKegiatan = z.object({
  tanggalPelaksanaan: z.iso.date({ error: "Tanggal pelaksanaan wajib diisi." }),
  skemaOpp: z.enum(["P_TO_P", "MANDIRI"], { error: "Pilih skema OPP." }),
  tempatOpp: z
    .string({ error: "Tempat wajib diisi." })
    .trim()
    .min(3, { error: "Tempat minimal 3 karakter." })
    .max(255, { error: "Tempat maksimal 255 karakter." }),
  idPengelolaKelas: idOpsional,
  idPenanggungJawab: idOpsional,
});

export type FieldKegiatan = keyof z.infer<typeof SkemaKegiatan>;
export type StateKegiatan = StateForm<FieldKegiatan>;

/** Kode berurutan per tahun pelaksanaan: OPP-2026-001. */
async function kodeBaru(tx: Tx, tanggal: string) {
  const awalan = `OPP-${tanggal.slice(0, 4)}-`;
  await kunci(tx, `kode-kegiatan:${awalan}`);
  const terakhir = await tx.kegiatanOpp.findFirst({
    where: { kodeKegiatan: { startsWith: awalan } },
    orderBy: { kodeKegiatan: "desc" },
    select: { kodeKegiatan: true },
  });
  const urut = terakhir ? Number(terakhir.kodeKegiatan.slice(awalan.length)) + 1 : 1;
  return awalan + String(urut).padStart(3, "0");
}

/** Buat kegiatan baru (tanpa idKegiatanOpp, lalu buka detailnya) atau ubah yang ada. */
export async function simpanKegiatan(_state: StateKegiatan | undefined, formData: FormData): Promise<StateKegiatan> {
  await wajibRole("PENGELOLA_KELAS");

  const idKegiatan = teksOpsional(formData.get("idKegiatanOpp"));
  if (idKegiatan && !UUID.test(idKegiatan)) return { pesan: "Kegiatan tidak ditemukan." };

  const hasil = SkemaKegiatan.safeParse({
    tanggalPelaksanaan: formData.get("tanggalPelaksanaan"),
    skemaOpp: formData.get("skemaOpp"),
    tempatOpp: formData.get("tempatOpp"),
    idPengelolaKelas: teksOpsional(formData.get("idPengelolaKelas")),
    idPenanggungJawab: teksOpsional(formData.get("idPenanggungJawab")),
  });
  if (!hasil.success) return { errors: z.flattenError(hasil.error).fieldErrors };
  const d = hasil.data;

  const keluaran = await prisma.$transaction(async (tx): Promise<StateKegiatan | { id: string }> => {
    if (d.idPengelolaKelas && !(await punyaRole(tx, d.idPengelolaKelas, "PENGELOLA_KELAS"))) {
      return { errors: { idPengelolaKelas: ["Pegawai ini bukan Pengelola Kelas aktif."] } };
    }
    if (d.idPenanggungJawab && !(await punyaRole(tx, d.idPenanggungJawab, "PENANGGUNG_JAWAB"))) {
      return { errors: { idPenanggungJawab: ["Pegawai ini bukan Penanggung Jawab aktif."] } };
    }

    const data = {
      tanggalPelaksanaan: keTanggalDb(d.tanggalPelaksanaan),
      skemaOpp: d.skemaOpp,
      tempatOpp: d.tempatOpp,
      idPengelolaKelas: d.idPengelolaKelas ?? null,
      idPenanggungJawab: d.idPenanggungJawab ?? null,
    };

    if (!idKegiatan) {
      if (d.tanggalPelaksanaan < hariIniWib()) {
        return { errors: { tanggalPelaksanaan: ["Tanggal pelaksanaan tidak boleh sebelum hari ini."] } };
      }
      const baru = await tx.kegiatanOpp.create({
        data: { ...data, kodeKegiatan: await kodeBaru(tx, d.tanggalPelaksanaan) },
        select: { idKegiatanOpp: true },
      });
      return { id: baru.idKegiatanOpp };
    }

    await kunci(tx, `kegiatan:${idKegiatan}`);
    const lama = await tx.kegiatanOpp.findUnique({
      where: { idKegiatanOpp: idKegiatan },
      select: { skemaOpp: true, isCpmiFinal: true, _count: { select: { peserta: true } } },
    });
    if (!lama) return { pesan: "Kegiatan tidak ditemukan." };
    if (lama.isCpmiFinal) return { pesan: PESAN_FINAL };
    // Peserta dipilih berdasarkan skema, jadi skema tidak boleh berubah di bawahnya.
    if (lama.skemaOpp !== d.skemaOpp && lama._count.peserta > 0) {
      return { errors: { skemaOpp: ["Skema tidak bisa diubah karena sudah ada peserta. Keluarkan peserta lebih dulu."] } };
    }
    await tx.kegiatanOpp.update({ where: { idKegiatanOpp: idKegiatan }, data });
    return { id: idKegiatan };
  });

  if (!("id" in keluaran)) return keluaran;
  segarkan(keluaran.id);
  if (!idKegiatan) redirect(detail(keluaran.id));
  return { sukses: true, pesan: "Kegiatan diperbarui." };
}

/** Hapus kegiatan yang belum final dan belum ada presensi. */
export async function hapusKegiatan(idKegiatan: string): Promise<Hasil> {
  await wajibRole("PENGELOLA_KELAS");
  if (!UUID.test(idKegiatan)) return { sukses: false, pesan: "Kegiatan tidak ditemukan." };

  const hasil = await prisma.$transaction(async (tx): Promise<Hasil> => {
    await kunci(tx, `kegiatan:${idKegiatan}`);
    const k = await tx.kegiatanOpp.findUnique({
      where: { idKegiatanOpp: idKegiatan },
      select: { isCpmiFinal: true, _count: { select: { presensi: true } } },
    });
    if (!k) return { sukses: false, pesan: "Kegiatan tidak ditemukan." };
    if (k.isCpmiFinal) return { sukses: false, pesan: "Kegiatan sudah final dan tidak bisa dihapus." };
    if (k._count.presensi > 0) return { sukses: false, pesan: "Kegiatan sudah memiliki presensi dan tidak bisa dihapus." };
    await tx.kegiatanOpp.delete({ where: { idKegiatanOpp: idKegiatan } });
    return { sukses: true, pesan: "Kegiatan dihapus." };
  });

  if (!hasil.sukses) return hasil;
  revalidatePath(DAFTAR);
  redirect(DAFTAR);
}

// =============================================================================
// Kurikulum
// =============================================================================

const jam = (label: string) =>
  z.string({ error: `${label} wajib diisi.` }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: `${label} wajib diisi.` });

const SkemaKurikulum = z
  .object({
    idMateri: z.coerce.number({ error: "Pilih materi." }).int().positive({ error: "Pilih materi." }),
    idInstruktur: z.string({ error: "Pilih instruktur." }).regex(UUID, { error: "Pilih instruktur." }),
    jamMulai: jam("Jam mulai"),
    jamSelesai: jam("Jam selesai"),
  })
  .refine((d) => menitDariJam(d.jamSelesai) > menitDariJam(d.jamMulai), {
    path: ["jamSelesai"],
    error: "Jam selesai harus setelah jam mulai.",
  });

export type FieldKurikulum = keyof z.infer<typeof SkemaKurikulum>;
export type StateKurikulum = StateForm<FieldKurikulum>;

const tumpang = (a: { jamMulai: string; jamSelesai: string }, b: { jamMulai: Date | null; jamSelesai: Date | null }) =>
  !!b.jamMulai &&
  !!b.jamSelesai &&
  menitDariJam(a.jamMulai) < menitDariJam(dariJamDb(b.jamSelesai)) &&
  menitDariJam(dariJamDb(b.jamMulai)) < menitDariJam(a.jamSelesai);

/** Tambah (tanpa idKurikulum) atau ubah satu sesi kurikulum. */
export async function simpanKurikulum(_state: StateKurikulum | undefined, formData: FormData): Promise<StateKurikulum> {
  await wajibRole("PENGELOLA_KELAS");

  const idKegiatan = String(formData.get("idKegiatanOpp") ?? "");
  if (!UUID.test(idKegiatan)) return { pesan: "Kegiatan tidak ditemukan." };
  const idKurikulum = Number(formData.get("idKurikulum")) || undefined;

  const hasil = SkemaKurikulum.safeParse({
    idMateri: formData.get("idMateri") || undefined,
    idInstruktur: teksOpsional(formData.get("idInstruktur")),
    jamMulai: formData.get("jamMulai"),
    jamSelesai: formData.get("jamSelesai"),
  });
  if (!hasil.success) return { errors: z.flattenError(hasil.error).fieldErrors };
  const d = hasil.data;

  let keluaran: StateKurikulum;
  try {
    keluaran = await prisma.$transaction(async (tx): Promise<StateKurikulum> => {
      // Kunci per instruktur agar dua kegiatan tidak memesan jam yang sama bersamaan.
      await kunci(tx, `kegiatan:${idKegiatan}`);
      await kunci(tx, `instruktur:${d.idInstruktur}`);

      const kegiatan = await tx.kegiatanOpp.findUnique({
        where: { idKegiatanOpp: idKegiatan },
        select: {
          tanggalPelaksanaan: true,
          isCpmiFinal: true,
          kurikulum: { select: { idKurikulum: true, idMateri: true, jamMulai: true, jamSelesai: true } },
        },
      });
      if (!kegiatan) return { pesan: "Kegiatan tidak ditemukan." };
      if (kegiatan.isCpmiFinal) return { pesan: PESAN_FINAL };

      const lama = idKurikulum ? kegiatan.kurikulum.find((k) => k.idKurikulum === idKurikulum) : undefined;
      if (idKurikulum && !lama) return { pesan: "Sesi kurikulum tidak ditemukan." };

      // Materi nonaktif masih boleh dipertahankan pada sesi lama, tapi tidak dipilih baru.
      const materi = await tx.materiOpp.findUnique({ where: { idMateri: d.idMateri }, select: { isActive: true } });
      if (!materi || (!materi.isActive && lama?.idMateri !== d.idMateri)) {
        return { errors: { idMateri: ["Materi tidak tersedia."] } };
      }
      if (!(await punyaRole(tx, d.idInstruktur, "INSTRUKTUR"))) {
        return { errors: { idInstruktur: ["Pegawai ini bukan Instruktur aktif."] } };
      }

      const bentrokKelas = kegiatan.kurikulum.find((k) => k.idKurikulum !== idKurikulum && tumpang(d, k));
      if (bentrokKelas) {
        return {
          errors: {
            jamMulai: [`Bertabrakan dengan sesi lain di kegiatan ini (${dariJamDb(bentrokKelas.jamMulai!)}–${dariJamDb(bentrokKelas.jamSelesai!)}).`],
          },
        };
      }

      const jadwalInstruktur = await tx.kurikulumOpp.findMany({
        where: {
          idInstruktur: d.idInstruktur,
          kegiatan: { tanggalPelaksanaan: kegiatan.tanggalPelaksanaan },
          NOT: idKurikulum ? { idKurikulum } : undefined,
        },
        select: { jamMulai: true, jamSelesai: true, kegiatan: { select: { kodeKegiatan: true } } },
      });
      const bentrok = jadwalInstruktur.find((k) => tumpang(d, k));
      if (bentrok) {
        return {
          errors: {
            idInstruktur: [
              `Instruktur sudah mengajar di ${bentrok.kegiatan.kodeKegiatan} pukul ${dariJamDb(bentrok.jamMulai!)}–${dariJamDb(bentrok.jamSelesai!)}.`,
            ],
          },
        };
      }

      const data = {
        idMateri: d.idMateri,
        idInstruktur: d.idInstruktur,
        jamMulai: keJamDb(d.jamMulai),
        jamSelesai: keJamDb(d.jamSelesai),
      };
      if (idKurikulum) {
        await tx.kurikulumOpp.update({ where: { idKurikulum }, data });
      } else {
        await tx.kurikulumOpp.create({ data: { ...data, idKegiatanOpp: idKegiatan } });
      }
      return { sukses: true, pesan: idKurikulum ? "Sesi diperbarui." : "Sesi ditambahkan." };
    });
  } catch (e) {
    if (isDuplikat(e)) return { errors: { idMateri: ["Materi ini sudah diajarkan instruktur yang sama di kegiatan ini."] } };
    throw e;
  }

  if (keluaran.sukses) segarkan(idKegiatan);
  return keluaran;
}

export async function hapusKurikulum(idKegiatan: string, idKurikulum: number): Promise<Hasil> {
  await wajibRole("PENGELOLA_KELAS");
  if (!UUID.test(idKegiatan)) return { sukses: false, pesan: "Kegiatan tidak ditemukan." };
  const { count } = await prisma.kurikulumOpp.deleteMany({
    where: { idKurikulum, idKegiatanOpp: idKegiatan, kegiatan: { isCpmiFinal: false } },
  });
  if (count === 0) return { sukses: false, pesan: "Sesi sudah tidak ada, atau kegiatan sudah final." };
  segarkan(idKegiatan);
  return { sukses: true, pesan: "Sesi dihapus." };
}

// =============================================================================
// Peserta
// =============================================================================

/**
 * Tambahkan CPMI yang sudah diverifikasi, skemanya sesuai kegiatan (OPP Mandiri
 * menerima Mandiri Reguler dan SSW), dan belum terdaftar di kegiatan OPP lain.
 */
export async function tambahPeserta(idKegiatan: string, idCpmi: string[]): Promise<Hasil> {
  await wajibRole("PENGELOLA_KELAS");
  if (!UUID.test(idKegiatan)) return { sukses: false, pesan: "Kegiatan tidak ditemukan." };
  const daftar = [...new Set(idCpmi)].filter((id) => UUID.test(id));
  if (daftar.length === 0) return { sukses: false, pesan: "Pilih minimal satu CPMI." };

  const hasil = await prisma.$transaction(async (tx): Promise<Hasil> => {
    await kunci(tx, "peserta-opp");
    const k = await tx.kegiatanOpp.findUnique({
      where: { idKegiatanOpp: idKegiatan },
      select: { skemaOpp: true, isCpmiFinal: true },
    });
    if (!k) return { sukses: false, pesan: "Kegiatan tidak ditemukan." };
    if (k.isCpmiFinal) return { sukses: false, pesan: "Data peserta sudah dikunci (final)." };

    const layak = await tx.cpmi.findMany({
      where: {
        idCpmi: { in: daftar },
        skemaPendaftaran: { in: SKEMA_CPMI_OPP[k.skemaOpp] },
        verifikasi: { some: { statusVerifikasi: "SUDAH_SELESAI" } },
        pesertaOpp: { none: {} },
      },
      select: { idCpmi: true },
    });
    if (layak.length === 0) {
      return { sukses: false, pesan: "CPMI yang dipilih sudah terdaftar di kegiatan lain atau tidak memenuhi syarat." };
    }
    await tx.pesertaOpp.createMany({ data: layak.map((c) => ({ idKegiatanOpp: idKegiatan, idCpmi: c.idCpmi })) });

    const dilewati = daftar.length - layak.length;
    return {
      sukses: true,
      pesan: `${layak.length} peserta ditambahkan.` + (dilewati ? ` ${dilewati} dilewati karena sudah terdaftar di kegiatan lain atau tidak memenuhi syarat.` : ""),
    };
  });

  if (hasil.sukses) segarkan(idKegiatan);
  return hasil;
}

export async function keluarkanPeserta(idKegiatan: string, idCpmi: string): Promise<Hasil> {
  await wajibRole("PENGELOLA_KELAS");
  if (!UUID.test(idKegiatan) || !UUID.test(idCpmi)) return { sukses: false, pesan: "Peserta tidak ditemukan." };

  const hasil = await prisma.$transaction(async (tx): Promise<Hasil> => {
    await kunci(tx, "peserta-opp");
    const k = await tx.kegiatanOpp.findUnique({ where: { idKegiatanOpp: idKegiatan }, select: { isCpmiFinal: true } });
    if (!k) return { sukses: false, pesan: "Kegiatan tidak ditemukan." };
    if (k.isCpmiFinal) return { sukses: false, pesan: "Data peserta sudah dikunci (final)." };
    const sudahPresensi = await tx.presensiOpp.count({ where: { idKegiatanOpp: idKegiatan, idCpmi } });
    if (sudahPresensi) return { sukses: false, pesan: "Peserta sudah presensi dan tidak bisa dikeluarkan." };
    const { count } = await tx.pesertaOpp.deleteMany({ where: { idKegiatanOpp: idKegiatan, idCpmi } });
    return count ? { sukses: true, pesan: "Peserta dikeluarkan." } : { sukses: false, pesan: "Peserta sudah tidak ada." };
  });

  if (hasil.sukses) segarkan(idKegiatan);
  return hasil;
}

// =============================================================================
// Nomor SK & SPT
// =============================================================================

const nomor = z
  .string()
  .trim()
  .regex(POLA_NOMOR_URUT, { error: "Isi nomor urutnya saja (angka), contoh: 1647." })
  .optional();
const SkemaNomor = z.object({
  tanggalSurat: z.iso.date({ error: "Tanggal surat tidak valid." }).optional(),
  noSkOpp: nomor,
  noSptInstruktur: nomor,
  noSptPengelola: nomor,
});

export type FieldNomor = keyof z.infer<typeof SkemaNomor>;
export type StateNomor = StateForm<FieldNomor>;

/** Simpan nomor urut SK/SPT; format lengkapnya dibuat saat ditampilkan (lib/nomor-dokumen). */
export async function simpanNomorDokumen(_state: StateNomor | undefined, formData: FormData): Promise<StateNomor> {
  await wajibRole("PENGELOLA_KELAS");
  const idKegiatan = String(formData.get("idKegiatanOpp") ?? "");
  if (!UUID.test(idKegiatan)) return { pesan: "Kegiatan tidak ditemukan." };

  const hasil = SkemaNomor.safeParse({
    tanggalSurat: teksOpsional(formData.get("tanggalSurat")),
    noSkOpp: teksOpsional(formData.get("noSkOpp")),
    noSptInstruktur: teksOpsional(formData.get("noSptInstruktur")),
    noSptPengelola: teksOpsional(formData.get("noSptPengelola")),
  });
  if (!hasil.success) return { errors: z.flattenError(hasil.error).fieldErrors };
  const d = hasil.data;

  const { count } = await prisma.kegiatanOpp.updateMany({
    where: { idKegiatanOpp: idKegiatan },
    data: {
      tanggalSurat: d.tanggalSurat ? keTanggalDb(d.tanggalSurat) : null,
      noSkOpp: d.noSkOpp ?? null,
      noSptInstruktur: d.noSptInstruktur ?? null,
      noSptPengelola: d.noSptPengelola ?? null,
    },
  });
  if (count === 0) return { pesan: "Kegiatan tidak ditemukan." };

  segarkan(idKegiatan);
  return { sukses: true, pesan: "Nomor dokumen disimpan." };
}

// =============================================================================
// Finalisasi & SRIKANDI (Flow Chart PM bagian 5)
// =============================================================================

/**
 * "Set Status Peserta: FINAL / LOCKED". Dilakukan setelah kegiatan berlangsung
 * dan tidak ada verifikasi susulan. Setelah final, kegiatan, kurikulum,
 * peserta, dan presensi tidak bisa diubah lagi.
 */
export async function kunciFinal(idKegiatan: string): Promise<Hasil> {
  await wajibRole("PENGELOLA_KELAS");
  if (!UUID.test(idKegiatan)) return { sukses: false, pesan: "Kegiatan tidak ditemukan." };

  const hasil = await prisma.$transaction(async (tx): Promise<Hasil> => {
    await kunci(tx, "peserta-opp");
    await kunci(tx, `kegiatan:${idKegiatan}`);
    const k = await tx.kegiatanOpp.findUnique({
      where: { idKegiatanOpp: idKegiatan },
      select: { isCpmiFinal: true, tanggalPelaksanaan: true, _count: { select: { peserta: true } } },
    });
    if (!k) return { sukses: false, pesan: "Kegiatan tidak ditemukan." };
    if (k.isCpmiFinal) return { sukses: false, pesan: "Kegiatan sudah final." };
    if (dariTanggalDb(k.tanggalPelaksanaan) > hariIniWib()) {
      return { sukses: false, pesan: "Data baru bisa dikunci pada hari pelaksanaan atau sesudahnya." };
    }
    if (k._count.peserta === 0) return { sukses: false, pesan: "Belum ada peserta." };
    await tx.kegiatanOpp.update({ where: { idKegiatanOpp: idKegiatan }, data: { isCpmiFinal: true } });
    return { sukses: true, pesan: "Data peserta dikunci (final)." };
  });

  if (hasil.sukses) segarkan(idKegiatan);
  return hasil;
}

/** Buka kunci bila ada kekeliruan. Hanya Admin, dan hanya sebelum berkas diunggah ke SRIKANDI. */
export async function bukaKunciFinal(idKegiatan: string): Promise<Hasil> {
  await wajibRole("ADMIN");
  if (!UUID.test(idKegiatan)) return { sukses: false, pesan: "Kegiatan tidak ditemukan." };
  const { count } = await prisma.kegiatanOpp.updateMany({
    where: { idKegiatanOpp: idKegiatan, isCpmiFinal: true, statusSrikandiUpload: false },
    data: { isCpmiFinal: false },
  });
  if (count === 0) return { sukses: false, pesan: "Kunci tidak bisa dibuka: kegiatan belum final atau berkas sudah diunggah ke SRIKANDI." };
  segarkan(idKegiatan);
  return { sukses: true, pesan: "Kunci final dibuka." };
}

const tautan = (label: string) =>
  z
    .url({ protocol: /^https?$/, error: `${label} harus berupa tautan (https://...).` })
    .max(2000, { error: "Tautan terlalu panjang." });

const SkemaSrikandi = z.object({
  fileSkOppUrl: tautan("Tautan SK OPP"),
  fileSptInstrukturUrl: tautan("Tautan SPT Instruktur").optional(),
  fileSptPengelolaUrl: tautan("Tautan SPT Pengelola").optional(),
});

export type FieldSrikandi = keyof z.infer<typeof SkemaSrikandi>;
export type StateSrikandi = StateForm<FieldSrikandi>;

/**
 * "Upload File SK & SPT Final ke SRIKANDI (TTE)". SRIKANDI tidak menyediakan
 * API untuk aplikasi ini, jadi berkas diunggah petugas di aplikasi SRIKANDI,
 * lalu tautan naskahnya dicatat di sini sebagai arsip.
 */
export async function simpanSrikandi(_state: StateSrikandi | undefined, formData: FormData): Promise<StateSrikandi> {
  await wajibRole("PENGELOLA_KELAS");
  const idKegiatan = String(formData.get("idKegiatanOpp") ?? "");
  if (!UUID.test(idKegiatan)) return { pesan: "Kegiatan tidak ditemukan." };

  const hasil = SkemaSrikandi.safeParse({
    fileSkOppUrl: teksOpsional(formData.get("fileSkOppUrl")) ?? "",
    fileSptInstrukturUrl: teksOpsional(formData.get("fileSptInstrukturUrl")),
    fileSptPengelolaUrl: teksOpsional(formData.get("fileSptPengelolaUrl")),
  });
  if (!hasil.success) return { errors: z.flattenError(hasil.error).fieldErrors };

  const { count } = await prisma.kegiatanOpp.updateMany({
    where: { idKegiatanOpp: idKegiatan, isCpmiFinal: true },
    data: {
      fileSkOppUrl: hasil.data.fileSkOppUrl,
      fileSptInstrukturUrl: hasil.data.fileSptInstrukturUrl ?? null,
      fileSptPengelolaUrl: hasil.data.fileSptPengelolaUrl ?? null,
      statusSrikandiUpload: true,
      waktuUploadSrikandi: new Date(),
    },
  });
  if (count === 0) return { pesan: "Kunci data final lebih dulu sebelum mencatat unggahan SRIKANDI." };

  segarkan(idKegiatan);
  return { sukses: true, pesan: "Arsip SRIKANDI dicatat." };
}
