"use client";

import { Save } from "lucide-react";
import { startTransition, useActionState, useEffect } from "react";
import type { SkemaPendaftaran } from "@/generated/prisma/enums";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, idPesanField } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { LABEL_SKEMA } from "@/app/(publik)/pendaftaran/pilihan";
import { simpanKegiatan } from "./actions";

export type OpsiPegawai = { idPegawai: string; namaLengkap: string; nip: string };

export type IsianKegiatan = {
  idKegiatanOpp: string;
  kodeKegiatan: string;
  tanggalPelaksanaan: string;
  skemaOpp: SkemaPendaftaran;
  tempatOpp: string;
  idPengelolaKelas: string | null;
  idPenanggungJawab: string | null;
};

type Props = {
  /** null = buat kegiatan baru. */
  kegiatan: IsianKegiatan | null;
  pengelola: OpsiPegawai[];
  penanggungJawab: OpsiPegawai[];
  hariIni: string;
  onTutup: () => void;
};

/** Modal "Buat Kegiatan OPP Baru & Pilih Tim" (juga dipakai untuk mengubah). */
export function ModalKegiatan({ kegiatan, pengelola, penanggungJawab, hariIni, onTutup }: Props) {
  const [state, action, pending] = useActionState(simpanKegiatan, undefined);
  const e = state?.errors;

  useEffect(() => {
    if (state?.sukses) {
      toast.sukses(state.pesan ?? "Tersimpan");
      onTutup();
    }
  }, [state, onTutup]);

  const kontrol = (id: string, error?: string[]) => ({
    id,
    name: id,
    "aria-invalid": !!error || undefined,
    "aria-describedby": idPesanField(id),
  });

  return (
    <Modal
      buka
      onTutup={onTutup}
      tutupSaatKlikLuar={false}
      judul={kegiatan ? `Ubah ${kegiatan.kodeKegiatan}` : "Buat Kegiatan OPP"}
      deskripsi={kegiatan ? undefined : "Kode kegiatan dibuat otomatis. Kurikulum dan peserta diatur setelah kegiatan dibuat."}
      footer={
        <>
          <Button varian="outline" onClick={onTutup}>
            Batal
          </Button>
          <Button type="submit" form="form-kegiatan" memuat={pending} ikon={<Save />}>
            {kegiatan ? "Simpan" : "Buat Kegiatan"}
          </Button>
        </>
      }
    >
      <form
        id="form-kegiatan"
        onSubmit={(ev) => {
          ev.preventDefault();
          const data = new FormData(ev.currentTarget);
          startTransition(() => action(data));
        }}
        className="flex flex-col gap-4"
        noValidate
      >
        {state?.pesan && !state.sukses && <Alert jenis="gagal">{state.pesan}</Alert>}
        {kegiatan && <input type="hidden" name="idKegiatanOpp" value={kegiatan.idKegiatanOpp} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="tanggalPelaksanaan" label="Tanggal Pelaksanaan" wajib error={e?.tanggalPelaksanaan}>
            <Input
              type="date"
              min={kegiatan ? undefined : hariIni}
              defaultValue={kegiatan?.tanggalPelaksanaan}
              {...kontrol("tanggalPelaksanaan", e?.tanggalPelaksanaan)}
            />
          </Field>
          <Field htmlFor="skemaOpp" label="Skema OPP" wajib error={e?.skemaOpp} hint="Hanya CPMI dengan skema ini yang bisa jadi peserta.">
            <Select defaultValue={kegiatan?.skemaOpp ?? ""} {...kontrol("skemaOpp", e?.skemaOpp)}>
              <option value="" disabled>
                Pilih skema
              </option>
              {Object.entries(LABEL_SKEMA).map(([nilai, label]) => (
                <option key={nilai} value={nilai}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field htmlFor="tempatOpp" label="Tempat" wajib error={e?.tempatOpp}>
          <Input
            maxLength={255}
            placeholder="Contoh: Aula BP3MI Lampung"
            defaultValue={kegiatan?.tempatOpp}
            {...kontrol("tempatOpp", e?.tempatOpp)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <PilihPegawai label="Pengelola Kelas" id="idPengelolaKelas" opsi={pengelola} nilai={kegiatan?.idPengelolaKelas} error={e?.idPengelolaKelas} />
          <PilihPegawai label="Penanggung Jawab" id="idPenanggungJawab" opsi={penanggungJawab} nilai={kegiatan?.idPenanggungJawab} error={e?.idPenanggungJawab} />
        </div>
      </form>
    </Modal>
  );
}

function PilihPegawai(p: { label: string; id: string; opsi: OpsiPegawai[]; nilai?: string | null; error?: string[] }) {
  return (
    <Field
      htmlFor={p.id}
      label={p.label}
      error={p.error}
      hint={p.opsi.length === 0 ? `Belum ada pegawai dengan role ${p.label}.` : undefined}
    >
      <Select
        id={p.id}
        name={p.id}
        defaultValue={p.nilai ?? ""}
        aria-invalid={!!p.error || undefined}
        aria-describedby={idPesanField(p.id)}
      >
        <option value="">Belum ditentukan</option>
        {p.opsi.map((o) => (
          <option key={o.idPegawai} value={o.idPegawai}>
            {o.namaLengkap}
          </option>
        ))}
      </Select>
    </Field>
  );
}
