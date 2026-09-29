// template.tsx dibuat ulang setiap pindah halaman (beda dengan layout), jadi
// animasi masuk diputar tiap navigasi. Navbar dan footer di layout tetap diam.
export default function TemplatePublik({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 animate-masuk flex-col">{children}</div>;
}
