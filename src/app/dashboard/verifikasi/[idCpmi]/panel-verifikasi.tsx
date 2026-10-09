"use client";

import { CircleCheck, FilePen, Megaphone, MessageCircle, Play, RotateCcw, Save, UserX, Volume2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState, useTransition } from "react";
import type { StatusAntrian, StatusVerifikasi } from "@/generated/prisma/enums";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, idPesanField } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { Modal, useKonfirmasi } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { buatLinkWa } from "@/lib/whatsapp";
import { ambilVerifikasi, kembalikanKeAntrean, panggil, revisiVerifikasi, selesaiVerifikasi, tandaiTidakHadir } from "../actions";
import { umumkanNomor } from "../umumkan";

type PropsPanel = {
  idCpmi: string;
  noAntrian: string;
  namaLengkap: string;
  noWhatsapp: string;
  statusAntrian: StatusAntrian;
  statusVerifikasi: StatusVerifikasi;
  catatanTerakhir: string | null;
  verifikator: string | null;
  /** false = sedang dipegang verifikator lain. */
  bolehMengubah: boolean;
};

/** Tombol aksi sesuai tahap (Flow Chart PM bagian 2). */
export function PanelVerifikasi(p: PropsPanel) {
  const [memproses, mulai] = useTransition();
  const [modalRevisi, setModalRevisi] = useState(false);
  const { konfirmasi, elemenKonfirmasi } = useKonfirmasi();

  function jalankan(aksi: () => Promise<{ sukses?: boolean; pesan?: string; noAntrian?: string }>) {
    mulai(async () => {
      const hasil = await aksi();
      if (!hasil.sukses) return void toast.gagal(hasil.pesan ?? "Gagal");
      if (hasil.noAntrian) umumkanNomor(hasil.noAntrian);
      toast.sukses(hasil.pesan ?? "Tersimpan");
    });
  }

  async function selesai() {
    const ya = await konfirmasi({
      judul: "Berkas fisik valid?",
      pesan: `${p.namaLengkap} akan berstatus Sudah Diverifikasi dan bisa didaftarkan ke kegiatan OPP.`,
      labelYa: "Ya, Selesai",
    });
    if (ya) jalankan(() => selesaiVerifikasi(p.idCpmi));
  }

  async function tidakHadir() {
    const ya = await konfirmasi({ judul: `${p.noAntrian} tidak hadir?`, labelYa: "Tandai Tidak Hadir" });
    if (ya) jalankan(() => tandaiTidakHadir(p.idCpmi));
  }

  const sedang = p.statusVerifikasi === "SEDANG_DIVERIFIKASI";
  const revisi = p.statusAntrian === "MENUNGGU" && p.statusVerifikasi === "PERLU_REVISI";
  let isi: React.ReactNode;

  if (p.statusVerifikasi === "SUDAH_SELESAI") {
    isi = (
      <Alert jenis="sukses" judul="Sudah diverifikasi">
        Berkas lengkap{p.verifikator ? `, diverifikasi oleh ${p.verifikator}` : ""}. CPMI siap didaftarkan ke kegiatan OPP.
      </Alert>
    );
  } else if (sedang && !p.bolehMengubah) {
    isi = (
      <Alert jenis="info" judul="Sedang diverifikasi">
        Berkas sedang diperiksa oleh {p.verifikator}.
      </Alert>
    );
  } else if (sedang) {
    isi = (
      <>
        <p className="text-sm text-fg-muted">Cocokkan berkas fisik dengan data di samping, lalu pilih hasilnya.</p>
        <Button ikon={<CircleCheck />} disabled={memproses} onClick={selesai}>
          Selesai, Berkas Valid
        </Button>
        <Button varian="outline" ikon={<FilePen />} disabled={memproses} onClick={() => setModalRevisi(true)}>
          Catat Revisi / Penolakan
        </Button>
      </>
    );
  } else if (p.statusAntrian === "DIPANGGIL") {
    isi = (
      <>
        <p className="text-sm text-fg-muted">Nomor sedang dipanggil. Tekan Ambil saat CPMI sudah di depan loket.</p>
        <Button ikon={<Play />} memuat={memproses} onClick={() => jalankan(() => ambilVerifikasi(p.idCpmi))}>
          Ambil, Mulai Verifikasi
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button varian="outline" ikon={<Volume2 />} onClick={() => umumkanNomor(p.noAntrian)}>
            Ulangi
          </Button>
          <Button varian="outline" ikon={<UserX />} disabled={memproses} onClick={tidakHadir}>
            Tidak Hadir
          </Button>
        </div>
      </>
    );
  } else if (p.statusAntrian === "BATAL") {
    isi = (
      <>
        <Alert jenis="peringatan" judul="Tidak hadir">
          CPMI tidak datang saat dipanggil.
        </Alert>
        <Button varian="outline" ikon={<RotateCcw />} memuat={memproses} onClick={() => jalankan(() => kembalikanKeAntrean(p.idCpmi))}>
          Kembalikan ke Antrean
        </Button>
      </>
    );
  } else {
    isi = (
      <>
        {revisi ? (
          <Alert jenis="peringatan" judul="Sedang memperbaiki berkas">
            Panggil kembali saat CPMI sudah datang dengan berkas yang diperbaiki.
          </Alert>
        ) : (
          <p className="text-sm text-fg-muted">Menunggu giliran dipanggil.</p>
        )}
        <Button ikon={<Megaphone />} memuat={memproses} onClick={() => jalankan(() => panggil(p.idCpmi))}>
          Panggil {p.noAntrian}
        </Button>
        {revisi && p.catatanTerakhir && (
          <a
            href={buatLinkWa(pesanRevisi(p), p.noWhatsapp)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-brand-text hover:underline"
          >
            <MessageCircle className="size-4" aria-hidden />
            Kirim catatan revisi lewat WhatsApp
          </a>
        )}
      </>
    );
  }

  return (
    <Card>
      <CardHeader judul="Verifikasi Berkas" />
      <CardBody className="flex flex-col gap-3">{isi}</CardBody>
      {modalRevisi && <ModalRevisi idCpmi={p.idCpmi} onTutup={() => setModalRevisi(false)} />}
      {elemenKonfirmasi}
    </Card>
  );
}

function pesanRevisi(p: PropsPanel) {
  return [
    `Halo ${p.namaLengkap},`,
    "",
    `Hasil verifikasi berkas Anda di BP3MI Lampung (antrean ${p.noAntrian}): berkas perlu diperbaiki.`,
    "",
    `Catatan petugas:\n${p.catatanTerakhir}`,
    "",
    "Silakan kembali ke loket verifikasi setelah berkas lengkap dengan menunjukkan tiket antrean Anda.",
  ].join("\n");
}

function ModalRevisi({ idCpmi, onTutup }: { idCpmi: string; onTutup: () => void }) {
  const [state, action, pending] = useActionState(revisiVerifikasi, undefined);
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
      judul="Catat Revisi / Penolakan"
      deskripsi="CPMI kembali ke daftar antrean dan dipanggil ulang setelah memperbaiki berkas."
      footer={
        <>
          <Button varian="outline" onClick={onTutup}>
            Batal
          </Button>
          <Button type="submit" form="form-revisi" memuat={pending} ikon={<Save />}>
            Simpan Catatan
          </Button>
        </>
      }
    >
      <form
        id="form-revisi"
        onSubmit={(ev) => {
          ev.preventDefault();
          const data = new FormData(ev.currentTarget);
          startTransition(() => action(data));
        }}
        className="flex flex-col gap-4"
        noValidate
      >
        {state?.pesan && !state.sukses && <Alert jenis="gagal">{state.pesan}</Alert>}
        <input type="hidden" name="idCpmi" value={idCpmi} />
        <Field htmlFor="catatan" label="Berkas yang perlu diperbaiki" wajib error={e?.catatan} hint="Catatan ini bisa dikirim ke CPMI lewat WhatsApp.">
          <Textarea
            id="catatan"
            name="catatan"
            rows={4}
            maxLength={2000}
            placeholder="Contoh: Perjanjian kerja belum ditandatangani pengguna jasa."
            aria-invalid={!!e?.catatan || undefined}
            aria-describedby={idPesanField("catatan")}
          />
        </Field>
      </form>
    </Modal>
  );
}
