import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Sesi stateless: cookie berisi JWT bertanda tangan (HS256) yang hanya memuat
// id pegawai. Role dan status aktif selalu dibaca ulang dari database di dal.ts,
// jadi pegawai yang dinonaktifkan langsung kehilangan akses.

export const NAMA_COOKIE_SESI = "sesi";
const DURASI_SESI_MS = 8 * 60 * 60 * 1000; // satu shift kerja

type PayloadSesi = { idPegawai: string };

function kunciSesi() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET belum diset atau kurang dari 32 karakter.");
  }
  return new TextEncoder().encode(secret);
}

export async function enkripsiSesi(payload: PayloadSesi, kedaluwarsa: Date) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(kedaluwarsa)
    .sign(kunciSesi());
}

export async function dekripsiSesi(token: string | undefined): Promise<PayloadSesi | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunciSesi(), { algorithms: ["HS256"] });
    return typeof payload.idPegawai === "string" ? { idPegawai: payload.idPegawai } : null;
  } catch {
    return null;
  }
}

export async function buatSesi(idPegawai: string) {
  const kedaluwarsa = new Date(Date.now() + DURASI_SESI_MS);
  const token = await enkripsiSesi({ idPegawai }, kedaluwarsa);
  (await cookies()).set(NAMA_COOKIE_SESI, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: kedaluwarsa,
    path: "/",
  });
}

export async function hapusSesi() {
  (await cookies()).delete(NAMA_COOKIE_SESI);
}
