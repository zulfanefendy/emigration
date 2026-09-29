"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { KUNCI_TEMA, type Tema } from "@/lib/tema";

// Tema terang/gelap. Pilihan disimpan di localStorage; bawaannya terang.
// Skrip anti-kedip ada di lib/tema.ts dan dipasang di root layout.

const pendengar = new Set<() => void>();

function temaSekarang(): Tema {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTema(tema: Tema) {
  document.documentElement.dataset.theme = tema;
  try {
    localStorage.setItem(KUNCI_TEMA, tema);
  } catch {
    // mode privat / storage diblokir: tema tetap berlaku untuk sesi ini
  }
  pendengar.forEach((f) => f());
}

export function useTema(): Tema {
  return useSyncExternalStore(
    (f) => {
      pendengar.add(f);
      return () => pendengar.delete(f);
    },
    temaSekarang,
    () => "light",
  );
}

export function ToggleTema({ className }: { className?: string }) {
  const tema = useTema();
  const gelap = tema === "dark";
  return (
    <button
      type="button"
      onClick={() => setTema(gelap ? "light" : "dark")}
      aria-label={gelap ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      title={gelap ? "Mode terang" : "Mode gelap"}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg transition-colors",
        "focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      {gelap ? <Sun className="size-[18px]" aria-hidden /> : <Moon className="size-[18px]" aria-hidden />}
    </button>
  );
}
