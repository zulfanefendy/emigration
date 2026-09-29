import { punyaAkses, type Role } from "./role";

// Menu sidebar dashboard per role, mengikuti Use Case Diagram dari PM.
// `tersedia: false` = modul belum dibuat; ubah saat halamannya sudah ada.
// `ikon` adalah kunci di components/layout/ikon-menu.ts (bukan komponen, karena
// menu dikirim dari server ke komponen client).
export type KunciIkonMenu = "beranda" | "verifikasi" | "kegiatan" | "jadwal" | "materi" | "pegawai";

export type MenuDashboard = {
  href: string;
  judul: string;
  deskripsi: string;
  ikon: KunciIkonMenu;
  /** Kosong = semua pegawai yang login. */
  roles: Role[];
  tersedia: boolean;
};

export const MENU_DASHBOARD: MenuDashboard[] = [
  {
    href: "/dashboard",
    judul: "Beranda",
    deskripsi: "Ringkasan dan akses cepat.",
    ikon: "beranda",
    roles: [],
    tersedia: true,
  },
  {
    href: "/dashboard/verifikasi",
    judul: "Verifikasi Loket",
    deskripsi: "Daftar antrean hari ini, panggil CPMI, verifikasi berkas fisik.",
    ikon: "verifikasi",
    roles: ["VERIFIKATOR"],
    tersedia: false,
  },
  {
    href: "/dashboard/kegiatan-opp",
    judul: "Kegiatan OPP",
    deskripsi: "Buat kegiatan, atur kurikulum, SK & SPT, QR presensi, LPJ, SRIKANDI.",
    ikon: "kegiatan",
    roles: ["PENGELOLA_KELAS", "PENANGGUNG_JAWAB"],
    tersedia: false,
  },
  {
    href: "/dashboard/jadwal-mengajar",
    judul: "Jadwal Mengajar",
    deskripsi: "Materi dan jadwal OPP yang ditugaskan kepada Anda.",
    ikon: "jadwal",
    roles: ["INSTRUKTUR"],
    tersedia: false,
  },
  {
    href: "/dashboard/materi",
    judul: "Master Materi OPP",
    deskripsi: "Kelola daftar materi dan durasi jam pelajaran.",
    ikon: "materi",
    roles: ["PENGELOLA_KELAS"],
    tersedia: false,
  },
  {
    href: "/dashboard/pegawai",
    judul: "Pegawai & Role",
    deskripsi: "Kelola akun pegawai dan hak aksesnya.",
    ikon: "pegawai",
    roles: ["ADMIN"],
    tersedia: false,
  },
];

/** Menu yang boleh dilihat pegawai dengan role tersebut. */
export function menuUntuk(roles: readonly Role[]): MenuDashboard[] {
  return MENU_DASHBOARD.filter((m) => m.roles.length === 0 || punyaAkses(roles, m.roles));
}
