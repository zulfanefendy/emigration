"use client";

import { ArrowLeft, CircleCheck, PenLine, Search } from "lucide-react";
import { startTransition, useActionState, useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, idPesanField } from "@/components/ui/field";
import { Checkbox, Input } from "@/components/ui/input";
import { cariPeserta, simpanPresensi, type DataPeserta } from "./actions";
import { KanvasTtd } from "./kanvas-ttd";

type Props = { idKegiatanOpp: string; izin: string };
type Identitas = { noPaspor: string; tanggalLahir: string };

/**
 * Langkah 1 identitas (paspor + tanggal lahir), langkah 2 konfirmasi data,
 * tanda tangan, dan ceklis logistik, lalu layar selesai.
 */
export function AlurPresensi({ idKegiatanOpp, izin }: Props) {
  const [state, action, pending] = useActionState(cariPeserta, undefined);
  const [identitas, setIdentitas] = useState<Identitas | null>(null);
  const [ulang, setUlang] = useState(0);
  const [selesai, setSelesai] = useState<string | null>(null);
  const e = state?.errors;
  // Setelah "Bukan saya", abaikan hasil pencarian lama sampai dicari lagi.
  const peserta = identitas && state?.peserta ? state.peserta : null;

  const waktuSelesai = selesai ?? peserta?.sudahPresensi;
  if (peserta && waktuSelesai) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <CircleCheck className="size-14 text-success" aria-hidden />
        <h1 className="text-xl font-bold text-fg">{selesai ? "Presensi tersimpan" : "Anda sudah presensi"}</h1>
        <p className="text-fg-muted">
          {peserta.namaLengkap}
          <br />
          {waktuSelesai}
        </p>
        <p className="text-sm text-fg-muted">Terima kasih. Silakan ikuti kegiatan OPP sampai selesai.</p>
      </Card>
    );
  }

  if (peserta && identitas) {
    return (
      <FormTandaTangan
        idKegiatanOpp={idKegiatanOpp}
        izin={izin}
        identitas={identitas}
        peserta={peserta}
        onKembali={() => {
          setIdentitas(null);
          setUlang((n) => n + 1);
        }}
        onSelesai={setSelesai}
      />
    );
  }

  return (
    <Card className="p-6">
      <h1 className="font-semibold text-fg">Langkah 1: Data Diri</h1>
      <p className="mt-1 text-sm text-fg-muted">Masukkan nomor paspor dan tanggal lahir sesuai data pendaftaran.</p>
      <form
        key={ulang}
        onSubmit={(ev) => {
          ev.preventDefault();
          const data = new FormData(ev.currentTarget);
          setIdentitas({ noPaspor: String(data.get("noPaspor")), tanggalLahir: String(data.get("tanggalLahir")) });
          startTransition(() => action(data));
        }}
        className="mt-5 flex flex-col gap-4"
        noValidate
      >
        {state?.pesan && !pending && <Alert jenis="gagal">{state.pesan}</Alert>}
        <input type="hidden" name="idKegiatanOpp" value={idKegiatanOpp} />
        <input type="hidden" name="izin" value={izin} />
        <Field htmlFor="noPaspor" label="Nomor Paspor" wajib error={e?.noPaspor}>
          <Input
            id="noPaspor"
            name="noPaspor"
            defaultValue={identitas?.noPaspor}
            placeholder="A1234567"
            maxLength={12}
            autoCapitalize="characters"
            autoComplete="off"
            className="font-mono uppercase"
            aria-invalid={!!e?.noPaspor || undefined}
            aria-describedby={idPesanField("noPaspor")}
          />
        </Field>
        <Field htmlFor="tanggalLahir" label="Tanggal Lahir" wajib error={e?.tanggalLahir}>
          <Input
            id="tanggalLahir"
            name="tanggalLahir"
            type="date"
            defaultValue={identitas?.tanggalLahir}
            aria-invalid={!!e?.tanggalLahir || undefined}
            aria-describedby={idPesanField("tanggalLahir")}
          />
        </Field>
        <Button type="submit" ukuran="lg" memuat={pending} ikon={<Search />}>
          Lanjut
        </Button>
      </form>
    </Card>
  );
}

