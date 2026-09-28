// Kirim pesan WhatsApp tanpa API: sistem hanya menyiapkan teks, lalu pengguna
// menyalinnya atau membuka tautan wa.me yang sudah berisi pesan.

/** Ubah nomor lokal (08xx / +62xx / 62xx) ke format internasional tanpa "+". */
export function normalisasiNomorWa(nomor: string): string {
  const angka = nomor.replace(/\D/g, "");
  if (angka.startsWith("0")) return "62" + angka.slice(1);
  return angka;
}

/**
 * Tautan untuk tombol "Kirim WA". Tanpa nomor, WhatsApp akan meminta
 * pengguna memilih kontak/grup tujuan (cocok untuk laporan ke grup).
 */
export function buatLinkWa(pesan: string, nomor?: string): string {
  const tujuan = nomor ? normalisasiNomorWa(nomor) : "";
  return `https://wa.me/${tujuan}?text=${encodeURIComponent(pesan)}`;
}
