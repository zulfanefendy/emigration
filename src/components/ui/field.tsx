import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PropsField = {
  /** Harus sama dengan `id` pada input di dalamnya. */
  htmlFor: string;
  label: ReactNode;
  wajib?: boolean;
  /** Keterangan singkat di bawah input. */
  hint?: ReactNode;
  /** Pesan error; bisa langsung array dari z.flattenError(...).fieldErrors. */
  error?: string | string[];
  className?: string;
  children: ReactNode;
};

/**
 * Label + input + hint + error dalam satu paket.
 * Beri input `aria-invalid` dan `aria-describedby={idPesanField(id)}` agar
 * pembaca layar membacakan pesan error/hint.
 */
export function Field({ htmlFor, label, wajib, hint, error, className, children }: PropsField) {
  const pesanError = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-fg">
        {label}
        {wajib && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {pesanError ? (
        <p id={idPesanField(htmlFor)} className="flex items-center gap-1.5 text-sm font-medium text-danger">
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          {pesanError}
        </p>
      ) : (
        hint && (
          <p id={idPesanField(htmlFor)} className="text-sm text-fg-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function idPesanField(id: string) {
  return `${id}-pesan`;
}
