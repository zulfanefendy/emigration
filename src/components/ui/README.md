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
