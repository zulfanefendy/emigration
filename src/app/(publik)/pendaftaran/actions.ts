"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { isDuplikat, teksOpsional, type StateForm } from "@/lib/form";
import { cekFormatPaspor } from "@/lib/paspor";
import { hariIniWib, isHariKerja, keTanggalDb, tambahHari } from "@/lib/tanggal";
import { BATAS_HARI_JADWAL, PENDIDIKAN } from "./pilihan";

// Modul 1: pendaftaran CPMI tanpa login.
// Alur (Flow Chart PM): cek paspor -> formulir -> simpan + nomor antrean -> tiket PDF.

// ---------------------------------------------------------------------------
// Langkah 1: cek nomor paspor
// ---------------------------------------------------------------------------

export type StateCekPaspor = {
  error?: string;
  /** Paspor valid dan belum terdaftar: lanjut ke formulir. */
  baru?: string;
  /** Paspor sudah terdaftar: minta tanggal lahir untuk membuka tiket. */
  terdaftar?: string;
  /** Penanda percobaan dari client, agar tombol "Ganti nomor paspor" bisa mengabaikan hasil lama. */
  ulang?: number;
};

export async function cekPaspor(_state: StateCekPaspor | undefined, formData: FormData): Promise<StateCekPaspor> {
  const ulang = Number(formData.get("ulang")) || 0;
  const hasil = cekFormatPaspor(String(formData.get("noPaspor") ?? ""));
  if (!hasil.valid) return { error: hasil.pesan, ulang };

  const ada = await prisma.cpmi.findUnique({ where: { noPaspor: hasil.noPaspor }, select: { idCpmi: true } });
  return ada ? { terdaftar: hasil.noPaspor, ulang } : { baru: hasil.noPaspor, ulang };
}

/**
 * Membuka kembali tiket CPMI yang sudah terdaftar. Tanggal lahir dipakai
 * sebagai pengaman agar tiket orang lain tidak bisa dibuka hanya dengan
 * mengetahui nomor paspornya.
 */
export async function bukaTiket(_state: StateForm | undefined, formData: FormData): Promise<StateForm> {
  const paspor = cekFormatPaspor(String(formData.get("noPaspor") ?? ""));
  const tanggalLahir = String(formData.get("tanggalLahir") ?? "");
  if (!paspor.valid) return { pesan: paspor.pesan };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahir)) return { errors: { tanggalLahir: ["Tanggal lahir wajib diisi."] } };

  const cpmi = await prisma.cpmi.findUnique({
    where: { noPaspor: paspor.noPaspor },
    select: { tanggalLahir: true, antrian: { select: { idAntrian: true } } },
  });
  // Pesan sama untuk "tidak ada" dan "tidak cocok" agar data tidak bisa ditebak.
  if (!cpmi?.antrian || cpmi.tanggalLahir.getTime() !== keTanggalDb(tanggalLahir).getTime()) {
    return { errors: { tanggalLahir: ["Tanggal lahir tidak cocok dengan data pendaftaran."] } };
  }
  redirect(`/pendaftaran/tiket/${cpmi.antrian.idAntrian}`);
}

// ---------------------------------------------------------------------------
// Langkah 2: formulir pendaftaran
// ---------------------------------------------------------------------------

const teks = (label: string, maks: number, min = 1) =>
  z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .min(min, { error: min > 1 ? `${label} minimal ${min} karakter.` : `${label} wajib diisi.` })
    .max(maks, { error: `${label} maksimal ${maks} karakter.` });

const tanggalIso = (label: string) =>
  z.string({ error: `${label} wajib diisi.` }).regex(/^\d{4}-\d{2}-\d{2}$/, { error: `${label} wajib diisi.` });

const SkemaCpmi = z.object({
  nik: z
    .string()
    .regex(/^\d{16}$/, { error: "NIK harus 16 angka." })
    .optional(),
  namaLengkap: teks("Nama lengkap", 150, 3).toUpperCase(),
  tempatLahir: teks("Tempat lahir", 100),
  tanggalLahir: tanggalIso("Tanggal lahir").refine(
    (t) => {
      // CPMI minimal berusia 18 tahun (UU 18/2017 Pasal 5).
      const hariIni = hariIniWib();
      const batas = `${Number(hariIni.slice(0, 4)) - 18}${hariIni.slice(4)}`;
      return t <= batas && t >= "1940-01-01";
    },
    { error: "Usia CPMI minimal 18 tahun." },
  ),
  jenisKelamin: z.enum(["L", "P"], { error: "Pilih jenis kelamin." }),
  alamatLengkap: teks("Alamat", 1000, 10),
  provinsi: teks("Provinsi", 100),
  kabupatenKota: teks("Kabupaten/kota", 100),
  noWhatsapp: z
    .string({ error: "Nomor WhatsApp wajib diisi." })
    .transform((s) => s.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(\+62|62|0)8\d{7,12}$/, { error: "Nomor WhatsApp tidak valid, contoh: 081234567890." })),
  pendidikanTerakhir: z.enum(PENDIDIKAN, { error: "Pilih pendidikan terakhir." }),
  asalSekolahInstansi: teks("Asal sekolah/instansi", 150),

  skemaPendaftaran: z.enum(["P_TO_P", "MANDIRI_REGULER", "MANDIRI_SSW"], { error: "Pilih skema pendaftaran." }),
  negaraPenempatan: teks("Negara penempatan", 100),
  sektor: z.enum(["FORMAL", "INFORMAL"], { error: "Pilih sektor." }),
  jenisPekerjaan: teks("Jenis pekerjaan", 150),
  namaPenggunaJasa: teks("Nama pengguna jasa", 150),
  alamatPenggunaJasa: teks("Alamat pengguna jasa", 1000, 5),
  gaji: z
    .string({ error: "Gaji wajib diisi." })
    .transform((s) => s.replace(/[.\s]/g, "").replace(",", "."))
    .pipe(
      z
        .string()
        .regex(/^\d{1,13}(\.\d{1,2})?$/, { error: "Gaji berupa angka, contoh: 25000." })
        .refine((s) => Number(s) > 0, { error: "Gaji harus lebih dari 0." }),
    ),

  tanggalRencanaVerifikasi: tanggalIso("Tanggal verifikasi").superRefine((t, ctx) => {
    const hariIni = hariIniWib();
    if (t < hariIni) ctx.addIssue({ code: "custom", message: "Tanggal verifikasi tidak boleh sebelum hari ini." });
    else if (t > tambahHari(hariIni, BATAS_HARI_JADWAL))
      ctx.addIssue({ code: "custom", message: `Pilih tanggal paling lambat ${BATAS_HARI_JADWAL} hari dari sekarang.` });
    else if (!isHariKerja(t)) ctx.addIssue({ code: "custom", message: "Loket hanya buka Senin sampai Jumat." });
  }),
});

