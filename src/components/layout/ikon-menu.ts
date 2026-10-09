import { BookOpenText, CalendarRange, ClipboardCheck, LayoutDashboard, MessageSquareText, Presentation, UsersRound, type LucideIcon } from "lucide-react";
import type { KunciIkonMenu } from "@/lib/auth/menu";

export const IKON_MENU: Record<KunciIkonMenu, LucideIcon> = {
  beranda: LayoutDashboard,
  verifikasi: ClipboardCheck,
  kegiatan: CalendarRange,
  laporan: MessageSquareText,
  jadwal: Presentation,
  materi: BookOpenText,
  pegawai: UsersRound,
};
