import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Palette } from "lucide-react";
import { IKON_MENU } from "@/components/layout/ikon-menu";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { wajibLogin } from "@/lib/auth/dal";
import { menuUntuk } from "@/lib/auth/menu";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Beranda" };

export default async function HalamanDashboard({ searchParams }: PageProps<"/dashboard">) {
  const pegawai = await wajibLogin();
  const { akses } = await searchParams;
  const modul = menuUntuk(pegawai.roles).filter((m) => m.href !== "/dashboard");

  return (
    <>
      <PageHeader
        judul={`Selamat datang, ${pegawai.namaLengkap.split(" ")[0]}`}
        deskripsi="Pilih modul sesuai tugas Anda."
      />

      {akses === "ditolak" && (
        <Alert jenis="peringatan" judul="Akses ditolak" className="mb-6">
          Anda tidak memiliki akses ke halaman tersebut.
        </Alert>
      )}

      {modul.length === 0 ? (
        <Alert jenis="info" judul="Belum ada role">
          Akun Anda belum memiliki role. Hubungi admin untuk mendapatkan akses.
        </Alert>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modul.map((m, i) => {
            const Ikon = IKON_MENU[m.ikon];
            const isi = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
                    <Ikon className="size-5" aria-hidden />
                  </span>
                  {m.tersedia ? (
                    <ArrowRight className="size-5 text-fg-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
                  ) : (
                    <Badge>Segera</Badge>
                  )}
                </div>
                <h2 className="mt-4 font-semibold text-fg">{m.judul}</h2>
                <p className="mt-1 text-sm text-fg-muted">{m.deskripsi}</p>
              </>
            );
            const kelas = "group block p-5";
            const tunda = { animationDelay: `${80 + i * 60}ms` };
            return m.tersedia ? (
              <Link
                key={m.href}
                href={m.href}
                style={tunda}
                className="animate-masuk rounded-xl focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Card className={cn(kelas, "h-full transition duration-300 ease-halus hover:-translate-y-0.5 hover:border-brand-text/50 hover:shadow-md")}>
                  {isi}
                </Card>
              </Link>
            ) : (
              <Card key={m.href} style={tunda} className={cn(kelas, "animate-masuk border-dashed")}>
                {isi}
              </Card>
            );
          })}
        </div>
      )}

      {process.env.APP_ENV !== "production" && (
        <Link
          href="/dashboard/ui-kit"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand-text hover:underline"
        >
          <Palette className="size-4" aria-hidden />
          Lihat UI Kit (tidak tampil di server produksi)
        </Link>
      )}
    </>
  );
}
