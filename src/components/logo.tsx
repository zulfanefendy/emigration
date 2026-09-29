import { cn } from "@/lib/cn";

// Logo sementara (bola dunia + lintasan emas). Ganti dengan logo resmi bila sudah ada.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9 shrink-0", className)} aria-hidden>
      <rect width="40" height="40" rx="10" fill="#11375C" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="20" cy="20" r="10" />
        <ellipse cx="20" cy="20" rx="4.2" ry="10" />
        <path d="M10.6 16.5h18.8M10.6 23.5h18.8" />
      </g>
      <path d="M6.5 27.5C13 33.5 27.5 33 34 22" fill="none" stroke="#FBB934" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="34" cy="22" r="2.2" fill="#FBB934" />
    </svg>
  );
}

type PropsLogo = { className?: string; /** warna teks untuk latar gelap (sidebar/navbar navy) */ terang?: boolean };

export function Logo({ className, terang }: PropsLogo) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={cn(terang && "ring-1 ring-white/20 rounded-[10px]")} />
      <span className="flex flex-col leading-tight">
        <span className={cn("text-[11px] font-semibold tracking-[0.14em] uppercase", terang ? "text-aksen" : "text-brand-text")}>
          BP3MI Lampung
        </span>
        <span className={cn("text-sm font-bold", terang ? "text-white" : "text-fg")}>Verifikasi CPMI &amp; OPP</span>
      </span>
    </span>
  );
}
