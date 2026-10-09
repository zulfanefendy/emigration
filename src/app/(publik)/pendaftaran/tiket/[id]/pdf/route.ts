import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { formatTanggal, formatWaktu } from "@/lib/tanggal";
import { LABEL_SKEMA } from "../../../pilihan";
import { ambilTiket, BAWA_SAAT_VERIFIKASI, samarkanPaspor } from "../data";

// Tiket antrean PDF ukuran A6 (BPMN: "Cetak Tiket Antrean PDF").

const NAVY = rgb(0x11 / 255, 0x37 / 255, 0x5c / 255);
const ABU = rgb(0.38, 0.42, 0.48);
const HITAM = rgb(0.07, 0.09, 0.12);
const GARIS = rgb(0.85, 0.87, 0.9);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tiket = await ambilTiket(id);
  if (!tiket) return new Response("Tiket tidak ditemukan", { status: 404 });

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Tiket Antrean ${tiket.noAntrian}`);
  pdf.setAuthor("BP3MI Lampung");

  const lebar = 297.64;
  const tinggi = 419.53;
  const page = pdf.addPage([lebar, tinggi]);
  const biasa = await pdf.embedFont(StandardFonts.Helvetica);
  const tebal = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.CourierBold);
  const tulis = penulis(page);
  const tengah = (teks: string, y: number, font: PDFFont, ukuran: number, warna = HITAM) =>
    tulis(teks, (lebar - font.widthOfTextAtSize(aman(teks), ukuran)) / 2, y, font, ukuran, warna);

  // Kepala
  page.drawRectangle({ x: 0, y: tinggi - 56, width: lebar, height: 56, color: NAVY });
  tulis("BP3MI LAMPUNG", 20, tinggi - 24, tebal, 8, rgb(0xfb / 255, 0xb9 / 255, 0x34 / 255));
  tulis("Tiket Antrean Verifikasi Dokumen CPMI", 20, tinggi - 40, tebal, 10.5, rgb(1, 1, 1));

  // Nomor antrean
  let y = tinggi - 84;
  tengah("Nomor Antrean", y, biasa, 9, ABU);
  y -= 46;
  tengah(tiket.noAntrian, y, mono, 44);
  y -= 22;
  tengah(formatTanggal(tiket.tanggalAntrian), y, tebal, 10.5);
  y -= 18;
  page.drawLine({ start: { x: 20, y }, end: { x: lebar - 20, y }, thickness: 0.8, color: GARIS, dashArray: [3, 3] });

  // Data CPMI
  const { cpmi } = tiket;
  const baris: [string, string][] = [
    ["Nama", cpmi.namaLengkap],
    ["No. Paspor", samarkanPaspor(cpmi.noPaspor)],
    ["Skema", LABEL_SKEMA[cpmi.skemaPendaftaran]],
    ["Negara Tujuan", cpmi.negaraPenempatan],
    ["Didaftarkan", formatWaktu(tiket.createdAt)],
  ];
  y -= 20;
  for (const [label, nilai] of baris) {
    tulis(label, 20, y, biasa, 8.5, ABU);
    tulis(potong(nilai, tebal, 8.5, lebar - 110), 100, y, tebal, 8.5);
    y -= 15;
  }

  // Berkas yang dibawa
  y -= 8;
  tulis("Bawa saat datang ke loket:", 20, y, tebal, 8.5);
  y -= 13;
  for (const b of BAWA_SAAT_VERIFIKASI) {
    tulis(`- ${b}`, 24, y, biasa, 8, ABU);
    y -= 11.5;
  }

  tengah("Datang sesuai tanggal di atas pada jam layanan loket.", 18, biasa, 7, ABU);

  const isi = await pdf.save();
  return new Response(Buffer.from(isi), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="tiket-antrean-${tiket.noAntrian}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function penulis(page: PDFPage) {
  return (teks: string, x: number, y: number, font: PDFFont, size: number, color = HITAM) =>
    page.drawText(aman(teks), { x, y, font, size, color });
}

/** Font standar PDF hanya mendukung WinAnsi; karakter lain diganti "?". */
function aman(teks: string): string {
  return teks.normalize("NFC").replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function potong(teks: string, font: PDFFont, ukuran: number, maks: number): string {
  let hasil = aman(teks);
  if (font.widthOfTextAtSize(hasil, ukuran) <= maks) return hasil;
  while (hasil.length > 1 && font.widthOfTextAtSize(`${hasil}...`, ukuran) > maks) hasil = hasil.slice(0, -1);
  return `${hasil}...`;
}
