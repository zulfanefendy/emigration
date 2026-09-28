-- CreateEnum
CREATE TYPE "skema_pendaftaran_enum" AS ENUM ('P TO P', 'MANDIRI REGULER', 'MANDIRI SSW');

-- CreateEnum
CREATE TYPE "jenis_kelamin_enum" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "sektor_enum" AS ENUM ('FORMAL', 'INFORMAL');

-- CreateEnum
CREATE TYPE "status_verifikasi_enum" AS ENUM ('BELUM DIVERIFIKASI', 'SEDANG DIVERIFIKASI', 'PERLU REVISI', 'SUDAH SELESAI');

-- CreateEnum
CREATE TYPE "status_antrian_enum" AS ENUM ('MENUNGGU', 'DIPANGGIL', 'SELESAI', 'BATAL');

-- CreateTable
CREATE TABLE "pegawai" (
    "id_pegawai" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nip" VARCHAR(18) NOT NULL,
    "nama_lengkap" VARCHAR(150) NOT NULL,
    "jabatan" VARCHAR(100),
    "no_whatsapp" VARCHAR(20),
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pegawai_pkey" PRIMARY KEY ("id_pegawai")
);

-- CreateTable
CREATE TABLE "role" (
    "id_role" SERIAL NOT NULL,
    "nama_role" VARCHAR(50) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id_role")
);

-- CreateTable
CREATE TABLE "pegawai_role" (
    "id_pegawai" UUID NOT NULL,
    "id_role" INTEGER NOT NULL,

    CONSTRAINT "pegawai_role_pkey" PRIMARY KEY ("id_pegawai","id_role")
);

-- CreateTable
CREATE TABLE "materi_opp" (
    "id_materi" SERIAL NOT NULL,
    "kode_materi" VARCHAR(20) NOT NULL,
    "judul_materi" VARCHAR(200) NOT NULL,
    "deskripsi" TEXT,
    "durasi_jam_pelajaran" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materi_opp_pkey" PRIMARY KEY ("id_materi")
);

-- CreateTable
CREATE TABLE "cpmi" (
    "id_cpmi" UUID NOT NULL DEFAULT gen_random_uuid(),
    "no_paspor" VARCHAR(20) NOT NULL,
    "nik" VARCHAR(16),
    "nama_lengkap" VARCHAR(150) NOT NULL,
    "tempat_lahir" VARCHAR(100) NOT NULL,
    "tanggal_lahir" DATE NOT NULL,
    "jenis_kelamin" "jenis_kelamin_enum" NOT NULL,
    "alamat_lengkap" TEXT NOT NULL,
    "provinsi" VARCHAR(100) NOT NULL,
    "kabupaten_kota" VARCHAR(100) NOT NULL,
    "no_whatsapp" VARCHAR(20) NOT NULL,
    "pendidikan_terakhir" VARCHAR(50) NOT NULL,
    "asal_sekolah_instansi" VARCHAR(150) NOT NULL,
    "skema_pendaftaran" "skema_pendaftaran_enum" NOT NULL,
    "negara_penempatan" VARCHAR(100) NOT NULL,
    "sektor" "sektor_enum" NOT NULL,
    "jenis_pekerjaan" VARCHAR(150) NOT NULL,
    "nama_pengguna_jasa" VARCHAR(150) NOT NULL,
    "alamat_pengguna_jasa" TEXT NOT NULL,
    "gaji" DECIMAL(15,2) NOT NULL,
    "tanggal_rencana_verifikasi" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cpmi_pkey" PRIMARY KEY ("id_cpmi")
);

-- CreateTable
CREATE TABLE "antrian" (
    "id_antrian" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_cpmi" UUID NOT NULL,
    "no_antrian" VARCHAR(20) NOT NULL,
    "tanggal_antrian" DATE NOT NULL DEFAULT CURRENT_DATE,
    "status_antrian" "status_antrian_enum" NOT NULL DEFAULT 'MENUNGGU',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "antrian_pkey" PRIMARY KEY ("id_antrian")
);

