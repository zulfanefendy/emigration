import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BadgeStatusAntrian, BadgeStatusVerifikasi } from "@/components/status";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { LABEL_SEKTOR, LABEL_SKEMA } from "@/app/(publik)/pendaftaran/pilihan";
import { wajibRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { dariTanggalDb, formatTanggal, formatWaktu, hariIniWib } from "@/lib/tanggal";
import { PanelVerifikasi } from "./panel-verifikasi";

export const metadata: Metadata = { title: "Detail Verifikasi" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function HalamanDetailVerifikasi({ params }: PageProps<"/dashboard/verifikasi/[idCpmi]">) {
  const pegawai = await wajibRole("VERIFIKATOR");
  const { idCpmi } = await params;
  if (!UUID.test(idCpmi)) notFound();

  const cpmi = await prisma.cpmi.findUnique({
    where: { idCpmi },
    include: {
      antrian: true,
      verifikasi: { orderBy: { createdAt: "desc" }, include: { verifikator: { select: { namaLengkap: true } } } },
    },
  });
  if (!cpmi?.antrian) notFound();

  const { antrian } = cpmi;
  const terakhir = cpmi.verifikasi[0];
  const tanggalAntrian = dariTanggalDb(antrian.tanggalAntrian);
  const kembali = tanggalAntrian === hariIniWib() ? "/dashboard/verifikasi" : `/dashboard/verifikasi?tanggal=${tanggalAntrian}`;

  const kelompok: { judul: string; isi: [string, string | null][] }[] = [
    {
      judul: "Data Diri",
      isi: [
        ["Nomor Paspor", cpmi.noPaspor],
        ["NIK", cpmi.nik],
        ["Nama Lengkap", cpmi.namaLengkap],
        ["Tempat, Tanggal Lahir", `${cpmi.tempatLahir}, ${formatTanggal(cpmi.tanggalLahir, { hari: false })}`],
        ["Jenis Kelamin", cpmi.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"],
        ["Pendidikan", `${cpmi.pendidikanTerakhir} — ${cpmi.asalSekolahInstansi}`],
        ["No. WhatsApp", cpmi.noWhatsapp],
        ["Alamat", `${cpmi.alamatLengkap}, ${cpmi.kabupatenKota}, ${cpmi.provinsi}`],
      ],
    },
    {
      judul: "Rencana Penempatan",
      isi: [
        ["Skema", LABEL_SKEMA[cpmi.skemaPendaftaran]],
        ["Negara", cpmi.negaraPenempatan],
        ["Sektor", LABEL_SEKTOR[cpmi.sektor]],
        ["Jenis Pekerjaan", cpmi.jenisPekerjaan],
        ["Pengguna Jasa", cpmi.namaPenggunaJasa],
        ["Alamat Pengguna Jasa", cpmi.alamatPenggunaJasa],
        ["Gaji per Bulan", Number(cpmi.gaji).toLocaleString("id-ID")],
      ],
    },
  ];

  return (
    <>
      <ButtonLink href={kembali} varian="ghost" ukuran="sm" ikon={<ArrowLeft aria-hidden />} className="-ml-3 mb-2">
        Daftar antrean
      </ButtonLink>
      <PageHeader
        judul={
          <span className="flex items-center gap-3">
            <span className="font-mono">{antrian.noAntrian}</span>
            <span className="text-fg-muted">·</span>
            {cpmi.namaLengkap}
          </span>
        }
        deskripsi={`Antrean ${formatTanggal(antrian.tanggalAntrian)}`}
        aksi={
          <>
            <BadgeStatusAntrian status={antrian.statusAntrian} />
            {terakhir && <BadgeStatusVerifikasi status={terakhir.statusVerifikasi} />}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          {kelompok.map((k) => (
            <Card key={k.judul}>
              <CardHeader judul={k.judul} />
              <CardBody>
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[12rem_1fr]">
                  {k.isi.map(([label, nilai]) => (
                    <div key={label} className="contents">
                      <dt className="text-fg-muted">{label}</dt>
                      <dd className="font-medium text-fg">{nilai ?? "—"}</dd>
                    </div>
                  ))}
                </dl>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          <PanelVerifikasi
            idCpmi={cpmi.idCpmi}
            noAntrian={antrian.noAntrian}
            namaLengkap={cpmi.namaLengkap}
            noWhatsapp={cpmi.noWhatsapp}
            statusAntrian={antrian.statusAntrian}
            statusVerifikasi={terakhir?.statusVerifikasi ?? "BELUM_DIVERIFIKASI"}
            catatanTerakhir={terakhir?.catatanVerifikasi ?? null}
            verifikator={terakhir?.verifikator?.namaLengkap ?? null}
            bolehMengubah={
              !terakhir?.idVerifikator || terakhir.idVerifikator === pegawai.idPegawai || pegawai.roles.includes("ADMIN")
            }
          />

          <Card>
            <CardHeader judul="Riwayat Verifikasi" />
            <CardBody>
              {cpmi.verifikasi.every((v) => v.statusVerifikasi === "BELUM_DIVERIFIKASI") ? (
                <p className="text-sm text-fg-muted">Belum pernah diverifikasi.</p>
              ) : (
                <ol className="flex flex-col gap-4">
                  {cpmi.verifikasi
                    .filter((v) => v.statusVerifikasi !== "BELUM_DIVERIFIKASI")
                    .map((v) => (
                      <li key={v.idVerifikasi} className="border-l-2 border-border pl-3 text-sm">
                        <BadgeStatusVerifikasi status={v.statusVerifikasi} />
                        <p className="mt-1 text-fg-muted">
                          {v.verifikator?.namaLengkap ?? "—"}
                          {v.waktuMulaiVerifikasi && ` · mulai ${formatWaktu(v.waktuMulaiVerifikasi)}`}
                        </p>
                        {v.waktuSelesaiVerifikasi && <p className="text-fg-muted">selesai {formatWaktu(v.waktuSelesaiVerifikasi)}</p>}
                        {v.catatanVerifikasi && <p className="mt-1 whitespace-pre-line text-fg">{v.catatanVerifikasi}</p>}
                      </li>
                    ))}
                </ol>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
