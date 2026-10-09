import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/lib/auth/role";
import { prisma } from "@/lib/prisma";
import { hariIniWib, dariTanggalDb } from "@/lib/tanggal";

// Data kegiatan OPP yang dipakai halaman detail dan generator dokumen .docx.

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const pegawaiRingkas = { select: { idPegawai: true, namaLengkap: true, nip: true, jabatan: true } } as const;

const isiKegiatan = {
  pengelolaKelas: pegawaiRingkas,
  penanggungJawab: pegawaiRingkas,
  kurikulum: {
    orderBy: [{ jamMulai: "asc" }, { idKurikulum: "asc" }],
    include: {
      materi: { select: { idMateri: true, kodeMateri: true, judulMateri: true, durasiJamPelajaran: true } },
      instruktur: pegawaiRingkas,
    },
  },
  peserta: {
    orderBy: { cpmi: { namaLengkap: "asc" } },
    include: {
      cpmi: {
        select: {
          idCpmi: true,
          namaLengkap: true,
          noPaspor: true,
          jenisKelamin: true,
          negaraPenempatan: true,
          jenisPekerjaan: true,
          kabupatenKota: true,
        },
      },
    },
  },
  // Tanpa kolom tanda tangan (base64) agar halaman tetap ringan; gambar diambil lewat route ttd.
  presensi: { select: { idCpmi: true, waktuScan: true, terimaToolkit: true, terimaKonsumsi: true } },
  _count: { select: { presensi: true } },
} satisfies Prisma.KegiatanOppInclude;

export type KegiatanLengkap = Prisma.KegiatanOppGetPayload<{ include: typeof isiKegiatan }>;

export const ambilKegiatan = cache(async (id: string): Promise<KegiatanLengkap | null> => {
  if (!UUID.test(id)) return null;
  return prisma.kegiatanOpp.findUnique({ where: { idKegiatanOpp: id }, include: isiKegiatan });
});

/** Pegawai aktif yang punya role tertentu, untuk pilihan tim dan instruktur. */
export async function pegawaiDenganRole(role: Role) {
  return prisma.pegawai.findMany({
    where: { isActive: true, roles: { some: { role: { namaRole: role } } } },
    orderBy: { namaLengkap: "asc" },
    select: { idPegawai: true, namaLengkap: true, nip: true },
  });
}

export type TahapKegiatan = "final" | "selesai" | "hari-ini" | "akan-datang";

export function tahapKegiatan(k: { tanggalPelaksanaan: Date; isCpmiFinal: boolean }): TahapKegiatan {
  if (k.isCpmiFinal) return "final";
  const tanggal = dariTanggalDb(k.tanggalPelaksanaan);
  const hariIni = hariIniWib();
  if (tanggal < hariIni) return "selesai";
  return tanggal === hariIni ? "hari-ini" : "akan-datang";
}
