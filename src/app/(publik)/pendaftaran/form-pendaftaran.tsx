"use client";

import { Send } from "lucide-react";
import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, idPesanField } from "@/components/ui/field";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { daftarCpmi, type FieldCpmi } from "./actions";
import { LABEL_SEKTOR, LABEL_SKEMA, PENDIDIKAN, SARAN_KABUPATEN_LAMPUNG, SARAN_NEGARA } from "./pilihan";

type PropsForm = { noPaspor: string; hariIni: string; batasJadwal: string };

export function FormPendaftaran({ noPaspor, hariIni, batasJadwal }: PropsForm) {
  const [state, action, pending] = useActionState(daftarCpmi, undefined);
  const refForm = useRef<HTMLFormElement>(null);
  const e = state?.errors;

  // Setelah validasi gagal, bawa pengguna ke isian pertama yang salah.
  useEffect(() => {
    if (state?.errors) refForm.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  }, [state]);

  /** Props bersama untuk input: id = name, plus atribut aksesibilitas error. */
  const isian = (nama: FieldCpmi) => ({
    id: nama,
    name: nama,
    "aria-invalid": !!e?.[nama] || undefined,
    "aria-describedby": idPesanField(nama),
  });

  return (
    <form
      ref={refForm}
      onSubmit={(ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-6"
      noValidate
    >
      <input type="hidden" name="noPaspor" value={noPaspor} />
      {state?.pesan && <Alert jenis="gagal">{state.pesan}</Alert>}
      {e?.noPaspor && <Alert jenis="gagal">{e.noPaspor[0]}</Alert>}

      <Bagian judul="Data Diri" deskripsi="Isi sesuai paspor dan KTP.">
        <Field htmlFor="noPasporTampil" label="Nomor Paspor" hint="Sudah dicek dan valid.">
          <Input id="noPasporTampil" value={noPaspor} readOnly className="font-mono tracking-widest" />
        </Field>
        <Field htmlFor="nik" label="NIK" error={e?.nik} hint="16 angka sesuai KTP. Boleh dikosongkan.">
          <Input {...isian("nik")} inputMode="numeric" maxLength={16} autoComplete="off" />
        </Field>
        <Field htmlFor="namaLengkap" label="Nama Lengkap" wajib error={e?.namaLengkap} hint="Sesuai paspor." className="sm:col-span-2">
          <Input {...isian("namaLengkap")} maxLength={150} autoComplete="name" className="uppercase" />
        </Field>
        <Field htmlFor="tempatLahir" label="Tempat Lahir" wajib error={e?.tempatLahir}>
          <Input {...isian("tempatLahir")} maxLength={100} />
        </Field>
        <Field htmlFor="tanggalLahir" label="Tanggal Lahir" wajib error={e?.tanggalLahir}>
          <Input {...isian("tanggalLahir")} type="date" max={hariIni} />
        </Field>
        <Field htmlFor="jenisKelamin" label="Jenis Kelamin" wajib error={e?.jenisKelamin}>
          <Select {...isian("jenisKelamin")} defaultValue="">
            <option value="" disabled>
              Pilih
            </option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </Select>
        </Field>
        <Field htmlFor="noWhatsapp" label="Nomor WhatsApp" wajib error={e?.noWhatsapp} hint="Contoh: 081234567890">
          <Input {...isian("noWhatsapp")} type="tel" inputMode="tel" maxLength={20} autoComplete="tel" />
        </Field>
        <Field htmlFor="pendidikanTerakhir" label="Pendidikan Terakhir" wajib error={e?.pendidikanTerakhir}>
          <Select {...isian("pendidikanTerakhir")} defaultValue="">
            <option value="" disabled>
              Pilih
            </option>
            {PENDIDIKAN.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>
        <Field htmlFor="asalSekolahInstansi" label="Asal Sekolah / Instansi" wajib error={e?.asalSekolahInstansi}>
          <Input {...isian("asalSekolahInstansi")} maxLength={150} />
        </Field>
      </Bagian>

      <Bagian judul="Alamat">
        <Field htmlFor="alamatLengkap" label="Alamat Lengkap" wajib error={e?.alamatLengkap} hint="Jalan, RT/RW, desa/kelurahan, kecamatan." className="sm:col-span-2">
          <Textarea {...isian("alamatLengkap")} rows={2} maxLength={1000} autoComplete="street-address" />
        </Field>
        <Field htmlFor="provinsi" label="Provinsi" wajib error={e?.provinsi}>
          <Input {...isian("provinsi")} defaultValue="Lampung" maxLength={100} />
        </Field>
        <Field htmlFor="kabupatenKota" label="Kabupaten / Kota" wajib error={e?.kabupatenKota}>
          <Input {...isian("kabupatenKota")} list="saran-kabupaten" maxLength={100} />
          <datalist id="saran-kabupaten">
            {SARAN_KABUPATEN_LAMPUNG.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </Field>
      </Bagian>

      <Bagian judul="Rencana Penempatan" deskripsi="Sesuai perjanjian kerja.">
        <Field htmlFor="skemaPendaftaran" label="Skema Pendaftaran" wajib error={e?.skemaPendaftaran}>
          <Select {...isian("skemaPendaftaran")} defaultValue="">
            <option value="" disabled>
              Pilih
            </option>
            {Object.entries(LABEL_SKEMA).map(([nilai, label]) => (
              <option key={nilai} value={nilai}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field htmlFor="negaraPenempatan" label="Negara Penempatan" wajib error={e?.negaraPenempatan}>
          <Input {...isian("negaraPenempatan")} list="saran-negara" maxLength={100} />
          <datalist id="saran-negara">
            {SARAN_NEGARA.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </Field>
        <Field htmlFor="sektor" label="Sektor" wajib error={e?.sektor}>
          <Select {...isian("sektor")} defaultValue="">
            <option value="" disabled>
              Pilih
            </option>
            {Object.entries(LABEL_SEKTOR).map(([nilai, label]) => (
              <option key={nilai} value={nilai}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field htmlFor="jenisPekerjaan" label="Jenis Pekerjaan" wajib error={e?.jenisPekerjaan} hint="Contoh: Caregiver, Operator Pabrik">
          <Input {...isian("jenisPekerjaan")} maxLength={150} />
        </Field>
        <Field htmlFor="namaPenggunaJasa" label="Nama Pengguna Jasa" wajib error={e?.namaPenggunaJasa} hint="Nama majikan atau perusahaan.">
          <Input {...isian("namaPenggunaJasa")} maxLength={150} />
        </Field>
        <Field htmlFor="gaji" label="Gaji per Bulan" wajib error={e?.gaji} hint="Dalam mata uang negara penempatan, contoh: 20.000">
          <Input {...isian("gaji")} inputMode="decimal" maxLength={20} />
        </Field>
        <Field htmlFor="alamatPenggunaJasa" label="Alamat Pengguna Jasa" wajib error={e?.alamatPenggunaJasa} className="sm:col-span-2">
          <Textarea {...isian("alamatPenggunaJasa")} rows={2} maxLength={1000} />
        </Field>
      </Bagian>

      <Bagian judul="Jadwal Verifikasi di Loket" deskripsi="Pilih hari kedatangan Anda ke kantor BP3MI Lampung.">
        <Field
          htmlFor="tanggalRencanaVerifikasi"
          label="Tanggal Verifikasi"
          wajib
          error={e?.tanggalRencanaVerifikasi}
          hint="Senin sampai Jumat. Nomor antrean diberikan untuk tanggal ini."
        >
          <Input {...isian("tanggalRencanaVerifikasi")} type="date" min={hariIni} max={batasJadwal} />
        </Field>
      </Bagian>

      <Card className="p-5">
        <label htmlFor="setuju" className="flex cursor-pointer items-start gap-3 text-sm text-fg">
          <Checkbox {...isian("setuju")} value="ya" className="mt-0.5" />
          <span>
            Saya menyatakan data yang saya isi benar dan sesuai dokumen asli. Saya akan membawa berkas fisik saat
            verifikasi di loket.
          </span>
        </label>
        {e?.setuju && (
          <p id={idPesanField("setuju")} className="mt-2 text-sm font-medium text-danger">
            {e.setuju[0]}
          </p>
        )}
      </Card>

      <div className="flex justify-end">
        <Button type="submit" ukuran="lg" memuat={pending} ikon={<Send />}>
          Daftar &amp; Ambil Nomor Antrean
        </Button>
      </div>
    </form>
  );
}

function Bagian({ judul, deskripsi, children }: { judul: string; deskripsi?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader judul={judul} deskripsi={deskripsi} />
      <CardBody className="grid gap-4 sm:grid-cols-2">{children}</CardBody>
    </Card>
  );
}

