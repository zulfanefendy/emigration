import "server-only";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type ParagraphChild,
} from "docx";
import { LABEL_SKEMA } from "@/app/(publik)/pendaftaran/pilihan";
import { dariJamDb, formatTanggal, hariIniWib, keTanggalDb } from "@/lib/tanggal";
import type { KegiatanLengkap } from "../../data";

// Draf SK OPP dan SPT (.docx) untuk diperiksa, lalu diunggah ke SRIKANDI untuk TTE.
// Redaksi masih umum; sesuaikan dengan format naskah dinas resmi BP3MI Lampung.

export type JenisDokumen = "sk" | "spt-instruktur" | "spt-pengelola";

const INSTANSI = "BALAI PELAYANAN PELINDUNGAN PEKERJA MIGRAN INDONESIA";
const WILAYAH = "LAMPUNG";
const PEJABAT = "Kepala BP3MI Lampung";
const KOTA = "Bandar Lampung";
const KOSONG = "....................";

// Ukuran dalam twip (1 cm = 567) dan half-point.
const MARGIN = { top: 1134, bottom: 1134, left: 1418, right: 1134 }; // 2 cm, kiri 2,5 cm
const LEBAR_ISI = 11906 - MARGIN.left - MARGIN.right; // lebar A4 dikurangi margin
const UKURAN = 22;

const teks = (isi: string, opsi: { tebal?: boolean } = {}) => new TextRun({ text: isi, bold: opsi.tebal });

function par(isi: string | ParagraphChild[], opsi: { rata?: "tengah" | "kanan" | "penuh"; tebal?: boolean; spasiSetelah?: number } = {}) {
  return new Paragraph({
    children: typeof isi === "string" ? [teks(isi, { tebal: opsi.tebal })] : isi,
    alignment:
      opsi.rata === "tengah" ? AlignmentType.CENTER : opsi.rata === "kanan" ? AlignmentType.RIGHT : opsi.rata === "penuh" ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
    spacing: { after: opsi.spasiSetelah ?? 120, line: 276 },
  });
}

const kosong = () => par("", { spasiSetelah: 0 });

function kop() {
  return [
    par(INSTANSI, { rata: "tengah", tebal: true, spasiSetelah: 0 }),
    par(WILAYAH, { rata: "tengah", tebal: true, spasiSetelah: 0 }),
    new Paragraph({
      children: [],
      border: { bottom: { style: BorderStyle.THICK_THIN_SMALL_GAP, size: 18, color: "000000", space: 4 } },
      spacing: { after: 240 },
    }),
  ];
}

/** Baris "Label : isi" seperti Menimbang/Mengingat; label kosong = lanjutan butir sebelumnya. */
function butir(label: string, isi: string) {
  return new Table({
    width: { size: LEBAR_ISI, type: WidthType.DXA },
    columnWidths: [1900, 300, LEBAR_ISI - 2200],
    borders: tanpaGaris,
    rows: [
      new TableRow({
        children: [
          sel(label, 1900, { garis: false }),
          sel(label ? ":" : "", 300, { garis: false }),
          sel(isi, LEBAR_ISI - 2200, { garis: false, rata: "penuh" }),
        ],
      }),
    ],
  });
}

const tanpaGaris = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function sel(isi: string, lebar: number, opsi: { tebal?: boolean; garis?: boolean; rata?: "tengah" | "penuh" } = {}) {
  return new TableCell({
    width: { size: lebar, type: WidthType.DXA },
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    borders: opsi.garis === false ? tanpaGaris : undefined,
    children: isi.split("\n").map((baris) => par(baris, { tebal: opsi.tebal, rata: opsi.rata, spasiSetelah: 0 })),
  });
}

