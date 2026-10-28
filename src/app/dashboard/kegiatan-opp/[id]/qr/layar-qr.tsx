"use client";

import { useRouter } from "next/navigation";
import { Copy, Link2, Maximize, Share2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, kelasTombol } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";

type Props = {
  svg: string;
  /** Tautan cadangan untuk peserta yang tidak bisa memindai QR. */
  tautan: string;
  kodeKegiatan: string;
  judul: string;
  keterangan: string;
  jumlahPeserta: number;
  jumlahPresensi: number;
  peringatan: string | null;
};

/** QR (berganti tiap menit) dan jumlah presensi diperbarui berkala selama tampil di layar kelas. */
const INTERVAL_SEGAR_MS = 10_000;

/** "Tampilkan QR Code Presensi OPP" untuk diproyeksikan di depan kelas. */
export function LayarQr(p: Props) {
  const router = useRouter();
  const layar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, INTERVAL_SEGAR_MS);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="flex flex-col gap-4">
      {p.peringatan && <Alert jenis="peringatan">{p.peringatan}</Alert>}
      <Card ref={layar} className="flex flex-col items-center gap-6 bg-white p-8 text-center text-[#0b1420] fullscreen:justify-center fullscreen:rounded-none">
        <div>
          <p className="font-mono text-sm font-semibold text-[#4b5563]">{p.kodeKegiatan}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Presensi {p.judul}</h1>
          <p className="mt-1 text-[#4b5563]">{p.keterangan}</p>
        </div>
        <div
          role="img"
          aria-label={`QR code presensi ${p.kodeKegiatan}`}
          className="w-full max-w-[min(26rem,70vh)] [&_svg]:h-auto [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: p.svg }}
        />
        <div>
          <p className="text-lg font-semibold">Pindai dengan kamera HP, lalu tanda tangan di layar.</p>
          <p className="text-sm text-[#4b5563]">QR berganti otomatis setiap menit.</p>
          <p className="mt-2 text-4xl font-bold tabular-nums">
            {p.jumlahPresensi}
            <span className="text-2xl text-[#4b5563]"> / {p.jumlahPeserta} hadir</span>
          </p>
        </div>
      </Card>
      <div className="flex flex-wrap justify-center gap-2">
        <Button ikon={<Maximize />} onClick={() => layar.current?.requestFullscreen()}>
          Layar Penuh
        </Button>
      </div>
      <TautanPresensi tautan={p.tautan} judul={`Presensi ${p.judul} (${p.kodeKegiatan})`} />
    </div>
  );
}

/** Tautan presensi cadangan untuk dibagikan lewat WhatsApp bila peserta tidak bisa memindai QR. */
function TautanPresensi({ tautan, judul }: { tautan: string; judul: string }) {
  async function salin() {
    try {
      await navigator.clipboard.writeText(tautan);
      toast.sukses("Tautan presensi disalin.");
    } catch {
      toast.gagal("Gagal menyalin. Salin tautan secara manual.");
    }
  }

  const pesanWa = `${judul}
Silakan isi presensi lewat tautan berikut (hanya hari ini):
${tautan}`;

  return (
    <Card>
      <CardHeader
        judul={
          <span className="inline-flex items-center gap-2">
            <Link2 className="size-4" aria-hidden /> Tautan Presensi
          </span>
        }
        deskripsi="Untuk peserta yang tidak bisa memindai QR. Tautan hanya berlaku pada hari pelaksanaan, dan hanya CPMI peserta kegiatan ini yang bisa presensi."
      />
      <CardBody className="flex flex-col gap-3">
        <p className="rounded-lg border border-border bg-surface-muted px-3 py-2 font-mono text-xs break-all text-fg">{tautan}</p>
        <div className="flex flex-wrap gap-2">
          <Button varian="outline" ukuran="sm" ikon={<Copy />} onClick={salin}>
            Salin Tautan
          </Button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(pesanWa)}`}
            target="_blank"
            rel="noreferrer"
            className={kelasTombol("outline", "sm")}
          >
            <Share2 aria-hidden />
            Bagikan ke WhatsApp
          </a>
        </div>
      </CardBody>
    </Card>
  );
}
