import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Tampil seketika saat menu diklik, selagi server mengambil data halaman
// tujuan, sehingga perpindahan tidak terasa macet.
export default function MemuatDashboard() {
  return (
    <div role="status" aria-label="Memuat halaman">
      <div className="mb-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>
      <Card>
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-border px-5 py-4 first:border-t-0">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </Card>
    </div>
  );
}
