import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIPEKAN - Sistem Pelaporan Insiden & Keamanan Kampus",
  description: "Aplikasi pelaporan insiden keamanan fisik, siber, dan pelanggaran tata tertib kampus yang aman dan terenkripsi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
