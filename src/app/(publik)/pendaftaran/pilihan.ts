import type { Sektor, SkemaOpp, SkemaPendaftaran } from "@/generated/prisma/enums";

// Pilihan di formulir pendaftaran. Dipakai di form (client) dan validasi (server).

export const LABEL_SKEMA: Record<SkemaPendaftaran, string> = {
  P_TO_P: "P to P (melalui P3MI)",
  MANDIRI_REGULER: "Mandiri Reguler",
  MANDIRI_SSW: "Mandiri SSW (Jepang)",
};

/** Kegiatan OPP hanya dua skema; Mandiri Reguler dan Mandiri SSW ikut OPP Mandiri. */
export const LABEL_SKEMA_OPP: Record<SkemaOpp, string> = {
  P_TO_P: "P to P",
  MANDIRI: "Mandiri",
};

/** Skema pendaftaran CPMI yang boleh menjadi peserta tiap skema OPP. */
export const SKEMA_CPMI_OPP: Record<SkemaOpp, SkemaPendaftaran[]> = {
  P_TO_P: ["P_TO_P"],
  MANDIRI: ["MANDIRI_REGULER", "MANDIRI_SSW"],
};

/** Panjang 1 jam pelajaran (JP) per skema OPP, dalam menit. */
export const MENIT_PER_JP: Record<SkemaOpp, number> = {
  P_TO_P: 45,
  MANDIRI: 30,
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

/** 38 provinsi. CPMI dari luar Lampung juga boleh mendaftar di BP3MI Lampung. */
export const PROVINSI = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Bengkulu",
  "Sumatera Selatan",
  "Kepulauan Bangka Belitung",
  "Lampung",
  "Banten",
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Gorontalo",
  "Sulawesi Tengah",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Maluku",
  "Maluku Utara",
  "Papua",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Selatan",
] as const;

/** Saran kabupaten/kota, hanya ditampilkan bila provinsi = Lampung. */
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
