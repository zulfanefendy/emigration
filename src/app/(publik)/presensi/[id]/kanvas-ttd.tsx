"use client";

import { Eraser } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Props = {
  /** Dipanggil dengan PNG base64, atau null saat kanvas dikosongkan. */
  onUbah: (png: string | null) => void;
  invalid?: boolean;
  idPesan?: string;
};

const TINGGI = 200;
const TINTA = "#0b1420";

/** Kanvas tanda tangan untuk jari/stylus/mouse ("TTD Digital di Canvas"). */
export function KanvasTtd({ onUbah, invalid, idPesan }: Props) {
  const kanvas = useRef<HTMLCanvasElement>(null);
  const menggambar = useRef(false);
  const terakhir = useRef<{ x: number; y: number } | null>(null);
  const ada = useRef(false);

  // Ukuran piksel mengikuti lebar tampilan x devicePixelRatio (maks 2 agar file tetap kecil).
  useEffect(() => {
    const c = kanvas.current!;
    function atur() {
      const rasio = Math.min(window.devicePixelRatio || 1, 2);
      const lebar = c.clientWidth;
      if (c.width === Math.round(lebar * rasio)) return;
      c.width = Math.round(lebar * rasio);
      c.height = Math.round(TINGGI * rasio);
      const ctx = c.getContext("2d")!;
      ctx.scale(rasio, rasio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = TINTA;
      // Mengubah ukuran menghapus isi kanvas.
      if (ada.current) {
        ada.current = false;
        onUbah(null);
      }
    }
    atur();
    window.addEventListener("resize", atur);
    return () => window.removeEventListener("resize", atur);
  }, [onUbah]);

  function titik(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function mulai(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    menggambar.current = true;
    terakhir.current = titik(e);
    const ctx = e.currentTarget.getContext("2d")!;
    const p = terakhir.current;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = TINTA;
    ctx.fill();
  }

  function gerak(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!menggambar.current || !terakhir.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const p = titik(e);
    ctx.beginPath();
    ctx.moveTo(terakhir.current.x, terakhir.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    terakhir.current = p;
    ada.current = true;
  }

  function selesai() {
    if (!menggambar.current) return;
    menggambar.current = false;
    terakhir.current = null;
    if (ada.current) onUbah(kanvas.current!.toDataURL("image/png"));
  }

  function hapus() {
    const c = kanvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    ada.current = false;
    onUbah(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <canvas
          ref={kanvas}
          role="img"
          aria-label="Area tanda tangan"
          aria-describedby={idPesan}
          style={{ height: TINGGI }}
          className={cn(
            "w-full touch-none rounded-lg border-2 border-dashed bg-white",
            invalid ? "border-danger" : "border-input-border",
          )}
          onPointerDown={mulai}
          onPointerMove={gerak}
          onPointerUp={selesai}
          onPointerCancel={selesai}
        />
        <span className="pointer-events-none absolute right-4 bottom-10 left-4 border-b border-[#9ca3af]" aria-hidden />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-fg-muted">Tanda tangan dengan jari di dalam kotak.</p>
        <Button varian="ghost" ukuran="sm" ikon={<Eraser />} onClick={hapus}>
          Hapus
        </Button>
      </div>
    </div>
  );
}