-- CreateTable
CREATE TABLE "verifikasi_cpmi" (
    "id_verifikasi" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_cpmi" UUID NOT NULL,
    "id_verifikator" UUID,
    "status_verifikasi" "status_verifikasi_enum" NOT NULL DEFAULT 'BELUM DIVERIFIKASI',
    "waktu_mulai_verifikasi" TIMESTAMPTZ,
    "waktu_selesai_verifikasi" TIMESTAMPTZ,
    "catatan_verifikasi" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifikasi_cpmi_pkey" PRIMARY KEY ("id_verifikasi")
);

-- CreateTable
CREATE TABLE "kegiatan_opp" (
    "id_kegiatan_opp" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kode_kegiatan" VARCHAR(50) NOT NULL,
    "tanggal_pelaksanaan" DATE NOT NULL,
    "skema_opp" "skema_pendaftaran_enum" NOT NULL,
    "tempat_opp" VARCHAR(255) NOT NULL,
    "id_pengelola_kelas" UUID,
    "id_penanggung_jawab" UUID,
    "no_sk_opp" VARCHAR(100),
    "no_spt_instruktur" VARCHAR(100),
    "no_spt_pengelola" VARCHAR(100),
    "file_sk_opp_url" TEXT,
    "file_spt_instruktur_url" TEXT,
    "file_spt_pengelola_url" TEXT,
    "status_srikandi_upload" BOOLEAN NOT NULL DEFAULT false,
    "waktu_upload_srikandi" TIMESTAMPTZ,
    "is_cpmi_final" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kegiatan_opp_pkey" PRIMARY KEY ("id_kegiatan_opp")
);

-- CreateTable
CREATE TABLE "kurikulum_opp" (
    "id_kurikulum" SERIAL NOT NULL,
    "id_kegiatan_opp" UUID NOT NULL,
    "id_materi" INTEGER NOT NULL,
    "id_instruktur" UUID NOT NULL,
    "jam_mulai" TIME,
    "jam_selesai" TIME,

    CONSTRAINT "kurikulum_opp_pkey" PRIMARY KEY ("id_kurikulum")
);

-- CreateTable
CREATE TABLE "peserta_opp" (
    "id_kegiatan_opp" UUID NOT NULL,
    "id_cpmi" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "peserta_opp_pkey" PRIMARY KEY ("id_kegiatan_opp","id_cpmi")
);

-- CreateTable
CREATE TABLE "presensi_opp" (
    "id_presensi" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_kegiatan_opp" UUID NOT NULL,
    "id_cpmi" UUID NOT NULL,
    "waktu_scan" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_hadir" BOOLEAN NOT NULL DEFAULT true,
    "terima_toolkit" BOOLEAN NOT NULL DEFAULT false,
    "terima_konsumsi" BOOLEAN NOT NULL DEFAULT false,
    "tanda_tangan_png" TEXT NOT NULL,

    CONSTRAINT "presensi_opp_pkey" PRIMARY KEY ("id_presensi")
);

-- CreateIndex
CREATE UNIQUE INDEX "pegawai_nip_key" ON "pegawai"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "pegawai_email_key" ON "pegawai"("email");

-- CreateIndex
CREATE UNIQUE INDEX "role_nama_role_key" ON "role"("nama_role");

-- CreateIndex
CREATE UNIQUE INDEX "materi_opp_kode_materi_key" ON "materi_opp"("kode_materi");

-- CreateIndex
CREATE UNIQUE INDEX "cpmi_no_paspor_key" ON "cpmi"("no_paspor");

-- CreateIndex
CREATE UNIQUE INDEX "cpmi_nik_key" ON "cpmi"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_id_cpmi_key" ON "antrian"("id_cpmi");

