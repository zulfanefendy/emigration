-- Kegiatan OPP hanya dua skema: P TO P dan MANDIRI.
-- CPMI Mandiri Reguler dan Mandiri SSW sama-sama ikut OPP Mandiri.
CREATE TYPE "skema_opp_enum" AS ENUM ('P TO P', 'MANDIRI');

ALTER TABLE "kegiatan_opp"
  ALTER COLUMN "skema_opp" SET DATA TYPE "skema_opp_enum"
  USING (CASE WHEN "skema_opp" = 'P TO P' THEN 'P TO P' ELSE 'MANDIRI' END)::"skema_opp_enum";
