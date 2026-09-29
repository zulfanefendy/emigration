import "server-only";
import { cookies } from "next/headers";
import type { JenisPesan } from "@/components/ui/nada";

// Notifikasi dari server action yang berakhir dengan redirect():
//   await kirimFlash("sukses", "Pegawai berhasil ditambahkan");
//   redirect("/dashboard/pegawai");
// Pesan disimpan di cookie singkat lalu ditampilkan <Toaster /> di halaman tujuan.
// Cookie sengaja tidak httpOnly karena dibaca oleh browser; jangan isi data sensitif.
export async function kirimFlash(jenis: JenisPesan, judul: string, deskripsi?: string) {
  (await cookies()).set("flash", JSON.stringify({ jenis, judul, deskripsi }), {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
  });
}
