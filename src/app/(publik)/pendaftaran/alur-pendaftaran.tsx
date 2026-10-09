"use client";

import { ArrowLeft, Search, Ticket } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, idPesanField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { bukaTiket, cekPaspor } from "./actions";
import { FormPendaftaran } from "./form-pendaftaran";

type PropsAlur = { hariIni: string; batasJadwal: string };

/**
 * Langkah 1 (cek paspor) lalu langkah 2 (formulir) di satu halaman, supaya
 * nomor paspor tidak perlu dibawa lewat URL. Server tetap memeriksa ulang
 * paspor saat formulir dikirim.
 */
export function AlurPendaftaran(props: PropsAlur) {
  const [state, action, pending] = useActionState(cekPaspor, undefined);
  // Dipakai untuk kembali dari formulir/tiket lama ke kotak cek paspor.
  const [ulang, setUlang] = useState(0);
  const tampil = state && state.ulang === ulang ? state : undefined;

  if (tampil?.baru) {
    return (
      <>
        <LangkahKembali onKlik={() => setUlang((n) => n + 1)} />
        <FormPendaftaran noPaspor={tampil.baru} {...props} />
      </>
    );
  }

  if (tampil?.terdaftar) {
    return (
      <>
        <LangkahKembali onKlik={() => setUlang((n) => n + 1)} />
        <FormBukaTiket noPaspor={tampil.terdaftar} />
      </>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-fg">Langkah 1: Cek Nomor Paspor</h2>
      <p className="mt-1 text-sm text-fg-muted">
        Nomor paspor ada di halaman data paspor, di pojok kanan atas. Contoh: A1234567.
      </p>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          const data = new FormData(ev.currentTarget);
          data.set("ulang", String(ulang));
          startTransition(() => action(data));
        }}
        className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start"
        noValidate
      >
        <Field htmlFor="noPaspor" label="Nomor Paspor" wajib error={tampil?.error} className="flex-1">
          <Input
            id="noPaspor"
            name="noPaspor"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            placeholder="A1234567"
            className="font-mono text-base tracking-widest uppercase"
            aria-invalid={!!tampil?.error || undefined}
            aria-describedby={idPesanField("noPaspor")}
            autoFocus
          />
        </Field>
        <Button type="submit" memuat={pending} ikon={<Search />} className="sm:mt-7">
          Cek Paspor
        </Button>
      </form>
    </Card>
  );
}

function LangkahKembali({ onKlik }: { onKlik: () => void }) {
  return (
    <Button varian="ghost" ukuran="sm" ikon={<ArrowLeft />} onClick={onKlik} className="-ml-3 mb-3 self-start">
      Ganti nomor paspor
    </Button>
  );
}

function FormBukaTiket({ noPaspor }: { noPaspor: string }) {
  const [state, action, pending] = useActionState(bukaTiket, undefined);
  const e = state?.errors;

  return (
    <Card className="p-6">
      <Alert jenis="info" judul="Paspor ini sudah terdaftar">
        Nomor paspor <span className="font-mono font-semibold text-fg">{noPaspor}</span> sudah pernah mendaftar.
        Masukkan tanggal lahir untuk membuka kembali tiket antrean Anda.
      </Alert>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          const data = new FormData(ev.currentTarget);
          startTransition(() => action(data));
        }}
        className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start"
        noValidate
      >
        {state?.pesan && <Alert jenis="gagal">{state.pesan}</Alert>}
        <input type="hidden" name="noPaspor" value={noPaspor} />
        <Field htmlFor="tanggalLahirTiket" label="Tanggal Lahir" wajib error={e?.tanggalLahir} className="flex-1">
          <Input
            id="tanggalLahirTiket"
            name="tanggalLahir"
            type="date"
            aria-invalid={!!e?.tanggalLahir || undefined}
            aria-describedby={idPesanField("tanggalLahirTiket")}
          />
        </Field>
        <Button type="submit" memuat={pending} ikon={<Ticket />} className="sm:mt-7">
          Lihat Tiket
        </Button>
      </form>
    </Card>
  );
}
