"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { wajibRole } from "@/lib/auth/dal";
import { ROLE } from "@/lib/auth/role";
import { isDuplikat, teksOpsional, type StateForm } from "@/lib/form";
import { normalisasiNomorWa } from "@/lib/whatsapp";

const SkemaPegawai = z.object({
  nip: z.string().trim().regex(/^\d{18}$/, { error: "NIP harus 18 digit angka." }),
  namaLengkap: z
    .string()
    .trim()
    .min(3, { error: "Nama lengkap minimal 3 karakter." })
    .max(150, { error: "Nama lengkap maksimal 150 karakter." }),
  jabatan: z.string().max(100, { error: "Jabatan maksimal 100 karakter." }).optional(),
  noWhatsapp: z
    .string()
    .transform(normalisasiNomorWa)
    .pipe(z.string().regex(/^62\d{8,13}$/, { error: "Nomor WhatsApp tidak valid, contoh 081234567890." }))
    .optional(),
  email: z.email({ error: "Format email tidak valid." }).trim().toLowerCase().max(100),
  /** Wajib saat menambah; saat mengubah, kosong = password tidak diganti. */
  password: z.string().min(8, { error: "Password minimal 8 karakter." }).max(72).optional(),
  roles: z.array(z.enum(ROLE)).min(1, { error: "Pilih minimal satu role." }),
});

export type FieldPegawai = keyof z.infer<typeof SkemaPegawai>;
export type StatePegawai = StateForm<FieldPegawai>;

export async function simpanPegawai(_state: StatePegawai | undefined, formData: FormData): Promise<StatePegawai> {
  const admin = await wajibRole("ADMIN");

  const idPegawai = teksOpsional(formData.get("idPegawai"));
  const hasil = SkemaPegawai.safeParse({
    nip: formData.get("nip"),
    namaLengkap: formData.get("namaLengkap"),
    jabatan: teksOpsional(formData.get("jabatan")),
    noWhatsapp: teksOpsional(formData.get("noWhatsapp")),
    email: formData.get("email"),
    password: teksOpsional(formData.get("password")),
    roles: formData.getAll("roles"),
  });
  if (!hasil.success) return { errors: z.flattenError(hasil.error).fieldErrors };

  const { password, roles, ...data } = hasil.data;
  if (!idPegawai && !password) return { errors: { password: ["Password wajib diisi untuk pegawai baru."] } };

  // Admin tidak boleh mencabut role ADMIN miliknya sendiri, supaya selalu ada
  // minimal satu admin aktif yang bisa mengelola akun.
  if (idPegawai === admin.idPegawai && !roles.includes("ADMIN")) {
    return { errors: { roles: ["Anda tidak bisa mencabut role Admin dari akun sendiri."] } };
  }

  const kembar = await prisma.pegawai.findMany({
    where: { OR: [{ nip: data.nip }, { email: data.email }], NOT: idPegawai ? { idPegawai } : undefined },
    select: { nip: true, email: true },
  });
  if (kembar.length > 0) {
    return {
      errors: {
        nip: kembar.some((k) => k.nip === data.nip) ? ["NIP sudah terdaftar."] : undefined,
        email: kembar.some((k) => k.email === data.email) ? ["Email sudah terdaftar."] : undefined,
      },
    };
  }

  const idRole = await prisma.role.findMany({ where: { namaRole: { in: roles } }, select: { idRole: true } });
  const isiPegawai = {
    ...data,
    jabatan: data.jabatan ?? null,
    noWhatsapp: data.noWhatsapp ?? null,
    ...(password && { passwordHash: await bcrypt.hash(password, 12) }),
  };

  try {
    if (idPegawai) {
      await prisma.$transaction([
        prisma.pegawai.update({ where: { idPegawai }, data: isiPegawai }),
        prisma.pegawaiRole.deleteMany({ where: { idPegawai } }),
        prisma.pegawaiRole.createMany({ data: idRole.map((r) => ({ idPegawai, idRole: r.idRole })) }),
      ]);
    } else {
      await prisma.pegawai.create({
        data: { ...isiPegawai, passwordHash: isiPegawai.passwordHash!, roles: { create: idRole } },
      });
    }
  } catch (e) {
    if (isDuplikat(e)) return { pesan: "NIP atau email sudah terdaftar." };
    throw e;
  }

  revalidatePath("/dashboard/pegawai");
  return { sukses: true, pesan: idPegawai ? "Data pegawai diperbarui." : "Pegawai ditambahkan." };
}

/** Pegawai nonaktif tidak bisa login; sesi yang sedang berjalan langsung ditolak oleh dal.ts. */
export async function ubahStatusPegawai(idPegawai: string, isActive: boolean): Promise<StateForm> {
  const admin = await wajibRole("ADMIN");
  if (idPegawai === admin.idPegawai && !isActive) {
    return { pesan: "Anda tidak bisa menonaktifkan akun sendiri." };
  }
  await prisma.pegawai.update({ where: { idPegawai }, data: { isActive } });
  revalidatePath("/dashboard/pegawai");
  return { sukses: true, pesan: isActive ? "Pegawai diaktifkan." : "Pegawai dinonaktifkan." };
}
