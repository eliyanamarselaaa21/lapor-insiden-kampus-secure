// ===================================================================
// Skema Validasi Input dengan Zod (src/lib/validations.ts)
//
// ALASAN KEAMANAN (Materi Demo Cyber Security):
// 1. Sanitasi & Validasi Lapisan Pertama (Defense-in-Depth):
//    Jangan pernah mempercayai input dari pengguna (Never Trust User Input).
//    Validasi Zod memastikan format, tipe data, dan batas panjang karakter
//    terverifikasi sebelum data menyentuh database atau logika aplikasi.
// 2. Perlindungan Mass Assignment Vulnerability (CWE-915):
//    Pada skema registrasi (registerSchema), kita sengaja TIDAK menyertakan kolom 'role'.
//    Ini mencegah penyerang menyuntikkan payload `role: "ADMIN"` saat registrasi akun baru.
//    Peran pengguna baru akan selalu dikunci secara default menjadi `USER` di backend.
// 3. Kebijakan Kata Sandi Kuat (Password Complexity Policy):
//    Wajib minimal 8 karakter, kombinasi huruf besar, huruf kecil, angka, dan simbol.
//    Ini mempersulit teknik serangan Brute Force dan Dictionary Attack.
// 4. Pembatasan Panjang Input (Anti Buffer Overflow / Denial of Service):
//    Membatasi panjang teks masukan untuk mencegah serangan Resource Exhaustion (DoS).
// ===================================================================

import { z } from "zod";

// -------------------------------------------------------------------
// 1. Skema Registrasi Pengguna Baru
// -------------------------------------------------------------------
export const registerSchema = z
  .object({
    nama: z
      .string()
      .trim()
      .min(3, "Nama lengkap minimal 3 karakter")
      .max(100, "Nama lengkap maksimal 100 karakter"),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Format alamat email kampus tidak valid")
      .max(100, "Email terlalu panjang"),

    password: z
      .string()
      .min(8, "Kata sandi minimal 8 karakter")
      .max(128, "Kata sandi maksimal 128 karakter")
      .regex(/[A-Z]/, "Kata sandi wajib mengandung minimal 1 huruf kapital (A-Z)")
      .regex(/[a-z]/, "Kata sandi wajib mengandung minimal 1 huruf kecil (a-z)")
      .regex(/[0-9]/, "Kata sandi wajib mengandung minimal 1 angka (0-9)")
      .regex(
        /[^A-Za-z0-9]/,
        "Kata sandi wajib mengandung minimal 1 karakter simbol unik (!@#$%^&* dsb.)"
      ),

    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok dengan kata sandi",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// -------------------------------------------------------------------
// 2. Skema Login Pengguna
// -------------------------------------------------------------------
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format alamat email tidak valid"),

  password: z
    .string()
    .min(1, "Kata sandi wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// -------------------------------------------------------------------
// 3. Skema Pembuatan Laporan Insiden (Mahasiswa / Staf Pelapor)
// -------------------------------------------------------------------
export const createReportSchema = z.object({
  judul: z
    .string()
    .trim()
    .min(5, "Judul laporan minimal 5 karakter")
    .max(150, "Judul laporan maksimal 150 karakter"),

  kategori: z.enum(["KEHILANGAN", "PELANGGARAN", "SIBER", "LAINNYA"], {
    errorMap: () => ({ message: "Pilih kategori insiden yang valid" }),
  }),

  lokasi: z
    .string()
    .trim()
    .min(3, "Lokasi kejadian minimal 3 karakter")
    .max(100, "Lokasi kejadian maksimal 100 karakter"),

  deskripsi: z
    .string()
    .trim()
    .min(20, "Kronologi/deskripsi kejadian minimal 20 karakter agar jelas dan informatif")
    .max(3000, "Deskripsi laporan maksimal 3000 karakter"),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// -------------------------------------------------------------------
// 4. Skema Pembaruan Status Laporan oleh Petugas Keamanan (ADMIN)
// -------------------------------------------------------------------
export const updateStatusSchema = z.object({
  status: z.enum(["BARU", "DIPROSES", "SELESAI"], {
    errorMap: () => ({ message: "Pilih status laporan yang valid" }),
  }),

  catatanAdmin: z
    .string()
    .trim()
    .max(1000, "Catatan petugas maksimal 1000 karakter")
    .optional()
    .nullable(),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
