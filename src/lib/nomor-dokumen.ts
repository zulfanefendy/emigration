// Format baku nomor SK dan SPT OPP. Pengguna hanya mengisi nomor urut dari
// tata usaha; tahun dan bulan mengikuti tanggal surat.
//   SK : NOMOR 1647 TAHUN 2026
//   SPT: SP.1705/10.7/PP.03.06/X/2026

/** Kode arsip unit BP3MI Lampung. */
export const KODE_ARSIP_UNIT = "10.7";
/** Kode klasifikasi arsip kegiatan OPP. */
export const KODE_KLASIFIKASI_OPP = "PP.03.06";

const ROMAWI = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** Nomor urut yang valid: 1 sampai 6 angka. */
export const POLA_NOMOR_URUT = /^\d{1,6}$/;

/** `tanggal` dalam format YYYY-MM-DD. */
export function bulanRomawi(tanggal: string) {
  return ROMAWI[Number(tanggal.slice(5, 7)) - 1];
}

/**
 * "1647 TAHUN 2026" (tanpa kata NOMOR, yang ditulis di naskah). Nilai lama
 * yang bukan nomor urut ditampilkan apa adanya.
 */
export function nomorSk(urut: string, tanggal: string) {
  return POLA_NOMOR_URUT.test(urut) ? `${urut} TAHUN ${tanggal.slice(0, 4)}` : urut;
}

export function nomorSpt(urut: string, tanggal: string) {
  return POLA_NOMOR_URUT.test(urut)
    ? `SP.${urut}/${KODE_ARSIP_UNIT}/${KODE_KLASIFIKASI_OPP}/${bulanRomawi(tanggal)}/${tanggal.slice(0, 4)}`
    : urut;
}
