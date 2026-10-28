-- Gaji jadi teks bebas agar mata uang negara penempatan ikut tercatat.
-- Data lama dikonversi apa adanya (mis. 25000.00 -> '25000.00').
ALTER TABLE "cpmi" ALTER COLUMN "gaji" SET DATA TYPE VARCHAR(100) USING "gaji"::text;
