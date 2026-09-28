"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { buatSesi, hapusSesi } from "@/lib/auth/session";

const SkemaLogin = z.object({
  identitas: z.string().trim().min(1, { error: "Email atau NIP wajib diisi." }),
  password: z.string().min(1, { error: "Password wajib diisi." }),
});

export type StateLogin = {
  errors?: { identitas?: string[]; password?: string[] };
  pesan?: string;
  identitas?: string;
};

// Hash tiruan agar waktu respons sama saat akun tidak ditemukan,
// sehingga penyerang tidak bisa menebak email/NIP mana yang terdaftar.
let hashTiruan: Promise<string> | undefined;
function ambilHashTiruan() {
  hashTiruan ??= bcrypt.hash("akun-tidak-ada", 12);
  return hashTiruan;
}

export async function login(_state: StateLogin | undefined, formData: FormData): Promise<StateLogin> {
  const hasil = SkemaLogin.safeParse({
    identitas: formData.get("identitas"),
    password: formData.get("password"),
  });
  if (!hasil.success) {
    return {
      errors: z.flattenError(hasil.error).fieldErrors,
      identitas: String(formData.get("identitas") ?? ""),
    };
  }

  const { identitas, password } = hasil.data;
  const pegawai = await prisma.pegawai.findFirst({
    where: { OR: [{ email: { equals: identitas, mode: "insensitive" } }, { nip: identitas }] },
    select: { idPegawai: true, passwordHash: true, isActive: true },
  });

  const cocok = await bcrypt.compare(password, pegawai?.passwordHash ?? (await ambilHashTiruan()));
  if (!pegawai || !cocok) {
    return { pesan: "Email/NIP atau password salah.", identitas };
  }
  if (!pegawai.isActive) {
    return { pesan: "Akun Anda dinonaktifkan. Hubungi admin.", identitas };
  }

  await buatSesi(pegawai.idPegawai);
  redirect("/dashboard");
}

export async function logout() {
  await hapusSesi();
  redirect("/login");
}
