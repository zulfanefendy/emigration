import { connection } from "next/server";
import { Logo } from "@/components/logo";

// Label environment dibaca saat request (APP_ENV ditulis ke .env oleh workflow deploy).
const LABEL_ENV: Record<string, string> = { production: "", development: "Development" };

export async function FooterPublik() {
  await connection();
  const labelEnv = LABEL_ENV[process.env.APP_ENV ?? ""] ?? "Local";

  return (
    <footer className="bg-sidebar text-sidebar-fg">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo terang />
          <p className="mt-3 max-w-sm text-sm">
            Balai Pelayanan Pelindungan Pekerja Migran Indonesia (BP3MI) Lampung.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm md:items-end">
          <p>&copy; {new Date().getFullYear()} BP3MI Lampung. Capstone Project Kelompok A.</p>
          {labelEnv && (
            <span className="w-fit rounded-full bg-aksen px-2.5 py-0.5 text-xs font-semibold text-aksen-fg">
              Environment: {labelEnv}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
