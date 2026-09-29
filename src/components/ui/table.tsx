import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

// Tabel data sederhana. Bungkus dengan <Card> agar berbingkai; di layar sempit
// tabel bisa digeser ke samping tanpa membuat halaman ikut melebar.

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("bg-surface-muted/60 text-left text-xs font-semibold text-fg-muted uppercase", className)} {...props} />;
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return <th className={cn("px-4 py-3 whitespace-nowrap", className)} {...props} />;
}

export function Tr({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("border-t border-border", className)} {...props} />;
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-middle text-fg", className)} {...props} />;
}

/** Baris pengganti saat tabel tidak berisi data. */
export function TableKosong({ kolom, children }: { kolom: number; children: ReactNode }) {
  return (
    <tr className="border-t border-border">
      <td colSpan={kolom} className="px-4 py-10 text-center text-sm text-fg-muted">
        {children}
      </td>
    </tr>
  );
}
