"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/logo";
import { ToggleTema } from "@/components/theme";
import type { MenuDashboard } from "@/lib/auth/menu";
import { cn } from "@/lib/cn";
import { IKON_MENU } from "./ikon-menu";

type PropsShell = {
  menu: MenuDashboard[];
  namaPegawai: string;
  labelRole: string;
  aksiLogout: () => Promise<void>;
  children: ReactNode;
};

/** Kerangka dashboard: sidebar navy (drawer di layar kecil) + topbar + konten. */
export function ShellDashboard({ menu, namaPegawai, labelRole, aksiLogout, children }: PropsShell) {
  const pathname = usePathname();
  // Drawer (mobile) dicatat terbuka di path mana; pindah halaman = otomatis tertutup.
  const [drawerDi, setDrawerDi] = useState<string | null>(null);
  const drawerBuka = drawerDi === pathname;
  const setDrawerBuka = (buka: boolean) => setDrawerDi(buka ? pathname : null);

  useEffect(() => {
    if (!drawerBuka) return;
    const tutupDenganEsc = (e: KeyboardEvent) => e.key === "Escape" && setDrawerDi(null);
    window.addEventListener("keydown", tutupDenganEsc);
    return () => window.removeEventListener("keydown", tutupDenganEsc);
  }, [drawerBuka]);

  return (
    <div className="flex min-h-dvh flex-1">
      {/* Latar gelap saat drawer terbuka (mobile) */}
      <div
        aria-hidden
        onClick={() => setDrawerBuka(false)}
        className={cn(
          "fixed inset-0 z-40 bg-[#0b1420]/50 transition-opacity lg:hidden",
          drawerBuka ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-68 flex-col bg-sidebar text-sidebar-fg transition-transform duration-200",
          "lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          drawerBuka ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link href="/dashboard" className="rounded-md focus-visible:ring-2 focus-visible:ring-aksen focus-visible:outline-none">
            <Logo terang />
          </Link>
          <button
            type="button"
            onClick={() => setDrawerBuka(false)}
            aria-label="Tutup menu"
            className="flex size-9 items-center justify-center rounded-lg hover:bg-sidebar-hover lg:hidden"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <nav aria-label="Menu utama" className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-[0.14em] text-sidebar-fg/70 uppercase">Menu</p>
          <ul className="flex flex-col gap-1">
            {menu.map((m) => (
              <li key={m.href}>
                <ItemMenu menu={m} aktif={m.href === "/dashboard" ? pathname === m.href : pathname.startsWith(m.href)} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border px-5 py-3 text-xs text-sidebar-fg/80">
          &copy; {new Date().getFullYear()} BP3MI Lampung
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerBuka(true)}
            aria-label="Buka menu"
            aria-controls="sidebar"
            aria-expanded={drawerBuka}
            className="-ml-1 flex size-9 items-center justify-center rounded-lg text-fg hover:bg-surface-muted lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ToggleTema className="text-fg-muted hover:bg-surface-muted hover:text-fg" />
            <div className="mx-1 hidden h-8 w-px bg-border sm:block" />
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold text-fg">{namaPegawai}</p>
              <p className="text-xs text-fg-muted">{labelRole}</p>
            </div>
            <form action={aksiLogout}>
              <button
                type="submit"
                title="Keluar"
                className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
              >
                <LogOut className="size-[18px]" aria-hidden />
                <span className="hidden md:inline">Keluar</span>
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function ItemMenu({ menu, aktif }: { menu: MenuDashboard; aktif: boolean }) {
  const Ikon = IKON_MENU[menu.ikon];
  const kelas = cn(
    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    aktif ? "bg-sidebar-hover text-sidebar-fg-active" : "text-sidebar-fg",
  );

  if (!menu.tersedia) {
    return (
      <span className={cn(kelas, "cursor-not-allowed text-sidebar-fg/85")} aria-disabled title="Modul sedang dikembangkan">
        <Ikon className="size-[18px] shrink-0" aria-hidden />
        <span className="flex-1">{menu.judul}</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold">Segera</span>
      </span>
    );
  }

  return (
    <Link
      href={menu.href}
      aria-current={aktif ? "page" : undefined}
      className={cn(kelas, "hover:bg-sidebar-hover hover:text-sidebar-fg-active focus-visible:ring-2 focus-visible:ring-aksen focus-visible:outline-none")}
    >
      {aktif && <span aria-hidden className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-aksen" />}
      <Ikon className={cn("size-[18px] shrink-0", aktif && "text-aksen")} aria-hidden />
      <span className="flex-1">{menu.judul}</span>
    </Link>
  );
}
