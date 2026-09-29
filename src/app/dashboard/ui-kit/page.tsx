import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { wajibLogin } from "@/lib/auth/dal";
import { ContohKomponen } from "./contoh-komponen";

export const metadata: Metadata = { title: "UI Kit" };

// Katalog komponen untuk tim developer. Tidak tersedia di server produksi.
export default async function HalamanUiKit() {
  await wajibLogin();
  if (process.env.APP_ENV === "production") notFound();

  return (
    <>
      <PageHeader
        judul="UI Kit"
        deskripsi="Contoh semua komponen di src/components/ui. Salin pola dari sini saat membuat modul baru."
      />
      <ContohKomponen />
    </>
  );
}
