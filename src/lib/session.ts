// ===================================================================
// Server Session & Security Context Helpers (src/lib/session.ts)
//
// ALASAN KEAMANAN (Materi Demo Cyber Security):
// 1. Verifikasi Sesi Terpusat (Centralized Session Verification):
//    Memeriksa keaslian token JWT langsung dari cookie HttpOnly pada Server Component
//    atau Server Action tanpa mengekspos kredensial ke client.
// 2. Proteksi Eksploitasi ID (Anti-IDOR / Insecure Direct Object References):
//    Dengan mengambil identitas pengguna langsung dari sesi server (bukan dari input form/URL),
//    penyerang tidak dapat memalsukan ID pengguna lain saat melakukan tindakan.
// 3. Pencatatan Alamat IP Klien:
//    Mendeteksi IP asli pengguna (melewati reverse proxy/load balancer) untuk
//    keperluan pelacakan jejak audit (Audit Trail) dan mitigasi serangan.
// ===================================================================

import { cookies, headers } from "next/headers";
import { SESSION_COOKIE_NAME, verifyToken, type SessionPayload } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

/**
 * Mengambil data sesi pengguna saat ini langsung dari verifikasi token JWT di cookie.
 * @returns SessionPayload jika token valid, atau null jika tidak ada sesi aktif.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return await verifyToken(token);
}

/**
 * Mengambil data lengkap profil pengguna dari database berdasarkan sesi aktif.
 * Menggunakan teknik projection (select) untuk memastikan hash password tidak ikut terambil.
 */
export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

/**
 * Penjaga Akses Server: Wajibkan pengguna sudah login.
 * Melempar error atau mengembalikan sesi valid.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Akses ditolak: Anda harus masuk terlebih dahulu.");
  }
  return session;
}

/**
 * Penjaga Akses Server: Wajibkan pengguna memiliki peran ADMIN.
 * Menegakkan Role-Based Access Control (RBAC) pada lapisan server.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    throw new Error("Akses ditolak: Hanya Tim Keamanan (Admin) yang diizinkan mengakses fungsi ini.");
  }
  return session;
}

/**
 * Mengambil alamat IP pengirim request dari header HTTP standar.
 * Berguna untuk pencatatan ActivityLog dan deteksi anomali keamanan.
 */
export function getClientIp(): string {
  const headerList = headers();
  // Header standar reverse proxy seperti Vercel, Cloudflare, atau Nginx
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = headerList.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
