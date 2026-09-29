import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import { SKRIP_TEMA } from "@/lib/tema";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Verifikasi Digital CPMI & OPP", template: "%s | BP3MI Lampung" },
  description: "Sistem verifikasi digital CPMI dan Orientasi Pra Pemberangkatan BP3MI Lampung",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme diisi SKRIP_TEMA sebelum hydrate, jadi atributnya memang bisa berbeda dari HTML server.
    <html lang="id" data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
