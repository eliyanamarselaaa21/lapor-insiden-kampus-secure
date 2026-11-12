/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// ===================================================================
// KONFIGURASI CONTENT SECURITY POLICY (CSP)
// Standar Keamanan OWASP untuk Aplikasi Modern Next.js:
// 1. default-src 'self'       : Hanya izinkan resource dari domain sendiri.
// 2. script-src               : 'self', 'unsafe-inline', 'unsafe-eval' (diperlukan Next.js untuk hidrasi & rendering).
// 3. style-src                : 'self', 'unsafe-inline' (diperlukan Tailwind CSS & styling dinamis).
// 4. img-src                  : 'self', data:, blob: (izinkan aset gambar lokal dan SVG/data-URI).
// 5. font-src 'self'          : Hanya font dari origin aplikasi.
// 6. object-src 'none'        : Blokir plugin berisiko tinggi (Flash, Java Applet, ActiveX).
// 7. base-uri 'self'          : Cegah manipulasi tag <base> untuk pembajakan URL relatif (Anti-Base Tag Hijacking).
// 8. form-action 'self'       : Formulir hanya boleh mengirim data ke origin sistem sendiri.
// 9. frame-ancestors 'none'   : Cegah website dimuat di dalam <iframe> situs lain (Mitigasi Clickjacking).
// 10. upgrade-insecure-requests : Paksa seluruh request HTTP ditingkatkan ke HTTPS (Production).
// ===================================================================
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
  ${isProd ? "upgrade-insecure-requests;" : ""}
`.replace(/\s{2,}/g, " ").trim();

// Daftar HTTP Security Headers Lengkap
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    // Mitigasi Clickjacking: Larang browser memuat situs di dalam <iframe> atau <frame>
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Mitigasi MIME-Sniffing: Paksa browser mematuhi Content-Type yang dideklarasikan server
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Kebijakan Referrer: Lindungi privasi URL saat navigasi lintas domain
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Batasi akses API peramban terhadap perangkat keras sensitif (Kamera, Mic, GPS)
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    // HSTS (HTTP Strict Transport Security): Wajibkan peramban selalu memakai HTTPS selama 2 tahun
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Kontrol DNS Prefetching
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig = {
  // Sembunyikan header 'X-Powered-By: Next.js' (Pencegahan Information Gathering / Server Fingerprinting)
  poweredByHeader: false,
  reactStrictMode: true,

  // Pasang security headers di semua rute aplikasi
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
