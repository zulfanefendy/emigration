import type { Metadata } from "next";
import Link from "next/link";
import { wajibLogin } from "@/lib/auth/dal";
import { MENU_DASHBOARD } from "@/lib/auth/menu";
import { punyaAkses } from "@/lib/auth/role";

export const metadata: Metadata = { title: "Dashboard" };

export default async function HalamanDashboard({ searchParams }: PageProps<"/dashboard">) {
  const pegawai = await wajibLogin();
  const { akses } = await searchParams;
  const menu = MENU_DASHBOARD.filter((m) => punyaAkses(pegawai.roles, m.roles));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Selamat datang, {pegawai.namaLengkap.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-zinc-500">Pilih modul sesuai tugas Anda.</p>
      </div>

      {akses === "ditolak" && (
        <p role="alert" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Anda tidak memiliki akses ke halaman tersebut.
        </p>
      )}

      {menu.length === 0 ? (
        <p className="rounded-lg bg-white px-4 py-6 text-sm text-zinc-500 ring-1 ring-zinc-200">
          Akun Anda belum memiliki role. Hubungi admin untuk mendapatkan akses.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menu.map((m) => {
            const isi = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-zinc-900">{m.judul}</h2>
                  {!m.tersedia && (
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
                      Segera
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-zinc-500">{m.deskripsi}</p>
              </>
            );
            const kelas = "rounded-xl bg-white p-5 ring-1 ring-zinc-200";
            return m.tersedia ? (
              <Link key={m.href} href={m.href} className={`${kelas} transition hover:ring-sky-600`}>
                {isi}
              </Link>
            ) : (
              <div key={m.href} className={`${kelas} opacity-70`}>
                {isi}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
