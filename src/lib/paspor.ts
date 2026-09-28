// Validasi format nomor paspor Indonesia.
// Hanya mengecek bentuk nomornya, tidak dicocokkan ke data imigrasi.
// Format paspor RI: 8 karakter = 1 huruf + 7 angka, contoh A1234567, E1234567.

const POLA_PASPOR = /^[A-Z][0-9]{7}$/;

/** Rapikan input: huruf besar, buang spasi dan tanda hubung. */
export function normalisasiPaspor(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "");
}

export type HasilCekPaspor =
  | { valid: true; noPaspor: string }
  | { valid: false; pesan: string };

export function cekFormatPaspor(input: string): HasilCekPaspor {
  const noPaspor = normalisasiPaspor(input);

  if (noPaspor.length === 0) {
    return { valid: false, pesan: "Nomor paspor wajib diisi." };
  }
  if (noPaspor.length !== 8) {
    return { valid: false, pesan: "Nomor paspor harus 8 karakter (1 huruf + 7 angka)." };
  }
  if (!POLA_PASPOR.test(noPaspor)) {
    return {
      valid: false,
      pesan: "Format tidak sesuai. Nomor paspor diawali 1 huruf lalu 7 angka, contoh: A1234567.",
    };
  }
  return { valid: true, noPaspor };
}
