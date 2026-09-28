import Link from "next/link";
import { wajibLogin } from "@/lib/auth/dal";
import { LABEL_ROLE } from "@/lib/auth/role";
import { logout } from "@/app/login/actions";

export default async function LayoutDashboard({ children }: LayoutProps<"/dashboard">) {
  const pegawai = await wajibLogin();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="flex flex-col leading-tight">
            <span className="text-xs font-semibold tracking-widest text-sky-700 uppercase">BP3MI Lampung</span>
            <span className="text-sm font-bold text-zinc-900">Verifikasi Digital CPMI &amp; OPP</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-zinc-900">{pegawai.namaLengkap}</p>
              <p className="text-xs text-zinc-500">{pegawai.roles.map((r) => LABEL_ROLE[r]).join(", ") || "Tanpa role"}</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
