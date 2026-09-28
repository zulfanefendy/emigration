import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NAMA_COOKIE_SESI, dekripsiSesi } from "./session";
import { isRole, punyaAkses, type Role } from "./role";

// Data Access Layer: satu-satunya tempat untuk mengecek siapa yang login dan
// apa role-nya. Setiap halaman dan server action pegawai wajib lewat sini.

export type PegawaiLogin = {
  idPegawai: string;
  namaLengkap: string;
  nip: string;
  email: string;
  roles: Role[];
};

/** Pegawai yang sedang login, atau null. Di-cache per request. */
export const ambilPegawaiLogin = cache(async (): Promise<PegawaiLogin | null> => {
  const sesi = await dekripsiSesi((await cookies()).get(NAMA_COOKIE_SESI)?.value);
  if (!sesi) return null;

  const pegawai = await prisma.pegawai.findUnique({
    where: { idPegawai: sesi.idPegawai },
    select: {
      idPegawai: true,
      namaLengkap: true,
      nip: true,
      email: true,
      isActive: true,
      roles: { select: { role: { select: { namaRole: true } } } },
    },
  });
  if (!pegawai || !pegawai.isActive) return null;

  return {
    idPegawai: pegawai.idPegawai,
    namaLengkap: pegawai.namaLengkap,
    nip: pegawai.nip,
    email: pegawai.email,
    roles: pegawai.roles.map((r) => r.role.namaRole).filter(isRole),
  };
});

/** Wajib login; bila tidak, arahkan ke halaman login. */
export async function wajibLogin(): Promise<PegawaiLogin> {
  const pegawai = await ambilPegawaiLogin();
  if (!pegawai) redirect("/login");
  return pegawai;
}

/** Wajib login dan punya salah satu role (ADMIN selalu lolos). */
export async function wajibRole(...roleDiizinkan: Role[]): Promise<PegawaiLogin> {
  const pegawai = await wajibLogin();
  if (!punyaAkses(pegawai.roles, roleDiizinkan)) redirect("/dashboard?akses=ditolak");
  return pegawai;
}
