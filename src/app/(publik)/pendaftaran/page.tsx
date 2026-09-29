import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Pendaftaran CPMI" };

// Sementara: diganti oleh modul 1 (cek paspor -> formulir -> tiket antrean).
export default function HalamanPendaftaran() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-fg">Pendaftaran CPMI</h1>
      <p className="mt-1 text-sm text-fg-muted">Cek nomor paspor, isi formulir, lalu dapatkan tiket antrean.</p>
      <Card className="mt-6 p-6">
        <Alert jenis="info" judul="Segera tersedia">
          Formulir pendaftaran online sedang disiapkan.
        </Alert>
        <ButtonLink href="/" varian="outline" ikon={<ArrowLeft aria-hidden />} className="mt-6">
          Kembali ke beranda
        </ButtonLink>
      </Card>
    </div>
  );
}
