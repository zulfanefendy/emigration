import { Prisma } from "@/generated/prisma/client";

// Bentuk state yang dikembalikan server action form (dipakai dengan useActionState).
export type StateForm<Field extends string = string> = {
  errors?: Partial<Record<Field, string[]>>;
  /** Pesan umum di atas form. */
  pesan?: string;
  /** true = tersimpan; komponen client menutup modal dan menampilkan toast. */
  sukses?: boolean;
};

/**
 * true bila error berasal dari constraint unique. Action tetap mengecek
 * duplikat lebih dulu agar pesannya per kolom; ini jaring pengaman saat dua
 * orang menyimpan data yang sama di waktu bersamaan.
 */
export function isDuplikat(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/** Ambil string dari FormData; kosong/spasi menjadi undefined. */
export function teksOpsional(nilai: FormDataEntryValue | null): string | undefined {
  const s = typeof nilai === "string" ? nilai.trim() : "";
  return s === "" ? undefined : s;
}
