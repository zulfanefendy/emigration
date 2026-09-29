"use client";

import { Pencil, Power, PowerOff, Save, Search, UserPlus } from "lucide-react";
import { startTransition, useActionState, useEffect, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, idPesanField } from "@/components/ui/field";
import { Checkbox, Input, Select } from "@/components/ui/input";
import { Modal, useKonfirmasi } from "@/components/ui/modal";
import { Table, TableKosong, Td, Th, THead, Tr } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { LABEL_ROLE, ROLE, type Role } from "@/lib/auth/role";
import { simpanPegawai, ubahStatusPegawai } from "./actions";

export type BarisPegawai = {
  idPegawai: string;
  nip: string;
  namaLengkap: string;
  jabatan: string | null;
  noWhatsapp: string | null;
  email: string;
  isActive: boolean;
  roles: Role[];
};

const KETERANGAN_ROLE: Record<Role, string> = {
  ADMIN: "Semua menu, termasuk kelola pegawai.",
  VERIFIKATOR: "Memanggil antrean dan memverifikasi berkas CPMI di loket.",
  INSTRUKTUR: "Mengajar materi OPP yang ditugaskan.",
  PENGELOLA_KELAS: "Menyusun kegiatan OPP, kurikulum, dokumen, dan presensi.",
  PENANGGUNG_JAWAB: "Menyetujui kegiatan OPP dan dokumennya.",
};

type Props = { pegawai: BarisPegawai[]; idPegawaiLogin: string };

