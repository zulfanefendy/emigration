import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { wajibRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { DaftarMateri } from "./daftar-materi";

export const metadata: Metadata = { title: "Master Materi OPP" };

export default async function HalamanMateri() {
  await wajibRole("PENGELOLA_KELAS");

  const materi = await prisma.materiOpp.findMany({
    orderBy: [{ isActive: "desc" }, { kodeMateri: "asc" }],
    select: {
      idMateri: true,
      kodeMateri: true,
      judulMateri: true,
      deskripsi: true,
      durasiJamPelajaran: true,
      isActive: true,
      _count: { select: { kurikulum: true } },
    },
  });

  return (
    <>
      <PageHeader judul="Master Materi OPP" deskripsi="Daftar materi yang bisa dipilih saat menyusun kurikulum kegiatan OPP." />
      <DaftarMateri
        materi={materi.map(({ _count, ...m }) => ({ ...m, dipakai: _count.kurikulum }))}
      />
    </>
  );
}
