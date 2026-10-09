"use client";

import { CloudUpload, ExternalLink, FileSpreadsheet, Lock, LockOpen, MessageSquareText, Pencil, Save } from "lucide-react";
import { startTransition, useActionState, useEffect, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink, kelasTombol } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, idPesanField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useKonfirmasi } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { bukaKunciFinal, kunciFinal, simpanSrikandi, type StateSrikandi } from "../actions";

type Srikandi = {
  sudah: boolean;
  waktu: string | null;
  fileSkOppUrl: string | null;
  fileSptInstrukturUrl: string | null;
  fileSptPengelolaUrl: string | null;
};

type Props = {
  idKegiatanOpp: string;
  tanggal: string;
  final: boolean;
  bolehUbah: boolean;
  admin: boolean;
  /** Tanggal pelaksanaan sudah tiba. */
  sudahBerlangsung: boolean;
  jumlahPeserta: number;
  jumlahHadir: number;
  /** CPMI terverifikasi berskema sama yang belum jadi peserta (verifikasi susulan). */
  calonSusulan: number;
  srikandi: Srikandi;
};

/** Flow Chart PM bagian 5: cek verifikasi susulan, kunci final, LPJ, laporan WA, SRIKANDI. */
export function BagianFinalisasi(p: Props) {
  const [memproses, mulai] = useTransition();
  const { konfirmasi, elemenKonfirmasi } = useKonfirmasi();
  const belumHadir = p.jumlahPeserta - p.jumlahHadir;

  async function kunci() {
    const ya = await konfirmasi({
      judul: "Kunci data final?",
      pesan:
        `${p.jumlahHadir} dari ${p.jumlahPeserta} peserta sudah presensi` +
        (belumHadir ? `; ${belumHadir} peserta akan tercatat tidak hadir` : "") +
        ". Setelah dikunci, kegiatan, kurikulum, peserta, dan presensi tidak bisa diubah.",
      labelYa: "Kunci Final",
    });
    if (!ya) return;
    mulai(async () => {
      const hasil = await kunciFinal(p.idKegiatanOpp);
      if (hasil.sukses) toast.sukses(hasil.pesan);
      else toast.gagal(hasil.pesan);
    });
  }

  async function bukaKunci() {
    const ya = await konfirmasi({ judul: "Buka kunci final?", pesan: "Data kegiatan bisa diubah lagi. LPJ yang sudah diunduh perlu dibuat ulang.", labelYa: "Buka Kunci" });
    if (!ya) return;
    mulai(async () => {
      const hasil = await bukaKunciFinal(p.idKegiatanOpp);
      if (hasil.sukses) toast.sukses(hasil.pesan);
      else toast.gagal(hasil.pesan);
    });
  }

  return (
    <Card>
      <CardHeader
        judul="Finalisasi"
        aksi={p.final ? <Badge nada="sukses"><Lock aria-hidden />Final</Badge> : <Badge>Belum final</Badge>}
      />
      <CardBody className="flex flex-col gap-4">
        {!p.final && (
          <>
            <dl className="grid grid-cols-3 gap-2 text-center text-sm">
              {(
                [
                  ["Peserta", p.jumlahPeserta],
                  ["Hadir", p.jumlahHadir],
                  ["Belum", belumHadir],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className="rounded-lg bg-surface-muted px-2 py-2">
                  <dt className="text-xs text-fg-muted">{label}</dt>
                  <dd className="text-lg font-bold text-fg">{n}</dd>
                </div>
              ))}
            </dl>
            {p.calonSusulan > 0 && (
              <Alert jenis="peringatan" judul="Ada verifikasi susulan?">
                {p.calonSusulan} CPMI sudah diverifikasi dengan skema yang sama tetapi belum menjadi peserta. Tambahkan lewat
                &quot;Tambah Peserta&quot; bila mereka ikut kegiatan ini, sebelum data dikunci.
              </Alert>
            )}
            {!p.sudahBerlangsung && <p className="text-sm text-fg-muted">Data bisa dikunci mulai hari pelaksanaan.</p>}
            {p.bolehUbah && (
              <Button ikon={<Lock />} memuat={memproses} disabled={!p.sudahBerlangsung || p.jumlahPeserta === 0} onClick={kunci}>
                Kunci Data Final
              </Button>
            )}
          </>
        )}

        {p.final && (
          <>
            <a href={`/dashboard/kegiatan-opp/${p.idKegiatanOpp}/lpj`} download className={kelasTombol("primary")}>
              <FileSpreadsheet aria-hidden />
              Unduh LPJ Excel
            </a>
            <ButtonLink href={`/dashboard/laporan-harian?tanggal=${p.tanggal}`} varian="outline" ikon={<MessageSquareText aria-hidden />}>
              Laporan Harian WA
            </ButtonLink>
            <BagianSrikandi idKegiatanOpp={p.idKegiatanOpp} bolehUbah={p.bolehUbah} srikandi={p.srikandi} />
            {p.admin && !p.srikandi.sudah && (
              <Button varian="ghost" ukuran="sm" ikon={<LockOpen />} memuat={memproses} onClick={bukaKunci}>
                Buka kunci (Admin)
              </Button>
            )}
          </>
        )}
      </CardBody>
      {elemenKonfirmasi}
    </Card>
  );
}