export function DaftarPegawai({ pegawai, idPegawaiLogin }: Props) {
  const [cari, setCari] = useState("");
  const [filterRole, setFilterRole] = useState<Role | "">("");
  const [sasaran, setSasaran] = useState<BarisPegawai | "baru" | null>(null);
  const [memproses, mulai] = useTransition();
  const { konfirmasi, elemenKonfirmasi } = useKonfirmasi();

  const kata = cari.trim().toLowerCase();
  const tampil = pegawai.filter(
    (p) =>
      (!filterRole || p.roles.includes(filterRole)) &&
      (!kata || p.namaLengkap.toLowerCase().includes(kata) || p.nip.includes(kata) || p.email.includes(kata)),
  );

  async function ubahStatus(p: BarisPegawai) {
    if (p.isActive) {
      const ya = await konfirmasi({
        judul: `Nonaktifkan ${p.namaLengkap}?`,
        pesan: "Pegawai tidak bisa login lagi sampai diaktifkan kembali. Riwayat verifikasi dan kegiatannya tetap tersimpan.",
        labelYa: "Nonaktifkan",
        bahaya: true,
      });
      if (!ya) return;
    }
    mulai(async () => {
      const hasil = await ubahStatusPegawai(p.idPegawai, !p.isActive);
      if (hasil.sukses) toast.sukses(hasil.pesan ?? "Tersimpan");
      else toast.gagal(hasil.pesan ?? "Gagal menyimpan");
    });
  }

  return (
    <Card>
      <CardHeader
        judul={`${pegawai.filter((p) => p.isActive).length} pegawai aktif`}
        deskripsi={`dari ${pegawai.length} akun terdaftar`}
        aksi={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
              <Input
                type="search"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari nama, NIP, email"
                aria-label="Cari pegawai"
                className="w-56 pl-9"
              />
            </div>
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as Role | "")}
              aria-label="Filter role"
              className="w-44"
            >
              <option value="">Semua role</option>
              {ROLE.map((r) => (
                <option key={r} value={r}>
                  {LABEL_ROLE[r]}
                </option>
              ))}
            </Select>
            <Button ikon={<UserPlus />} onClick={() => setSasaran("baru")}>
              Tambah Pegawai
            </Button>
          </>
        }
      />
      <Table>
        <THead>
          <tr>
            <Th>Pegawai</Th>
            <Th>Kontak</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th className="text-right">Aksi</Th>
          </tr>
        </THead>
        <tbody>
          {tampil.length === 0 ? (
            <TableKosong kolom={5}>{kata || filterRole ? "Tidak ada pegawai yang cocok." : "Belum ada pegawai."}</TableKosong>
          ) : (
            tampil.map((p) => {
              const diriSendiri = p.idPegawai === idPegawaiLogin;
              return (
                <Tr key={p.idPegawai} className={p.isActive ? undefined : "text-fg-muted"}>
                  <Td>
                    <p className="font-medium">
                      {p.namaLengkap}
                      {diriSendiri && <span className="ml-1.5 text-xs font-normal text-fg-muted">(Anda)</span>}
                    </p>
                    <p className="font-mono text-xs text-fg-muted">{p.nip}</p>
                    {p.jabatan && <p className="text-xs text-fg-muted">{p.jabatan}</p>}
                  </Td>
                  <Td className="text-sm">
                    <p>{p.email}</p>
                    {p.noWhatsapp && <p className="text-xs text-fg-muted">+{p.noWhatsapp}</p>}
                  </Td>
                  <Td>
                    <div className="flex max-w-64 flex-wrap gap-1">
                      {p.roles.length === 0 ? (
                        <Badge nada="peringatan">Tanpa role</Badge>
                      ) : (
                        p.roles.map((r) => (
                          <Badge key={r} nada={r === "ADMIN" ? "aksen" : "brand"}>
                            {LABEL_ROLE[r]}
                          </Badge>
                        ))
                      )}
                    </div>
                  </Td>
                  <Td>{p.isActive ? <Badge nada="sukses">Aktif</Badge> : <Badge>Nonaktif</Badge>}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button varian="ghost" ukuran="sm" ikon={<Pencil />} onClick={() => setSasaran(p)}>
                        Ubah
                      </Button>
                      {!diriSendiri && (
                        <Button
                          varian="ghost"
                          ukuran="sm"
                          ikon={p.isActive ? <PowerOff /> : <Power />}
                          disabled={memproses}
                          onClick={() => ubahStatus(p)}
                        >
                          {p.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Table>

      {sasaran && (
        <ModalPegawai
          pegawai={sasaran === "baru" ? null : sasaran}
          diriSendiri={sasaran !== "baru" && sasaran.idPegawai === idPegawaiLogin}
          onTutup={() => setSasaran(null)}
        />
      )}
      {elemenKonfirmasi}
    </Card>
  );
}

type PropsModal = { pegawai: BarisPegawai | null; diriSendiri: boolean; onTutup: () => void };

function ModalPegawai({ pegawai, diriSendiri, onTutup }: PropsModal) {
  const [state, action, pending] = useActionState(simpanPegawai, undefined);
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
      ukuran="lg"
      judul={pegawai ? "Ubah Pegawai" : "Tambah Pegawai"}
      deskripsi={pegawai ? pegawai.namaLengkap : "Pegawai login memakai email atau NIP dan password di bawah."}
      footer={
        <>
          <Button varian="outline" onClick={onTutup}>
            Batal
          </Button>
          <Button type="submit" form="form-pegawai" memuat={pending} ikon={<Save />}>
            Simpan
          </Button>
        </>
      }
    >
      <form
        id="form-pegawai"
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
        {pegawai && <input type="hidden" name="idPegawai" value={pegawai.idPegawai} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="namaLengkap" label="Nama Lengkap" wajib error={e?.namaLengkap} className="sm:col-span-2">
            <Input
              id="namaLengkap"
              name="namaLengkap"
              defaultValue={pegawai?.namaLengkap}
              maxLength={150}
              aria-invalid={!!e?.namaLengkap || undefined}
              aria-describedby={idPesanField("namaLengkap")}
            />
          </Field>
          <Field htmlFor="nip" label="NIP" wajib error={e?.nip} hint="18 digit angka">
            <Input
              id="nip"
              name="nip"
              inputMode="numeric"
              defaultValue={pegawai?.nip}
              maxLength={18}
              className="font-mono"
              aria-invalid={!!e?.nip || undefined}
              aria-describedby={idPesanField("nip")}
            />
          </Field>
          <Field htmlFor="jabatan" label="Jabatan" error={e?.jabatan}>
            <Input
              id="jabatan"
              name="jabatan"
              defaultValue={pegawai?.jabatan ?? ""}
              maxLength={100}
              aria-invalid={!!e?.jabatan || undefined}
              aria-describedby={idPesanField("jabatan")}
            />
          </Field>
          <Field htmlFor="email" label="Email" wajib error={e?.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="off"
              defaultValue={pegawai?.email}
              maxLength={100}
              aria-invalid={!!e?.email || undefined}
              aria-describedby={idPesanField("email")}
            />
          </Field>
          <Field htmlFor="noWhatsapp" label="No. WhatsApp" error={e?.noWhatsapp} hint="Contoh: 081234567890">
            <Input
              id="noWhatsapp"
              name="noWhatsapp"
              type="tel"
              inputMode="tel"
              defaultValue={pegawai?.noWhatsapp?.replace(/^62/, "0") ?? ""}
              aria-invalid={!!e?.noWhatsapp || undefined}
              aria-describedby={idPesanField("noWhatsapp")}
            />
          </Field>
          <Field
            htmlFor="password"
            label={pegawai ? "Password Baru" : "Password"}
            wajib={!pegawai}
            error={e?.password}
            hint={pegawai ? "Kosongkan bila tidak ingin mengganti password." : "Minimal 8 karakter."}
            className="sm:col-span-2"
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!e?.password || undefined}
              aria-describedby={idPesanField("password")}
            />
          </Field>
        </div>

        <fieldset aria-describedby={idPesanField("roles")}>
          <legend className="text-sm font-semibold text-fg">
            Role<span className="ml-0.5 text-danger" aria-hidden>*</span>
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {ROLE.map((r) => {
              const kunci = diriSendiri && r === "ADMIN";
              return (
                <label
                  key={r}
                  className="flex cursor-pointer gap-3 rounded-lg border border-border p-3 has-checked:border-brand-text/60 has-checked:bg-brand-soft/50"
                >
                  <Checkbox name="roles" value={r} defaultChecked={pegawai?.roles.includes(r)} disabled={kunci} className="mt-0.5" />
                  {/* Checkbox disabled tidak ikut terkirim, jadi role Admin milik sendiri dikirim lewat input tersembunyi */}
                  {kunci && <input type="hidden" name="roles" value={r} />}
                  <span className="text-sm">
                    <span className="font-semibold text-fg">{LABEL_ROLE[r]}</span>
                    <span className="block text-xs text-fg-muted">
                      {kunci ? "Role Admin milik sendiri tidak bisa dicabut." : KETERANGAN_ROLE[r]}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {e?.roles && (
            <p id={idPesanField("roles")} className="mt-1.5 text-sm font-medium text-danger">
              {e.roles[0]}
            </p>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}
