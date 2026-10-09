import type { Metadata } from "next";
import { hariIniWib, tambahHari } from "@/lib/tanggal";
import { AlurPendaftaran } from "./alur-pendaftaran";
import { BATAS_HARI_JADWAL } from "./pilihan";

export const metadata: Metadata = { title: "Pendaftaran CPMI" };

// "Hari ini" harus dihitung saat request, bukan saat build.
export const dynamic = "force-dynamic";

export default function HalamanPendaftaran() {
  const hariIni = hariIniWib();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-fg">Pendaftaran Verifikasi CPMI</h1>
      <p className="mt-1 mb-6 text-sm text-fg-muted">
        Cek nomor paspor, isi formulir, lalu dapatkan tiket antrean untuk verifikasi berkas di loket.
      </p>
      <AlurPendaftaran hariIni={hariIni} batasJadwal={tambahHari(hariIni, BATAS_HARI_JADWAL)} />
    </div>
  );
}
