"use client";

import { FileDown, Save } from "lucide-react";
import { startTransition, useActionState, useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, kelasTombol } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, idPesanField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { simpanNomorDokumen } from "../actions";

type Props = {
  idKegiatanOpp: string;
  bolehUbah: boolean;
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

  useEffect(() => {
    if (state?.sukses) toast.sukses(state.pesan ?? "Tersimpan");
  }, [state]);

  const dokumen = [
    { jenis: "sk", label: "SK OPP", nomor: p.noSkOpp, syarat: null },
    { jenis: "spt-instruktur", label: "SPT Instruktur", nomor: p.noSptInstruktur, syarat: p.adaKurikulum ? null : "Isi kurikulum dulu" },
    { jenis: "spt-pengelola", label: "SPT Pengelola", nomor: p.noSptPengelola, syarat: p.adaPengelola ? null : "Tentukan pengelola kelas dulu" },
  ];

  const isian = [
    { id: "noSkOpp", label: "No. SK OPP", nilai: p.noSkOpp },
    { id: "noSptInstruktur", label: "No. SPT Instruktur", nilai: p.noSptInstruktur },
    { id: "noSptPengelola", label: "No. SPT Pengelola", nilai: p.noSptPengelola },
  ] as const;

  return (
    <Card>
      <CardHeader judul="SK & SPT" deskripsi="Nomor dari bagian tata usaha, lalu unduh draf .docx." />
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
            {isian.map((f) => (
              <Field key={f.id} htmlFor={f.id} label={f.label} error={e?.[f.id]}>
                <Input
                  id={f.id}
                  name={f.id}
                  defaultValue={f.nilai ?? ""}
                  maxLength={100}
                  placeholder="Contoh: B.123/BP3MI-LPG/X/2026"
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
