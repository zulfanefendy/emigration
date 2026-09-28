// Daftar role pegawai. Nilainya harus sama dengan isi tabel `role` (lihat prisma/seed.ts).
export const ROLE = [
  "ADMIN",
  "VERIFIKATOR",
  "INSTRUKTUR",
  "PENGELOLA_KELAS",
  "PENANGGUNG_JAWAB",
] as const;

export type Role = (typeof ROLE)[number];

export const LABEL_ROLE: Record<Role, string> = {
  ADMIN: "Admin",
  VERIFIKATOR: "Verifikator",
  INSTRUKTUR: "Instruktur",
  PENGELOLA_KELAS: "Pengelola Kelas",
  PENANGGUNG_JAWAB: "Penanggung Jawab",
};

export function isRole(nilai: string): nilai is Role {
  return (ROLE as readonly string[]).includes(nilai);
}

/** ADMIN boleh mengakses semua menu; role lain harus tercantum. */
export function punyaAkses(rolePegawai: readonly Role[], roleDiizinkan: readonly Role[]): boolean {
  return rolePegawai.includes("ADMIN") || rolePegawai.some((r) => roleDiizinkan.includes(r));
}
