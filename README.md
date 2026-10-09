# Emigration — Verifikasi CPMI & OPP BP3MI Lampung

Capstone Project Kelompok A. Aplikasi verifikasi digital Calon Pekerja Migran Indonesia (CPMI)
dan Orientasi Pra Pemberangkatan (OPP).

- Dev: https://dev.31capsuta.com (branch `develop`)
- Prod: https://31capsuta.com (branch `main`)

Stack: Next.js 16 (App Router, Server Actions) · React 19 · Tailwind CSS 4 · Prisma 7 + PostgreSQL · Zod.

## Menjalankan di laptop sendiri

Butuh **Node.js 22** dan **PostgreSQL** (versi 15 ke atas; boleh instalasi biasa atau Docker).

```bash
git clone https://github.com/zulfanefendy/emigration.git
cd emigration
git checkout develop
npm install

cp .env.example .env          # lalu isi DATABASE_URL, SEED_ADMIN_PASSWORD, SESSION_SECRET
npx prisma generate           # wajib: client Prisma tidak ikut di-commit
npx prisma migrate dev        # buat tabel di database lokal
npx prisma db seed            # role, materi contoh, akun admin

npm run dev                   # http://localhost:3000
```

Login di `/login` dengan `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

Belum punya Postgres? Paling cepat lewat Docker:

```bash
docker run -d --name emigration-db -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=emigration postgres:17
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/emigration
```

> `npm run db:start|db:stop|db:status` hanya untuk Postgres terpisah di laptop Indrawan
> (port 5433). Atur `PG_BIN` dan `PG_DATA` bila ingin memakainya di laptop lain.

Perintah yang sering dipakai:

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run lint` | Cek ESLint |
| `npm run build` | Pastikan build produksi lolos sebelum PR |
| `npx prisma studio` | Lihat/ubah isi database lewat browser |
| `npx prisma migrate dev --name <nama>` | Buat migrasi setelah mengubah `schema.prisma` |

## Struktur folder

```
prisma/
  schema.prisma        skema database (sumber: query_capstone_project_postgre dari PM)
  migrations/          riwayat migrasi — jangan edit migrasi yang sudah di-merge
  seed.ts              data awal
src/app/
  (publik)/            halaman tanpa login: beranda, pendaftaran CPMI
  login/
  dashboard/<modul>/   satu folder per modul: page.tsx + actions.ts + komponen client
src/components/ui/     komponen bersama (Button, Card, Table, Modal, ...) — baca README di sana
src/lib/auth/          sesi, role, menu sidebar (menu.ts)
src/lib/               helper: prisma, form, paspor, whatsapp, ...
```

Contoh modul yang sudah jadi dan bisa ditiru polanya: `src/app/dashboard/materi` dan
`src/app/dashboard/pegawai`. Galeri komponen ada di `/dashboard/ui-kit`.

## Ikut mengerjakan

Baca **[CONTRIBUTING.md](CONTRIBUTING.md)** — alur branch, pembagian modul, dan aturan
mengubah skema database.
