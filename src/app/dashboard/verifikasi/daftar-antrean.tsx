"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Megaphone, RotateCcw, Search, UserX, Volume2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import type { SkemaPendaftaran, StatusAntrian, StatusVerifikasi } from "@/generated/prisma/enums";
import { BadgeStatusAntrian, BadgeStatusVerifikasi } from "@/components/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useKonfirmasi } from "@/components/ui/modal";
import { Table, TableKosong, Td, Th, THead, Tr } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { LABEL_SKEMA } from "@/app/(publik)/pendaftaran/pilihan";
import { kembalikanKeAntrean, panggil, panggilBerikutnya, tandaiTidakHadir } from "./actions";
import { umumkanNomor } from "./umumkan";

export type BarisAntrean = {
  idCpmi: string;
  noAntrian: string;
  statusAntrian: StatusAntrian;
  namaLengkap: string;
  noPaspor: string;
  skema: SkemaPendaftaran;
  negara: string;
  statusVerifikasi: StatusVerifikasi;
  verifikator: string | null;
  milikSaya: boolean;
};

type Saringan = "semua" | "menunggu" | "proses" | "revisi" | "selesai" | "batal";

/** CPMI yang sedang memperbaiki berkas: antrean menunggu, verifikasi terakhir perlu revisi. */
const sedangRevisi = (b: BarisAntrean) => b.statusAntrian === "MENUNGGU" && b.statusVerifikasi === "PERLU_REVISI";

const SARINGAN: { kunci: Saringan; label: string; cocok: (b: BarisAntrean) => boolean }[] = [
  { kunci: "semua", label: "Semua", cocok: () => true },
  { kunci: "menunggu", label: "Menunggu", cocok: (b) => b.statusAntrian === "MENUNGGU" && !sedangRevisi(b) },
  { kunci: "proses", label: "Dipanggil", cocok: (b) => b.statusAntrian === "DIPANGGIL" },
  { kunci: "revisi", label: "Perbaiki Berkas", cocok: sedangRevisi },
  { kunci: "selesai", label: "Selesai", cocok: (b) => b.statusAntrian === "SELESAI" },
  { kunci: "batal", label: "Tidak Hadir", cocok: (b) => b.statusAntrian === "BATAL" },
];

/** Daftar diperbarui otomatis agar beberapa loket melihat status yang sama. */
const INTERVAL_SEGAR_MS = 15_000;

