"use client";

import Link from "next/link";
import { ChevronRight, Plus, Search } from "lucide-react";
import { useState } from "react";
import type { SkemaPendaftaran } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableKosong, Td, Th, THead, Tr } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { formatTanggal, keTanggalDb } from "@/lib/tanggal";
import { LABEL_SKEMA } from "@/app/(publik)/pendaftaran/pilihan";
import { BadgeTahap } from "./badge-tahap";
import type { TahapKegiatan } from "./data";
import { ModalKegiatan, type OpsiPegawai } from "./form-kegiatan";

export type BarisKegiatan = {
  idKegiatanOpp: string;
  kodeKegiatan: string;
  tanggalPelaksanaan: string;
  skemaOpp: SkemaPendaftaran;
  tempatOpp: string;
  jumlahPeserta: number;
  jumlahSesi: number;
  tahap: TahapKegiatan;
};

type Saringan = "mendatang" | "terlaksana" | "semua";

const SARINGAN: { kunci: Saringan; label: string; cocok: (k: BarisKegiatan) => boolean }[] = [
  { kunci: "mendatang", label: "Mendatang", cocok: (k) => k.tahap === "akan-datang" || k.tahap === "hari-ini" },
  { kunci: "terlaksana", label: "Terlaksana", cocok: (k) => k.tahap === "selesai" || k.tahap === "final" },
  { kunci: "semua", label: "Semua", cocok: () => true },
];

type Props = {
  kegiatan: BarisKegiatan[];
  bolehUbah: boolean;
  hariIni: string;
  pengelola: OpsiPegawai[];
  penanggungJawab: OpsiPegawai[];
};

export function DaftarKegiatan({ kegiatan, bolehUbah, hariIni, pengelola, penanggungJawab }: Props) {
  const [saringan, setSaringan] = useState<Saringan>("mendatang");
  const [cari, setCari] = useState("");
  const [buatBaru, setBuatBaru] = useState(false);

  const jumlah = Object.fromEntries(SARINGAN.map((s) => [s.kunci, kegiatan.filter(s.cocok).length])) as Record<Saringan, number>;
  const kata = cari.trim().toLowerCase();
  const cocok = SARINGAN.find((s) => s.kunci === saringan)!.cocok;
  let tampil = kegiatan.filter(
    (k) => cocok(k) && (!kata || k.kodeKegiatan.toLowerCase().includes(kata) || k.tempatOpp.toLowerCase().includes(kata)),
  );
  // Kegiatan mendatang paling dekat di atas; yang lain terbaru di atas.
  if (saringan === "mendatang") tampil = tampil.toReversed();

  return (
    <Card>
      <CardHeader
        judul={`${kegiatan.length} kegiatan`}
        aksi={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
              <Input
                type="search"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari kode atau tempat"
                aria-label="Cari kegiatan"
                className="w-56 pl-9"
              />
            </div>
            {bolehUbah && (
              <Button ikon={<Plus />} onClick={() => setBuatBaru(true)}>
                Buat Kegiatan
              </Button>
            )}
          </>
        }
      />
      <div role="tablist" aria-label="Saring kegiatan" className="flex flex-wrap gap-1.5 border-b border-border px-5 py-3">
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
            <Th>Kode</Th>
            <Th>Pelaksanaan</Th>
            <Th>Skema</Th>
            <Th className="text-right">Sesi</Th>
            <Th className="text-right">Peserta</Th>
            <Th>Status</Th>
            <Th>
              <span className="sr-only">Detail</span>
            </Th>
          </tr>
        </THead>
        <tbody>
          {tampil.length === 0 ? (
            <TableKosong kolom={7}>
              {kegiatan.length === 0 ? "Belum ada kegiatan OPP." : "Tidak ada kegiatan yang cocok."}
            </TableKosong>
          ) : (
            tampil.map((k) => (
              <Tr key={k.idKegiatanOpp}>
                <Td className="font-mono text-xs font-semibold whitespace-nowrap">
                  <Link href={`/dashboard/kegiatan-opp/${k.idKegiatanOpp}`} className="hover:underline">
                    {k.kodeKegiatan}
                  </Link>
                </Td>
                <Td>
                  <p className="font-medium">{formatTanggal(keTanggalDb(k.tanggalPelaksanaan))}</p>
                  <p className="text-xs text-fg-muted">{k.tempatOpp}</p>
                </Td>
                <Td className="whitespace-nowrap">{LABEL_SKEMA[k.skemaOpp]}</Td>
                <Td className="text-right">{k.jumlahSesi}</Td>
                <Td className="text-right">{k.jumlahPeserta}</Td>
                <Td>
                  <BadgeTahap tahap={k.tahap} />
                </Td>
                <Td>
                  <Link
                    href={`/dashboard/kegiatan-opp/${k.idKegiatanOpp}`}
                    aria-label={`Detail ${k.kodeKegiatan}`}
                    className="flex size-8 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>

      {buatBaru && (
        <ModalKegiatan
          kegiatan={null}
          pengelola={pengelola}
          penanggungJawab={penanggungJawab}
          hariIni={hariIni}
          onTutup={() => setBuatBaru(false)}
        />
      )}
    </Card>
  );
}
