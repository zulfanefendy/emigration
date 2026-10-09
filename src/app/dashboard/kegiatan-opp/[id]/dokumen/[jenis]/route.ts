import { wajibRole } from "@/lib/auth/dal";
import { punyaAkses } from "@/lib/auth/role";
import { ambilKegiatan } from "../../../data";
import { buatDokumen, namaFileDokumen, type JenisDokumen } from "../buat-dokumen";

// "System Generate File .docx: SK OPP & SPT" (Flow Chart PM bagian 3).
// Instruktur hanya boleh mengunduh SPT Instruktur kegiatan yang ia ajar.

const JENIS: readonly JenisDokumen[] = ["sk", "spt-instruktur", "spt-pengelola"];

export async function GET(_req: Request, { params }: RouteContext<"/dashboard/kegiatan-opp/[id]/dokumen/[jenis]">) {
  const pegawai = await wajibRole("PENGELOLA_KELAS", "PENANGGUNG_JAWAB", "INSTRUKTUR");
  const { id, jenis } = await params;
  if (!JENIS.includes(jenis as JenisDokumen)) return new Response("Jenis dokumen tidak dikenal", { status: 404 });

  const kegiatan = await ambilKegiatan(id);
  if (!kegiatan) return new Response("Kegiatan tidak ditemukan", { status: 404 });

  if (!punyaAkses(pegawai.roles, ["PENGELOLA_KELAS", "PENANGGUNG_JAWAB"])) {
    const mengajar = kegiatan.kurikulum.some((s) => s.idInstruktur === pegawai.idPegawai);
    if (jenis !== "spt-instruktur" || !mengajar || !kegiatan.noSptInstruktur) {
      return new Response("Tidak punya akses ke dokumen ini", { status: 403 });
    }
  }

  const isi = await buatDokumen(jenis as JenisDokumen, kegiatan);
  return new Response(new Uint8Array(isi), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${namaFileDokumen(jenis as JenisDokumen, kegiatan)}"`,
      "Cache-Control": "no-store",
    },
  });
}
