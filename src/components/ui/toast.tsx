"use client";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { GAYA_PESAN, type JenisPesan } from "./nada";

// Notifikasi pop-up (toast). Bisa dipanggil dari komponen client mana pun:
//   toast.sukses("Data tersimpan")
//   toast.gagal("Gagal menyimpan", { deskripsi: "Coba lagi" })
// Dari server action yang diakhiri redirect ke halaman lain, pakai kirimFlash()
// di lib/flash.ts; <Toaster /> menampilkannya di halaman tujuan. Untuk action
// tanpa redirect, kembalikan state dari action lalu panggil toast di client.

type ItemToast = { id: number; jenis: JenisPesan; judul: string; deskripsi?: string; durasi: number };
type OpsiToast = { deskripsi?: string; /** ms; 0 = tidak hilang otomatis */ durasi?: number };

const DURASI_BAWAAN: Record<JenisPesan, number> = { sukses: 4000, info: 5000, peringatan: 6000, gagal: 8000 };
const MAKS_TOAST = 4;

let daftar: ItemToast[] = [];
let idBerikut = 1;
const pendengar = new Set<() => void>();

function ubah(baru: ItemToast[]) {
  daftar = baru;
  pendengar.forEach((f) => f());
}

function tambah(jenis: JenisPesan, judul: string, opsi: OpsiToast = {}) {
  const item: ItemToast = { id: idBerikut++, jenis, judul, deskripsi: opsi.deskripsi, durasi: opsi.durasi ?? DURASI_BAWAAN[jenis] };
  ubah([...daftar, item].slice(-MAKS_TOAST));
  return item.id;
}

export function tutupToast(id: number) {
  ubah(daftar.filter((t) => t.id !== id));
}

export const toast = {
  sukses: (judul: string, opsi?: OpsiToast) => tambah("sukses", judul, opsi),
  gagal: (judul: string, opsi?: OpsiToast) => tambah("gagal", judul, opsi),
  peringatan: (judul: string, opsi?: OpsiToast) => tambah("peringatan", judul, opsi),
  info: (judul: string, opsi?: OpsiToast) => tambah("info", judul, opsi),
};

// --- Flash dari server (cookie berumur pendek, lihat lib/flash.ts) ---
export const NAMA_COOKIE_FLASH = "flash";

function bacaFlash() {
  const mentah = document.cookie.split("; ").find((c) => c.startsWith(NAMA_COOKIE_FLASH + "="));
  if (!mentah) return;
  document.cookie = `${NAMA_COOKIE_FLASH}=; Max-Age=0; path=/`;
  try {
    const { jenis, judul, deskripsi } = JSON.parse(decodeURIComponent(mentah.slice(NAMA_COOKIE_FLASH.length + 1)));
    if (jenis in GAYA_PESAN && typeof judul === "string") tambah(jenis, judul, { deskripsi });
  } catch {
    // cookie rusak: abaikan
  }
}

// --- Tampilan ---
const langganan = (f: () => void) => {
  pendengar.add(f);
  return () => pendengar.delete(f);
};
const KOSONG: ItemToast[] = [];

/** Pasang sekali di root layout. */
export function Toaster() {
  const items = useSyncExternalStore(langganan, () => daftar, () => KOSONG);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(bacaFlash, [pathname]);

  // Wadah toast dijadikan popover agar berada di "top layer" browser, sehingga
  // tetap tampil di atas <dialog> modal. Dibuka ulang tiap ada toast baru supaya
  // selalu menjadi lapisan paling atas.
  useEffect(() => {
    const el = ref.current;
    if (!el?.showPopover) return;
    if (el.matches(":popover-open")) el.hidePopover();
    if (items.length > 0) el.showPopover();
  }, [items.length]);

  return (
    <div
      ref={ref}
      popover="manual"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 bottom-auto m-0 flex h-auto w-auto flex-col items-center gap-2 overflow-visible border-0 bg-transparent p-4",
        "sm:left-auto sm:items-end",
      )}
    >
      {items.map((t) => (
        <KartuToast key={t.id} item={t} />
      ))}
    </div>
  );
}

function KartuToast({ item }: { item: ItemToast }) {
  const gaya = GAYA_PESAN[item.jenis];
  const Ikon = gaya.ikon;

  useEffect(() => {
    if (!item.durasi) return;
    const timer = setTimeout(() => tutupToast(item.id), item.durasi);
    return () => clearTimeout(timer);
  }, [item.id, item.durasi]);

  return (
    <div
      role={item.jenis === "gagal" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm animate-[toast-masuk_180ms_ease-out] gap-3 rounded-xl border bg-surface p-4 shadow-lg",
        "border-border border-l-4",
        {
          sukses: "border-l-success",
          gagal: "border-l-danger",
          peringatan: "border-l-warning",
          info: "border-l-brand-text",
        }[item.jenis],
      )}
    >
      <Ikon className={cn("mt-0.5 size-5 shrink-0", gaya.ikonWarna)} aria-hidden />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-fg">{item.judul}</p>
        {item.deskripsi && <p className="mt-0.5 text-fg-muted">{item.deskripsi}</p>}
      </div>
      <button
        type="button"
        onClick={() => tutupToast(item.id)}
        aria-label="Tutup notifikasi"
        className="-m-1 flex size-7 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-muted hover:text-fg"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
