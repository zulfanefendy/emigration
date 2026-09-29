// Diputar ulang tiap pindah menu; sidebar dan topbar di layout tetap diam.
export default function TemplateDashboard({ children }: { children: React.ReactNode }) {
  return <div className="animate-masuk">{children}</div>;
}
