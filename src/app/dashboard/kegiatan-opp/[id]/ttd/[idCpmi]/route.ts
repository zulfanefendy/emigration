import { wajibRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { UUID } from "../../../data";

// Gambar tanda tangan presensi satu peserta (disimpan sebagai PNG base64).
export async function GET(_req: Request, { params }: RouteContext<"/dashboard/kegiatan-opp/[id]/ttd/[idCpmi]">) {
  await wajibRole("PENGELOLA_KELAS", "PENANGGUNG_JAWAB");
  const { id, idCpmi } = await params;
  if (!UUID.test(id) || !UUID.test(idCpmi)) return new Response("Tidak ditemukan", { status: 404 });

  const presensi = await prisma.presensiOpp.findUnique({
    where: { idKegiatanOpp_idCpmi: { idKegiatanOpp: id, idCpmi } },
    select: { tandaTanganPng: true },
  });
  const base64 = presensi?.tandaTanganPng.split(",")[1];
  if (!base64) return new Response("Tidak ditemukan", { status: 404 });

  return new Response(new Uint8Array(Buffer.from(base64, "base64")), {
    headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=3600" },
  });
}
