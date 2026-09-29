import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Varian = "primary" | "secondary" | "outline" | "ghost" | "danger" | "aksen";
type Ukuran = "sm" | "md" | "lg" | "icon";

const KELAS_VARIAN: Record<Varian, string> = {
  primary: "bg-brand text-brand-fg hover:bg-brand-hover",
  secondary: "bg-brand-soft text-brand-text hover:bg-brand-soft/70",
  outline: "border border-input-border bg-surface text-fg hover:bg-surface-muted",
  ghost: "text-fg hover:bg-surface-muted",
  danger: "bg-danger text-white hover:bg-danger/90 dark:text-[#1b0a08]",
  aksen: "bg-aksen text-aksen-fg hover:bg-aksen/90",
};

const KELAS_UKURAN: Record<Ukuran, string> = {
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-6 text-base",
  icon: "size-10",
};

/** Class tombol, dipakai juga untuk <Link> yang tampil seperti tombol. */
export function kelasTombol(varian: Varian = "primary", ukuran: Ukuran = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-colors",
    "focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0",
    KELAS_VARIAN[varian],
    KELAS_UKURAN[ukuran],
    className,
  );
}

type PropsTombol = ComponentProps<"button"> & {
  varian?: Varian;
  ukuran?: Ukuran;
  /** Tampilkan spinner dan kunci tombol, mis. saat server action berjalan. */
  memuat?: boolean;
  ikon?: ReactNode;
};

export function Button({ varian, ukuran, memuat, ikon, className, children, disabled, type = "button", ...props }: PropsTombol) {
  return (
    <button
      type={type}
      disabled={disabled || memuat}
      aria-busy={memuat || undefined}
      className={kelasTombol(varian, ukuran, className)}
      {...props}
    >
      {memuat ? <Loader2 className="animate-spin" aria-hidden /> : ikon}
      {children}
    </button>
  );
}

type PropsLinkTombol = ComponentProps<typeof Link> & { varian?: Varian; ukuran?: Ukuran; ikon?: ReactNode };

export function ButtonLink({ varian, ukuran, ikon, className, children, ...props }: PropsLinkTombol) {
  return (
    <Link className={kelasTombol(varian, ukuran, className)} {...props}>
      {ikon}
      {children}
    </Link>
  );
}