type PropsTtd = {
  idKegiatanOpp: string;
  izin: string;
  identitas: Identitas;
  peserta: DataPeserta;
  onKembali: () => void;
  onSelesai: (waktu: string) => void;
};

function FormTandaTangan({ idKegiatanOpp, izin, identitas, peserta, onKembali, onSelesai }: PropsTtd) {
  const [state, action, pending] = useActionState(simpanPresensi, undefined);
  const [ttd, setTtd] = useState<string | null>(null);
  const [errorLokal, setErrorLokal] = useState<string | null>(null);
  const onUbahTtd = useCallback((png: string | null) => {
    setTtd(png);
    if (png) setErrorLokal(null);
  }, []);

  useEffect(() => {
    if (state?.sukses && state.waktu) onSelesai(state.waktu);
  }, [state, onSelesai]);

  const errorTtd = errorLokal ?? state?.errors?.tandaTangan?.[0];
  const errorIdentitas = state?.errors?.noPaspor?.[0] ?? state?.errors?.tanggalLahir?.[0];

  return (
    <Card className="p-6">
      <button
        type="button"
        onClick={onKembali}
        className="-ml-1 mb-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-text hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Bukan saya
      </button>
      <h1 className="font-semibold text-fg">Langkah 2: Konfirmasi & Tanda Tangan</h1>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 rounded-lg bg-surface-muted px-4 py-3 text-sm">
        <dt className="text-fg-muted">Nama</dt>
        <dd className="font-semibold text-fg">{peserta.namaLengkap}</dd>
        <dt className="text-fg-muted">No. Paspor</dt>
        <dd className="font-mono text-fg">{peserta.noPasporSamar}</dd>
        <dt className="text-fg-muted">Penempatan</dt>
        <dd className="text-fg">
          {peserta.jenisPekerjaan}, {peserta.negaraPenempatan}
        </dd>
      </dl>

      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          if (!ttd) return void setErrorLokal("Tanda tangan wajib diisi.");
          const data = new FormData(ev.currentTarget);
          data.set("tandaTangan", ttd);
          startTransition(() => action(data));
        }}
        className="mt-5 flex flex-col gap-5"
        noValidate
      >
        {(state?.pesan || errorIdentitas) && !pending && <Alert jenis="gagal">{state?.pesan ?? errorIdentitas}</Alert>}
        <input type="hidden" name="idKegiatanOpp" value={idKegiatanOpp} />
        <input type="hidden" name="izin" value={izin} />
        <input type="hidden" name="noPaspor" value={identitas.noPaspor} />
        <input type="hidden" name="tanggalLahir" value={identitas.tanggalLahir} />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold text-fg">Penerimaan hak peserta</legend>
          <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-3 text-sm">
            <Checkbox name="terimaToolkit" />
            Saya sudah menerima toolkit (perlengkapan OPP)
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-3 text-sm">
            <Checkbox name="terimaKonsumsi" />
            Saya sudah menerima konsumsi
          </label>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-fg">
            Tanda Tangan<span className="ml-0.5 text-danger" aria-hidden>*</span>
          </p>
          <KanvasTtd onUbah={onUbahTtd} invalid={!!errorTtd} idPesan={errorTtd ? "ttd-pesan" : undefined} />
          {errorTtd && (
            <p id="ttd-pesan" className="text-sm font-medium text-danger">
              {errorTtd}
            </p>
          )}
        </div>

        <Button type="submit" ukuran="lg" memuat={pending} ikon={<PenLine />}>
          Simpan Presensi
        </Button>
      </form>
    </Card>
  );
}