/** Tabel bergaris dengan baris judul tebal. */
function tabel(kolom: { judul: string; lebar: number }[], baris: string[][]) {
  const skala = LEBAR_ISI / kolom.reduce((n, k) => n + k.lebar, 0);
  const lebar = kolom.map((k) => Math.round(k.lebar * skala));
  return new Table({
    width: { size: LEBAR_ISI, type: WidthType.DXA },
    columnWidths: lebar,
    rows: [
      new TableRow({ tableHeader: true, children: kolom.map((k, i) => sel(k.judul, lebar[i], { tebal: true, rata: "tengah" })) }),
      ...baris.map((b) => new TableRow({ cantSplit: true, children: b.map((isi, i) => sel(isi, lebar[i])) })),
    ],
  });
}

/** SK "ditetapkan", SPT "dikeluarkan". */
function tandaTangan(kata: "Ditetapkan" | "Dikeluarkan") {
  const kiri = 5200;
  const p = (isi: string) => new Paragraph({ children: [teks(isi)], indent: { left: kiri }, spacing: { after: 0 } });
  return [
    kosong(),
    p(`${kata} di ${KOTA}`),
    p(`pada tanggal ${formatTanggal(keTanggalDb(hariIniWib()), { hari: false })}`),
    p(`${PEJABAT},`),
    kosong(),
    p("(ditandatangani secara elektronik)"),
    kosong(),
    p(`( ${KOSONG}${KOSONG} )`),
  ];
}

function judulDokumen(judul: string[], nomor: string | null) {
  return [
    ...judul.map((j) => par(j, { rata: "tengah", tebal: true, spasiSetelah: 0 })),
    par(`NOMOR: ${nomor ?? KOSONG}`, { rata: "tengah", spasiSetelah: 240 }),
  ];
}

const hariTanggal = (k: KegiatanLengkap) => formatTanggal(k.tanggalPelaksanaan);
const jamSesi = (s: KegiatanLengkap["kurikulum"][number]) =>
  s.jamMulai && s.jamSelesai ? `${dariJamDb(s.jamMulai)}–${dariJamDb(s.jamSelesai)}` : "-";
const namaSkema = (k: KegiatanLengkap) => LABEL_SKEMA[k.skemaOpp].toUpperCase();

function tabelKurikulum(k: KegiatanLengkap, sesi = k.kurikulum, denganInstruktur = true) {
  return tabel(
    [
      { judul: "No.", lebar: 6 },
      { judul: "Waktu", lebar: 16 },
      { judul: "Materi", lebar: 44 },
      { judul: "JP", lebar: 7 },
      ...(denganInstruktur ? [{ judul: "Instruktur", lebar: 27 }] : []),
    ],
    sesi.map((s, i) => [
      String(i + 1),
      jamSesi(s),
      s.materi.judulMateri,
      String(s.materi.durasiJamPelajaran),
      ...(denganInstruktur ? [s.instruktur.namaLengkap] : []),
    ]),
  );
}

function tabelPegawai(daftar: { namaLengkap: string; nip: string; jabatan: string | null }[], peran?: string[]) {
  return tabel(
    [
      { judul: "No.", lebar: 6 },
      { judul: "Nama / NIP", lebar: 46 },
      { judul: "Jabatan", lebar: 28 },
      ...(peran ? [{ judul: "Tugas", lebar: 20 }] : []),
    ],
    daftar.map((p, i) => [String(i + 1), `${p.namaLengkap}\nNIP ${p.nip}`, p.jabatan ?? "-", ...(peran ? [peran[i]] : [])]),
  );
}

