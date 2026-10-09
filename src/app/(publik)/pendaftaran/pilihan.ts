import type { Sektor, SkemaPendaftaran } from "@/generated/prisma/enums";

// Pilihan di formulir pendaftaran. Dipakai di form (client) dan validasi (server).

export const LABEL_SKEMA: Record<SkemaPendaftaran, string> = {
  P_TO_P: "P to P (melalui P3MI)",
  MANDIRI_REGULER: "Mandiri Reguler",
  MANDIRI_SSW: "Mandiri SSW (Jepang)",
};

export const LABEL_SEKTOR: Record<Sektor, string> = {
  FORMAL: "Formal",
  INFORMAL: "Informal",
};

export const PENDIDIKAN = ["SD", "SMP", "SMA/SMK", "D1", "D2", "D3", "D4/S1", "S2", "S3"] as const;

/** Saran saja (datalist); negara lain tetap boleh diketik. */
export const SARAN_NEGARA = [
  "Taiwan",
  "Hong Kong",
  "Malaysia",
  "Singapura",
  "Korea Selatan",
  "Jepang",
  "Brunei Darussalam",
  "Arab Saudi",
  "Uni Emirat Arab",
  "Qatar",
  "Polandia",
  "Turki",
];

export const SARAN_KABUPATEN_LAMPUNG = [
  "Kota Bandar Lampung",
  "Kota Metro",
  "Kabupaten Lampung Barat",
  "Kabupaten Lampung Selatan",
  "Kabupaten Lampung Tengah",
  "Kabupaten Lampung Timur",
  "Kabupaten Lampung Utara",
  "Kabupaten Mesuji",
  "Kabupaten Pesawaran",
  "Kabupaten Pesisir Barat",
  "Kabupaten Pringsewu",
  "Kabupaten Tanggamus",
  "Kabupaten Tulang Bawang",
  "Kabupaten Tulang Bawang Barat",
  "Kabupaten Way Kanan",
];

/** Tanggal verifikasi paling jauh yang boleh dipilih, dihitung dari hari ini. */
export const BATAS_HARI_JADWAL = 30;
