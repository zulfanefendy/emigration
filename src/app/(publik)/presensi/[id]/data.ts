import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { dariTanggalDb, formatTanggal, hariIniWib } from "@/lib/tanggal";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ambilKegiatanPresensi = cache(async (id: string) => {
  if (!UUID.test(id)) return null;
  return prisma.kegiatanOpp.findUnique({
    where: { idKegiatanOpp: id },
    select: { idKegiatanOpp: true, kodeKegiatan: true, tanggalPelaksanaan: true, skemaOpp: true, tempatOpp: true, isCpmiFinal: true },
  });
});

/** null = presensi dibuka. Presensi hanya pada hari pelaksanaan dan sebelum data dikunci. */
export async function alasanTutup(id: string): Promise<string | null> {
  const k = await ambilKegiatanPresensi(id);
  if (!k) return "Kegiatan tidak ditemukan.";
  if (k.isCpmiFinal) return "Presensi kegiatan ini sudah ditutup.";
  const tanggal = dariTanggalDb(k.tanggalPelaksanaan);
  if (tanggal !== hariIniWib()) {
    return `Presensi hanya dibuka pada hari pelaksanaan, ${formatTanggal(k.tanggalPelaksanaan)}.`;
  }
  return null;
}
