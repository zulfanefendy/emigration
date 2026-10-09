import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { wajibRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { formatTanggal, hariIniWib, keTanggalDb } from "@/lib/tanggal";
import { DaftarAntrean, type BarisAntrean } from "./daftar-antrean";
import { PilihTanggal } from "./pilih-tanggal";

export const metadata: Metadata = { title: "Verifikasi Loket" };

export default async function HalamanVerifikasi({ searchParams }: PageProps<"/dashboard/verifikasi">) {
  const pegawai = await wajibRole("VERIFIKATOR");
  const { tanggal: param } = await searchParams;
  const hariIni = hariIniWib();
  const tanggal = typeof param === "string" && /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : hariIni;

  const antrian = await prisma.antrian.findMany({
    where: { tanggalAntrian: keTanggalDb(tanggal) },
    orderBy: { noAntrian: "asc" },
    select: {
      noAntrian: true,
      statusAntrian: true,
      cpmi: {
        select: {
          idCpmi: true,
          namaLengkap: true,
          noPaspor: true,
          skemaPendaftaran: true,
          negaraPenempatan: true,
          verifikasi: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { statusVerifikasi: true, idVerifikator: true, verifikator: { select: { namaLengkap: true } } },
          },
        },
      },
    },
  });

  const baris: BarisAntrean[] = antrian.map(({ cpmi, ...a }) => {
    const v = cpmi.verifikasi[0];
    return {
      idCpmi: cpmi.idCpmi,
      noAntrian: a.noAntrian,
      statusAntrian: a.statusAntrian,
      namaLengkap: cpmi.namaLengkap,
      noPaspor: cpmi.noPaspor,
      skema: cpmi.skemaPendaftaran,
      negara: cpmi.negaraPenempatan,
      statusVerifikasi: v?.statusVerifikasi ?? "BELUM_DIVERIFIKASI",
      verifikator: v?.verifikator?.namaLengkap ?? null,
      milikSaya: v?.idVerifikator === pegawai.idPegawai,
    };
  });

  return (
    <>
      <PageHeader
        judul="Verifikasi Loket"
        deskripsi={`Antrean ${tanggal === hariIni ? "hari ini, " : ""}${formatTanggal(keTanggalDb(tanggal))}`}
        aksi={<PilihTanggal tanggal={tanggal} hariIni={hariIni} />}
      />
      <DaftarAntrean key={tanggal} tanggal={tanggal} baris={baris} />
    </>
  );
}
