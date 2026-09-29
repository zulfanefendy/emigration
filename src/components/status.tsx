import { CircleCheck, CircleDashed, Clock, Megaphone, RotateCcw, Search, XCircle } from "lucide-react";
import type { StatusAntrian, StatusVerifikasi } from "@/generated/prisma/enums";
import { Badge, type NadaBadge } from "@/components/ui/badge";

// Badge status yang konsisten di semua modul (antrean & verifikasi).

const STATUS_VERIFIKASI: Record<StatusVerifikasi, { label: string; nada: NadaBadge; ikon: typeof Clock }> = {
  BELUM_DIVERIFIKASI: { label: "Belum Diverifikasi", nada: "netral", ikon: CircleDashed },
  SEDANG_DIVERIFIKASI: { label: "Sedang Diverifikasi", nada: "brand", ikon: Search },
  PERLU_REVISI: { label: "Perlu Revisi", nada: "peringatan", ikon: RotateCcw },
  SUDAH_SELESAI: { label: "Sudah Diverifikasi", nada: "sukses", ikon: CircleCheck },
};

const STATUS_ANTRIAN: Record<StatusAntrian, { label: string; nada: NadaBadge; ikon: typeof Clock }> = {
  MENUNGGU: { label: "Menunggu", nada: "netral", ikon: Clock },
  DIPANGGIL: { label: "Dipanggil", nada: "aksen", ikon: Megaphone },
  SELESAI: { label: "Selesai", nada: "sukses", ikon: CircleCheck },
  BATAL: { label: "Batal", nada: "bahaya", ikon: XCircle },
};

export function BadgeStatusVerifikasi({ status }: { status: StatusVerifikasi }) {
  const s = STATUS_VERIFIKASI[status];
  return (
    <Badge nada={s.nada}>
      <s.ikon aria-hidden />
      {s.label}
    </Badge>
  );
}

export function BadgeStatusAntrian({ status }: { status: StatusAntrian }) {
  const s = STATUS_ANTRIAN[status];
  return (
    <Badge nada={s.nada}>
      <s.ikon aria-hidden />
      {s.label}
    </Badge>
  );
}
