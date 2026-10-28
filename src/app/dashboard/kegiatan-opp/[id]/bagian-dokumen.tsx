"use client";

import { FileDown, Save } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, kelasTombol } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, idPesanField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { nomorSk, nomorSpt } from "@/lib/nomor-dokumen";
import { simpanNomorDokumen } from "../actions";

type Props = {
  idKegiatanOpp: string;
  bolehUbah: boolean;
  /** YYYY-MM-DD; dipakai bila tanggal surat belum diisi. */
  tanggalPelaksanaan: string;
  tanggalSurat: string | null;
  noSkOpp: string | null;
  noSptInstruktur: string | null;
  noSptPengelola: string | null;
  adaKurikulum: boolean;
  adaPengelola: boolean;
};

/** "Input No. SK OPP, SPT Instruktur & Pengelola" lalu "Generate File .docx". */
export function BagianDokumen(p: Props) {
  const [state, action, pending] = useActionState(simpanNomorDokumen, undefined);
  const e = state?.errors;
  const [tanggal, setTanggal] = useState(p.tanggalSurat ?? p.tanggalPelaksanaan);
  const [urut, setUrut] = useState({ noSkOpp: p.noSkOpp ?? "", noSptInstruktur: p.noSptInstruktur ?? "", noSptPengelola: p.noSptPengelola ?? "" });
  const tanggalBerlaku = p.tanggalSurat ?? p.tanggalPelaksanaan;

  useEffect(() => {
    if (state?.sukses) toast.sukses(state.pesan ?? "Tersimpan");
  }, [state]);

  const dokumen = [
    { jenis: "sk", label: "SK OPP", nomor: p.noSkOpp && `NOMOR ${nomorSk(p.noSkOpp, tanggalBerlaku)}`, syarat: null },
    {
      jenis: "spt-instruktur",
      label: "SPT Instruktur",
      nomor: p.noSptInstruktur && nomorSpt(p.noSptInstruktur, tanggalBerlaku),
      syarat: p.adaKurikulum ? null : "Isi kurikulum dulu",
    },
    {
      jenis: "spt-pengelola",
      label: "SPT Pengelola",
      nomor: p.noSptPengelola && nomorSpt(p.noSptPengelola, tanggalBerlaku),
      syarat: p.adaPengelola ? null : "Tentukan pengelola kelas dulu",
    },
  ];

  const isian = [
    { id: "noSkOpp", label: "No. Urut SK OPP", format: (u: string) => `NOMOR ${nomorSk(u, tanggal)}`, contoh: "1647" },
    { id: "noSptInstruktur", label: "No. Urut SPT Instruktur", format: (u: string) => nomorSpt(u, tanggal), contoh: "1705" },
    { id: "noSptPengelola", label: "No. Urut SPT Pengelola", format: (u: string) => nomorSpt(u, tanggal), contoh: "1706" },
  ] as const;

  return (
    <Card>
      <CardHeader judul="SK & SPT" deskripsi="Isi nomor urut dari tata usaha; format lengkap dibuat otomatis. Lalu unduh draf .docx." />
      <CardBody className="flex flex-col gap-4">
        {p.bolehUbah && (
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              const data = new FormData(ev.currentTarget);
              startTransition(() => action(data));
            }}
            className="flex flex-col gap-3"
            noValidate
          >
            {state?.pesan && !state.sukses && <Alert jenis="gagal">{state.pesan}</Alert>}
            <input type="hidden" name="idKegiatanOpp" value={p.idKegiatanOpp} />
            <Field htmlFor="tanggalSurat" label="Tanggal Surat" error={e?.tanggalSurat} hint="Menentukan bulan (Romawi) dan tahun pada nomor.">
              <Input
                id="tanggalSurat"
                name="tanggalSurat"
                type="date"
                value={tanggal}
                onChange={(ev) => setTanggal(ev.target.value || p.tanggalPelaksanaan)}
                aria-invalid={!!e?.tanggalSurat || undefined}
                aria-describedby={idPesanField("tanggalSurat")}
              />
            </Field>
            {isian.map((f) => (
              <Field
                key={f.id}
                htmlFor={f.id}
                label={f.label}
                error={e?.[f.id]}
                hint={<span className="font-mono">{f.format(urut[f.id].trim() || "…")}</span>}
              >
                <Input
                  id={f.id}
                  name={f.id}
                  value={urut[f.id]}
                  onChange={(ev) => setUrut((u) => ({ ...u, [f.id]: ev.target.value }))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={`Contoh: ${f.contoh}`}
                  aria-invalid={!!e?.[f.id] || undefined}
                  aria-describedby={idPesanField(f.id)}
                />
              </Field>
            ))}
            <Button type="submit" varian="outline" memuat={pending} ikon={<Save />}>
              Simpan Nomor
            </Button>
          </form>
        )}

        <ul className="flex flex-col gap-2 border-t border-border pt-4">
          {dokumen.map((d) => {
            const alasan = d.syarat ?? (d.nomor ? null : "Nomor belum diisi");
            return (
              <li key={d.jenis} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">{d.label}</p>
                  <p className="truncate text-xs text-fg-muted">{alasan ?? d.nomor}</p>
                </div>
                {alasan ? (
                  <Button varian="secondary" ukuran="sm" ikon={<FileDown />} disabled>
                    .docx
                  </Button>
                ) : (
                  <a href={`/dashboard/kegiatan-opp/${p.idKegiatanOpp}/dokumen/${d.jenis}`} download className={kelasTombol("secondary", "sm")}>
                    <FileDown aria-hidden />
                    .docx
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
