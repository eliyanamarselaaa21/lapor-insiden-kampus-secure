// ===================================================================
// Next.js Middleware untuk Proteksi Rute & Otorisasi RBAC (src/middleware.ts)
//
// ALASAN KEAMANAN (Materi Demo Cyber Security):
// 1. Eksekusi di Garis Depan (Edge Route Protection):
//    Middleware mencegat setiap request sebelum halaman dirender. Pengguna
//    tanpa otentikasi tidak akan pernah bisa mengakses komponen atau data privat.
// 2. Penegakan Role-Based Access Control (RBAC):
//    - Tamu (belum login) -> Dilarang masuk ke rute /dashboard atau /admin, diarahkan ke /login.
//    - Peran USER (Mahasiswa) -> Dilarang mengakses area investigasi /admin, diarahkan ke /dashboard.
//    - Peran ADMIN (Petugas) -> Dilarang mengakses area pelapor biasa /dashboard, diarahkan ke /admin.
// 3. Verifikasi Kriptografis Tanpa Akses Database (Stateless Token Verification):
//    Menggunakan fungsi verifyToken (HS256 Web Crypto via 'jose'). Token divalidasi
//    secara matematis di Edge tanpa membebani koneksi database Neon.
// 4. Perlindungan Otomatis Terhadap Sesi yang Sudah Login:
//    Pengguna yang sudah login dicegah mengakses kembali halaman /login atau /register
//    dan langsung diarahkan ke dashboard masing-masing.
// ===================================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifyToken } from "@/lib/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Ambil token sesi dari cookie HttpOnly
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 2. Verifikasi keaslian tanda tangan token JWT
  const session = sessionCookie ? await verifyToken(sessionCookie) : null;
  const isAuthenticated = !!session;
  const userRole = session?.role;

  // Rute-rute yang dilindungi
  const isAdminRoute = pathname.startsWith("/admin");
  const isUserRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/lapor");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

  // -----------------------------------------------------------------
  // KASUS A: Pengguna belum terautentikasi (Tamu)
  // -----------------------------------------------------------------
  if (!isAuthenticated && (isAdminRoute || isUserRoute)) {
    // Arahkan ke halaman login dan simpan tujuan awal untuk redirect setelah login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // -----------------------------------------------------------------
  // KASUS B: Pengguna SUDAH login tetapi mengakses halaman /login atau /register
  // -----------------------------------------------------------------
  if (isAuthenticated && isAuthRoute) {
    if (userRole === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // -----------------------------------------------------------------
  // KASUS C: Pelanggaran Akses RBAC (User Mahasiswa mencoba masuk ke /admin)
  // -----------------------------------------------------------------
  if (isAdminRoute && userRole !== "ADMIN") {
    // Tolak akses mahasiswa ke portal admin keamanan kampus
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // -----------------------------------------------------------------
  // KASUS D: Petugas Admin mengakses dashboard mahasiswa (/dashboard)
  // -----------------------------------------------------------------
  if (isUserRoute && userRole === "ADMIN") {
    // Alihkan petugas ke konsol investigasi admin
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Izinkan request melanjutkan ke halaman tujuan jika semua pemeriksaan lolos
  return NextResponse.next();
}

// Konfigurasi matcher: Jalankan middleware untuk semua rute kecuali file statis & internal Next.js
export const config = {
  matcher: [
    /*
     * Cocokkan semua path request kecuali:
     * - api (API route handlers)
     * - _next/static (file statis CSS, JS bundle)
     * - _next/image (optimasi gambar Next.js)
     * - favicon.ico, file logo/gambar dengan ekstensi (.svg, .png, .jpg, dll)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
