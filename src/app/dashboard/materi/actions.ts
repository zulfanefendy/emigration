"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { wajibRole } from "@/lib/auth/dal";
import { isDuplikat, teksOpsional, type StateForm } from "@/lib/form";

const SkemaMateri = z.object({
  kodeMateri: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, { error: "Kode materi wajib diisi." })
    .max(20, { error: "Kode materi maksimal 20 karakter." })
    .regex(/^[A-Z0-9-]+$/, { error: "Hanya huruf, angka, dan tanda minus." }),
  judulMateri: z
    .string()
    .trim()
    .min(3, { error: "Judul materi minimal 3 karakter." })
    .max(200, { error: "Judul materi maksimal 200 karakter." }),
  deskripsi: z.string().max(2000, { error: "Deskripsi maksimal 2000 karakter." }).optional(),
  durasiJamPelajaran: z.coerce
    .number({ error: "Durasi wajib berupa angka." })
    .int({ error: "Durasi harus bilangan bulat." })
    .min(1, { error: "Durasi minimal 1 JP." })
    .max(40, { error: "Durasi maksimal 40 JP." }),
});

export type FieldMateri = keyof z.infer<typeof SkemaMateri>;
export type StateMateri = StateForm<FieldMateri>;

/** Tambah materi (tanpa idMateri) atau ubah materi yang sudah ada. */
export async function simpanMateri(_state: StateMateri | undefined, formData: FormData): Promise<StateMateri> {
  await wajibRole("PENGELOLA_KELAS");

  const idMateri = Number(formData.get("idMateri")) || undefined;
  const hasil = SkemaMateri.safeParse({
    kodeMateri: formData.get("kodeMateri"),
    judulMateri: formData.get("judulMateri"),
    deskripsi: teksOpsional(formData.get("deskripsi")),
    durasiJamPelajaran: formData.get("durasiJamPelajaran"),
  });
  if (!hasil.success) return { errors: z.flattenError(hasil.error).fieldErrors };

  const data = { ...hasil.data, deskripsi: hasil.data.deskripsi ?? null };

  const kembar = await prisma.materiOpp.findFirst({
    where: { kodeMateri: data.kodeMateri, NOT: idMateri ? { idMateri } : undefined },
    select: { idMateri: true },
  });
  if (kembar) return { errors: { kodeMateri: ["Kode materi sudah dipakai."] } };

  try {
    if (idMateri) {
      await prisma.materiOpp.update({ where: { idMateri }, data });
    } else {
      await prisma.materiOpp.create({ data });
    }
  } catch (e) {
    if (isDuplikat(e)) return { errors: { kodeMateri: ["Kode materi sudah dipakai."] } };
    throw e;
  }

  revalidatePath("/dashboard/materi");
  return { sukses: true, pesan: idMateri ? "Materi diperbarui." : "Materi ditambahkan." };
}

/**
 * Materi nonaktif tidak bisa dipilih untuk kurikulum baru, tetapi kurikulum
 * lama yang sudah memakainya tetap utuh. Karena itu materi tidak dihapus.
 */
export async function ubahStatusMateri(idMateri: number, isActive: boolean): Promise<StateForm> {
  await wajibRole("PENGELOLA_KELAS");
  await prisma.materiOpp.update({ where: { idMateri }, data: { isActive } });
  revalidatePath("/dashboard/materi");
  return { sukses: true, pesan: isActive ? "Materi diaktifkan." : "Materi dinonaktifkan." };
}
