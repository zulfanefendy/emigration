"use client";

import { Check, Lock, Minus, Search, UserMinus, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Checkbox, Input } from "@/components/ui/input";
import { Modal, useKonfirmasi } from "@/components/ui/modal";
import { Table, TableKosong, Td, Th, THead, Tr } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { keluarkanPeserta, tambahPeserta } from "../actions";

type Peserta = {
  idCpmi: string;
  namaLengkap: string;
  noPaspor: string;
  jenisKelamin: "L" | "P";
  negaraPenempatan: string;
  jenisPekerjaan: string;
  presensi: { jam: string; toolkit: boolean; konsumsi: boolean } | null;
};

type Calon = { idCpmi: string; namaLengkap: string; noPaspor: string; negaraPenempatan: string; skema: string };

type Props = {
  idKegiatanOpp: string;
  bolehUbah: boolean;
  final: boolean;
  /** Label skema OPP kegiatan ini. */
  skema: string;
  peserta: Peserta[];
  calon: Calon[];
};

const cocokKata = (kata: string) => (c: { namaLengkap: string; noPaspor: string }) =>
  !kata || c.namaLengkap.toLowerCase().includes(kata) || c.noPaspor.toLowerCase().includes(kata);

export function BagianPeserta({ idKegiatanOpp, bolehUbah, final, skema, peserta, calon }: Props) {
  const [cari, setCari] = useState("");
  const [modal, setModal] = useState(false);
  const [memproses, mulai] = useTransition();
  const { konfirmasi, elemenKonfirmasi } = useKonfirmasi();

  const tampil = peserta.filter(cocokKata(cari.trim().toLowerCase()));
  const laki = peserta.filter((p) => p.jenisKelamin === "L").length;
  const hadir = peserta.filter((p) => p.presensi).length;

  async function keluarkan(p: Peserta) {
    const ya = await konfirmasi({ judul: `Keluarkan ${p.namaLengkap}?`, pesan: "CPMI bisa didaftarkan lagi ke kegiatan mana pun.", labelYa: "Keluarkan" });
    if (!ya) return;
    mulai(async () => {
      const hasil = await keluarkanPeserta(idKegiatanOpp, p.idCpmi);
      if (hasil.sukses) toast.sukses(hasil.pesan);
      else toast.gagal(hasil.pesan);
    });
  }

  return (
    <Card>
      <CardHeader
        judul={`Peserta (${peserta.length})`}
        deskripsi={
          peserta.length
            ? `${laki} laki-laki · ${peserta.length - laki} perempuan · ${hadir} sudah presensi`
            : `CPMI skema ${skema} yang sudah diverifikasi.`
        }
        aksi={
          <>
            {peserta.length > 8 && (
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
                <Input type="search" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama, paspor" aria-label="Cari peserta" className="w-48 pl-9" />
              </div>
            )}
            {bolehUbah && (
              <Button ukuran="sm" ikon={<UserPlus />} onClick={() => setModal(true)}>
                Tambah Peserta
              </Button>
            )}
          </>
        }
      />
      {final && (
        <div className="px-5 pt-4">
          <Alert jenis="info" judul="Data peserta final">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-4" aria-hidden /> Peserta sudah dikunci dan tidak bisa diubah.
            </span>
          </Alert>
        </div>
      )}
      <Table>
        <THead>
          <tr>
            <Th className="w-12">No.</Th>
            <Th>CPMI</Th>
            <Th>Penempatan</Th>
            <Th>Presensi</Th>
            {bolehUbah && <Th className="text-right">Aksi</Th>}
          </tr>
        </THead>
        <tbody>
          {tampil.length === 0 ? (
            <TableKosong kolom={bolehUbah ? 5 : 4}>{peserta.length === 0 ? "Belum ada peserta." : "Tidak ada peserta yang cocok."}</TableKosong>
          ) : (
            tampil.map((p, i) => (
              <Tr key={p.idCpmi}>
                <Td className="text-fg-muted">{i + 1}</Td>
                <Td>
                  <p className="font-medium">{p.namaLengkap}</p>
                  <p className="font-mono text-xs text-fg-muted">
                    {p.noPaspor} · {p.jenisKelamin}
                  </p>
                </Td>
                <Td>
                  <p>{p.negaraPenempatan}</p>
                  <p className="text-xs text-fg-muted">{p.jenisPekerjaan}</p>
                </Td>
                <Td>
                  {p.presensi ? (
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <Badge nada="sukses">Hadir {p.presensi.jam}</Badge>
                        <a
                          href={`/dashboard/kegiatan-opp/${idKegiatanOpp}/ttd/${p.idCpmi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-brand-text hover:underline"
                        >
                          TTD
                        </a>
                      </span>
                      <span className="flex gap-3 text-xs text-fg-muted">
                        <Tanda ya={p.presensi.toolkit} label="Toolkit" />
                        <Tanda ya={p.presensi.konsumsi} label="Konsumsi" />
                      </span>
                    </div>
                  ) : (
                    <Badge>Belum</Badge>
                  )}
                </Td>
                {bolehUbah && (
                  <Td className="text-right">
                    {!p.presensi && (
                      <Button varian="ghost" ukuran="sm" ikon={<UserMinus />} disabled={memproses} onClick={() => keluarkan(p)}>
                        Keluarkan
                      </Button>
                    )}
                  </Td>
                )}
              </Tr>
            ))
          )}
        </tbody>
      </Table>

      {modal && <ModalTambahPeserta idKegiatanOpp={idKegiatanOpp} skema={skema} calon={calon} onTutup={() => setModal(false)} />}
      {elemenKonfirmasi}
    </Card>
  );
}

function Tanda({ ya, label }: { ya: boolean; label: string }) {
  const Ikon = ya ? Check : Minus;
  return (
    <span className={ya ? "inline-flex items-center gap-0.5 text-success" : "inline-flex items-center gap-0.5"}>
      <Ikon className="size-3.5" aria-hidden />
      {label}
      <span className="sr-only">{ya ? " diterima" : " belum diterima"}</span>
    </span>
  );
}

function ModalTambahPeserta({ idKegiatanOpp, skema, calon, onTutup }: { idKegiatanOpp: string; skema: string; calon: Calon[]; onTutup: () => void }) {
  const [cari, setCari] = useState("");
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [memproses, mulai] = useTransition();

  const tampil = calon.filter(cocokKata(cari.trim().toLowerCase()));
  const semuaTerpilih = tampil.length > 0 && tampil.every((c) => dipilih.has(c.idCpmi));

  function ubah(id: string, pilih: boolean) {
    setDipilih((lama) => {
      const baru = new Set(lama);
      if (pilih) baru.add(id);
      else baru.delete(id);
      return baru;
    });
  }

  function pilihSemua(pilih: boolean) {
    setDipilih((lama) => {
      const baru = new Set(lama);
      for (const c of tampil) {
        if (pilih) baru.add(c.idCpmi);
        else baru.delete(c.idCpmi);
      }
      return baru;
    });
  }

  function simpan() {
    mulai(async () => {
      const hasil = await tambahPeserta(idKegiatanOpp, [...dipilih]);
      if (!hasil.sukses) return void toast.gagal(hasil.pesan);
      toast.sukses(hasil.pesan);
      onTutup();
    });
  }

  return (
    <Modal
      buka
      onTutup={onTutup}
      ukuran="lg"
      judul="Tambah Peserta"
      deskripsi={`CPMI skema ${skema} yang sudah diverifikasi dan belum terdaftar di kegiatan OPP lain.`}
      footer={
        <>
          <Button varian="outline" onClick={onTutup}>
            Batal
          </Button>
          <Button ikon={<UserPlus />} memuat={memproses} disabled={dipilih.size === 0} onClick={simpan}>
            Tambahkan {dipilih.size > 0 ? dipilih.size : ""}
          </Button>
        </>
      }
    >
      {calon.length === 0 ? (
        <Alert jenis="info">
          Belum ada CPMI skema {skema} yang siap didaftarkan. CPMI muncul di sini setelah berkasnya selesai diverifikasi di loket
          {skema === "Mandiri" ? " (Mandiri Reguler maupun Mandiri SSW)" : ""}.
        </Alert>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
            <Input type="search" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama atau paspor" aria-label="Cari CPMI" className="pl-9" />
          </div>
          <label className="flex items-center gap-3 border-b border-border px-1 pb-2 text-sm font-semibold">
            <Checkbox checked={semuaTerpilih} onChange={(e) => pilihSemua(e.target.checked)} disabled={tampil.length === 0} />
            Pilih semua yang tampil ({tampil.length})
          </label>
          <ul className="flex max-h-[50vh] flex-col overflow-y-auto">
            {tampil.map((c) => (
              <li key={c.idCpmi}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-2 hover:bg-surface-muted">
                  <Checkbox checked={dipilih.has(c.idCpmi)} onChange={(e) => ubah(c.idCpmi, e.target.checked)} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-fg">{c.namaLengkap}</span>
                    <span className="block font-mono text-xs text-fg-muted">{c.noPaspor}</span>
                  </span>
                  <span className="text-right text-sm text-fg-muted">
                    {c.negaraPenempatan}
                    <span className="block text-xs">{c.skema}</span>
                  </span>
                </label>
              </li>
            ))}
            {tampil.length === 0 && <li className="py-6 text-center text-sm text-fg-muted">Tidak ada CPMI yang cocok.</li>}
          </ul>
        </div>
      )}
    </Modal>
  );
}
