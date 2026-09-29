import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type NadaBadge = "netral" | "brand" | "sukses" | "peringatan" | "bahaya" | "aksen";

const KELAS_NADA: Record<NadaBadge, string> = {
  netral: "bg-surface-muted text-fg-muted",
  brand: "bg-brand-soft text-brand-text",
  sukses: "bg-success-soft text-success",
  peringatan: "bg-warning-soft text-warning",
  bahaya: "bg-danger-soft text-danger",
  aksen: "bg-aksen text-aksen-fg",
};

export function Badge({ nada = "netral", className, ...props }: ComponentProps<"span"> & { nada?: NadaBadge }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3.5",
        KELAS_NADA[nada],
        className,
      )}
      {...props}
    />
  );
}
