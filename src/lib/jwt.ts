// ===================================================================
// Utilitas Manajemen Sesi JWT & Cookie Aman (src/lib/jwt.ts)
// Menggunakan library resmi modern: "jose"
//
// ALASAN KEAMANAN (Materi Demo Cyber Security):
// 1. Kenapa library "jose"?
//    "jose" adalah pustaka kriptografi modern berbasis Web Crypto API standar,
//    ringan, aman, serta kompatibel dengan Edge Runtime & Serverless di Next.js.
// 2. Mitigasi Algoritma "none" (Algorithm Confusion Attack):
//    Saat verifikasi, kita secara eksplisit mewajibkan algoritma HS256 (`algorithms: ["HS256"]`),
//    sehingga penyerang tidak bisa memalsukan token dengan header { "alg": "none" }.
// 3. Cookie Berkeamanan Tinggi (Defense-in-Depth):
//    - HttpOnly = true    -> Token tidak dapat dibaca oleh document.cookie di JavaScript (Anti-XSS).
//    - Secure = true      -> Cookie hanya ditransmisikan melalui koneksi terenkripsi HTTPS (di Production).
//    - SameSite = 'lax'   -> Cookie tidak disertakan pada request lintas situs berbahaya (Anti-CSRF).
//    - Path = '/'         -> Berlaku terpusat di seluruh sistem.
// 4. Zero Hardcoded Secret:
//    Kunci rahasia diambil dari process.env.JWT_SECRET (wajib minimal 32 karakter).
// ===================================================================

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Nama cookie sesi aplikasi
export const SESSION_COOKIE_NAME = "sipekan_session";

// Masa berlaku sesi (1 hari dalam hitungan detik)
export const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24; // 24 Jam

// Struktur data (payload) yang disimpan di dalam token JWT
export interface SessionPayload extends JWTPayload {
  userId: string;
  nama: string;
  email: string;
  role: "ADMIN" | "USER";
}

/**
 * Mendapatkan kunci kriptografis terenkode dari variabel lingkungan.
 * Memberikan validasi panjang kunci untuk memastikan kekuatan simetris algoritma HMAC-SHA256.
 */
function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "❌ KRITIKAL KEAMANAN: JWT_SECRET belum diatur atau panjangnya kurang dari 32 karakter di .env!"
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Membuat token JWT bertanda tangan digital (Digital Signature) untuk sesi pengguna.
 * @param payload Data identitas dan peran pengguna (userId, nama, email, role).
 * @param expiresIn Masa kedaluwarsa token (default: "1d" / 24 jam).
 * @returns String JWT terenkripsi dengan algoritma HS256.
 */
export async function signToken(
  payload: Omit<SessionPayload, "iat" | "exp">,
  expiresIn: string = "1d"
): Promise<string> {
  const secretKey = getJwtSecretKey();

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt() // Waktu diterbitkan (iat)
    .setExpirationTime(expiresIn) // Batas kedaluwarsa (exp)
    .sign(secretKey);
}

/**
 * Memvalidasi keaslian tanda tangan digital token JWT dan mengecek masa kedaluwarsa.
 * @param token String JWT yang diterima dari cookie request.
 * @returns SessionPayload jika valid dan belum kedaluwarsa, atau null jika manipulasi terdeteksi.
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const secretKey = getJwtSecretKey();

    // Verifikasi tanda tangan digital & tolak algoritma selain HS256
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    return payload as SessionPayload;
  } catch (error) {
    // Jika token kedaluwarsa, signature rusak, atau dimanipulasi, tolak sesi (return null)
    return null;
  }
}

/**
 * Pengaturan Atribut Keamanan Cookie Sesi
 * Disesuaikan dengan rekomendasi OWASP untuk pencegahan XSS dan CSRF.
 */
export const SESSION_COOKIE_OPTIONS = {
  name: SESSION_COOKIE_NAME,
  httpOnly: true, // WAJIB: Browser memblokir akses JavaScript (document.cookie) ke token ini
  secure: process.env.NODE_ENV === "production", // Hanya dikirim melalui saluran HTTPS di production
  sameSite: "lax" as const, // Perlindungan terhadap serangan Cross-Site Request Forgery (CSRF)
  path: "/",
  maxAge: SESSION_EXPIRATION_SECONDS,
};
