import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QrCode } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { LABEL_SKEMA } from "@/app/(publik)/pendaftaran/pilihan";
import { buatIzin, cekKodeQr } from "@/lib/presensi-token";
import { formatTanggal } from "@/lib/tanggal";
import { AlurPresensi } from "./alur-presensi";
import { alasanTutup, ambilKegiatanPresensi } from "./data";

export const metadata: Metadata = { title: "Presensi OPP", robots: { index: false } };

export default async function HalamanPresensi({ params, searchParams }: PageProps<"/presensi/[id]">) {
  const { id } = await params;
  const { k: kode } = await searchParams;
  const kegiatan = await ambilKegiatanPresensi(id);
  if (!kegiatan) notFound();

  const tutup = await alasanTutup(id);
  const qrBerlaku = typeof kode === "string" && cekKodeQr(id, kode);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <Card className="mb-6 overflow-hidden">
        <div className="bg-sidebar px-5 py-4 text-white">
          <p className="text-xs font-semibold tracking-[0.16em] text-aksen uppercase">Presensi OPP · BP3MI Lampung</p>
          <p className="mt-0.5 font-semibold">Orientasi Pra Penempatan {LABEL_SKEMA[kegiatan.skemaOpp]}</p>
        </div>
        <div className="px-5 py-3 text-sm text-fg-muted">
          <p className="font-medium text-fg">{formatTanggal(kegiatan.tanggalPelaksanaan)}</p>
          <p>
            {kegiatan.tempatOpp} · <span className="font-mono">{kegiatan.kodeKegiatan}</span>
          </p>
        </div>
      </Card>

      {tutup ? (
        <Alert jenis="peringatan" judul="Presensi belum bisa dilakukan">
          {tutup}
        </Alert>
      ) : !qrBerlaku ? (
        <Alert jenis="peringatan" judul="QR sudah kedaluwarsa">
          <span className="inline-flex items-start gap-1.5">
            <QrCode className="mt-0.5 size-4 shrink-0" aria-hidden />
            QR presensi berganti setiap menit. Pindai ulang QR yang tampil di layar kelas.
          </span>
        </Alert>
      ) : (
        <AlurPresensi idKegiatanOpp={id} izin={buatIzin(id)} />
      )}
    </div>
  );
}
