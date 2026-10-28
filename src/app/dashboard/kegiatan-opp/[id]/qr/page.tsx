import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import QRCode from "qrcode";
import { ButtonLink } from "@/components/ui/button";
import { LABEL_SKEMA_OPP } from "@/app/(publik)/pendaftaran/pilihan";
import { wajibRole } from "@/lib/auth/dal";
import { kodeQr, kodeTautan } from "@/lib/presensi-token";
import { formatTanggal } from "@/lib/tanggal";
import { ambilKegiatan, tahapKegiatan } from "../../data";
import { LayarQr } from "./layar-qr";

export const metadata: Metadata = { title: "QR Presensi" };

/** Alamat publik aplikasi, mengikuti host yang dipakai untuk membuka dashboard. */
async function alamatAsal() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function HalamanQrPresensi({ params }: PageProps<"/dashboard/kegiatan-opp/[id]/qr">) {
  await wajibRole("PENGELOLA_KELAS", "PENANGGUNG_JAWAB");
  const k = await ambilKegiatan((await params).id);
  if (!k) notFound();

  // Kode berganti tiap menit; LayarQr me-refresh halaman agar QR ikut berganti.
  const asal = await alamatAsal();
  const url = `${asal}/presensi/${k.idKegiatanOpp}?k=${kodeQr(k.idKegiatanOpp)}`;
  const tautan = `${asal}/presensi/${k.idKegiatanOpp}?t=${kodeTautan(k.idKegiatanOpp)}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  const tahap = tahapKegiatan(k);

  return (
    <>
      <ButtonLink href={`/dashboard/kegiatan-opp/${k.idKegiatanOpp}`} varian="ghost" ukuran="sm" ikon={<ArrowLeft aria-hidden />} className="-ml-3 mb-2">
        {k.kodeKegiatan}
      </ButtonLink>
      <LayarQr
        svg={svg}
        tautan={tautan}
        kodeKegiatan={k.kodeKegiatan}
        judul={`OPP ${LABEL_SKEMA_OPP[k.skemaOpp]}`}
        keterangan={`${formatTanggal(k.tanggalPelaksanaan)} · ${k.tempatOpp}`}
        jumlahPeserta={k.peserta.length}
        jumlahPresensi={k._count.presensi}
        peringatan={
          tahap === "akan-datang"
            ? "Kegiatan ini belum berlangsung."
            : tahap === "selesai" || tahap === "final"
              ? "Kegiatan ini sudah lewat."
              : null
        }
      />
    </>
  );
}
