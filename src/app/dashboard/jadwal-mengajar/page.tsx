import type { Metadata } from "next";
import Link from "next/link";
import { Clock, FileDown, MapPin, MessageCircle, Users } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { kelasTombol } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { LABEL_SKEMA_OPP } from "@/app/(publik)/pendaftaran/pilihan";
import { wajibRole } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";
import { prisma } from "@/lib/prisma";
import { dariJamDb, dariTanggalDb, formatTanggal, hariIniWib, keTanggalDb } from "@/lib/tanggal";
import { buatLinkWa } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Jadwal Mengajar" };

type Tampilan = "mendatang" | "riwayat";

/** Batas riwayat yang ditampilkan; cukup untuk beberapa bulan terakhir. */
const BATAS_RIWAYAT = 50;

export default async function HalamanJadwalMengajar({ searchParams }: PageProps<"/dashboard/jadwal-mengajar">) {
  const pegawai = await wajibRole("INSTRUKTUR");
  const tampilan: Tampilan = (await searchParams).tampil === "riwayat" ? "riwayat" : "mendatang";
  const hariIni = keTanggalDb(hariIniWib());

  const mengajar = { kurikulum: { some: { idInstruktur: pegawai.idPegawai } } };
  const [kegiatan, jumlahMendatang] = await Promise.all([
    prisma.kegiatanOpp.findMany({
      where: { ...mengajar, tanggalPelaksanaan: tampilan === "mendatang" ? { gte: hariIni } : { lt: hariIni } },
      orderBy: [{ tanggalPelaksanaan: tampilan === "mendatang" ? "asc" : "desc" }, { kodeKegiatan: "asc" }],
      take: tampilan === "riwayat" ? BATAS_RIWAYAT : undefined,
      select: {
        idKegiatanOpp: true,
        kodeKegiatan: true,
        tanggalPelaksanaan: true,
        skemaOpp: true,
        tempatOpp: true,
        noSptInstruktur: true,
        pengelolaKelas: { select: { namaLengkap: true, noWhatsapp: true } },
        _count: { select: { peserta: true } },
        // Seluruh rundown kegiatan, supaya instruktur tahu sesi sebelum dan sesudahnya.
        kurikulum: {
          orderBy: [{ jamMulai: "asc" }, { idKurikulum: "asc" }],
          select: {
            idKurikulum: true,
            idInstruktur: true,
            jamMulai: true,
            jamSelesai: true,
            materi: { select: { judulMateri: true, durasiJamPelajaran: true } },
            instruktur: { select: { namaLengkap: true } },
          },
        },
      },
    }),
    prisma.kegiatanOpp.count({ where: { ...mengajar, tanggalPelaksanaan: { gte: hariIni } } }),
  ]);

  const sesiSaya = kegiatan.flatMap((k) => k.kurikulum.filter((s) => s.idInstruktur === pegawai.idPegawai));
  const totalJp = sesiSaya.reduce((n, s) => n + s.materi.durasiJamPelajaran, 0);
  const hariIniIso = hariIniWib();

  return (
    <>
      <PageHeader
        judul="Jadwal Mengajar"
        deskripsi={
          tampilan === "mendatang"
            ? `${sesiSaya.length} sesi mendatang · ${totalJp} JP`
            : `${sesiSaya.length} sesi yang sudah terlaksana${kegiatan.length === BATAS_RIWAYAT ? " (terbaru)" : ""}`
        }
      />

      <nav aria-label="Tampilan jadwal" className="mb-6 flex gap-1.5">
        {(
          [
            ["mendatang", `Mendatang (${jumlahMendatang})`, "/dashboard/jadwal-mengajar"],
            ["riwayat", "Riwayat", "/dashboard/jadwal-mengajar?tampil=riwayat"],
          ] as const
        ).map(([kunci, label, href]) => (
          <Link
            key={kunci}
            href={href}
            aria-current={tampilan === kunci ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none",
              tampilan === kunci ? "bg-brand text-brand-fg" : "text-fg-muted hover:bg-surface-muted",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {kegiatan.length === 0 ? (
        <Alert jenis="info" judul={tampilan === "mendatang" ? "Belum ada jadwal mengajar" : "Belum ada riwayat mengajar"}>
          {tampilan === "mendatang"
            ? "Jadwal akan muncul di sini setelah Pengelola Kelas menugaskan Anda di kurikulum kegiatan OPP."
            : "Kegiatan OPP yang sudah Anda ajar akan tercatat di sini."}
        </Alert>
      ) : (
        <div className="flex flex-col gap-4">
          {kegiatan.map((k) => {
            const hariH = dariTanggalDb(k.tanggalPelaksanaan) === hariIniIso;
            const pengelola = k.pengelolaKelas;
            return (
              <Card key={k.idKegiatanOpp} className={cn(hariH && "border-aksen")}>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
                      {formatTanggal(k.tanggalPelaksanaan)}
                      {hariH && <Badge nada="aksen">Hari Ini</Badge>}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
                      <span className="font-mono">{k.kodeKegiatan}</span>
                      <span>OPP {LABEL_SKEMA_OPP[k.skemaOpp]}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden />
                        {k.tempatOpp}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" aria-hidden />
                        {k._count.peserta} peserta
                      </span>
                    </p>
                  </div>
                  {k.noSptInstruktur && (
                    <a
                      href={`/dashboard/kegiatan-opp/${k.idKegiatanOpp}/dokumen/spt-instruktur`}
                      download
                      className={kelasTombol("secondary", "sm")}
                    >
                      <FileDown aria-hidden />
                      SPT
                    </a>
                  )}
                </div>

                <CardBody>
                  <ol className="flex flex-col gap-1">
                    {k.kurikulum.map((s) => {
                      const milikSaya = s.idInstruktur === pegawai.idPegawai;
                      return (
                        <li
                          key={s.idKurikulum}
                          className={cn(
                            "flex flex-wrap items-baseline gap-x-4 gap-y-0.5 rounded-lg px-3 py-2 text-sm",
                            milikSaya ? "bg-brand-soft" : "text-fg-muted",
                          )}
                        >
                          <span className={cn("inline-flex w-28 items-center gap-1.5 font-mono", milikSaya && "font-semibold text-brand-text")}>
                            <Clock className="size-3.5" aria-hidden />
                            {s.jamMulai && s.jamSelesai ? `${dariJamDb(s.jamMulai)}–${dariJamDb(s.jamSelesai)}` : "—"}
                          </span>
                          <span className={cn("min-w-0 flex-1", milikSaya && "font-semibold text-fg")}>
                            {s.materi.judulMateri}
                            <span className="font-normal text-fg-muted"> · {s.materi.durasiJamPelajaran} JP</span>
                          </span>
                          <span className={cn("text-xs", milikSaya && "font-semibold text-brand-text")}>
                            {milikSaya ? "Anda" : s.instruktur.namaLengkap}
                          </span>
                        </li>
                      );
                    })}
                  </ol>

                  {pengelola && (
                    <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-sm text-fg-muted">
                      Pengelola kelas: <span className="font-medium text-fg">{pengelola.namaLengkap}</span>
                      {pengelola.noWhatsapp && tampilan === "mendatang" && (
                        <a
                          href={buatLinkWa(`Halo ${pengelola.namaLengkap}, saya instruktur OPP ${k.kodeKegiatan} (${formatTanggal(k.tanggalPelaksanaan)}).`, pengelola.noWhatsapp)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-brand-text hover:underline"
                        >
                          <MessageCircle className="size-4" aria-hidden />
                          Hubungi
                        </a>
                      )}
                    </p>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
