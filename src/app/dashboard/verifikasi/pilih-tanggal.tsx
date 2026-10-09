"use client";

import { CalendarDays } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Ganti tanggal antrean yang ditampilkan (default hari ini). */
export function PilihTanggal({ tanggal, hariIni }: { tanggal: string; hariIni: string }) {
  const router = useRouter();
  const path = usePathname();
  const ke = (t: string) => router.push(t === hariIni ? path : `${path}?tanggal=${t}`);

  return (
    <div className="flex items-center gap-2">
      {tanggal !== hariIni && (
        <Button varian="outline" ikon={<CalendarDays />} onClick={() => ke(hariIni)}>
          Hari ini
        </Button>
      )}
      <Input
        type="date"
        value={tanggal}
        onChange={(e) => e.target.value && ke(e.target.value)}
        aria-label="Tanggal antrean"
        className="w-44"
      />
    </div>
  );
}
