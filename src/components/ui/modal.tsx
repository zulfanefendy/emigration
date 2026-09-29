"use client";

import { TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

// Modal memakai elemen <dialog> bawaan browser: fokus terkunci di dalam modal,
// tombol Esc menutup, dan konten di belakangnya tidak bisa diklik.

type Ukuran = "sm" | "md" | "lg" | "xl";
const LEBAR: Record<Ukuran, string> = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

type PropsModal = {
  buka: boolean;
  onTutup: () => void;
  judul: ReactNode;
  deskripsi?: ReactNode;
  children?: ReactNode;
  /** Tombol-tombol di bagian bawah. */
  footer?: ReactNode;
  ukuran?: Ukuran;
  /** false = klik di luar modal tidak menutup (mis. saat form sedang diisi). */
  tutupSaatKlikLuar?: boolean;
};

export function Modal({ buka, onTutup, judul, deskripsi, children, footer, ukuran = "md", tutupSaatKlikLuar = true }: PropsModal) {
  const ref = useRef<HTMLDialogElement>(null);
  const idJudul = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (buka && !dialog.open) {
      dialog.showModal();
      // Fokus awal: elemen ber-data-autofocus, lalu input pertama, lalu dialog itu sendiri
      // (bukan tombol tutup, yang dipilih browser secara bawaan).
      const sasaran =
        dialog.querySelector<HTMLElement>("[data-autofocus]") ??
        dialog.querySelector<HTMLElement>("input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea:not(:disabled)");
      (sasaran ?? dialog).focus();
    }
    if (!buka && dialog.open) dialog.close();
  }, [buka]);

  return (
    <dialog
      ref={ref}
      onClose={onTutup}
      onClick={(e) => {
        if (tutupSaatKlikLuar && e.target === ref.current) onTutup();
      }}
      aria-labelledby={idJudul}
      tabIndex={-1}
      className={cn(
        "m-auto outline-none w-[calc(100%-2rem)] rounded-2xl border border-border bg-surface p-0 text-fg shadow-2xl",
        "backdrop:bg-[#0b1420]/60 backdrop:backdrop-blur-[2px]",
        "open:animate-[modal-masuk_160ms_ease-out]",
        LEBAR[ukuran],
      )}
    >
      {buka && (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <h2 id={idJudul} className="text-lg font-semibold text-fg">
                {judul}
              </h2>
              {deskripsi && <p className="mt-0.5 text-sm text-fg-muted">{deskripsi}</p>}
            </div>
            <button
              type="button"
              onClick={onTutup}
              aria-label="Tutup"
              className="-m-1 flex size-8 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {children && <div className="overflow-y-auto px-5 py-4">{children}</div>}
          {footer && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-surface-muted/50 px-5 py-3">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}

// ---------------------------------------------------------------------------
// Konfirmasi: const { konfirmasi, elemenKonfirmasi } = useKonfirmasi();
//   if (await konfirmasi({ judul: "Hapus pegawai?", bahaya: true })) { ... }
// Render {elemenKonfirmasi} sekali di komponen tersebut.
// ---------------------------------------------------------------------------

type OpsiKonfirmasi = {
  judul: string;
  pesan?: ReactNode;
  labelYa?: string;
  labelBatal?: string;
  /** Tombol merah + ikon peringatan, untuk aksi yang tidak bisa dibatalkan. */
  bahaya?: boolean;
};

export function useKonfirmasi() {
  const [opsi, setOpsi] = useState<OpsiKonfirmasi | null>(null);
  const penyelesai = useRef<(ya: boolean) => void>(undefined);

  const konfirmasi = useCallback((o: OpsiKonfirmasi) => {
    setOpsi(o);
    return new Promise<boolean>((resolve) => {
      penyelesai.current = resolve;
    });
  }, []);

  const selesai = (ya: boolean) => {
    penyelesai.current?.(ya);
    penyelesai.current = undefined;
    setOpsi(null);
  };

  const elemenKonfirmasi = (
    <Modal
      buka={opsi !== null}
      onTutup={() => selesai(false)}
      ukuran="sm"
      judul={
        <span className="flex items-center gap-2">
          {opsi?.bahaya && <TriangleAlert className="size-5 text-danger" aria-hidden />}
          {opsi?.judul}
        </span>
      }
      footer={
        <>
          <Button varian="outline" onClick={() => selesai(false)} data-autofocus={opsi?.bahaya || undefined}>
            {opsi?.labelBatal ?? "Batal"}
          </Button>
          <Button varian={opsi?.bahaya ? "danger" : "primary"} onClick={() => selesai(true)} data-autofocus={!opsi?.bahaya || undefined}>
            {opsi?.labelYa ?? "Ya, lanjutkan"}
          </Button>
        </>
      }
    >
      {opsi?.pesan && <div className="text-sm text-fg-muted">{opsi.pesan}</div>}
    </Modal>
  );

  return { konfirmasi, elemenKonfirmasi };
}
