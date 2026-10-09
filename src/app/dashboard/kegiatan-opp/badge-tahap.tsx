import { CalendarCheck, CalendarClock, CircleCheck, Lock } from "lucide-react";
import { Badge, type NadaBadge } from "@/components/ui/badge";
import type { TahapKegiatan } from "./data";

const TAHAP: Record<TahapKegiatan, { label: string; nada: NadaBadge; ikon: typeof Lock }> = {
  "akan-datang": { label: "Akan Datang", nada: "brand", ikon: CalendarClock },
  "hari-ini": { label: "Hari Ini", nada: "aksen", ikon: CalendarCheck },
  selesai: { label: "Terlaksana", nada: "netral", ikon: CircleCheck },
  final: { label: "Final", nada: "sukses", ikon: Lock },
};

export function BadgeTahap({ tahap }: { tahap: TahapKegiatan }) {
  const t = TAHAP[tahap];
  return (
    <Badge nada={t.nada}>
      <t.ikon aria-hidden />
      {t.label}
    </Badge>
  );
}
