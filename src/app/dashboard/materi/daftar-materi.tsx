"use client";

import { Pencil, Plus, Power, PowerOff, Save, Search } from "lucide-react";
import { startTransition, useActionState, useEffect, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, idPesanField } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Modal, useKonfirmasi } from "@/components/ui/modal";
import { Table, TableKosong, Td, Th, THead, Tr } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { simpanMateri, ubahStatusMateri } from "./actions";

export type BarisMateri = {
  idMateri: number;
  kodeMateri: string;
  judulMateri: string;
  deskripsi: string | null;
  durasiJamPelajaran: number;
  isActive: boolean;
  /** Jumlah kurikulum yang memakai materi ini. */
  dipakai: number;
};

export function DaftarMateri({ materi }: { materi: BarisMateri[] }) {
  const [cari, setCari] = useState("");
  // null = modal tertutup, "baru" = tambah, objek = ubah
  const [sasaran, setSasaran] = useState<BarisMateri | "baru" | null>(null);
  const [memproses, mulai] = useTransition();
  const { konfirmasi, elemenKonfirmasi } = useKonfirmasi();

  const kata = cari.trim().toLowerCase();
  const tampil = kata
    ? materi.filter((m) => m.kodeMateri.toLowerCase().includes(kata) || m.judulMateri.toLowerCase().includes(kata))
    : materi;
  const totalJpAktif = materi.filter((m) => m.isActive).reduce((n, m) => n + m.durasiJamPelajaran, 0);

  async function ubahStatus(m: BarisMateri) {
    if (m.isActive) {
      const ya = await konfirmasi({
        judul: `Nonaktifkan ${m.kodeMateri}?`,
        pesan: "Materi tidak bisa dipilih lagi untuk kurikulum baru. Kurikulum yang sudah memakainya tidak berubah.",
        labelYa: "Nonaktifkan",
      });
      if (!ya) return;
    }
    mulai(async () => {
      const hasil = await ubahStatusMateri(m.idMateri, !m.isActive);
      if (hasil.sukses) toast.sukses(hasil.pesan ?? "Tersimpan");
    });
  }

  return (
    <Card>
      <CardHeader
        judul={`${materi.length} materi`}
        deskripsi={`Total ${totalJpAktif} JP dari materi aktif`}
        aksi={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
              <Input
                type="search"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari kode atau judul"
                aria-label="Cari materi"
                className="w-56 pl-9"
              />
            </div>
            <Button ikon={<Plus />} onClick={() => setSasaran("baru")}>
              Tambah Materi
            </Button>
          </>
        }
      />
      <Table>
        <THead>
          <tr>
            <Th>Kode</Th>
            <Th>Judul Materi</Th>
            <Th className="text-right">Durasi</Th>
            <Th>Status</Th>
            <Th className="text-right">Aksi</Th>
          </tr>
        </THead>
        <tbody>
          {tampil.length === 0 ? (
            <TableKosong kolom={5}>{kata ? "Tidak ada materi yang cocok." : "Belum ada materi."}</TableKosong>
          ) : (
            tampil.map((m) => (
              <Tr key={m.idMateri} className={m.isActive ? undefined : "text-fg-muted"}>
                <Td className="font-mono text-xs font-semibold whitespace-nowrap">{m.kodeMateri}</Td>
                <Td>
                  <p className="font-medium">{m.judulMateri}</p>
                  {m.deskripsi && <p className="mt-0.5 line-clamp-1 text-xs text-fg-muted">{m.deskripsi}</p>}
                </Td>
                <Td className="text-right whitespace-nowrap">{m.durasiJamPelajaran} JP</Td>
                <Td>
                  {m.isActive ? <Badge nada="sukses">Aktif</Badge> : <Badge>Nonaktif</Badge>}
                  {m.dipakai > 0 && <p className="mt-1 text-xs text-fg-muted">Dipakai {m.dipakai} kurikulum</p>}
                </Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Button varian="ghost" ukuran="sm" ikon={<Pencil />} onClick={() => setSasaran(m)}>
                      Ubah
                    </Button>
                    <Button
                      varian="ghost"
                      ukuran="sm"
                      ikon={m.isActive ? <PowerOff /> : <Power />}
                      disabled={memproses}
                      onClick={() => ubahStatus(m)}
                    >
                      {m.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>

      {sasaran && <ModalMateri materi={sasaran === "baru" ? null : sasaran} onTutup={() => setSasaran(null)} />}
      {elemenKonfirmasi}
    </Card>
  );
}

function ModalMateri({ materi, onTutup }: { materi: BarisMateri | null; onTutup: () => void }) {
  const [state, action, pending] = useActionState(simpanMateri, undefined);
  const e = state?.errors;

  useEffect(() => {
    if (state?.sukses) {
      toast.sukses(state.pesan ?? "Tersimpan");
      onTutup();
    }
  }, [state, onTutup]);

  return (
    <Modal
      buka
      onTutup={onTutup}
      tutupSaatKlikLuar={false}
      judul={materi ? "Ubah Materi" : "Tambah Materi"}
      footer={
        <>
          <Button varian="outline" onClick={onTutup}>
            Batal
          </Button>
          <Button type="submit" form="form-materi" memuat={pending} ikon={<Save />}>
            Simpan
          </Button>
        </>
      }
    >
      <form
        id="form-materi"
        // onSubmit (bukan action=) agar isian tidak dikosongkan React saat validasi gagal
        onSubmit={(ev) => {
          ev.preventDefault();
          const data = new FormData(ev.currentTarget);
          startTransition(() => action(data));
        }}
        className="flex flex-col gap-4"
        noValidate
      >
        {state?.pesan && !state.sukses && <Alert jenis="gagal">{state.pesan}</Alert>}
        {materi && <input type="hidden" name="idMateri" value={materi.idMateri} />}

        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <Field htmlFor="kodeMateri" label="Kode Materi" wajib error={e?.kodeMateri} hint="Contoh: OPP-06">
            <Input
              id="kodeMateri"
              name="kodeMateri"
              defaultValue={materi?.kodeMateri}
              maxLength={20}
              className="uppercase"
              aria-invalid={!!e?.kodeMateri || undefined}
              aria-describedby={idPesanField("kodeMateri")}
            />
          </Field>
          <Field htmlFor="durasiJamPelajaran" label="Durasi (JP)" wajib error={e?.durasiJamPelajaran}>
            <Input
              id="durasiJamPelajaran"
              name="durasiJamPelajaran"
              type="number"
              min={1}
              max={40}
              defaultValue={materi?.durasiJamPelajaran ?? 1}
              aria-invalid={!!e?.durasiJamPelajaran || undefined}
              aria-describedby={idPesanField("durasiJamPelajaran")}
            />
          </Field>
        </div>

        <Field htmlFor="judulMateri" label="Judul Materi" wajib error={e?.judulMateri}>
          <Input
            id="judulMateri"
            name="judulMateri"
            defaultValue={materi?.judulMateri}
            maxLength={200}
            aria-invalid={!!e?.judulMateri || undefined}
            aria-describedby={idPesanField("judulMateri")}
          />
        </Field>

        <Field htmlFor="deskripsi" label="Deskripsi" error={e?.deskripsi}>
          <Textarea
            id="deskripsi"
            name="deskripsi"
            defaultValue={materi?.deskripsi ?? ""}
            rows={3}
            aria-invalid={!!e?.deskripsi || undefined}
            aria-describedby={idPesanField("deskripsi")}
          />
        </Field>
      </form>
    </Modal>
  );
}
