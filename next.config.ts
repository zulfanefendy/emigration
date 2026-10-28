import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Templat .docx SK/SPT dibaca dari disk saat runtime, jadi ikutkan ke build standalone.
  outputFileTracingIncludes: {
    "/dashboard/kegiatan-opp/*/dokumen/*": ["./templat-dokumen/**/*"],
  },
};

export default nextConfig;
