import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ClipboardCheck, QrCode, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { ToggleTema } from "@/components/theme";
import { ambilPegawaiLogin } from "@/lib/auth/dal";
import { FormLogin } from "./form-login";

export const metadata: Metadata = { title: "Login Pegawai" };

const KEUNGGULAN = [
  { ikon: ClipboardCheck, teks: "Verifikasi berkas CPMI langsung di loket" },
  { ikon: QrCode, teks: "Presensi OPP digital dengan QR Code" },
  { ikon: ShieldCheck, teks: "Dokumen SK & SPT siap untuk TTE SRIKANDI" },
];

export default async function HalamanLogin() {
  if (await ambilPegawaiLogin()) redirect("/dashboard");

  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Panel kiri: identitas sistem (disembunyikan di layar kecil) */}
      <section className="relative hidden overflow-hidden bg-sidebar text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="absolute -top-24 -right-24 size-80 rounded-full border-[36px] border-white/5" />
        <div aria-hidden className="absolute -bottom-32 -left-20 size-96 rounded-full bg-aksen/10 blur-3xl" />

        <Logo terang className="relative" />

        <div className="relative max-w-md">
          <h1 className="text-3xl leading-tight font-bold">
            Sistem Verifikasi Digital
            <span className="block text-aksen">CPMI &amp; OPP</span>
          </h1>
          <p className="mt-4 text-sidebar-fg">
            Layanan pendaftaran, verifikasi dokumen, dan Orientasi Pra Pemberangkatan calon pekerja migran Indonesia.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {KEUNGGULAN.map(({ ikon: Ikon, teks }) => (
              <li key={teks} className="flex items-center gap-3 text-sm">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Ikon className="size-[18px] text-aksen" aria-hidden />
                </span>
                {teks}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-fg/80">&copy; {new Date().getFullYear()} BP3MI Lampung</p>
      </section>

      {/* Panel kanan: form */}
      <section className="flex flex-col bg-background">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
            <ArrowLeft className="size-4" aria-hidden />
            Beranda
          </Link>
          <ToggleTema className="text-fg-muted hover:bg-surface-muted hover:text-fg" />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-16">
          <div className="w-full max-w-sm">
            <Logo className="mb-8 lg:hidden" />
            <h2 className="text-2xl font-bold tracking-tight text-fg">Login Pegawai</h2>
            <p className="mt-1.5 mb-8 text-sm text-fg-muted">Masuk dengan akun yang diberikan admin.</p>
            <FormLogin />
          </div>
        </div>
      </section>
    </div>
  );
}
