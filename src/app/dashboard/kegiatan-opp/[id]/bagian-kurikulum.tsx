"use client";

import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, idPesanField } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Modal, useKonfirmasi } from "@/components/ui/modal";
import { Table, TableKosong, Td, Th, THead, Tr } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { menitDariJam } from "@/lib/tanggal";
import { hapusKurikulum, simpanKurikulum } from "../actions";
import type { OpsiPegawai } from "../form-kegiatan";

/** 1 JP diklat = 45 menit; dipakai untuk menyarankan jam selesai. */
const MENIT_PER_JP = 45;

export type SesiKurikulum = {
  idKurikulum: number;
  idMateri: number;
  kodeMateri: string;
  judulMateri: string;
  durasiJp: number;
  idInstruktur: string;
  instruktur: string;
  jamMulai: string;
  jamSelesai: string;
};

export type OpsiMateri = { idMateri: number; kodeMateri: string; judulMateri: string; durasiJamPelajaran: number };

type Props = {
  idKegiatanOpp: string;
  bolehUbah: boolean;
  sesi: SesiKurikulum[];
  materi: OpsiMateri[];
  instruktur: OpsiPegawai[];
};

function tambahMenit(jam: string, menit: number) {
  const total = Math.min(menitDariJam(jam) + menit, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function BagianKurikulum({ idKegiatanOpp, bolehUbah, sesi, materi, instruktur }: Props) {
  const [sasaran, setSasaran] = useState<SesiKurikulum | "baru" | null>(null);
  const [memproses, mulai] = useTransition();
  const { konfirmasi, elemenKonfirmasi } = useKonfirmasi();
  const totalJp = sesi.reduce((n, s) => n + s.durasiJp, 0);

  async function hapus(s: SesiKurikulum) {
    const ya = await konfirmasi({ judul: `Hapus sesi ${s.kodeMateri}?`, pesan: `${s.judulMateri} — ${s.instruktur}`, labelYa: "Hapus" });
    if (!ya) return;
    mulai(async () => {
      const hasil = await hapusKurikulum(idKegiatanOpp, s.idKurikulum);
      if (hasil.sukses) toast.sukses(hasil.pesan);
      else toast.gagal(hasil.pesan);
    });
  }

  return (
    <Card>
      <CardHeader
        judul="Kurikulum & Instruktur"
        deskripsi={sesi.length ? `${sesi.length} sesi · ${totalJp} JP` : "Susun materi, instruktur, dan jamnya."}
        aksi={
          bolehUbah && (
            <Button ukuran="sm" ikon={<Plus />} onClick={() => setSasaran("baru")}>
              Tambah Sesi
            </Button>
          )
        }
      />
      <Table>
        <THead>
          <tr>
            <Th>Jam</Th>
            <Th>Materi</Th>
            <Th>Instruktur</Th>
            <Th className="text-right">JP</Th>
            {bolehUbah && <Th className="text-right">Aksi</Th>}
          </tr>
        </THead>
        <tbody>
          {sesi.length === 0 ? (
            <TableKosong kolom={bolehUbah ? 5 : 4}>Belum ada sesi kurikulum.</TableKosong>
          ) : (
            sesi.map((s) => (
              <Tr key={s.idKurikulum}>
                <Td className="font-mono text-sm whitespace-nowrap">
                  {s.jamMulai}–{s.jamSelesai}
                </Td>
                <Td>
                  <p className="font-medium">{s.judulMateri}</p>
                  <p className="font-mono text-xs text-fg-muted">{s.kodeMateri}</p>
                </Td>
                <Td>{s.instruktur}</Td>
                <Td className="text-right">{s.durasiJp}</Td>
                {bolehUbah && (
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button varian="ghost" ukuran="sm" ikon={<Pencil />} onClick={() => setSasaran(s)}>
                        Ubah
                      </Button>
                      <Button varian="ghost" ukuran="sm" ikon={<Trash2 />} disabled={memproses} onClick={() => hapus(s)} aria-label={`Hapus sesi ${s.kodeMateri}`} />
                    </div>
                  </Td>
                )}
              </Tr>
            ))
          )}
        </tbody>
      </Table>

      {bolehUbah && (materi.length === 0 || instruktur.length === 0) && (
        <div className="px-5 pb-4">
          <Alert jenis="peringatan">
            {materi.length === 0 ? "Belum ada materi aktif di Master Materi OPP." : "Belum ada pegawai dengan role Instruktur."}
          </Alert>
        </div>
      )}

      {sasaran && (
        <ModalSesi
          idKegiatanOpp={idKegiatanOpp}
          sesi={sasaran === "baru" ? null : sasaran}
          jamAwal={sesi.at(-1)?.jamSelesai || "08:00"}
          materi={materi}
          instruktur={instruktur}
          onTutup={() => setSasaran(null)}
        />
      )}
      {elemenKonfirmasi}
    </Card>
  );
}

type PropsModal = {
  idKegiatanOpp: string;
  sesi: SesiKurikulum | null;
  jamAwal: string;
  materi: OpsiMateri[];
  instruktur: OpsiPegawai[];
  onTutup: () => void;
};

function ModalSesi({ idKegiatanOpp, sesi, jamAwal, materi, instruktur, onTutup }: PropsModal) {
  const [state, action, pending] = useActionState(simpanKurikulum, undefined);
  const e = state?.errors;

  // Materi sesi lama bisa saja sudah nonaktif; tetap tampilkan agar tidak hilang dari pilihan.
  const opsiMateri =
    sesi && !materi.some((m) => m.idMateri === sesi.idMateri)
      ? [{ idMateri: sesi.idMateri, kodeMateri: sesi.kodeMateri, judulMateri: `${sesi.judulMateri} (nonaktif)`, durasiJamPelajaran: sesi.durasiJp }, ...materi]
      : materi;

  const [idMateri, setIdMateri] = useState(sesi ? String(sesi.idMateri) : "");
  const [jamMulai, setJamMulai] = useState(sesi?.jamMulai ?? jamAwal);
  const [jamSelesai, setJamSelesai] = useState(sesi?.jamSelesai ?? "");
  // Jam selesai disarankan otomatis sampai pengguna mengubahnya sendiri.
  const [selesaiManual, setSelesaiManual] = useState(!!sesi);

  function sarankan(id: string, mulai: string) {
    const m = opsiMateri.find((o) => String(o.idMateri) === id);
    if (!selesaiManual && m && mulai) setJamSelesai(tambahMenit(mulai, m.durasiJamPelajaran * MENIT_PER_JP));
  }

  useEffect(() => {
    if (state?.sukses) {
      toast.sukses(state.pesan ?? "Tersimpan");
      onTutup();
    }
  }, [state, onTutup]);

  const aria = (id: string, error?: string[]) => ({
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
      judul={sesi ? "Ubah Sesi" : "Tambah Sesi"}
      footer={
        <>
          <Button varian="outline" onClick={onTutup}>
            Batal
          </Button>
          <Button type="submit" form="form-sesi" memuat={pending} ikon={<Save />}>
            Simpan
          </Button>
        </>
      }
    >
      <form
        id="form-sesi"
        onSubmit={(ev) => {
          ev.preventDefault();
          const data = new FormData(ev.currentTarget);
          startTransition(() => action(data));
        }}
        className="flex flex-col gap-4"
        noValidate
      >
        {state?.pesan && !state.sukses && <Alert jenis="gagal">{state.pesan}</Alert>}
        <input type="hidden" name="idKegiatanOpp" value={idKegiatanOpp} />
        {sesi && <input type="hidden" name="idKurikulum" value={sesi.idKurikulum} />}

        <Field htmlFor="idMateri" label="Materi" wajib error={e?.idMateri}>
          <Select
            value={idMateri}
            onChange={(ev) => {
              setIdMateri(ev.target.value);
              sarankan(ev.target.value, jamMulai);
            }}
            {...aria("idMateri", e?.idMateri)}
          >
            <option value="" disabled>
              Pilih materi
            </option>
            {opsiMateri.map((m) => (
              <option key={m.idMateri} value={m.idMateri}>
                {m.kodeMateri} · {m.judulMateri} ({m.durasiJamPelajaran} JP)
              </option>
            ))}
          </Select>
        </Field>

        <Field htmlFor="idInstruktur" label="Instruktur" wajib error={e?.idInstruktur}>
          <Select defaultValue={sesi?.idInstruktur ?? ""} {...aria("idInstruktur", e?.idInstruktur)}>
            <option value="" disabled>
              Pilih instruktur
            </option>
            {instruktur.map((i) => (
              <option key={i.idPegawai} value={i.idPegawai}>
                {i.namaLengkap}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field htmlFor="jamMulai" label="Jam Mulai" wajib error={e?.jamMulai}>
            <Input
              type="time"
              value={jamMulai}
              onChange={(ev) => {
                setJamMulai(ev.target.value);
                sarankan(idMateri, ev.target.value);
              }}
              {...aria("jamMulai", e?.jamMulai)}
            />
          </Field>
          <Field
            htmlFor="jamSelesai"
            label="Jam Selesai"
            wajib
            error={e?.jamSelesai}
            hint={selesaiManual ? undefined : `Otomatis ${MENIT_PER_JP} menit per JP.`}
          >
            <Input
              type="time"
              value={jamSelesai}
              onChange={(ev) => {
                setSelesaiManual(true);
                setJamSelesai(ev.target.value);
              }}
              {...aria("jamSelesai", e?.jamSelesai)}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
