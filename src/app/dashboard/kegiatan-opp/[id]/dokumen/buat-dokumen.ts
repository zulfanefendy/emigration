import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { LABEL_SKEMA_OPP } from "@/app/(publik)/pendaftaran/pilihan";
import { nomorSk, nomorSpt } from "@/lib/nomor-dokumen";
import { dariJamDb, dariTanggalDb, formatTanggal } from "@/lib/tanggal";
import type { KegiatanLengkap } from "../../data";

// Draf SK OPP dan SPT (.docx) dari templat baku BP3MI Lampung di folder
// templat-dokumen/ (dibuat dari contoh naskah SRIKANDI). Isian memakai tag
// {{nama}}; ${ttd_pengirim} dan sejenisnya dibiarkan untuk diisi SRIKANDI saat TTE.
// Templat boleh diubah di Word selama tag {{...}} tetap utuh.

export type JenisDokumen = "sk" | "spt-instruktur" | "spt-pengelola";

const FOLDER_TEMPLAT = path.join(process.cwd(), "templat-dokumen");

const SATUAN = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];

/** Terbilang 0–999, contoh: 16 -> "Enam Belas". */
function terbilang(n: number): string {
  if (n === 0) return "Nol";
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${SATUAN[n - 10]} Belas`;
  if (n < 100) return `${SATUAN[Math.floor(n / 10)]} Puluh${n % 10 ? ` ${SATUAN[n % 10]}` : ""}`;
  if (n < 200) return `Seratus${n % 100 ? ` ${terbilang(n % 100)}` : ""}`;
  if (n < 1000) return `${SATUAN[Math.floor(n / 100)]} Ratus${n % 100 ? ` ${terbilang(n % 100)}` : ""}`;
  return String(n);
}

/** "16 (Enam Belas)" seperti pada naskah. */
const angkaTerbilang = (n: number) => `${n} (${terbilang(n)})`;

/** "Jepang", "Taiwan dan Hong Kong", "A, B dan C". */
function gabung(daftar: string[]) {
  if (daftar.length <= 1) return daftar[0] ?? "-";
  return `${daftar.slice(0, -1).join(", ")} dan ${daftar.at(-1)}`;
}

/** Nilai yang sama dengan baris sebelumnya ditulis "sda" (sama dengan atas). */
const sda = (nilai: string, sebelumnya: string | undefined) => (nilai === sebelumnya ? "sda" : nilai);

/** Tanggal dengan hari dua digit seperti naskah dinas: "02 Oktober 2026", "Senin, 14 September 2026". */
const tanggalNaskah = (d: Date, hari = false) => formatTanggal(d, { hari }).replace(/(^|\s)(\d)(?=\s)/, (_, spasi, angka) => `${spasi}0${angka}`);

const jam = (d: Date | null) => (d ? dariJamDb(d).replace(":", ".") : "-");

function dataUmum(k: KegiatanLengkap) {
  const peserta = k.peserta.map((p) => p.cpmi);
  const tanggalSurat = dariTanggalDb(k.tanggalSurat ?? k.tanggalPelaksanaan);
  const laki = peserta.filter((p) => p.jenisKelamin === "L").length;
  const negara = [...new Set(peserta.map((p) => p.negaraPenempatan.trim()))].sort((a, b) => a.localeCompare(b, "id"));

  return {
    nomorSk: k.noSkOpp ? nomorSk(k.noSkOpp, tanggalSurat) : "....",
    tanggalSurat: tanggalNaskah(k.tanggalSurat ?? k.tanggalPelaksanaan),
    tanggalPelaksanaan: tanggalNaskah(k.tanggalPelaksanaan),
    hariTanggal: tanggalNaskah(k.tanggalPelaksanaan, true),
    tempat: k.tempatOpp,
    jumlah: angkaTerbilang(peserta.length),
    jumlahL: angkaTerbilang(laki),
    jumlahP: angkaTerbilang(peserta.length - laki),
    negara: gabung(negara),
    totalJp: k.kurikulum.reduce((n, s) => n + s.materi.durasiJamPelajaran, 0),
    noSpt: (urut: string | null) => (urut ? nomorSpt(urut, tanggalSurat) : "...."),
  };
}

function dataSk(k: KegiatanLengkap) {
  const pengelola = k.pengelolaKelas?.namaLengkap ?? "-";
  return {
    peserta: k.peserta.map(({ cpmi: p }, i) => ({
      no: i + 1,
      nama: p.namaLengkap,
      ttl: `${p.tempatLahir}, ${tanggalNaskah(p.tanggalLahir)}`,
      lp: p.jenisKelamin,
      alamat: [p.alamatLengkap, p.kabupatenKota, p.provinsi].join(", "),
      penggunaJasa: `${p.namaPenggunaJasa} / ${p.alamatPenggunaJasa}`,
      jabatan: p.jenisPekerjaan,
      negara: p.negaraPenempatan,
      paspor: p.noPaspor,
      gaji: p.gaji,
    })),
    sesi: k.kurikulum.map((s, i, semua) => ({
      no: i + 1,
      waktu: `${jam(s.jamMulai)} - ${jam(s.jamSelesai)}`,
      materi: s.materi.judulMateri,
      instruktur: sda(s.instruktur.namaLengkap, semua[i - 1]?.instruktur.namaLengkap),
      pengelola: i === 0 ? pengelola : "sda",
      jp: s.materi.durasiJamPelajaran,
    })),
  };
}

type PegawaiSpt = { namaLengkap: string; nip: string; jabatan: string | null; pangkatGolongan: string | null };

/** Blok "Kepada": label hanya pada orang pertama. */
const kepada = (daftar: PegawaiSpt[]) =>
  daftar.map((p, i) => ({
    label: i === 0 ? "Kepada" : "",
    titik: i === 0 ? ":" : "",
    nama: p.namaLengkap,
    nip: p.nip,
    pangkat: p.pangkatGolongan ?? "-",
    jabatan: p.jabatan ?? "-",
  }));

function isiDokumen(jenis: JenisDokumen, k: KegiatanLengkap) {
  const { noSpt, ...umum } = dataUmum(k);
  if (jenis === "sk") return { ...umum, ...dataSk(k) };
  if (jenis === "spt-instruktur") {
    // Satu instruktur bisa mengajar beberapa materi; tampil sekali di "Kepada".
    const instruktur = [...new Map(k.kurikulum.map((s) => [s.instruktur.idPegawai, s.instruktur])).values()];
    return { ...umum, nomor: noSpt(k.noSptInstruktur), pegawai: kepada(instruktur) };
  }
  return { ...umum, nomor: noSpt(k.noSptPengelola), pegawai: kepada(k.pengelolaKelas ? [k.pengelolaKelas] : []) };
}

const NAMA_FILE: Record<JenisDokumen, string> = {
  sk: "SK_OPP",
  "spt-instruktur": "SPT_INSTRUKTUR_OPP",
  "spt-pengelola": "SPT_PENGELOLA_KELAS_OPP",
};

/** Contoh: SK_OPP_MANDIRI_20260914.docx */
export function namaFileDokumen(jenis: JenisDokumen, k: KegiatanLengkap) {
  const skema = LABEL_SKEMA_OPP[k.skemaOpp].toUpperCase().replace(/\s+/g, "_");
  return `${NAMA_FILE[jenis]}_${skema}_${dariTanggalDb(k.tanggalPelaksanaan).replaceAll("-", "")}.docx`;
}

export async function buatDokumen(jenis: JenisDokumen, k: KegiatanLengkap): Promise<Buffer> {
  const zip = new PizZip(await readFile(path.join(FOLDER_TEMPLAT, `${jenis}.docx`)));
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "{{", end: "}}" },
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });
  doc.render(isiDokumen(jenis, k));
  return doc.toBuffer({ compression: "DEFLATE" });
}
