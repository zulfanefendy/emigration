import { CircleAlert, CircleCheck, CircleX, Info, type LucideIcon } from "lucide-react";

// Jenis pesan yang dipakai bersama oleh Alert dan Toast.
export type JenisPesan = "sukses" | "gagal" | "peringatan" | "info";

export const GAYA_PESAN: Record<JenisPesan, { ikon: LucideIcon; kotak: string; ikonWarna: string; label: string }> = {
  sukses: { ikon: CircleCheck, kotak: "border-success/40 bg-success-soft", ikonWarna: "text-success", label: "Berhasil" },
  gagal: { ikon: CircleX, kotak: "border-danger/40 bg-danger-soft", ikonWarna: "text-danger", label: "Gagal" },
  peringatan: { ikon: CircleAlert, kotak: "border-warning/40 bg-warning-soft", ikonWarna: "text-warning", label: "Peringatan" },
  info: { ikon: Info, kotak: "border-brand-text/30 bg-brand-soft", ikonWarna: "text-brand-text", label: "Informasi" },
};
