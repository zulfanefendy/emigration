"use client";

import { Download, Plus, Save, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { BadgeStatusAntrian, BadgeStatusVerifikasi } from "@/components/status";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Field, idPesanField } from "@/components/ui/field";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { Modal, useKonfirmasi } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";

function Bagian({ judul, kode, children }: { judul: string; kode: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader judul={judul} deskripsi={<code className="text-xs">{kode}</code>} />
      <CardBody className="flex flex-col gap-4">{children}</CardBody>
    </Card>
  );
}

export function ContohKomponen() {
  const [modalBuka, setModalBuka] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const { konfirmasi, elemenKonfirmasi } = useKonfirmasi();

  async function simulasiSimpan() {
    setMenyimpan(true);
    await new Promise((r) => setTimeout(r, 1200));
    setMenyimpan(false);
    setModalBuka(false);
    toast.sukses("Kegiatan OPP tersimpan", { deskripsi: "Kode kegiatan OPP-2026-001" });
  }

  return (
    <div className="grid gap-6">
      <Bagian judul="Tombol" kode='<Button varian="primary" ikon={<Save />} memuat={pending}>'>
        <div className="flex flex-wrap gap-2">
          <Button ikon={<Save />}>Simpan</Button>
          <Button varian="secondary">Sekunder</Button>
          <Button varian="outline" ikon={<Download />}>
            Unduh LPJ
          </Button>
          <Button varian="ghost">Ghost</Button>
          <Button varian="aksen">Aksen</Button>
          <Button varian="danger" ikon={<Trash2 />}>
            Hapus
          </Button>
          <Button memuat>Memproses...</Button>
          <Button disabled>Nonaktif</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button ukuran="sm">Kecil</Button>
          <Button ukuran="md">Sedang</Button>
          <Button ukuran="lg">Besar</Button>
          <Button ukuran="icon" varian="outline" aria-label="Tambah">
            <Plus />
          </Button>
        </div>
      </Bagian>

      <Bagian judul="Form" kode='<Field htmlFor="x" label="..." error={state.errors?.x}><Input id="x" /></Field>'>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="uk-paspor" label="Nomor Paspor" wajib hint="1 huruf + 7 angka, contoh A1234567">
            <Input id="uk-paspor" placeholder="A1234567" aria-describedby={idPesanField("uk-paspor")} />
          </Field>
          <Field htmlFor="uk-nama" label="Nama Lengkap" wajib error="Nama lengkap wajib diisi.">
            <Input id="uk-nama" aria-invalid aria-describedby={idPesanField("uk-nama")} />
          </Field>
          <Field htmlFor="uk-skema" label="Skema Pendaftaran">
            <Select id="uk-skema" defaultValue="">
              <option value="" disabled>
                Pilih skema
              </option>
              <option>P TO P</option>
              <option>MANDIRI REGULER</option>
              <option>MANDIRI SSW</option>
            </Select>
          </Field>
          <Field htmlFor="uk-antrean" label="Nomor Antrean" hint="Diisi otomatis oleh sistem">
            <Input id="uk-antrean" readOnly value="A-017" />
          </Field>
          <Field htmlFor="uk-catatan" label="Catatan Verifikasi" className="sm:col-span-2">
            <Textarea id="uk-catatan" placeholder="Tuliskan berkas yang perlu diperbaiki..." />
          </Field>
          <label className="flex items-center gap-2.5 text-sm text-fg">
            <Checkbox defaultChecked /> Terima toolkit
          </label>
          <Field htmlFor="uk-nonaktif" label="Field nonaktif">
            <Input id="uk-nonaktif" disabled value="Tidak bisa diubah" />
          </Field>
        </div>
      </Bagian>

      <Bagian judul="Notifikasi (toast)" kode='toast.sukses("Judul", { deskripsi }) · kirimFlash("sukses", "...") di server action'>
        <div className="flex flex-wrap gap-2">
          <Button varian="outline" onClick={() => toast.sukses("Data berhasil disimpan")}>
            Sukses
          </Button>
          <Button varian="outline" onClick={() => toast.gagal("Gagal menyimpan data", { deskripsi: "Periksa koneksi lalu coba lagi." })}>
            Gagal
          </Button>
          <Button varian="outline" onClick={() => toast.peringatan("Kuota OPP hampir penuh", { deskripsi: "Tersisa 3 kursi." })}>
            Peringatan
          </Button>
          <Button varian="outline" onClick={() => toast.info("Antrean A-018 dipanggil")}>
            Info
          </Button>
        </div>
      </Bagian>

      <Bagian judul="Modal & konfirmasi" kode="<Modal buka onTutup judul footer> · await konfirmasi({ judul, bahaya })">
        <div className="flex flex-wrap gap-2">
          <Button ikon={<Plus />} onClick={() => setModalBuka(true)}>
            Buka modal form
          </Button>
          <Button
            varian="outline"
            onClick={async () => {
              if (await konfirmasi({ judul: "Kunci data peserta?", pesan: "Setelah dikunci, peserta OPP tidak bisa ditambah lagi.", labelYa: "Kunci data" })) {
                toast.sukses("Data peserta dikunci");
              }
            }}
          >
            Konfirmasi biasa
          </Button>
          <Button
            varian="danger"
            ikon={<Trash2 />}
            onClick={async () => {
              const ya = await konfirmasi({
                judul: "Hapus pegawai?",
                pesan: "Akun dan seluruh role pegawai ini akan dihapus permanen.",
                labelYa: "Hapus",
                bahaya: true,
              });
              if (ya) toast.sukses("Pegawai dihapus");
              else toast.info("Penghapusan dibatalkan");
            }}
          >
            Konfirmasi bahaya
          </Button>
        </div>
        {elemenKonfirmasi}
        <Modal
          buka={modalBuka}
          onTutup={() => !menyimpan && setModalBuka(false)}
          judul="Tambah Kegiatan OPP"
          deskripsi="Isi jadwal dan tempat pelaksanaan."
          tutupSaatKlikLuar={false}
          footer={
            <>
              <Button varian="outline" onClick={() => setModalBuka(false)} disabled={menyimpan}>
                Batal
              </Button>
              <Button ikon={<Save />} memuat={menyimpan} onClick={simulasiSimpan}>
                Simpan
              </Button>
            </>
          }
        >
          <div className="grid gap-4">
            <Field htmlFor="uk-m-tanggal" label="Tanggal Pelaksanaan" wajib>
              <Input id="uk-m-tanggal" type="date" />
            </Field>
            <Field htmlFor="uk-m-tempat" label="Tempat" wajib>
              <Input id="uk-m-tempat" placeholder="Aula BP3MI Lampung" />
            </Field>
          </div>
        </Modal>
      </Bagian>

      <Bagian judul="Alert (pesan di halaman)" kode='<Alert jenis="sukses|gagal|peringatan|info" judul="...">'>
        <Alert jenis="sukses" judul="Verifikasi selesai">Berkas CPMI telah dinyatakan lengkap.</Alert>
        <Alert jenis="gagal" judul="Paspor tidak valid">Nomor paspor harus 1 huruf diikuti 7 angka.</Alert>
        <Alert jenis="peringatan" judul="Ada verifikasi susulan">2 CPMI belum selesai diverifikasi.</Alert>
        <Alert jenis="info">Presensi dibuka pukul 08.00 WIB.</Alert>
      </Bagian>

      <Bagian judul="Badge & status" kode='<Badge nada="sukses"> · <BadgeStatusVerifikasi status={...} />'>
        <div className="flex flex-wrap gap-2">
          <Badge>Netral</Badge>
          <Badge nada="brand">Brand</Badge>
          <Badge nada="sukses">Sukses</Badge>
          <Badge nada="peringatan">Peringatan</Badge>
          <Badge nada="bahaya">Bahaya</Badge>
          <Badge nada="aksen">Aksen</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <BadgeStatusVerifikasi status="BELUM_DIVERIFIKASI" />
          <BadgeStatusVerifikasi status="SEDANG_DIVERIFIKASI" />
          <BadgeStatusVerifikasi status="PERLU_REVISI" />
          <BadgeStatusVerifikasi status="SUDAH_SELESAI" />
        </div>
        <div className="flex flex-wrap gap-2">
          <BadgeStatusAntrian status="MENUNGGU" />
          <BadgeStatusAntrian status="DIPANGGIL" />
          <BadgeStatusAntrian status="SELESAI" />
          <BadgeStatusAntrian status="BATAL" />
        </div>
      </Bagian>

      <Card>
        <CardHeader judul="Card dengan footer" deskripsi="CardHeader · CardBody · CardFooter" aksi={<Badge nada="brand">Contoh</Badge>} />
        <CardBody className="text-sm text-fg-muted">Konten kartu.</CardBody>
        <CardFooter>
          <Button varian="outline" ukuran="sm">
            Batal
          </Button>
          <Button ukuran="sm">Simpan</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
