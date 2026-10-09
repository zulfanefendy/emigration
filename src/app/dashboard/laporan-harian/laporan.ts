import "server-only";
import { LABEL_SKEMA } from "@/app/(publik)/pendaftaran/pilihan";
import { prisma } from "@/lib/prisma";
import { formatTanggal, formatWaktu, keTanggalDb } from "@/lib/tanggal";

// "Generate & Kirim WA Laporan Harian" (Flow Chart PM bagian 5): rekap loket
// verifikasi dan kegiatan OPP pada satu tanggal, dalam format teks WhatsApp.

export type RekapHarian = {
  loket: { terdaftar: number; selesai: number; revisi: number; tidakHadir: number; belum: number };
  kegiatan: {
    kodeKegiatan: string;
    skema: string;
    tempat: string;
    peserta: number;
    hadir: number;
    toolkit: number;
    konsumsi: number;
    final: boolean;
  }[];
};

export async function rekapHarian(tanggal: string): Promise<RekapHarian> {
  const tgl = keTanggalDb(tanggal);
  const [antrian, kegiatan] = await Promise.all([
    prisma.antrian.findMany({
      where: { tanggalAntrian: tgl },
      select: {
        statusAntrian: true,
        cpmi: { select: { verifikasi: { orderBy: { createdAt: "desc" }, take: 1, select: { statusVerifikasi: true } } } },
      },
    }),
    prisma.kegiatanOpp.findMany({
      where: { tanggalPelaksanaan: tgl },
      orderBy: { kodeKegiatan: "asc" },
      select: {
        kodeKegiatan: true,
        skemaOpp: true,
        tempatOpp: true,
        isCpmiFinal: true,
        _count: { select: { peserta: true } },
        presensi: { select: { terimaToolkit: true, terimaKonsumsi: true } },
      },
    }),
  ]);

  const loket = { terdaftar: antrian.length, selesai: 0, revisi: 0, tidakHadir: 0, belum: 0 };
  for (const a of antrian) {
    if (a.statusAntrian === "SELESAI") loket.selesai++;
    else if (a.statusAntrian === "BATAL") loket.tidakHadir++;
    else if (a.cpmi.verifikasi[0]?.statusVerifikasi === "PERLU_REVISI") loket.revisi++;
    else loket.belum++;
  }

  return {
    loket,
    kegiatan: kegiatan.map((k) => ({
      kodeKegiatan: k.kodeKegiatan,
      skema: LABEL_SKEMA[k.skemaOpp],
      tempat: k.tempatOpp,
      peserta: k._count.peserta,
      hadir: k.presensi.length,
      toolkit: k.presensi.filter((p) => p.terimaToolkit).length,
      konsumsi: k.presensi.filter((p) => p.terimaKonsumsi).length,
      final: k.isCpmiFinal,
    })),
  };
}

/** Teks siap kirim; *tebal* dan _miring_ mengikuti format WhatsApp. */
export function teksLaporan(tanggal: string, r: RekapHarian): string {
  const baris = [
    "*LAPORAN HARIAN BP3MI LAMPUNG*",
    formatTanggal(keTanggalDb(tanggal)),
    "",
    "*Verifikasi Loket*",
    `- Antrean terdaftar: ${r.loket.terdaftar}`,
    `- Selesai diverifikasi: ${r.loket.selesai}`,
    `- Perlu perbaikan berkas: ${r.loket.revisi}`,
    `- Tidak hadir: ${r.loket.tidakHadir}`,
    `- Belum diproses: ${r.loket.belum}`,
    "",
    "*Kegiatan OPP*",
  ];
  if (r.kegiatan.length === 0) baris.push("Tidak ada kegiatan OPP.");
  r.kegiatan.forEach((k, i) => {
    baris.push(
      `${i + 1}. ${k.kodeKegiatan} · ${k.skema} · ${k.tempat}`,
      `   Peserta ${k.peserta} · Hadir ${k.hadir} · Tidak hadir ${k.peserta - k.hadir}`,
      `   Toolkit ${k.toolkit} · Konsumsi ${k.konsumsi}`,
      `   Status data: ${k.final ? "FINAL" : "belum final"}`,
    );
  });
  baris.push("", `_Dibuat ${formatWaktu(new Date())} dari Sistem Verifikasi Digital CPMI & OPP._`);
  return baris.join("\n");
}
