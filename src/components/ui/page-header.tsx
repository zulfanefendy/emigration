import type { ReactNode } from "react";

type PropsPageHeader = { judul: ReactNode; deskripsi?: ReactNode; aksi?: ReactNode };

/** Judul halaman dashboard + tombol aksi di kanan (mis. "Tambah Pegawai"). */
export function PageHeader({ judul, deskripsi, aksi }: PropsPageHeader) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{judul}</h1>
        {deskripsi && <p className="mt-1 text-sm text-fg-muted">{deskripsi}</p>}
      </div>
      {aksi && <div className="flex flex-wrap items-center gap-2">{aksi}</div>}
    </div>
  );
}