function sk(k: KegiatanLengkap) {
  const peserta = k.peserta.map((p) => p.cpmi);
  const tim = [
    ...(k.penanggungJawab ? [{ ...k.penanggungJawab, tugas: "Penanggung Jawab" }] : []),
    ...(k.pengelolaKelas ? [{ ...k.pengelolaKelas, tugas: "Pengelola Kelas" }] : []),
  ];

  return [
    ...kop(),
    ...judulDokumen([`KEPUTUSAN ${PEJABAT.toUpperCase()}`], k.noSkOpp),
    par("TENTANG", { rata: "tengah", spasiSetelah: 0 }),
    par("PENYELENGGARAAN ORIENTASI PRA PENEMPATAN (OPP)", { rata: "tengah", tebal: true, spasiSetelah: 0 }),
    par(`CALON PEKERJA MIGRAN INDONESIA SKEMA ${namaSkema(k)}`, { rata: "tengah", tebal: true, spasiSetelah: 0 }),
    par(`KODE KEGIATAN ${k.kodeKegiatan}`, { rata: "tengah", tebal: true, spasiSetelah: 240 }),
    par(`${PEJABAT.toUpperCase()},`, { rata: "tengah", spasiSetelah: 240 }),
    butir(
      "Menimbang",
      "bahwa dalam rangka memberikan pembekalan kepada Calon Pekerja Migran Indonesia sebelum bekerja di luar negeri, perlu menyelenggarakan Orientasi Pra Penempatan dan menetapkannya dengan Keputusan Kepala BP3MI Lampung;",
    ),
    kosong(),
    butir("Mengingat", "Undang-Undang Nomor 18 Tahun 2017 tentang Pelindungan Pekerja Migran Indonesia;"),
    kosong(),
    par("MEMUTUSKAN:", { rata: "tengah", tebal: true }),
    butir("Menetapkan", "KEPUTUSAN KEPALA BP3MI LAMPUNG TENTANG PENYELENGGARAAN ORIENTASI PRA PENEMPATAN CALON PEKERJA MIGRAN INDONESIA."),
    kosong(),
    butir(
      "KESATU",
      `Menyelenggarakan Orientasi Pra Penempatan bagi Calon Pekerja Migran Indonesia skema ${LABEL_SKEMA[k.skemaOpp]} pada hari ${hariTanggal(k)}, bertempat di ${k.tempatOpp}, dengan peserta sebanyak ${peserta.length} orang sebagaimana tercantum dalam Lampiran I.`,
    ),
    kosong(),
    butir("KEDUA", "Susunan pelaksana dan kurikulum Orientasi Pra Penempatan sebagaimana tercantum dalam Lampiran II."),
    kosong(),
    butir("KETIGA", "Keputusan ini mulai berlaku pada tanggal ditetapkan."),
    ...tandaTangan("Ditetapkan"),

    // Lampiran I
    new Paragraph({ children: [teks("LAMPIRAN I", { tebal: true })], pageBreakBefore: true, spacing: { after: 0 } }),
    par(`Keputusan ${PEJABAT} Nomor ${k.noSkOpp ?? KOSONG}`, { spasiSetelah: 240 }),
    par("DAFTAR PESERTA ORIENTASI PRA PENEMPATAN", { rata: "tengah", tebal: true, spasiSetelah: 120 }),
    peserta.length
      ? tabel(
          [
            { judul: "No.", lebar: 6 },
            { judul: "Nama", lebar: 36 },
            { judul: "No. Paspor", lebar: 18 },
            { judul: "L/P", lebar: 7 },
            { judul: "Negara Penempatan", lebar: 33 },
          ],
          peserta.map((p, i) => [String(i + 1), p.namaLengkap, p.noPaspor, p.jenisKelamin, p.negaraPenempatan]),
        )
      : par("Belum ada peserta terdaftar.", { rata: "tengah" }),

    // Lampiran II
    new Paragraph({ children: [teks("LAMPIRAN II", { tebal: true })], pageBreakBefore: true, spacing: { after: 0 } }),
    par(`Keputusan ${PEJABAT} Nomor ${k.noSkOpp ?? KOSONG}`, { spasiSetelah: 240 }),
    par("A. SUSUNAN PELAKSANA", { tebal: true }),
    tim.length
      ? tabelPegawai(
          tim,
          tim.map((t) => t.tugas),
        )
      : par("Belum ditentukan."),
    kosong(),
    par("B. KURIKULUM DAN INSTRUKTUR", { tebal: true }),
    k.kurikulum.length ? tabelKurikulum(k) : par("Belum ditentukan."),
  ];
}

