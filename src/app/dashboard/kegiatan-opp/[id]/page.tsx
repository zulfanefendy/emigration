import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { LABEL_SKEMA, LABEL_SKEMA_OPP, MENIT_PER_JP, SKEMA_CPMI_OPP } from "@/app/(publik)/pendaftaran/pilihan";
import { wajibRole } from "@/lib/auth/dal";
import { punyaAkses } from "@/lib/auth/role";
import { prisma } from "@/lib/prisma";
import { dariJamDb, dariTanggalDb, formatJam, formatTanggal, formatWaktu, hariIniWib } from "@/lib/tanggal";
import { BadgeTahap } from "../badge-tahap";
import { ambilKegiatan, pegawaiDenganRole, tahapKegiatan } from "../data";
import { AksiKegiatan } from "./aksi-kegiatan";
import { BagianDokumen } from "./bagian-dokumen";
import { BagianFinalisasi } from "./bagian-finalisasi";
import { BagianKurikulum } from "./bagian-kurikulum";
import { BagianPeserta } from "./bagian-peserta";

export async function generateMetadata({ params }: PageProps<"/dashboard/kegiatan-opp/[id]">): Promise<Metadata> {
  const k = await ambilKegiatan((await params).id);
  return { title: k?.kodeKegiatan ?? "Kegiatan OPP" };
}

