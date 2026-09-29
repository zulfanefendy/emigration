import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { GAYA_PESAN, type JenisPesan } from "./nada";

type PropsAlert = { jenis?: JenisPesan; judul?: ReactNode; children?: ReactNode; aksi?: ReactNode; className?: string };

/** Pesan statis di dalam halaman (bukan pop-up). Untuk pop-up pakai toast. */
export function Alert({ jenis = "info", judul, children, aksi, className }: PropsAlert) {
  const gaya = GAYA_PESAN[jenis];
  const Ikon = gaya.ikon;
  return (
    <div
      role={jenis === "gagal" || jenis === "peringatan" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", gaya.kotak, className)}
    >
      <Ikon className={cn("mt-0.5 size-5 shrink-0", gaya.ikonWarna)} aria-hidden />
      <div className="flex-1 text-fg">
        {judul && <p className="font-semibold">{judul}</p>}
        {children && <div className={cn(judul && "mt-0.5", "text-fg-muted")}>{children}</div>}
      </div>
      {aksi && <div className="shrink-0 self-center">{aksi}</div>}
    </div>
  );
}
