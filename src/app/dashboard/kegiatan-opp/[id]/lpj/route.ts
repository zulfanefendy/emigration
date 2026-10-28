import ExcelJS from "exceljs";
import { LABEL_SKEMA_OPP } from "@/app/(publik)/pendaftaran/pilihan";
import { wajibRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { dariJamDb, formatJam, formatTanggal, formatWaktu } from "@/lib/tanggal";
import { ambilKegiatan } from "../../data";

// "Download Paket LPJ Excel Komplit" (Flow Chart PM bagian 5): ringkasan,
// daftar hadir dengan tanda tangan, serta kurikulum. Hanya setelah data final.

const TINGGI_TTD = 40; // px di sel Excel
const LEBAR_KOLOM_TTD = 22; // karakter

const GARIS: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  bottom: { style: "thin" },
  left: { style: "thin" },
  right: { style: "thin" },
};

/** Lebar/tinggi asli PNG dari header IHDR, untuk menjaga rasio gambar tanda tangan. */
function ukuranPng(png: Buffer) {
  return { lebar: png.readUInt32BE(16), tinggi: png.readUInt32BE(20) };
}

function tabel(ws: ExcelJS.Worksheet, judul: string[], baris: (string | number)[][], awal: number) {
  const kepala = ws.getRow(awal);
  kepala.values = judul;
  kepala.font = { bold: true };
  kepala.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  kepala.eachCell((c) => {
    c.border = GARIS;
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
  });
  baris.forEach((isi, i) => {
    const r = ws.getRow(awal + 1 + i);
    r.values = isi;
    r.alignment = { vertical: "middle", wrapText: true };
    for (let c = 1; c <= judul.length; c++) r.getCell(c).border = GARIS;
  });
}