export default async function HalamanDetailKegiatan({ params }: PageProps<"/dashboard/kegiatan-opp/[id]">) {
  const pegawai = await wajibRole("PENGELOLA_KELAS", "PENANGGUNG_JAWAB");
  const k = await ambilKegiatan((await params).id);
  if (!k) notFound();

  const bolehUbah = punyaAkses(pegawai.roles, ["PENGELOLA_KELAS"]);
  // Setelah final, data kegiatan hanya bisa dibaca (kecuali nomor dokumen dan arsip SRIKANDI).
  const bolehUbahData = bolehUbah && !k.isCpmiFinal;
  const tahap = tahapKegiatan(k);
  const tanggal = dariTanggalDb(k.tanggalPelaksanaan);

  const [pengelola, penanggungJawab, instruktur, materi, calonPeserta] = await Promise.all([
    bolehUbah ? pegawaiDenganRole("PENGELOLA_KELAS") : [],
    bolehUbah ? pegawaiDenganRole("PENANGGUNG_JAWAB") : [],
    bolehUbah ? pegawaiDenganRole("INSTRUKTUR") : [],
    bolehUbah
      ? prisma.materiOpp.findMany({
          where: { isActive: true },
          orderBy: { kodeMateri: "asc" },
          select: { idMateri: true, kodeMateri: true, judulMateri: true, durasiJamPelajaran: true },
        })
      : [],
    // CPMI yang siap ikut OPP: sudah diverifikasi, skema sesuai, belum masuk kegiatan mana pun.
    // Juga dipakai sebagai penanda "verifikasi susulan" sebelum data dikunci.
    !k.isCpmiFinal
      ? prisma.cpmi.findMany({
          where: {
            skemaPendaftaran: { in: SKEMA_CPMI_OPP[k.skemaOpp] },
            verifikasi: { some: { statusVerifikasi: "SUDAH_SELESAI" } },
            pesertaOpp: { none: {} },
          },
          orderBy: { namaLengkap: "asc" },
          take: 500,
          select: { idCpmi: true, namaLengkap: true, noPaspor: true, negaraPenempatan: true, skemaPendaftaran: true },
        })
      : [],
  ]);

  const ringkasan: [string, string][] = [
    ["Tanggal", formatTanggal(k.tanggalPelaksanaan)],
    ["Tempat", k.tempatOpp],
    ["Skema", LABEL_SKEMA_OPP[k.skemaOpp]],
    ["Pengelola Kelas", k.pengelolaKelas?.namaLengkap ?? "Belum ditentukan"],
    ["Penanggung Jawab", k.penanggungJawab?.namaLengkap ?? "Belum ditentukan"],
  ];

  return (
    <>
      <ButtonLink href="/dashboard/kegiatan-opp" varian="ghost" ukuran="sm" ikon={<ArrowLeft aria-hidden />} className="-ml-3 mb-2">
        Daftar kegiatan
      </ButtonLink>
      <PageHeader
        judul={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{k.kodeKegiatan}</span>
            <BadgeTahap tahap={tahap} />
          </span>
        }
        deskripsi={`${formatTanggal(k.tanggalPelaksanaan)} · ${k.tempatOpp}`}
        aksi={
          <AksiKegiatan
            bolehUbah={bolehUbahData}
            bolehHapus={!k.isCpmiFinal && k._count.presensi === 0}
            hariIni={hariIniWib()}
            pengelola={pengelola}
            penanggungJawab={penanggungJawab}
            kegiatan={{
              idKegiatanOpp: k.idKegiatanOpp,
              kodeKegiatan: k.kodeKegiatan,
              tanggalPelaksanaan: dariTanggalDb(k.tanggalPelaksanaan),
              skemaOpp: k.skemaOpp,
              tempatOpp: k.tempatOpp,
              idPengelolaKelas: k.idPengelolaKelas,
              idPenanggungJawab: k.idPenanggungJawab,
            }}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <BagianKurikulum
            idKegiatanOpp={k.idKegiatanOpp}
            menitPerJp={MENIT_PER_JP[k.skemaOpp]}
            bolehUbah={bolehUbahData}
            materi={materi}
            instruktur={instruktur}
            sesi={k.kurikulum.map((s) => ({
              idKurikulum: s.idKurikulum,
              idMateri: s.idMateri,
              kodeMateri: s.materi.kodeMateri,
              judulMateri: s.materi.judulMateri,
              durasiJp: s.materi.durasiJamPelajaran,
              idInstruktur: s.idInstruktur,
              instruktur: s.instruktur.namaLengkap,
              jamMulai: s.jamMulai ? dariJamDb(s.jamMulai) : "",
              jamSelesai: s.jamSelesai ? dariJamDb(s.jamSelesai) : "",
            }))}
          />
          <BagianPeserta
            idKegiatanOpp={k.idKegiatanOpp}
            bolehUbah={bolehUbahData}
            final={k.isCpmiFinal}
            peserta={k.peserta.map((p) => {
              const hadir = k.presensi.find((h) => h.idCpmi === p.idCpmi);
              return {
                ...p.cpmi,
                presensi: hadir ? { jam: formatJam(hadir.waktuScan), toolkit: hadir.terimaToolkit, konsumsi: hadir.terimaKonsumsi } : null,
              };
            })}
            skema={LABEL_SKEMA_OPP[k.skemaOpp]}
            calon={calonPeserta.map(({ skemaPendaftaran, ...c }) => ({ ...c, skema: LABEL_SKEMA[skemaPendaftaran] }))}
          />
        </div>

        <div className="flex flex-col gap-6">
          <BagianFinalisasi
            idKegiatanOpp={k.idKegiatanOpp}
            tanggal={tanggal}
            final={k.isCpmiFinal}
            bolehUbah={bolehUbah}
            admin={pegawai.roles.includes("ADMIN")}
            sudahBerlangsung={tanggal <= hariIniWib()}
            jumlahPeserta={k.peserta.length}
            jumlahHadir={k.presensi.length}
            calonSusulan={calonPeserta.length}
            srikandi={{
              sudah: k.statusSrikandiUpload,
              waktu: k.waktuUploadSrikandi ? formatWaktu(k.waktuUploadSrikandi) : null,
              fileSkOppUrl: k.fileSkOppUrl,
              fileSptInstrukturUrl: k.fileSptInstrukturUrl,
              fileSptPengelolaUrl: k.fileSptPengelolaUrl,
            }}
          />
          <Card>
            <CardHeader judul="Ringkasan" />
            <CardBody>
              <dl className="flex flex-col gap-3 text-sm">
                {ringkasan.map(([label, nilai]) => (
                  <div key={label}>
                    <dt className="text-fg-muted">{label}</dt>
                    <dd className="font-medium text-fg">{nilai}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
          <BagianDokumen
            idKegiatanOpp={k.idKegiatanOpp}
            bolehUbah={bolehUbah}
            tanggalPelaksanaan={tanggal}
            tanggalSurat={k.tanggalSurat ? dariTanggalDb(k.tanggalSurat) : null}
            noSkOpp={k.noSkOpp}
            noSptInstruktur={k.noSptInstruktur}
            noSptPengelola={k.noSptPengelola}
            adaKurikulum={k.kurikulum.length > 0}
            adaPengelola={!!k.idPengelolaKelas}
          />
        </div>
      </div>
    </>
  );
}
