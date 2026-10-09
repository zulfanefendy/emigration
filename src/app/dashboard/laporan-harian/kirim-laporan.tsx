"use client";

import { Copy, MessageCircle } from "lucide-react";
import { Button, kelasTombol } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { buatLinkWa } from "@/lib/whatsapp";

/** Tanpa WhatsApp API: buka WhatsApp dengan teks terisi, lalu pilih grup tujuan. */
export function KirimLaporan({ teks }: { teks: string }) {
  async function salin() {
    try {
      await navigator.clipboard.writeText(teks);
      toast.sukses("Laporan disalin");
    } catch {
      toast.gagal("Gagal menyalin. Blok teks pratinjau lalu salin manual.");
    }
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-3">
        <a href={buatLinkWa(teks)} target="_blank" rel="noreferrer" className={kelasTombol("primary", "lg")}>
          <MessageCircle aria-hidden />
          Kirim lewat WhatsApp
        </a>
        <Button varian="outline" ikon={<Copy />} onClick={salin}>
          Salin Teks
        </Button>
        <p className="text-xs text-fg-muted">WhatsApp akan meminta Anda memilih kontak atau grup tujuan.</p>
      </CardBody>
    </Card>
  );
}
