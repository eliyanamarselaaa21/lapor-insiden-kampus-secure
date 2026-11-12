// ===================================================================
// Prisma Client Singleton (src/lib/prisma.ts)
//
// ALASAN KEAMANAN & ARSITEKTUR:
// 1. Mencegah Connection Exhaustion (Kebocoran Koneksi Database):
//    Dalam mode development Next.js, setiap kali file disimpan (Hot Reload),
//    Node.js akan membuat instance baru. Jika tidak menggunakan pola Singleton,
//    koneksi ke Neon PostgreSQL akan cepat habis (error: "too many connections").
// 2. Keamanan Kueri:
//    Semua interaksi database wajib melalui client ini. Prisma secara internal
//    selalu menggunakan parameterized query (Prepared Statements) sehingga
//    kebal terhadap serangan SQL Injection (SQLi).
// ===================================================================

import { PrismaClient } from "@prisma/client";

// Fungsi pembuat instance Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient({
    // Catat log query di development untuk kemudahan audit/debug,
    // batasi hanya error di production untuk mencegah kebocoran informasi teknis.
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

// Deklarasi variabel global untuk menyimpan instance tunggal di lingkungan Node.js
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

// Gunakan instance yang sudah ada di globalThis jika ada, atau buat baru jika belum ada
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Simpan ke globalThis jika berada di lingkungan non-produksi (development / testing)
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
