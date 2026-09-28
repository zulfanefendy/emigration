import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ambilPegawaiLogin } from "@/lib/auth/dal";
import { FormLogin } from "./form-login";

export const metadata: Metadata = { title: "Login Pegawai" };

export default async function HalamanLogin() {
  if (await ambilPegawaiLogin()) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-100 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
        <p className="text-xs font-semibold tracking-widest text-sky-700 uppercase">BP3MI Lampung</p>
        <h1 className="mt-1 text-xl font-bold text-zinc-900">Login Pegawai</h1>
        <p className="mt-1 mb-6 text-sm text-zinc-500">Sistem Verifikasi Digital CPMI &amp; OPP</p>
        <FormLogin />
      </div>
    </main>
  );
}
