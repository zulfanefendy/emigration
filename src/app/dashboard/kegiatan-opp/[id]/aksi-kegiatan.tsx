"use client";

import { Pencil, QrCode, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { useKonfirmasi } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { hapusKegiatan } from "../actions";
import { ModalKegiatan, type IsianKegiatan, type OpsiPegawai } from "../form-kegiatan";

type Props = {
  kegiatan: IsianKegiatan;
  bolehUbah: boolean;
  bolehHapus: boolean;
  hariIni: string;
  pengelola: OpsiPegawai[];
  penanggungJawab: OpsiPegawai[];
};

export function AksiKegiatan({ kegiatan, bolehUbah, bolehHapus, hariIni, pengelola, penanggungJawab }: Props) {
  const [ubah, setUbah] = useState(false);
  const [memproses, mulai] = useTransition();
  const { konfirmasi, elemenKonfirmasi } = useKonfirmasi();

  async function hapus() {
    const ya = await konfirmasi({
      judul: `Hapus ${kegiatan.kodeKegiatan}?`,
      pesan: "Kurikulum dan daftar peserta kegiatan ini ikut terhapus. CPMI bisa didaftarkan ke kegiatan lain.",
      labelYa: "Hapus",
    });
    if (!ya) return;
    mulai(async () => {
      const hasil = await hapusKegiatan(kegiatan.idKegiatanOpp);
      // Berhasil = diarahkan ke daftar; hanya kegagalan yang kembali ke sini.
      if (hasil && !hasil.sukses) toast.gagal(hasil.pesan);
    });
  }

  return (
    <>
      <ButtonLink href={`/dashboard/kegiatan-opp/${kegiatan.idKegiatanOpp}/qr`} ikon={<QrCode aria-hidden />}>
        QR Presensi
      </ButtonLink>
      {bolehUbah && (
        <Button varian="outline" ikon={<Pencil />} onClick={() => setUbah(true)}>
          Ubah
        </Button>
      )}
      {bolehUbah && bolehHapus && (
        <Button varian="ghost" ikon={<Trash2 />} memuat={memproses} onClick={hapus} aria-label="Hapus kegiatan">
          Hapus
        </Button>
      )}
      {ubah && (
        <ModalKegiatan
          kegiatan={kegiatan}
          pengelola={pengelola}
          penanggungJawab={penanggungJawab}
          hariIni={hariIni}
          onTutup={() => setUbah(false)}
        />
      )}
      {elemenKonfirmasi}
    </>
  );
}
