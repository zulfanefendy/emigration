import type { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { wajibRole } from "@/lib/auth/dal";
import { formatTanggal, hariIniWib, keTanggalDb } from "@/lib/tanggal";
import { PilihTanggal } from "../verifikasi/pilih-tanggal";
import { KirimLaporan } from "./kirim-laporan";
import { rekapHarian, teksLaporan } from "./laporan";

export const metadata: Metadata = { title: "Laporan Harian" };

export default async function HalamanLaporanHarian({ searchParams }: PageProps<"/dashboard/laporan-harian">) {
  await wajibRole("PENGELOLA_KELAS", "PENANGGUNG_JAWAB");
  const { tanggal: param } = await searchParams;
  const hariIni = hariIniWib();
  const tanggal = typeof param === "string" && /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : hariIni;

  const rekap = await rekapHarian(tanggal);
  const teks = teksLaporan(tanggal, rekap);
  const angka: [string, number][] = [
    ["Antrean loket", rekap.loket.terdaftar],
    ["Selesai diverifikasi", rekap.loket.selesai],
    ["Kegiatan OPP", rekap.kegiatan.length],
    ["Hadir OPP", rekap.kegiatan.reduce((n, k) => n + k.hadir, 0)],
  ];

  return (
    <>
      <PageHeader
        judul="Laporan Harian"
        deskripsi={`Rekap ${tanggal === hariIni ? "hari ini, " : ""}${formatTanggal(keTanggalDb(tanggal))} untuk dikirim lewat WhatsApp.`}
        aksi={<PilihTanggal tanggal={tanggal} hariIni={hariIni} />}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader judul="Pratinjau pesan" deskripsi="Teks inilah yang akan dikirim." />
          <CardBody>
            <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap text-fg">{teks}</pre>
          </CardBody>
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardBody className="grid grid-cols-2 gap-4">
              {angka.map(([label, nilai]) => (
                <div key={label}>
                  <p className="text-sm text-fg-muted">{label}</p>
                  <p className="text-2xl font-bold text-fg">{nilai}</p>
                </div>
              ))}
            </CardBody>
          </Card>
          <KirimLaporan teks={teks} />
        </div>
      </div>
    </>
  );
}
