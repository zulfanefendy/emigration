"use server";

import { revalidatePath } from "next/cache";
import { isDuplikat, type StateForm } from "@/lib/form";
import { cekFormatPaspor } from "@/lib/paspor";
import { prisma } from "@/lib/prisma";
import { cekIzin } from "@/lib/presensi-token";
import { formatWaktu, keTanggalDb } from "@/lib/tanggal";
import { samarkanPaspor } from "../../pendaftaran/tiket/[id]/data";
import { alasanTutup } from "./data";

// Modul 4: presensi digital CPMI tanpa login (Flow Chart PM bagian 4).
// Scan QR -> konfirmasi data -> tanda tangan di canvas -> ceklis toolkit & konsumsi.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PESAN_IZIN = "Waktu pengisian habis. Pindai ulang QR di layar kelas.";

/** Tanda tangan PNG base64 dari canvas; ~20–60 KB untuk ukuran layar HP. */
const AWALAN_PNG = "data:image/png;base64,";
const MAKS_TTD = 400_000;
const MIN_TTD = 1_500;

type FieldIdentitas = "noPaspor" | "tanggalLahir";

export type DataPeserta = {
  namaLengkap: string;
  noPasporSamar: string;
  negaraPenempatan: string;
  jenisPekerjaan: string;
  /** Terisi bila sudah presensi sebelumnya. */
  sudahPresensi: string | null;
};

export type StateIdentitas = StateForm<FieldIdentitas> & { peserta?: DataPeserta };
export type StatePresensi = StateForm<FieldIdentitas | "tandaTangan"> & { waktu?: string };

type HasilCari =
  | { gagal: StateForm<FieldIdentitas> }
  | { cpmi: { idCpmi: string; namaLengkap: string; noPaspor: string; negaraPenempatan: string; jenisPekerjaan: string; presensi: { waktuScan: Date }[] } };

/** Cocokkan paspor + tanggal lahir dengan peserta kegiatan. */
async function cariPesertaKegiatan(idKegiatan: string, formData: FormData): Promise<HasilCari> {
  const paspor = cekFormatPaspor(String(formData.get("noPaspor") ?? ""));
  const tanggalLahir = String(formData.get("tanggalLahir") ?? "");
  if (!paspor.valid) return { gagal: { errors: { noPaspor: [paspor.pesan] } } };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahir)) return { gagal: { errors: { tanggalLahir: ["Tanggal lahir wajib diisi."] } } };

  const cpmi = await prisma.cpmi.findUnique({
    where: { noPaspor: paspor.noPaspor },
    select: {
      idCpmi: true,
      namaLengkap: true,
      noPaspor: true,
      tanggalLahir: true,
      negaraPenempatan: true,
      jenisPekerjaan: true,
      pesertaOpp: { where: { idKegiatanOpp: idKegiatan }, select: { idCpmi: true } },
      presensi: { where: { idKegiatanOpp: idKegiatan }, select: { waktuScan: true } },
    },
  });
  // Pesan sama untuk paspor tidak ada / tanggal lahir salah agar data tidak bisa ditebak.
  if (!cpmi || cpmi.tanggalLahir.getTime() !== keTanggalDb(tanggalLahir).getTime()) {
    return { gagal: { pesan: "Nomor paspor atau tanggal lahir tidak cocok dengan data pendaftaran." } };
  }
  if (cpmi.pesertaOpp.length === 0) {
    return { gagal: { pesan: "Anda belum terdaftar sebagai peserta kegiatan ini. Silakan lapor ke pengelola kelas." } };
  }
  return { cpmi };
}

async function periksaAkses(idKegiatan: string, izin: string): Promise<string | null> {
  if (!UUID.test(idKegiatan)) return "Kegiatan tidak ditemukan.";
  if (!cekIzin(idKegiatan, izin)) return PESAN_IZIN;
  return alasanTutup(idKegiatan);
}

/** Langkah 1: identitas. */
export async function cariPeserta(_state: StateIdentitas | undefined, formData: FormData): Promise<StateIdentitas> {
  const idKegiatan = String(formData.get("idKegiatanOpp") ?? "");
  const tutup = await periksaAkses(idKegiatan, String(formData.get("izin") ?? ""));
  if (tutup) return { pesan: tutup };

  const hasil = await cariPesertaKegiatan(idKegiatan, formData);
  if ("gagal" in hasil) return hasil.gagal;
  const { cpmi } = hasil;
  return {
    sukses: true,
    peserta: {
      namaLengkap: cpmi.namaLengkap,
      noPasporSamar: samarkanPaspor(cpmi.noPaspor),
      negaraPenempatan: cpmi.negaraPenempatan,
      jenisPekerjaan: cpmi.jenisPekerjaan,
      sudahPresensi: cpmi.presensi[0] ? formatWaktu(cpmi.presensi[0].waktuScan) : null,
    },
  };
}

/** Langkah 2: tanda tangan + ceklis, lalu simpan. Identitas dicek ulang di sini. */
export async function simpanPresensi(_state: StatePresensi | undefined, formData: FormData): Promise<StatePresensi> {
  const idKegiatan = String(formData.get("idKegiatanOpp") ?? "");
  const tutup = await periksaAkses(idKegiatan, String(formData.get("izin") ?? ""));
  if (tutup) return { pesan: tutup };

  const ttd = String(formData.get("tandaTangan") ?? "");
  if (!ttd.startsWith(AWALAN_PNG) || ttd.length < MIN_TTD) {
    return { errors: { tandaTangan: ["Tanda tangan wajib diisi."] } };
  }
  if (ttd.length > MAKS_TTD) return { errors: { tandaTangan: ["Tanda tangan terlalu besar. Hapus lalu ulangi."] } };
  // Pastikan isinya benar-benar PNG, bukan sembarang teks.
  const png = Buffer.from(ttd.slice(AWALAN_PNG.length), "base64");
  if (png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    return { errors: { tandaTangan: ["Tanda tangan tidak valid. Hapus lalu ulangi."] } };
  }

  const hasil = await cariPesertaKegiatan(idKegiatan, formData);
  if ("gagal" in hasil) return hasil.gagal;
  if (hasil.cpmi.presensi[0]) return { sukses: true, waktu: formatWaktu(hasil.cpmi.presensi[0].waktuScan) };

  // Kiriman ganda bersamaan (tombol ditekan dua kali): yang kalah membaca baris pemenang.
  const kunciPresensi = { idKegiatanOpp_idCpmi: { idKegiatanOpp: idKegiatan, idCpmi: hasil.cpmi.idCpmi } };
  let waktuScan: Date;
  try {
    ({ waktuScan } = await prisma.presensiOpp.create({
      data: {
        idKegiatanOpp: idKegiatan,
        idCpmi: hasil.cpmi.idCpmi,
        statusHadir: true,
        terimaToolkit: formData.get("terimaToolkit") === "on",
        terimaKonsumsi: formData.get("terimaKonsumsi") === "on",
        tandaTanganPng: ttd,
      },
      select: { waktuScan: true },
    }));
  } catch (e) {
    if (!isDuplikat(e)) throw e;
    ({ waktuScan } = await prisma.presensiOpp.findUniqueOrThrow({ where: kunciPresensi, select: { waktuScan: true } }));
  }

  revalidatePath(`/dashboard/kegiatan-opp/${idKegiatan}`);
  revalidatePath(`/dashboard/kegiatan-opp/${idKegiatan}/qr`);
  return { sukses: true, waktu: formatWaktu(waktuScan) };
}