function BagianSrikandi({ idKegiatanOpp, bolehUbah, srikandi }: { idKegiatanOpp: string; bolehUbah: boolean; srikandi: Srikandi }) {
  const [state, action, pending] = useActionState(simpanSrikandi, undefined);
  // State saat tombol "Ubah tautan" ditekan; mode ubah selesai begitu ada simpan sukses yang baru.
  const [ubahDari, setUbahDari] = useState<StateSrikandi | undefined | null>(null);
  const ubah = ubahDari !== null && !(state?.sukses && state !== ubahDari);
  const e = state?.errors;

  useEffect(() => {
    if (state?.sukses) toast.sukses(state.pesan ?? "Tersimpan");
  }, [state]);

  const berkas = [
    { id: "fileSkOppUrl", label: "SK OPP", nilai: srikandi.fileSkOppUrl, wajib: true },
    { id: "fileSptInstrukturUrl", label: "SPT Instruktur", nilai: srikandi.fileSptInstrukturUrl, wajib: false },
    { id: "fileSptPengelolaUrl", label: "SPT Pengelola", nilai: srikandi.fileSptPengelolaUrl, wajib: false },
  ] as const;

  if (srikandi.sudah && !ubah) {
    return (
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-fg">
          <CloudUpload className="size-4 text-success" aria-hidden />
          Diunggah ke SRIKANDI
        </p>
        <p className="text-xs text-fg-muted">{srikandi.waktu}</p>
        <ul className="flex flex-col gap-1 text-sm">
          {berkas
            .filter((b) => b.nilai)
            .map((b) => (
              <li key={b.id}>
                <a href={b.nilai!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-text hover:underline">
                  {b.label}
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </li>
            ))}
        </ul>
        {bolehUbah && (
          <Button varian="ghost" ukuran="sm" ikon={<Pencil />} onClick={() => setUbahDari(state)} className="self-start">
            Ubah tautan
          </Button>
        )}
      </div>
    );
  }

  if (!bolehUbah) {
    return <p className="border-t border-border pt-4 text-sm text-fg-muted">Berkas SK & SPT belum dicatat di SRIKANDI.</p>;
  }

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-3 border-t border-border pt-4"
      noValidate
    >
      <div>
        <p className="text-sm font-semibold text-fg">Arsip SRIKANDI (TTE)</p>
        <p className="text-xs text-fg-muted">Unggah SK & SPT final di aplikasi SRIKANDI, lalu tempel tautan naskahnya di sini.</p>
      </div>
      {state?.pesan && !state.sukses && <Alert jenis="gagal">{state.pesan}</Alert>}
      <input type="hidden" name="idKegiatanOpp" value={idKegiatanOpp} />
      {berkas.map((b) => (
        <Field key={b.id} htmlFor={b.id} label={b.label} wajib={b.wajib} error={e?.[b.id]}>
          <Input
            id={b.id}
            name={b.id}
            type="url"
            inputMode="url"
            defaultValue={b.nilai ?? ""}
            placeholder="https://srikandi.arsip.go.id/..."
            aria-invalid={!!e?.[b.id] || undefined}
            aria-describedby={idPesanField(b.id)}
          />
        </Field>
      ))}
      <div className="flex gap-2">
        <Button type="submit" memuat={pending} ikon={<Save />}>
          Simpan
        </Button>
        {ubah && (
          <Button varian="ghost" onClick={() => setUbahDari(null)}>
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}
