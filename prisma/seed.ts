// Data awal: daftar role, materi OPP contoh, dan akun admin pertama.
// Aman dijalankan berulang (upsert). Jalankan: npx prisma db seed
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const ROLE = ["ADMIN", "VERIFIKATOR", "INSTRUKTUR", "PENGELOLA_KELAS", "PENANGGUNG_JAWAB"];

// Contoh materi OPP; silakan diganti sesuai kurikulum resmi BP3MI.
const MATERI = [
  { kodeMateri: "OPP-01", judulMateri: "Peraturan Perundang-undangan di Negara Tujuan", durasiJamPelajaran: 2 },
  { kodeMateri: "OPP-02", judulMateri: "Perjanjian Kerja", durasiJamPelajaran: 2 },
  { kodeMateri: "OPP-03", judulMateri: "Hak dan Kewajiban PMI", durasiJamPelajaran: 1 },
  { kodeMateri: "OPP-04", judulMateri: "Adat Istiadat dan Budaya Negara Tujuan", durasiJamPelajaran: 1 },
  { kodeMateri: "OPP-05", judulMateri: "Jaminan Sosial PMI", durasiJamPelajaran: 1 },
];

async function main() {
  for (const namaRole of ROLE) {
    await prisma.role.upsert({ where: { namaRole }, update: {}, create: { namaRole } });
  }

  for (const materi of MATERI) {
    await prisma.materiOpp.upsert({ where: { kodeMateri: materi.kodeMateri }, update: {}, create: materi });
  }

  // Akun admin hanya dibuat bila kredensialnya diberikan lewat env,
  // supaya tidak ada password default yang ikut ke server.
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD kosong, akun admin dilewati.");
  } else {
    const roleAdmin = await prisma.role.findUniqueOrThrow({ where: { namaRole: "ADMIN" } });
    await prisma.pegawai.upsert({
      where: { email },
      update: {},
      create: {
        nip: process.env.SEED_ADMIN_NIP ?? "000000000000000000",
        namaLengkap: "Administrator",
        email,
        passwordHash: await bcrypt.hash(password, 12),
        roles: { create: { idRole: roleAdmin.idRole } },
      },
    });
    console.log(`Akun admin siap: ${email}`);
  }

  console.log("Seed selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
