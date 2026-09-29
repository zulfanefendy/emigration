import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Kotak abu berdenyut sebagai pengganti konten yang sedang dimuat. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden className={cn("animate-shimmer rounded-md bg-surface-muted", className)} {...props} />;
}
