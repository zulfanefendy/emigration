import Link from "next/link";
import { LogIn } from "lucide-react";
import { Logo } from "@/components/logo";
import { ToggleTema } from "@/components/theme";
import { kelasTombol } from "@/components/ui/button";

const TAUTAN = [
  { href: "/", label: "Beranda" },
  { href: "/#alur", label: "Alur Layanan" },
  { href: "/pendaftaran", label: "Pendaftaran" },
];

export function NavbarPublik() {
  return (
    <header className="sticky top-0 z-30 bg-sidebar text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="rounded-md focus-visible:ring-2 focus-visible:ring-aksen focus-visible:outline-none">
          <Logo terang />
        </Link>

        <nav aria-label="Navigasi utama" className="hidden flex-1 md:block">
          <ul className="flex items-center gap-1">
            {TAUTAN.map((t) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-sidebar-fg transition-colors hover:bg-sidebar-hover hover:text-white"
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ToggleTema className="text-sidebar-fg hover:bg-sidebar-hover hover:text-white" />
          <Link href="/login" className={kelasTombol("aksen", "sm", "h-9")}>
            <LogIn aria-hidden />
            <span className="hidden sm:inline">Login Pegawai</span>
            <span className="sm:hidden">Login</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
