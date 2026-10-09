// Helper tanggal. BP3MI Lampung memakai WIB, sedangkan server (Docker) berjalan
// di UTC, jadi "hari ini" selalu dihitung di zona Asia/Jakarta.
//
// Kolom @db.Date disimpan sebagai tengah malam UTC, mis. "2026-10-12" ->
// 2026-10-12T00:00:00Z. Karena itu tanggal-saja diformat dengan timeZone UTC.

const ZONA = "Asia/Jakarta";

/** "YYYY-MM-DD" untuk hari ini di WIB. */
export function hariIniWib(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());
}

/** "YYYY-MM-DD" -> Date tengah malam UTC (untuk kolom @db.Date). */
export function keTanggalDb(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Date dari kolom @db.Date -> "YYYY-MM-DD". */
export function dariTanggalDb(tanggal: Date): string {
  return tanggal.toISOString().slice(0, 10);
}

export function tambahHari(iso: string, hari: number): string {
  const d = keTanggalDb(iso);
  d.setUTCDate(d.getUTCDate() + hari);
  return dariTanggalDb(d);
}

/** Senin sampai Jumat. */
export function isHariKerja(iso: string): boolean {
  const hari = keTanggalDb(iso).getUTCDay();
  return hari !== 0 && hari !== 6;
}

/** Tanggal dari kolom @db.Date, contoh: "Senin, 12 Oktober 2026". */
export function formatTanggal(tanggal: Date, opsi: { hari?: boolean } = { hari: true }): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    weekday: opsi.hari ? "long" : undefined,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(tanggal);
}

/** Tanggal + jam dari kolom timestamp, contoh: "12 Okt 2026 09.30 WIB". */
export function formatWaktu(waktu: Date): string {
  const teks = new Intl.DateTimeFormat("id-ID", {
    timeZone: ZONA,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(waktu);
  return `${teks} WIB`;
}

// Kolom @db.Time dibaca Prisma sebagai Date 1970-01-01 dengan jam dalam UTC.

/** "08:30" -> Date untuk kolom @db.Time. */
export function keJamDb(jam: string): Date {
  return new Date(`1970-01-01T${jam}:00Z`);
}

/** Date dari kolom @db.Time -> "08:30". */
export function dariJamDb(jam: Date): string {
  return jam.toISOString().slice(11, 16);
}

/** "08:30" -> menit sejak tengah malam. */
export function menitDariJam(jam: string): number {
  const [j, m] = jam.split(":").map(Number);
  return j * 60 + m;
}

/** Jam dari kolom timestamp, contoh: "08.12". */
export function formatJam(waktu: Date): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, hour: "2-digit", minute: "2-digit" }).format(waktu);
}
