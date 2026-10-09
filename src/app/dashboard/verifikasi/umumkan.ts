// Pengumuman suara nomor antrean lewat Web Speech API browser (tanpa server).
// Bila browser tidak mendukung, fungsi ini diam saja.

const ANGKA = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];

/** "A-012" -> "A, nol, satu, dua": dieja per digit agar jelas di ruang tunggu. */
function ejaNomor(noAntrian: string): string {
  return [...noAntrian.replace(/-/g, "")].map((c) => (/\d/.test(c) ? ANGKA[Number(c)] : c)).join(", ");
}

export function umumkanNomor(noAntrian: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const ucapan = new SpeechSynthesisUtterance(
    `Nomor antrean, ${ejaNomor(noAntrian)}. Silakan menuju loket verifikasi.`,
  );
  ucapan.lang = "id-ID";
  ucapan.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(ucapan);
}
