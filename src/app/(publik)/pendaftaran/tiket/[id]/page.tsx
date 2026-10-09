import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, CircleCheck, Download, Home } from "lucide-react";
import { BadgeStatusVerifikasi } from "@/components/status";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatTanggal, formatWaktu } from "@/lib/tanggal";
import { LABEL_SKEMA } from "../../pilihan";
import { ambilTiket, BAWA_SAAT_VERIFIKASI, samarkanPaspor } from "./data";
import { TombolCetak } from "./tombol-cetak";

export const metadata: Metadata = { title: "Tiket Antrean", robots: { index: false } };

type PropsHalaman = { params: Promise<{ id: string }>; searchParams: Promise<{ baru?: string }> };

export default async function HalamanTiket({ params, searchParams }: PropsHalaman) {
  const { id } = await params;
  const { baru } = await searchParams;
  const tiket = await ambilTiket(id);
  if (!tiket) notFound();

  const { cpmi } = tiket;
  const status = cpmi.verifikasi[0]?.statusVerifikasi;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6">
      {baru && (
        <Alert jenis="sukses" judul="Pendaftaran berhasil" className="mb-6 print:hidden">
          Simpan tiket ini. Tautan halaman ini juga bisa dibuka lagi dari menu pendaftaran dengan nomor paspor dan
          tanggal lahir Anda.
        </Alert>
      )}

      <Card className="overflow-hidden print:border-0 print:shadow-none">
        <div className="bg-sidebar px-6 py-4 text-white">
          <p className="text-xs font-semibold tracking-[0.16em] text-aksen uppercase">BP3MI Lampung</p>
          <p className="mt-0.5 font-semibold">Tiket Antrean Verifikasi Dokumen CPMI</p>
        </div>

        <div className="border-b border-dashed border-border px-6 py-8 text-center">
          <p className="text-sm text-fg-muted">Nomor Antrean</p>
          <p className="mt-1 font-mono text-6xl font-bold tracking-tight text-fg">{tiket.noAntrian}</p>
          <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-fg">
            <CalendarDays className="size-4 text-brand-text" aria-hidden />
            {formatTanggal(tiket.tanggalAntrian)}
          </p>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 px-6 py-5 text-sm">
          <dt className="text-fg-muted">Nama</dt>
          <dd className="font-semibold text-fg">{cpmi.namaLengkap}</dd>
          <dt className="text-fg-muted">No. Paspor</dt>
          <dd className="font-mono text-fg">{samarkanPaspor(cpmi.noPaspor)}</dd>
          <dt className="text-fg-muted">Skema</dt>
          <dd className="text-fg">{LABEL_SKEMA[cpmi.skemaPendaftaran]}</dd>
          <dt className="text-fg-muted">Negara Tujuan</dt>
          <dd className="text-fg">{cpmi.negaraPenempatan}</dd>
          {status && (
            <>
              <dt className="text-fg-muted">Status</dt>
              <dd>
                <BadgeStatusVerifikasi status={status} />
              </dd>
            </>
          )}
          <dt className="text-fg-muted">Didaftarkan</dt>
          <dd className="text-fg">{formatWaktu(tiket.createdAt)}</dd>
        </dl>

        <div className="bg-surface-muted px-6 py-4 text-sm">
          <p className="font-semibold text-fg">Bawa saat datang ke loket:</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-fg-muted">
            {BAWA_SAAT_VERIFIKASI.map((b) => (
              <li key={b} className="flex gap-2">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <ButtonLink href={`/pendaftaran/tiket/${id}/pdf`} prefetch={false} ikon={<Download aria-hidden />}>
          Unduh PDF
        </ButtonLink>
        <TombolCetak />
        <ButtonLink href="/" varian="ghost" ikon={<Home aria-hidden />}>
          Beranda
        </ButtonLink>
      </div>
    </div>
  );
}
