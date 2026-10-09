import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { wajibRole } from "@/lib/auth/dal";
import { punyaAkses } from "@/lib/auth/role";
import { prisma } from "@/lib/prisma";
import { dariTanggalDb, hariIniWib } from "@/lib/tanggal";
import { pegawaiDenganRole, tahapKegiatan } from "./data";
import { DaftarKegiatan } from "./daftar-kegiatan";

export const metadata: Metadata = { title: "Kegiatan OPP" };

export default async function HalamanKegiatan() {
  const pegawai = await wajibRole("PENGELOLA_KELAS", "PENANGGUNG_JAWAB");
  const bolehUbah = punyaAkses(pegawai.roles, ["PENGELOLA_KELAS"]);

  const [kegiatan, pengelola, penanggungJawab] = await Promise.all([
    prisma.kegiatanOpp.findMany({
      orderBy: [{ tanggalPelaksanaan: "desc" }, { kodeKegiatan: "desc" }],
      select: {
        idKegiatanOpp: true,
        kodeKegiatan: true,
        tanggalPelaksanaan: true,
        skemaOpp: true,
        tempatOpp: true,
        isCpmiFinal: true,
        _count: { select: { peserta: true, kurikulum: true } },
      },
    }),
    bolehUbah ? pegawaiDenganRole("PENGELOLA_KELAS") : [],
    bolehUbah ? pegawaiDenganRole("PENANGGUNG_JAWAB") : [],
  ]);

  return (
    <>
      <PageHeader judul="Kegiatan OPP" deskripsi="Orientasi Pra Penempatan: jadwal, kurikulum, peserta, serta SK dan SPT." />
      <DaftarKegiatan
        bolehUbah={bolehUbah}
        hariIni={hariIniWib()}
        pengelola={pengelola}
        penanggungJawab={penanggungJawab}
        kegiatan={kegiatan.map((k) => ({
          idKegiatanOpp: k.idKegiatanOpp,
          kodeKegiatan: k.kodeKegiatan,
          tanggalPelaksanaan: dariTanggalDb(k.tanggalPelaksanaan),
          skemaOpp: k.skemaOpp,
          tempatOpp: k.tempatOpp,
          jumlahPeserta: k._count.peserta,
          jumlahSesi: k._count.kurikulum,
          tahap: tahapKegiatan(k),
        }))}
      />
    </>
  );
}
