# Komponen UI

Contoh hidup semua komponen: buka **`/dashboard/ui-kit`** (login dulu; tidak tersedia di server produksi).

## Aturan warna
- Pakai **token semantik**, jangan warna mentah (`bg-white`, `text-gray-500`, `#11375C`).
  Token otomatis menyesuaikan mode terang/gelap dan kontrasnya sudah dicek (WCAG AA).
- Token yang tersedia (lihat `src/app/globals.css`):
  - Latar: `bg-background` (halaman), `bg-surface` (kartu), `bg-surface-muted`
  - Teks: `text-fg` (utama), `text-fg-muted` (sekunder), `text-fg-subtle` (placeholder)
  - Garis: `border-border`, `border-input-border`
  - Brand: `bg-brand` / `text-brand-fg`, `bg-brand-soft` / `text-brand-text`, `bg-aksen` / `text-aksen-fg`
  - Status: `text-success` / `bg-success-soft`, `text-danger` / `bg-danger-soft`, `text-warning` / `bg-warning-soft`
- Kebutuhan khusus mode gelap: varian `dark:` (mis. `dark:text-brand-text`).

## Ikon
Hanya dari [`lucide-react`](https://lucide.dev/icons). Ikon dekoratif beri `aria-hidden`;
tombol yang hanya berisi ikon wajib punya `aria-label`.

## Pola umum

```tsx
// Form dengan server action
<Field htmlFor="nama" label="Nama Lengkap" wajib error={state?.errors?.nama}>
  <Input id="nama" name="nama" aria-invalid={!!state?.errors?.nama || undefined} aria-describedby={idPesanField("nama")} />
</Field>
<Button type="submit" memuat={pending} ikon={<Save />}>Simpan</Button>

// Notifikasi dari komponen client
toast.sukses("Data tersimpan");
toast.gagal("Gagal menyimpan", { deskripsi: "Coba lagi" });

// Notifikasi dari server action yang redirect ke halaman lain
await kirimFlash("sukses", "Pegawai ditambahkan"); // import dari "@/lib/flash"
redirect("/dashboard/pegawai");

// Konfirmasi sebelum aksi berbahaya
const { konfirmasi, elemenKonfirmasi } = useKonfirmasi();
if (await konfirmasi({ judul: "Hapus pegawai?", bahaya: true })) { ... }
// render {elemenKonfirmasi} sekali di komponen

// Modal
<Modal buka={buka} onTutup={() => setBuka(false)} judul="Tambah Materi" footer={<Button>Simpan</Button>}>
  ...isi form...
</Modal>

// Tabel data (bungkus dengan <Card>)
<Table><THead><tr><Th>Nama</Th></tr></THead>
  <tbody>{baris.length ? baris.map(b => <Tr key={b.id}><Td>{b.nama}</Td></Tr>) : <TableKosong kolom={1}>Belum ada data.</TableKosong>}</tbody>
</Table>

// Form di modal: pakai onSubmit + startTransition(() => action(formData)),
// bukan action={...}, agar isian tidak dikosongkan saat validasi gagal.
// Contoh lengkap: src/app/dashboard/materi/daftar-materi.tsx

// Badge status domain
<BadgeStatusVerifikasi status={v.statusVerifikasi} />   // dari "@/components/status"
```

## Halaman baru di dashboard
1. Buat `src/app/dashboard/<modul>/page.tsx`, panggil `await wajibRole("ROLE")` di awal.
2. Mulai dengan `<PageHeader judul="..." aksi={...} />`.
3. Set `tersedia: true` untuk menu tersebut di `src/lib/auth/menu.ts`.

## Animasi
Semua gerakan memakai satu kurva (`ease-halus`) dan durasi yang sama agar terasa seragam.
Pengguna yang mengaktifkan "kurangi gerakan" di sistem operasinya otomatis tidak melihat animasi.

Yang sudah otomatis, tidak perlu ditambahkan lagi:
- **Pindah halaman**: `template.tsx` di `(publik)` dan `dashboard` memutar `animate-masuk` pada konten.
- **Memuat halaman dashboard**: `dashboard/loading.tsx` menampilkan skeleton selagi data diambil.
  Halaman yang tata letaknya sangat berbeda boleh punya `loading.tsx` sendiri di foldernya.
- **Tautan `#anchor`**: scroll halus (lihat `globals.css`).

Yang dipakai saat membuat halaman atau fitur baru:

```tsx
// Muncul saat pertama kali masuk layar (bagian halaman panjang, daftar kartu)
import { Muncul } from "@/components/muncul";
<Muncul>...</Muncul>
{items.map((x, i) => <Muncul key={x.id} as="li" tunda={i * 80}>...</Muncul>)}

// Muncul saat halaman dibuka, berurutan
<div className="animate-masuk [animation-delay:120ms]">...</div>

// Kartu yang bisa diklik: terangkat sedikit saat hover
<Card className="transition duration-300 ease-halus hover:-translate-y-0.5 hover:shadow-md">

// Placeholder data yang sedang dimuat
import { Skeleton } from "@/components/ui/skeleton";
<Skeleton className="h-4 w-40" />
```

Batasan:
- Jangan animasikan `width`, `height`, `top`, atau `left`. Pakai `transform` dan `opacity` supaya tetap mulus di HP.
  Untuk membuka/menutup tinggi, pakai trik `grid-rows-[0fr]` ke `grid-rows-[1fr]` (contoh: menu mobile di `navbar-publik.tsx`).
- Durasi 150 sampai 300 ms untuk hover dan klik, 400 sampai 650 ms untuk konten yang masuk. Lebih lama akan terasa lambat.
- Jangan memberi animasi masuk pada tabel atau form yang sering dibuka ulang. Cukup animasi halaman dari template.
