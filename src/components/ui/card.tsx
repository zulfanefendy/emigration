import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-border bg-surface shadow-xs", className)} {...props} />;
}

type PropsKepalaCard = { judul: ReactNode; deskripsi?: ReactNode; aksi?: ReactNode; className?: string };

export function CardHeader({ judul, deskripsi, aksi, className }: PropsKepalaCard) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4", className)}>
      <div>
        <h2 className="font-semibold text-fg">{judul}</h2>
        {deskripsi && <p className="mt-0.5 text-sm text-fg-muted">{deskripsi}</p>}
      </div>
      {aksi && <div className="flex items-center gap-2">{aksi}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3", className)}
      {...props}
    />
  );
}
