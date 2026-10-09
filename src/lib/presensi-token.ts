import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// QR presensi dinamis (BPMN: "Generate Dynamic QR Code Presensi OPP").
// Kode di QR berganti tiap JENDELA_MS dan hanya berlaku sebentar, jadi foto QR
// yang dikirim ke grup tidak bisa dipakai presensi dari luar kelas.
// Setelah QR dipindai, CPMI mendapat "izin" yang berlaku cukup lama untuk
// mengisi data dan tanda tangan.

const JENDELA_MS = 60_000;
const DURASI_IZIN_MS = 20 * 60_000;

function kunci() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET belum diset atau kurang dari 32 karakter.");
  return secret;
}

const tandai = (isi: string) => createHmac("sha256", kunci()).update(isi).digest("base64url").slice(0, 22);

function sama(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const jendela = (waktu: number) => Math.floor(waktu / JENDELA_MS);

/** Kode untuk QR yang sedang ditampilkan di layar kelas. */
export function kodeQr(idKegiatan: string, sekarang = Date.now()): string {
  return tandai(`qr:${idKegiatan}:${jendela(sekarang)}`);
}

/** Berlaku untuk jendela saat ini dan sebelumnya (60–120 detik setelah tampil). */
export function cekKodeQr(idKegiatan: string, kode: string, sekarang = Date.now()): boolean {
  const j = jendela(sekarang);
  return [j, j - 1].some((n) => sama(kode, tandai(`qr:${idKegiatan}:${n}`)));
}

/** Izin mengisi presensi: "<kedaluwarsa>.<tanda>". */
export function buatIzin(idKegiatan: string, sekarang = Date.now()): string {
  const sampai = sekarang + DURASI_IZIN_MS;
  return `${sampai}.${tandai(`izin:${idKegiatan}:${sampai}`)}`;
}

export function cekIzin(idKegiatan: string, izin: string, sekarang = Date.now()): boolean {
  const [sampaiTeks, tanda] = izin.split(".");
  const sampai = Number(sampaiTeks);
  if (!Number.isFinite(sampai) || !tanda || sampai < sekarang) return false;
  return sama(tanda, tandai(`izin:${idKegiatan}:${sampai}`));
}
