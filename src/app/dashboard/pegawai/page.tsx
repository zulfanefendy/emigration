import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { wajibRole } from "@/lib/auth/dal";
import { isRole } from "@/lib/auth/role";
import { prisma } from "@/lib/prisma";
import { DaftarPegawai } from "./daftar-pegawai";

export const metadata: Metadata = { title: "Pegawai & Role" };

export default async function HalamanPegawai() {
  const admin = await wajibRole("ADMIN");

  const pegawai = await prisma.pegawai.findMany({
    orderBy: [{ isActive: "desc" }, { namaLengkap: "asc" }],
    select: {
      idPegawai: true,
      nip: true,
      namaLengkap: true,
      jabatan: true,
      noWhatsapp: true,
      email: true,
      isActive: true,
      roles: { select: { role: { select: { namaRole: true } } } },
    },
  });

  return (
    <>
      <PageHeader judul="Pegawai & Role" deskripsi="Kelola akun pegawai dan hak aksesnya. Satu pegawai boleh memiliki beberapa role." />
      <DaftarPegawai
        idPegawaiLogin={admin.idPegawai}
        pegawai={pegawai.map(({ roles, ...p }) => ({
          ...p,
          roles: roles.map((r) => r.role.namaRole).filter(isRole),
        }))}
      />
    </>
  );
}