export type FieldCpmi = keyof z.infer<typeof SkemaCpmi> | "noPaspor" | "setuju";
export type StateDaftar = StateForm<FieldCpmi>;

export async function daftarCpmi(_state: StateDaftar | undefined, formData: FormData): Promise<StateDaftar> {
  const paspor = cekFormatPaspor(String(formData.get("noPaspor") ?? ""));
  if (!paspor.valid) return { errors: { noPaspor: [paspor.pesan] } };

  const ambil = (k: string) => teksOpsional(formData.get(k));
  const hasil = SkemaCpmi.safeParse({
    nik: ambil("nik"),
    namaLengkap: ambil("namaLengkap"),
    tempatLahir: ambil("tempatLahir"),
    tanggalLahir: ambil("tanggalLahir"),
    jenisKelamin: ambil("jenisKelamin"),
    alamatLengkap: ambil("alamatLengkap"),
    provinsi: ambil("provinsi"),
    kabupatenKota: ambil("kabupatenKota"),
    noWhatsapp: ambil("noWhatsapp"),
    pendidikanTerakhir: ambil("pendidikanTerakhir"),
    asalSekolahInstansi: ambil("asalSekolahInstansi"),
    skemaPendaftaran: ambil("skemaPendaftaran"),
    negaraPenempatan: ambil("negaraPenempatan"),
    sektor: ambil("sektor"),
    jenisPekerjaan: ambil("jenisPekerjaan"),
    namaPenggunaJasa: ambil("namaPenggunaJasa"),
    alamatPenggunaJasa: ambil("alamatPenggunaJasa"),
    gaji: ambil("gaji"),
    tanggalRencanaVerifikasi: ambil("tanggalRencanaVerifikasi"),
  });
  const setuju = formData.get("setuju") === "ya";
  if (!hasil.success || !setuju) {
    const errors: StateDaftar["errors"] = hasil.success ? {} : z.flattenError(hasil.error).fieldErrors;
    if (!setuju) errors.setuju = ["Centang pernyataan ini untuk melanjutkan."];
    return { errors, pesan: "Periksa kembali isian yang ditandai." };
  }

  const { tanggalLahir, tanggalRencanaVerifikasi, nik, ...data } = hasil.data;

  if (nik && (await prisma.cpmi.findUnique({ where: { nik }, select: { idCpmi: true } }))) {
    return { errors: { nik: ["NIK ini sudah dipakai pendaftar lain."] } };
  }

  let idAntrian: string;
  try {
    idAntrian = await prisma.$transaction(async (tx) => {
      const tanggal = keTanggalDb(tanggalRencanaVerifikasi);

      // Kunci per tanggal agar dua pendaftar di saat yang sama tidak mendapat
      // nomor antrean yang sama. Kunci lepas otomatis saat transaksi selesai.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`antrian:${tanggalRencanaVerifikasi}`}))`;

      // Ambil nomor terbesar, bukan jumlah baris, agar tidak kembar bila ada data yang dihapus.
      const sudahAda = await tx.antrian.findMany({ where: { tanggalAntrian: tanggal }, select: { noAntrian: true } });
      const urut = Math.max(0, ...sudahAda.map((a) => Number(a.noAntrian.replace(/\D/g, "")))) + 1;

      const cpmi = await tx.cpmi.create({
        data: {
          ...data,
          noPaspor: paspor.noPaspor,
          nik: nik ?? null,
          tanggalLahir: keTanggalDb(tanggalLahir),
          tanggalRencanaVerifikasi: tanggal,
          antrian: { create: { noAntrian: formatNoAntrian(urut), tanggalAntrian: tanggal } },
          verifikasi: { create: {} },
        },
        select: { antrian: { select: { idAntrian: true } } },
      });
      return cpmi.antrian!.idAntrian;
    });
  } catch (e) {
    if (isDuplikat(e)) {
      return { errors: { noPaspor: ["Nomor paspor ini baru saja terdaftar. Buka tiket lewat halaman pendaftaran."] } };
    }
    throw e;
  }

  redirect(`/pendaftaran/tiket/${idAntrian}?baru=1`);
}

/** 1 -> "A-001". Nomor diulang dari 1 untuk setiap tanggal verifikasi. */
function formatNoAntrian(urut: number): string {
  return `A-${String(urut).padStart(3, "0")}`;
}