export async function GET(_req: Request, { params }: RouteContext<"/dashboard/kegiatan-opp/[id]/lpj">) {
  await wajibRole("PENGELOLA_KELAS", "PENANGGUNG_JAWAB");
  const k = await ambilKegiatan((await params).id);
  if (!k) return new Response("Kegiatan tidak ditemukan", { status: 404 });
  if (!k.isCpmiFinal) return new Response("Kunci data final lebih dulu sebelum mengunduh LPJ", { status: 409 });

  const ttd = await prisma.presensiOpp.findMany({
    where: { idKegiatanOpp: k.idKegiatanOpp },
    select: { idCpmi: true, tandaTanganPng: true },
  });
  const ttdPer = new Map(ttd.map((t) => [t.idCpmi, t.tandaTanganPng]));
  const hadirPer = new Map(k.presensi.map((p) => [p.idCpmi, p]));

  const wb = new ExcelJS.Workbook();
  wb.creator = "BP3MI Lampung";
  wb.created = new Date();

  // --- Ringkasan ------------------------------------------------------------
  const hadir = k.presensi.length;
  const ringkas = wb.addWorksheet("Ringkasan");
  ringkas.columns = [{ width: 28 }, { width: 60 }];
  ringkas.addRow(["LAPORAN PERTANGGUNGJAWABAN ORIENTASI PRA PENEMPATAN"]).font = { bold: true, size: 13 };
  ringkas.addRow(["BP3MI Lampung"]).font = { bold: true };
  ringkas.addRow([]);
  const isi: [string, string | number][] = [
    ["Kode Kegiatan", k.kodeKegiatan],
    ["Tanggal Pelaksanaan", formatTanggal(k.tanggalPelaksanaan)],
    ["Tempat", k.tempatOpp],
    ["Skema", LABEL_SKEMA_OPP[k.skemaOpp]],
    ["Penanggung Jawab", k.penanggungJawab?.namaLengkap ?? "-"],
    ["Pengelola Kelas", k.pengelolaKelas?.namaLengkap ?? "-"],
    ["No. SK OPP", k.noSkOpp ?? "-"],
    ["No. SPT Instruktur", k.noSptInstruktur ?? "-"],
    ["No. SPT Pengelola", k.noSptPengelola ?? "-"],
    ["Jumlah Peserta", k.peserta.length],
    ["Hadir", hadir],
    ["Tidak Hadir", k.peserta.length - hadir],
    ["Menerima Toolkit", k.presensi.filter((p) => p.terimaToolkit).length],
    ["Menerima Konsumsi", k.presensi.filter((p) => p.terimaKonsumsi).length],
    ["Jumlah Sesi / JP", `${k.kurikulum.length} sesi / ${k.kurikulum.reduce((n, s) => n + s.materi.durasiJamPelajaran, 0)} JP`],
    ["Diunduh", formatWaktu(new Date())],
  ];
  for (const [label, nilai] of isi) {
    const r = ringkas.addRow([label, nilai]);
    r.getCell(1).font = { bold: true };
    r.getCell(2).alignment = { horizontal: "left" };
  }

  // --- Daftar Hadir ---------------------------------------------------------
  const dh = wb.addWorksheet("Daftar Hadir", { pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  dh.columns = [
    { width: 5 },
    { width: 30 },
    { width: 13 },
    { width: 5 },
    { width: 20 },
    { width: 16 },
    { width: 20 },
    { width: 9 },
    { width: 9 },
    { width: 10 },
    { width: LEBAR_KOLOM_TTD },
  ];
  dh.addRow([`DAFTAR HADIR OPP ${k.kodeKegiatan}`]).font = { bold: true, size: 13 };
  dh.addRow([`${formatTanggal(k.tanggalPelaksanaan)} · ${k.tempatOpp}`]);
  const AWAL = 4;
  tabel(
    dh,
    ["No.", "Nama", "No. Paspor", "L/P", "Kabupaten/Kota", "Negara", "Jenis Pekerjaan", "Jam Hadir", "Toolkit", "Konsumsi", "Tanda Tangan"],
    k.peserta.map(({ cpmi }, i) => {
      const p = hadirPer.get(cpmi.idCpmi);
      return [
        i + 1,
        cpmi.namaLengkap,
        cpmi.noPaspor,
        cpmi.jenisKelamin,
        cpmi.kabupatenKota,
        cpmi.negaraPenempatan,
        cpmi.jenisPekerjaan,
        p ? formatJam(p.waktuScan) : "Tidak hadir",
        p ? (p.terimaToolkit ? "Ya" : "Tidak") : "-",
        p ? (p.terimaKonsumsi ? "Ya" : "Tidak") : "-",
        "",
      ];
    }),
    AWAL,
  );
  dh.views = [{ state: "frozen", ySplit: AWAL }];

  // Gambar tanda tangan ditempel di kolom terakhir tiap baris.
  const lebarSelPx = LEBAR_KOLOM_TTD * 7;
  k.peserta.forEach(({ cpmi }, i) => {
    const data = ttdPer.get(cpmi.idCpmi)?.split(",")[1];
    const baris = dh.getRow(AWAL + 1 + i);
    baris.height = TINGGI_TTD * 0.75 + 6; // pt
    if (!data) return;
    const png = Buffer.from(data, "base64");
    const { lebar, tinggi } = ukuranPng(png);
    const skala = Math.min(TINGGI_TTD / tinggi, (lebarSelPx - 8) / lebar);
    const gambar = wb.addImage({ base64: data, extension: "png" });
    dh.addImage(gambar, {
      tl: { col: 10.05, row: AWAL + i + 0.08 },
      ext: { width: Math.round(lebar * skala), height: Math.round(tinggi * skala) },
      editAs: "oneCell",
    });
  });

  // --- Kurikulum ------------------------------------------------------------
  const kur = wb.addWorksheet("Kurikulum");
  kur.columns = [{ width: 5 }, { width: 14 }, { width: 10 }, { width: 45 }, { width: 6 }, { width: 30 }, { width: 22 }];
  kur.addRow([`KURIKULUM OPP ${k.kodeKegiatan}`]).font = { bold: true, size: 13 };
  tabel(
    kur,
    ["No.", "Waktu", "Kode", "Materi", "JP", "Instruktur", "NIP"],
    k.kurikulum.map((s, i) => [
      i + 1,
      s.jamMulai && s.jamSelesai ? `${dariJamDb(s.jamMulai)}–${dariJamDb(s.jamSelesai)}` : "-",
      s.materi.kodeMateri,
      s.materi.judulMateri,
      s.materi.durasiJamPelajaran,
      s.instruktur.namaLengkap,
      s.instruktur.nip,
    ]),
    3,
  );

  const isiFile = await wb.xlsx.writeBuffer();
  return new Response(new Uint8Array(isiFile as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="LPJ_${k.kodeKegiatan}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