-- CreateIndex
CREATE INDEX "idx_antrian_tgl_status" ON "antrian"("tanggal_antrian", "status_antrian");

-- CreateIndex
CREATE INDEX "idx_verifikasi_status" ON "verifikasi_cpmi"("status_verifikasi");

-- CreateIndex
CREATE UNIQUE INDEX "kegiatan_opp_kode_kegiatan_key" ON "kegiatan_opp"("kode_kegiatan");

-- CreateIndex
CREATE INDEX "idx_kegiatan_tgl" ON "kegiatan_opp"("tanggal_pelaksanaan");

-- CreateIndex
CREATE UNIQUE INDEX "kurikulum_opp_id_kegiatan_opp_id_materi_id_instruktur_key" ON "kurikulum_opp"("id_kegiatan_opp", "id_materi", "id_instruktur");

-- CreateIndex
CREATE UNIQUE INDEX "presensi_opp_id_kegiatan_opp_id_cpmi_key" ON "presensi_opp"("id_kegiatan_opp", "id_cpmi");

-- AddForeignKey
ALTER TABLE "pegawai_role" ADD CONSTRAINT "pegawai_role_id_pegawai_fkey" FOREIGN KEY ("id_pegawai") REFERENCES "pegawai"("id_pegawai") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pegawai_role" ADD CONSTRAINT "pegawai_role_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "role"("id_role") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "antrian" ADD CONSTRAINT "antrian_id_cpmi_fkey" FOREIGN KEY ("id_cpmi") REFERENCES "cpmi"("id_cpmi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifikasi_cpmi" ADD CONSTRAINT "verifikasi_cpmi_id_cpmi_fkey" FOREIGN KEY ("id_cpmi") REFERENCES "cpmi"("id_cpmi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifikasi_cpmi" ADD CONSTRAINT "verifikasi_cpmi_id_verifikator_fkey" FOREIGN KEY ("id_verifikator") REFERENCES "pegawai"("id_pegawai") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kegiatan_opp" ADD CONSTRAINT "kegiatan_opp_id_pengelola_kelas_fkey" FOREIGN KEY ("id_pengelola_kelas") REFERENCES "pegawai"("id_pegawai") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kegiatan_opp" ADD CONSTRAINT "kegiatan_opp_id_penanggung_jawab_fkey" FOREIGN KEY ("id_penanggung_jawab") REFERENCES "pegawai"("id_pegawai") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kurikulum_opp" ADD CONSTRAINT "kurikulum_opp_id_kegiatan_opp_fkey" FOREIGN KEY ("id_kegiatan_opp") REFERENCES "kegiatan_opp"("id_kegiatan_opp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kurikulum_opp" ADD CONSTRAINT "kurikulum_opp_id_materi_fkey" FOREIGN KEY ("id_materi") REFERENCES "materi_opp"("id_materi") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kurikulum_opp" ADD CONSTRAINT "kurikulum_opp_id_instruktur_fkey" FOREIGN KEY ("id_instruktur") REFERENCES "pegawai"("id_pegawai") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peserta_opp" ADD CONSTRAINT "peserta_opp_id_kegiatan_opp_fkey" FOREIGN KEY ("id_kegiatan_opp") REFERENCES "kegiatan_opp"("id_kegiatan_opp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peserta_opp" ADD CONSTRAINT "peserta_opp_id_cpmi_fkey" FOREIGN KEY ("id_cpmi") REFERENCES "cpmi"("id_cpmi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi_opp" ADD CONSTRAINT "presensi_opp_id_kegiatan_opp_fkey" FOREIGN KEY ("id_kegiatan_opp") REFERENCES "kegiatan_opp"("id_kegiatan_opp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi_opp" ADD CONSTRAINT "presensi_opp_id_cpmi_fkey" FOREIGN KEY ("id_cpmi") REFERENCES "cpmi"("id_cpmi") ON DELETE CASCADE ON UPDATE CASCADE;
