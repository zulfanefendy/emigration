import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Satu instance PrismaClient per proses. Saat dev, hot reload Next.js membuat
// modul dievaluasi ulang, jadi instance disimpan di globalThis agar koneksi
// ke database tidak terus bertambah.
const globalUntukPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buatPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalUntukPrisma.prisma ?? buatPrismaClient();

if (process.env.NODE_ENV !== "production") globalUntukPrisma.prisma = prisma;
