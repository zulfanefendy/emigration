import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

// Satu gaya untuk semua kontrol form: teks gelap di atas putih, border yang
// jelas terlihat (kontras >= 3:1), placeholder abu tua, readonly berlatar abu.
const KELAS_KONTROL = cn(
  "w-full rounded-lg border border-input-border bg-input px-3 text-[15px] text-fg",
  "placeholder:text-fg-subtle",
  "focus:border-brand focus:ring-4 focus:ring-ring focus:outline-none dark:focus:border-brand-text",
  "read-only:bg-input-readonly disabled:cursor-not-allowed disabled:bg-input-readonly disabled:opacity-80",
  "aria-invalid:border-danger aria-invalid:focus:ring-danger/25",
);

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(KELAS_KONTROL, "h-10", className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={rows} className={cn(KELAS_KONTROL, "py-2", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(KELAS_KONTROL, "h-10 appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted"
      />
    </div>
  );
}

export function Checkbox({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4.5 shrink-0 cursor-pointer rounded border-input-border accent-brand",
        "focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none dark:accent-brand-text",
        className,
      )}
      {...props}
    />
  );
}
