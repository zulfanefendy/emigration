"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { Logo } from "@/components/logo";
import { ToggleTema } from "@/components/theme";
import { kelasTombol } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Tautan = { href: string; label: string; /** id section di beranda, untuk tautan #anchor */ bagian?: string };

const TAUTAN: Tautan[] = [
  { href: "/", label: "Beranda" },
  { href: "/#alur", label: "Alur Layanan", bagian: "alur" },
  { href: "/pendaftaran", label: "Pendaftaran" },
];

/** Tautan mana yang aktif: berdasarkan path, dan di beranda berdasarkan section yang sedang terlihat. */
function useTautanAktif(): string | null {
  const pathname = usePathname();
  const [bagianTerlihat, setBagianTerlihat] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== "/") return;
    const daftar = TAUTAN.filter((t) => t.bagian).map((t) => [t.href, document.getElementById(t.bagian!)] as const);
    let antre = 0;
    const periksa = () => {
      antre = 0;
      // Section dianggap aktif bila bagian atasnya sudah melewati 40% tinggi layar
      const batas = window.innerHeight * 0.4;
      const aktif = daftar.findLast(([, el]) => el && el.getBoundingClientRect().top < batas);
      setBagianTerlihat(aktif?.[0] ?? null);
    };
    const saatScroll = () => {
      antre ||= requestAnimationFrame(periksa);
    };
    periksa();
    window.addEventListener("scroll", saatScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", saatScroll);
      cancelAnimationFrame(antre);
    };
  }, [pathname]);

  if (pathname === "/") return bagianTerlihat ?? "/";
  return TAUTAN.find((t) => t.href !== "/" && !t.bagian && pathname.startsWith(t.href))?.href ?? null;
}

export function NavbarPublik() {
  const pathname = usePathname();
  const aktif = useTautanAktif();
  // Menu mobile dicatat terbuka di path mana; pindah halaman = otomatis tertutup.
  const [menuDi, setMenuDi] = useState<string | null>(null);
  const menuBuka = menuDi === pathname;

  // Di beranda, tautan ke beranda/section cukup di-scroll halus tanpa navigasi.
  const klikTautan = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, t: Tautan) => {
      setMenuDi(null);
      if (pathname !== "/" || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      if (t.bagian) document.getElementById(t.bagian)?.scrollIntoView();
      else window.scrollTo({ top: 0 });
      history.replaceState(null, "", t.href);
    },
    [pathname],
  );

  return (
    <header className="sticky top-0 z-30 bg-sidebar text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="rounded-md focus-visible:ring-2 focus-visible:ring-aksen focus-visible:outline-none">
          <Logo terang />
        </Link>

        <NavDesktop aktif={aktif} onKlik={klikTautan} />

        <div className="ml-auto flex items-center gap-2">
          <ToggleTema className="text-sidebar-fg hover:bg-sidebar-hover hover:text-white" />
          <Link href="/login" className={kelasTombol("aksen", "sm", "h-9")}>
            <LogIn aria-hidden />
            <span className="hidden sm:inline">Login Pegawai</span>
            <span className="sm:hidden">Login</span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuDi(menuBuka ? null : pathname)}
            aria-label={menuBuka ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuBuka}
            aria-controls="menu-publik"
            className="flex size-9 items-center justify-center rounded-lg text-sidebar-fg transition-colors hover:bg-sidebar-hover hover:text-white md:hidden"
          >
            <span className="relative size-5">
              <Menu aria-hidden className={cn("absolute inset-0 size-5 transition duration-200", menuBuka && "scale-50 rotate-90 opacity-0")} />
              <X aria-hidden className={cn("absolute inset-0 size-5 transition duration-200", !menuBuka && "scale-50 -rotate-90 opacity-0")} />
            </span>
          </button>
        </div>
      </div>

      {/* Menu mobile: tinggi dianimasikan dengan trik grid-rows 0fr -> 1fr */}
      <div
        id="menu-publik"
        className={cn(
          "grid border-t transition-[grid-template-rows,border-color] duration-300 ease-halus md:hidden",
          menuBuka ? "grid-rows-[1fr] border-sidebar-border" : "grid-rows-[0fr] border-transparent",
        )}
        inert={!menuBuka}
      >
        <nav aria-label="Navigasi utama" className="overflow-hidden">
          <ul className="flex flex-col gap-1 px-4 py-3">
            {TAUTAN.map((t, i) => (
              <li
                key={t.href}
                className={cn("transition duration-300 ease-halus", menuBuka ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0")}
                style={{ transitionDelay: menuBuka ? `${60 + i * 40}ms` : "0ms" }}
              >
                <Link
                  href={t.href}
                  onClick={(e) => klikTautan(e, t)}
                  aria-current={aktif === t.href ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    aktif === t.href ? "bg-sidebar-hover text-white" : "text-sidebar-fg hover:bg-sidebar-hover hover:text-white",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("h-4 w-1 rounded-full bg-aksen transition-transform duration-300", aktif === t.href ? "scale-y-100" : "scale-y-0")}
                  />
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

type PropsNav = { aktif: string | null; onKlik: (e: MouseEvent<HTMLAnchorElement>, t: Tautan) => void };

/** Navigasi desktop dengan latar penanda yang bergeser halus ke tautan aktif. */
function NavDesktop({ aktif, onKlik }: PropsNav) {
  const refTautan = useRef(new Map<string, HTMLAnchorElement>());
  const [posisi, setPosisi] = useState<{ x: number; lebar: number } | null>(null);
  // Posisi pertama langsung ditempatkan tanpa animasi geser dari kiri
  const [siap, setSiap] = useState(false);

  useLayoutEffect(() => {
    const ukur = () => {
      const el = aktif ? refTautan.current.get(aktif) : undefined;
      setPosisi(el ? { x: el.offsetLeft, lebar: el.offsetWidth } : null);
    };
    ukur();
    window.addEventListener("resize", ukur);
    return () => window.removeEventListener("resize", ukur);
  }, [aktif]);

  useEffect(() => {
    if (!posisi || siap) return;
    const id = requestAnimationFrame(() => setSiap(true));
    return () => cancelAnimationFrame(id);
  }, [posisi, siap]);

  return (
    <nav aria-label="Navigasi utama" className="hidden flex-1 md:block">
      <ul className="relative flex items-center gap-1">
        <li
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 rounded-lg bg-sidebar-hover",
            siap && "transition-[transform,width,opacity] duration-500 ease-halus",
            posisi ? "opacity-100" : "opacity-0",
          )}
          style={{ width: posisi?.lebar ?? 0, transform: `translateX(${posisi?.x ?? 0}px)` }}
        >
          <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-aksen" />
        </li>
        {TAUTAN.map((t) => (
          <li key={t.href} className="relative">
            <Link
              ref={(el) => {
                if (el) refTautan.current.set(t.href, el);
                else refTautan.current.delete(t.href);
              }}
              href={t.href}
              onClick={(e) => onKlik(e, t)}
              aria-current={aktif === t.href ? "page" : undefined}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-300",
                "focus-visible:ring-2 focus-visible:ring-aksen focus-visible:outline-none",
                aktif === t.href ? "text-white" : "text-sidebar-fg hover:text-white",
              )}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
