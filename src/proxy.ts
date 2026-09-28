import { NextResponse, type NextRequest } from "next/server";
import { NAMA_COOKIE_SESI, dekripsiSesi } from "@/lib/auth/session";

// Pemeriksaan optimistis: hanya membaca cookie, tanpa query database.
// Pemeriksaan sebenarnya (akun aktif, role) tetap dilakukan di lib/auth/dal.ts.
//
// /login sengaja tidak diarahkan ke /dashboard di sini: bila cookie masih valid
// tetapi akun sudah dinonaktifkan, itu akan menimbulkan redirect bolak-balik.
export async function proxy(request: NextRequest) {
  const sesi = await dekripsiSesi(request.cookies.get(NAMA_COOKIE_SESI)?.value);
  if (!sesi) return NextResponse.redirect(new URL("/login", request.nextUrl));
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
