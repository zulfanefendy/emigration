import type { Role } from "./role";

// Menu dashboard per role, mengikuti Use Case Diagram dari PM.
// `tersedia: false` = modul belum dibuat; ubah saat halamannya sudah ada.
export type MenuDashboard = {
  href: string;
  judul: string;
  deskripsi: string;
  roles: Role[];
  tersedia: boolean;
};

export const MENU_DASHBOARD: MenuDashboard[] = [
  {
    href: "/dashboard/verifikasi",
    judul: "Verifikasi Loket",
    deskripsi: "Daftar antrean hari ini, panggil CPMI, verifikasi berkas fisik.",
    roles: ["VERIFIKATOR"],
    tersedia: false,
  },
  {
    href: "/dashboard/kegiatan-opp",
    judul: "Kegiatan OPP",
    deskripsi: "Buat kegiatan, atur kurikulum, SK & SPT, QR presensi, LPJ, SRIKANDI.",
    roles: ["PENGELOLA_KELAS", "PENANGGUNG_JAWAB"],
    tersedia: false,
  },
  {
    href: "/dashboard/jadwal-mengajar",
    judul: "Jadwal Mengajar",
    deskripsi: "Materi dan jadwal OPP yang ditugaskan kepada Anda.",
    roles: ["INSTRUKTUR"],
    tersedia: false,
  },
  {
    href: "/dashboard/materi",
    judul: "Master Materi OPP",
    deskripsi: "Kelola daftar materi dan durasi jam pelajaran.",
    roles: ["PENGELOLA_KELAS"],
    tersedia: false,
  },
  {
    href: "/dashboard/pegawai",
    judul: "Pegawai & Role",
    deskripsi: "Kelola akun pegawai dan hak aksesnya.",
    roles: ["ADMIN"],
    tersedia: false,
  },
];
