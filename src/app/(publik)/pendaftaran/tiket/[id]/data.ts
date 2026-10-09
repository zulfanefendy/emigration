import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Data tiket antrean. ID antrean (UUID acak) berfungsi sebagai kunci akses,
 * jadi tiket hanya bisa dibuka oleh yang memegang tautannya.
 */
export const ambilTiket = cache(async (idAntrian: string) => {
  if (!UUID.test(idAntrian)) return null;
  return prisma.antrian.findUnique({
    where: { idAntrian },
    select: {
      noAntrian: true,
      tanggalAntrian: true,
      statusAntrian: true,
      createdAt: true,
      cpmi: {
        select: {
          namaLengkap: true,
          noPaspor: true,
          skemaPendaftaran: true,
          negaraPenempatan: true,
          verifikasi: { orderBy: { createdAt: "desc" }, take: 1, select: { statusVerifikasi: true } },
        },
      },
    },
  });
});

export type DataTiket = NonNullable<Awaited<ReturnType<typeof ambilTiket>>>;

/** A1234567 -> A1****67, cukup untuk dikenali tanpa membuka nomor lengkap. */
export function samarkanPaspor(noPaspor: string): string {
  return noPaspor.slice(0, 2) + "*".repeat(Math.max(0, noPaspor.length - 4)) + noPaspor.slice(-2);
}

export const BAWA_SAAT_VERIFIKASI = [
  "Tiket antrean ini (cetak atau tunjukkan di HP)",
  "Paspor asli",
  "KTP dan Kartu Keluarga asli",
  "Perjanjian kerja dan dokumen penempatan lainnya",
];
