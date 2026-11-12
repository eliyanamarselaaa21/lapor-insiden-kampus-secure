/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pengaturan keamanan HTTP Header & Next.js Engine
  // 1. Sembunyikan header 'X-Powered-By' agar penyerang tidak mudah mengetahui teknologi server
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
