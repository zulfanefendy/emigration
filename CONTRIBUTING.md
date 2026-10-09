# Panduan Kontribusi

## Alur branch

```
main      ← produksi (31capsuta.com). Hanya lewat PR dari develop, saat rilis.
develop   ← server dev (dev.31capsuta.com). Semua fitur masuk ke sini lewat PR.
feature/<modul>-<singkat>   ← tempat kamu bekerja
```

**Setiap push ke `develop` atau `main` langsung ter-deploy ke server.** Jadi jangan push
langsung ke dua branch itu; selalu lewat Pull Request.

1. Ambil versi terbaru: `git checkout develop && git pull`
2. Buat branch: `git checkout -b feature/verifikasi-panggil-antrean`
3. Commit kecil-kecil dengan pesan Bahasa Indonesia yang menjelaskan *apa* yang berubah
   (contoh: `Verifikasi: tombol panggil dan selesai antrean`).
4. Sebelum PR, sinkronkan dengan develop: `git pull origin develop` lalu bereskan konflik.
5. Pastikan `npm run lint` dan `npm run build` lolos.
6. Push branch-mu, buka PR ke **`develop`**, minta minimal 1 anggota lain me-review.
7. Setelah merge, hapus branch dan cek hasilnya di dev.31capsuta.com.

## Pembagian modul

Modul mengikuti BPMN / Use Case dari PM (dokumen ada di PM, tidak di repo).
Tulis nama penanggung jawab di kolom PIC.

| # | Modul | Folder | Tabel utama | Status | PIC |
| --- | --- | --- | --- | --- | --- |
| 0 | Fondasi: login, role, UI kit, Master Materi, Pegawai & Role | `dashboard/materi`, `dashboard/pegawai` | `Pegawai`, `Role`, `MateriOpp` | Selesai | Indrawan |
| 1 | Pendaftaran publik: cek paspor → formulir CPMI → tiket antrean (PDF) | `(publik)/pendaftaran` | `Cpmi`, `Antrian` | Selesai | Indrawan |
| 2 | Verifikasi loket: daftar antrean hari ini, panggil, Ambil → Sedang, Selesai / Revisi | `dashboard/verifikasi` | `Antrian`, `VerifikasiCpmi` | Selesai | Indrawan |
| 3 | Kegiatan OPP: buat kegiatan, kurikulum + instruktur, peserta, generate SK & SPT (.docx) | `dashboard/kegiatan-opp` | `KegiatanOpp`, `KurikulumOpp`, `PesertaOpp` | Selesai | Indrawan |
| 3b | Jadwal mengajar instruktur (lihat materi & jadwal yang ditugaskan) | `dashboard/jadwal-mengajar` | `KurikulumOpp` | Selesai | Indrawan |
| 4 | Presensi: QR per kegiatan, CPMI scan, tanda tangan di canvas, checklist toolkit/konsumsi | `(publik)/presensi`, `dashboard/kegiatan-opp` | `PresensiOpp` | Selesai | Indrawan |
| 5 | Penutupan: kunci final, LPJ (.xlsx), laporan harian WA, unggah ke SRIKANDI | `dashboard/kegiatan-opp`, `dashboard/laporan-harian` | `KegiatanOpp` | Selesai | Indrawan |

Urutan ketergantungan: **1 → 2** (verifikasi butuh data pendaftaran) dan **3 → 4 → 5**.
Jadi modul 1 dan 3 bisa dikerjakan bersamaan sejak awal; 2 dan 4 bisa mulai dengan data
dummy dari `prisma studio` sambil menunggu.

Modul 3, 4, 5 sama-sama di `dashboard/kegiatan-opp` — sepakati dulu pembagian sub-halamannya
(mis. `kegiatan-opp/[id]/presensi`, `kegiatan-opp/[id]/lpj`) supaya tidak saling timpa.

## File yang dipakai bersama (rawan konflik)

| File | Aturan |
| --- | --- |
| `prisma/schema.prisma` + `prisma/migrations/` | Lihat bagian *Mengubah skema* di bawah. |
| `src/lib/auth/menu.ts` | Saat halaman modulmu sudah bisa dipakai, ubah `tersedia: false` → `true` di entri modulmu saja. |
| `src/components/ui/*` | Boleh menambah komponen baru. Mengubah komponen yang sudah ada → kabari tim dulu, karena dipakai semua modul. |
| `prisma/seed.ts` | Tambah data seed di blok terpisah; jangan ubah blok milik modul lain. |
| `package.json` | Menambah library → sebutkan di deskripsi PR, dan commit `package-lock.json` juga. |

## Mengubah skema database

Skema sudah mencakup semua tabel dari PM. Kalau tetap perlu mengubah:

1. Diskusikan di grup dulu (kolom apa, untuk modul apa).
2. `git pull origin develop` **sebelum** membuat migrasi.
3. Ubah `schema.prisma`, lalu `npx prisma migrate dev --name <deskripsi_singkat>`.
4. Commit `schema.prisma` **dan** folder migrasi baru dalam satu PR, merge secepatnya —
   jangan biarkan PR berisi migrasi menggantung berhari-hari.
5. **Jangan pernah** mengedit atau menghapus folder migrasi yang sudah ada di `develop`.
   Kalau salah, buat migrasi baru yang memperbaikinya.

Setelah menarik perubahan skema dari teman: `npx prisma migrate dev` lalu `npx prisma generate`.

## Pola kode

- Halaman = Server Component (`page.tsx`) yang mengambil data lewat Prisma.
- Aksi ubah data = Server Action di `actions.ts`, validasi input dengan Zod, cek role
  dengan `wajibRole(...)` dari `src/lib/auth/dal.ts` di awal setiap action dan page. Lihat `dashboard/materi/actions.ts` sebagai contoh.
- Komponen interaktif (form, modal) = file terpisah dengan `"use client"`.
- Pakai komponen dari `src/components/ui` dan token warna semantik
  (aturannya di `src/components/ui/README.md`), jangan warna mentah.
- Nama variabel, fungsi, dan teks UI dalam Bahasa Indonesia, mengikuti kode yang sudah ada.
- Jangan commit `.env`, password, atau data CPMI asli.
