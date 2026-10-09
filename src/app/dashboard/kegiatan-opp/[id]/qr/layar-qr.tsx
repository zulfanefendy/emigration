"use client";

import { useRouter } from "next/navigation";
import { Maximize } from "lucide-react";
import { useEffect, useRef } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  svg: string;
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
    </div>
  );
}