function dasarSk(k: KegiatanLengkap) {
  return `Keputusan ${PEJABAT} Nomor ${k.noSkOpp ?? KOSONG} tentang Penyelenggaraan Orientasi Pra Penempatan Calon Pekerja Migran Indonesia Skema ${LABEL_SKEMA[k.skemaOpp]} (${k.kodeKegiatan}).`;
}

function sptInstruktur(k: KegiatanLengkap) {
  // Satu instruktur bisa mengajar beberapa materi; tampil sekali di daftar "Kepada".
  const instruktur = [...new Map(k.kurikulum.map((s) => [s.instruktur.idPegawai, s.instruktur])).values()];
  return [
    ...kop(),
    ...judulDokumen(["SURAT PERINTAH TUGAS"], k.noSptInstruktur),
    butir("Dasar", dasarSk(k)),
    kosong(),
    par("MEMERINTAHKAN:", { rata: "tengah", tebal: true }),
    butir("Kepada", "Nama-nama sebagaimana tercantum di bawah ini:"),
    kosong(),
    tabelPegawai(instruktur),
    kosong(),
    butir(
      "Untuk",
      `1. Menjadi instruktur pada Orientasi Pra Penempatan Calon Pekerja Migran Indonesia skema ${LABEL_SKEMA[k.skemaOpp]} pada hari ${hariTanggal(k)}, bertempat di ${k.tempatOpp}, dengan materi dan waktu sebagai berikut:`,
    ),
    kosong(),
    tabelKurikulum(k),
    kosong(),
    butir("", "2. Melaksanakan tugas ini dengan penuh tanggung jawab dan melaporkan hasilnya kepada pimpinan."),
    ...tandaTangan("Dikeluarkan"),
  ];
}

function sptPengelola(k: KegiatanLengkap) {
  const tim = k.pengelolaKelas ? [k.pengelolaKelas] : [];
  return [
    ...kop(),
    ...judulDokumen(["SURAT PERINTAH TUGAS"], k.noSptPengelola),
    butir("Dasar", dasarSk(k)),
    kosong(),
    par("MEMERINTAHKAN:", { rata: "tengah", tebal: true }),
    butir("Kepada", ""),
    kosong(),
    tabelPegawai(tim),
    kosong(),
    butir(
      "Untuk",
      `1. Menjadi pengelola kelas pada Orientasi Pra Penempatan Calon Pekerja Migran Indonesia skema ${LABEL_SKEMA[k.skemaOpp]} pada hari ${hariTanggal(k)}, bertempat di ${k.tempatOpp}, dengan jumlah peserta ${k.peserta.length} orang.`,
    ),
    butir("", "2. Menyiapkan kelas, mengelola presensi peserta, membagikan toolkit dan konsumsi, serta menyusun laporan pertanggungjawaban (LPJ)."),
    butir("", "3. Melaksanakan tugas ini dengan penuh tanggung jawab dan melaporkan hasilnya kepada pimpinan."),
    ...tandaTangan("Dikeluarkan"),
  ];
}

const JUDUL: Record<JenisDokumen, string> = {
  sk: "SK OPP",
  "spt-instruktur": "SPT Instruktur",
  "spt-pengelola": "SPT Pengelola",
};

export function namaFileDokumen(jenis: JenisDokumen, k: KegiatanLengkap) {
  return `${JUDUL[jenis].replace(" ", "_")}_${k.kodeKegiatan}.docx`;
}

export async function buatDokumen(jenis: JenisDokumen, k: KegiatanLengkap): Promise<Buffer> {
  const isi = jenis === "sk" ? sk(k) : jenis === "spt-instruktur" ? sptInstruktur(k) : sptPengelola(k);
  const doc = new Document({
    creator: "BP3MI Lampung",
    title: `${JUDUL[jenis]} ${k.kodeKegiatan}`,
    styles: { default: { document: { run: { font: "Arial", size: UKURAN } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: MARGIN,
          },
        },
        children: isi,
      },
    ],
  });
  return Packer.toBuffer(doc);
}
