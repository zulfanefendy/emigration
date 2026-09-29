import Link from "next/link";
import { ArrowRight, BookUser, ClipboardCheck, FileText, LogIn, QrCode, Ticket } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Alur layanan CPMI sesuai Flow Chart & BPMN dari PM.
const ALUR = [
  { ikon: BookUser, judul: "Cek Nomor Paspor", teks: "Masukkan nomor paspor untuk memulai pendaftaran." },
  { ikon: FileText, judul: "Isi Formulir", teks: "Lengkapi data diri, penempatan, dan pilih tanggal verifikasi." },
  { ikon: Ticket, judul: "Ambil Tiket Antrean", teks: "Simpan atau cetak tiket antrean (PDF) Anda." },
  { ikon: ClipboardCheck, judul: "Verifikasi di Loket", teks: "Datang sesuai jadwal dan bawa berkas fisik untuk diverifikasi." },
  { ikon: QrCode, judul: "Ikuti OPP & Presensi", teks: "Scan QR Code di kelas OPP, lalu tanda tangan digital." },
];

export default function HalamanBeranda() {
  return (
    <>
      <section className="relative overflow-hidden bg-sidebar text-white">
        <div aria-hidden className="absolute -top-32 -right-32 size-[28rem] rounded-full border-[48px] border-white/5" />
        <div aria-hidden className="absolute -bottom-40 left-1/3 size-96 rounded-full bg-aksen/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-semibold tracking-[0.18em] text-aksen uppercase">Portal Layanan CPMI</p>
          <h1 className="mt-3 max-w-3xl text-3xl leading-tight font-bold sm:text-5xl sm:leading-tight">
            Sistem Verifikasi Digital &amp; Orientasi Pra Pemberangkatan
          </h1>
          <p className="mt-5 max-w-2xl text-base text-sidebar-fg sm:text-lg">
            Daftar verifikasi dokumen, ambil nomor antrean, dan ikuti OPP dengan presensi digital, semuanya dalam satu
            layanan BP3MI Lampung.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/pendaftaran" varian="aksen" ukuran="lg">
              Daftar Verifikasi
              <ArrowRight aria-hidden />
            </ButtonLink>
            <ButtonLink
              href="/login"
              ukuran="lg"
              varian="ghost"
              ikon={<LogIn aria-hidden />}
              className="border border-white/40 text-white hover:bg-white/10"
            >
              Login Pegawai
            </ButtonLink>
          </div>
        </div>
      </section>

      <section id="alur" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.14em] text-brand-text uppercase">Alur Layanan</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl">Lima langkah hingga siap berangkat</h2>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ALUR.map(({ ikon: Ikon, judul, teks }, i) => (
            <li key={judul}>
              <Card className="relative h-full p-5">
                <span className="absolute top-4 right-4 text-3xl font-bold text-border" aria-hidden>
                  {i + 1}
                </span>
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand text-brand-fg">
                  <Ikon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold text-fg">
                  <span className="sr-only">Langkah {i + 1}: </span>
                  {judul}
                </h3>
                <p className="mt-1.5 text-sm text-fg-muted">{teks}</p>
              </Card>
            </li>
          ))}
        </ol>

        <Card className="mt-10 flex flex-col items-start gap-4 border-l-4 border-l-aksen p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-fg">Sudah terdaftar dan mengikuti kelas OPP?</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Presensi dilakukan dengan memindai QR Code yang ditampilkan petugas di kelas.
            </p>
          </div>
          <Link href="/pendaftaran" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text hover:underline">
            Mulai pendaftaran
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Card>
      </section>
    </>
  );
}
