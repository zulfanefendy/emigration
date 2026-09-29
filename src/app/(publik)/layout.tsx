import { FooterPublik } from "@/components/layout/footer-publik";
import { NavbarPublik } from "@/components/layout/navbar-publik";

// Layout untuk halaman yang diakses CPMI tanpa login (portal, pendaftaran, presensi).
export default function LayoutPublik({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavbarPublik />
      <main className="flex flex-1 flex-col">{children}</main>
      <FooterPublik />
    </>
  );
}