export function DaftarAntrean({ tanggal, baris }: { tanggal: string; baris: BarisAntrean[] }) {
  const router = useRouter();
  const [saringan, setSaringan] = useState<Saringan>("semua");
  const [cari, setCari] = useState("");
  const [memproses, mulai] = useTransition();
  const { konfirmasi, elemenKonfirmasi } = useKonfirmasi();

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, INTERVAL_SEGAR_MS);
    return () => clearInterval(id);
  }, [router]);

  const jumlah = Object.fromEntries(SARINGAN.map((s) => [s.kunci, baris.filter(s.cocok).length])) as Record<Saringan, number>;
  const kata = cari.trim().toLowerCase();
  const cocok = SARINGAN.find((s) => s.kunci === saringan)!.cocok;
  const tampil = baris.filter(
    (b) =>
      cocok(b) &&
      (!kata || b.noAntrian.toLowerCase().includes(kata) || b.namaLengkap.toLowerCase().includes(kata) || b.noPaspor.toLowerCase().includes(kata)),
  );

  function jalankan(aksi: () => Promise<{ sukses?: boolean; pesan?: string; noAntrian?: string }>, setelah?: () => void) {
    mulai(async () => {
      const hasil = await aksi();
      if (!hasil.sukses) {
        toast.gagal(hasil.pesan ?? "Gagal");
        return;
      }
      if (hasil.noAntrian) umumkanNomor(hasil.noAntrian);
      toast.sukses(hasil.pesan ?? "Tersimpan");
      setelah?.();
    });
  }

  function panggilSelanjutnya() {
    mulai(async () => {
      const hasil = await panggilBerikutnya(tanggal);
      if (!hasil.sukses || !hasil.noAntrian) {
        toast.gagal(hasil.pesan ?? "Gagal memanggil");
        return;
      }
      umumkanNomor(hasil.noAntrian);
      toast.sukses(hasil.pesan ?? "Memanggil");
      router.push(`/dashboard/verifikasi/${hasil.idCpmi}`);
    });
  }

  async function tidakHadir(b: BarisAntrean) {
    const ya = await konfirmasi({
      judul: `${b.noAntrian} tidak hadir?`,
      pesan: "Nomor ini dikeluarkan dari antrean. Bila CPMI datang kemudian, gunakan tombol Kembalikan.",
      labelYa: "Tandai Tidak Hadir",
    });
    if (ya) jalankan(() => tandaiTidakHadir(b.idCpmi));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-fg-muted">Menunggu dipanggil</p>
          <p className="text-3xl font-bold text-fg">{jumlah.menunggu}</p>
          {jumlah.revisi > 0 && (
            <p className="mt-0.5 text-xs text-fg-muted">
              + {jumlah.revisi} sedang memperbaiki berkas (panggil manual saat kembali)
            </p>
          )}
        </div>
        <Button ukuran="lg" ikon={<Megaphone />} memuat={memproses} disabled={jumlah.menunggu === 0} onClick={panggilSelanjutnya}>
          Panggil Berikutnya
        </Button>
      </Card>

      <Card>
        <CardHeader
          judul={`${baris.length} antrean`}
          deskripsi={`${jumlah.selesai} selesai diverifikasi`}
          aksi={
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
              <Input
                type="search"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari nomor, nama, paspor"
                aria-label="Cari antrean"
                className="w-60 pl-9"
              />
            </div>
          }
        />
        <div role="tablist" aria-label="Saring status" className="flex flex-wrap gap-1.5 border-b border-border px-5 py-3">
          {SARINGAN.map((s) => (
            <button
              key={s.kunci}
              type="button"
              role="tab"
              aria-selected={saringan === s.kunci}
              onClick={() => setSaringan(s.kunci)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none",
                saringan === s.kunci ? "bg-brand text-brand-fg" : "text-fg-muted hover:bg-surface-muted",
              )}
            >
              {s.label} <span className="opacity-75">{jumlah[s.kunci]}</span>
            </button>
          ))}
        </div>

        <Table>
          <THead>
            <tr>
              <Th>No.</Th>
              <Th>CPMI</Th>
              <Th>Penempatan</Th>
              <Th>Antrean</Th>
              <Th>Verifikasi</Th>
              <Th className="text-right">Aksi</Th>
            </tr>
          </THead>
          <tbody>
            {tampil.length === 0 ? (
              <TableKosong kolom={6}>
                {baris.length === 0 ? "Belum ada pendaftar untuk tanggal ini." : "Tidak ada antrean yang cocok."}
              </TableKosong>
            ) : (
              tampil.map((b) => (
                <Tr key={b.idCpmi} className={cn(b.statusAntrian === "DIPANGGIL" && "bg-aksen/10")}>
                  <Td className="font-mono text-base font-bold whitespace-nowrap">{b.noAntrian}</Td>
                  <Td>
                    <Link href={`/dashboard/verifikasi/${b.idCpmi}`} className="font-medium text-fg hover:underline">
                      {b.namaLengkap}
                    </Link>
                    <p className="font-mono text-xs text-fg-muted">{b.noPaspor}</p>
                  </Td>
                  <Td>
                    <p>{b.negara}</p>
                    <p className="text-xs text-fg-muted">{LABEL_SKEMA[b.skema]}</p>
                  </Td>
                  <Td>{sedangRevisi(b) ? <Badge nada="peringatan">Perbaiki Berkas</Badge> : <BadgeStatusAntrian status={b.statusAntrian} />}</Td>
                  <Td>
                    <BadgeStatusVerifikasi status={b.statusVerifikasi} />
                    {b.verifikator && b.statusVerifikasi !== "BELUM_DIVERIFIKASI" && (
                      <p className="mt-1 text-xs text-fg-muted">{b.milikSaya ? "oleh Anda" : `oleh ${b.verifikator}`}</p>
                    )}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      {b.statusAntrian === "MENUNGGU" && (
                        <Button varian="ghost" ukuran="sm" ikon={<Megaphone />} disabled={memproses} onClick={() => jalankan(() => panggil(b.idCpmi))}>
                          Panggil
                        </Button>
                      )}
                      {b.statusAntrian === "DIPANGGIL" && (
                        <>
                          <Button varian="ghost" ukuran="sm" ikon={<Volume2 />} onClick={() => umumkanNomor(b.noAntrian)}>
                            Ulangi
                          </Button>
                          {b.statusVerifikasi !== "SEDANG_DIVERIFIKASI" && (
                            <Button varian="ghost" ukuran="sm" ikon={<UserX />} disabled={memproses} onClick={() => tidakHadir(b)}>
                              Tidak Hadir
                            </Button>
                          )}
                        </>
                      )}
                      {b.statusAntrian === "BATAL" && (
                        <Button varian="ghost" ukuran="sm" ikon={<RotateCcw />} disabled={memproses} onClick={() => jalankan(() => kembalikanKeAntrean(b.idCpmi))}>
                          Kembalikan
                        </Button>
                      )}
                      <Link
                        href={`/dashboard/verifikasi/${b.idCpmi}`}
                        aria-label={`Detail ${b.noAntrian}`}
                        className="flex size-8 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <ChevronRight className="size-4" aria-hidden />
                      </Link>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
      {elemenKonfirmasi}
    </div>
  );
}
