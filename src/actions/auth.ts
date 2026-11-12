"use server";

// ===================================================================
// Server Actions Autentikasi & Manajemen Sesi (src/actions/auth.ts)
//
// ALASAN KEAMANAN (Materi Demo Cyber Security):
// 1. Eksekusi 100% di Sisi Server (Next.js Server Actions):
//    Seluruh logika validasi, pengecekan database, dan manipulasi token berjalan
//    di lingkungan server terisolasi.
// 2. Mekanisme Rate Limiting Berbasis Database (Brute-Force & Credential Stuffing Defense):
//    Maksimal 5 percobaan gagal dalam rentang 15 menit per kombinasi email & IP.
//    Jika terlampaui, request langsung ditolak dengan status LOGIN_BLOCKED.
// 3. Pencegahan User Enumeration (CWE-204) & Timing Attack:
//    Pesan kegagalan login selalu identik ("Email atau kata sandi salah.").
//    Penggunaan DUMMY_HASH menjaga kestabilan waktu komputasi.
// 4. Pencegahan Privilege Escalation / Mass Assignment:
//    Fungsi registrasi mengunci peran pengguna secara mutlak ke 'USER'.
// 5. Rekam Jejak Audit Keamanan Otomatis (Security Audit Trail):
//    Setiap kejadian (REGISTER, LOGIN_SUCCESS, LOGIN_FAILED, LOGIN_BLOCKED, LOGOUT)
//    langsung dicatat ke tabel ActivityLog lengkap dengan timestamp dan IP.
// ===================================================================

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { signToken, SESSION_COOKIE_OPTIONS, SESSION_COOKIE_NAME, verifyToken } from "@/lib/jwt";
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from "@/lib/validations";
import { getClientIp } from "@/lib/session";

// Tipe respons standar untuk komunikasi Server Action ke Client Form
export interface AuthActionResult {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  redirectTo?: string;
}

// Konfigurasi Rate Limiting Keamanan
const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

// Hash dummy untuk mitigasi Timing Attack saat email tidak ditemukan di database
const DUMMY_HASH = "$2a$12$e8uq8MRJp2r50/jZ/UqJ8O7rX6E/KzM6P9M8f0Q8f6E8q8f6E8q8f";

/**
 * 1. SERVER ACTION: REGISTRASI PENGGUNA BARU (MAHASISWA / STAF)
 */
export async function registerAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData: Record<string, unknown> = {
    nama: formData.get("nama"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  // Validasi input dengan Zod
  const validated = registerSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: "Data pendaftaran tidak valid. Silakan periksa kembali isian Anda.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { nama, email, password } = validated.data;
  const clientIp = getClientIp();

  try {
    // Periksa apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message: "Email kampus tersebut sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.",
      };
    }

    // Hash kata sandi dengan bcrypt (Cost factor 12)
    const hashedPassword = await hashPassword(password);

    // Simpan pengguna baru ke database (Role DIKUNCI mutlak sebagai USER)
    const newUser = await prisma.user.create({
      data: {
        nama,
        email,
        passwordHash: hashedPassword,
        role: Role.USER, // Prinsip Least Privilege: Default selalu USER
      },
    });

    // Catat jejak audit aktivitas ke ActivityLog
    await prisma.activityLog.create({
      data: {
        aksi: "REGISTER",
        detail: `Pendaftaran akun mahasiswa/pelapor baru atas nama ${nama} (${email})`,
        ip: clientIp,
        userId: newUser.id,
      },
    });

    return {
      success: true,
      message: "Pendaftaran berhasil! Akun Anda telah siap. Silakan masuk.",
      redirectTo: "/login?registered=success",
    };
  } catch (error) {
    console.error("Kesalahan internal saat registrasi:", error);
    return {
      success: false,
      message: "Terjadi gangguan pada sistem. Silakan coba beberapa saat lagi.",
    };
  }
}

/**
 * 2. SERVER ACTION: LOGIN PENGGUNA DENGAN RATE LIMITING
 */
export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData: Record<string, unknown> = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // Validasi input form
  const validated = loginSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: "Format email atau kata sandi tidak valid.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validated.data;
  const clientIp = getClientIp();

  try {
    // ===============================================================
    // PENGECEKAN RATE LIMITING (Perlindungan Brute-Force & Credential Stuffing)
    // Hitung kegagalan login dalam 15 menit terakhir untuk kombinasi IP & email ini
    // ===============================================================
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

    const recentFailedCount = await prisma.activityLog.count({
      where: {
        aksi: "LOGIN_FAILED",
        ip: clientIp,
        detail: {
          contains: email,
        },
        createdAt: {
          gte: windowStart,
        },
      },
    });

    if (recentFailedCount >= MAX_FAILED_ATTEMPTS) {
      // Catat pemblokiran percobaan login karena melebihi batas rate limit
      await prisma.activityLog.create({
        data: {
          aksi: "LOGIN_BLOCKED",
          detail: `Upaya login diblokir otomatis oleh Rate Limiter (${recentFailedCount} kegagalan) untuk email: ${email}`,
          ip: clientIp,
        },
      });

      return {
        success: false,
        message: `Terlalu banyak percobaan login yang gagal. Demi keamanan, akses dibatasi sementara. Silakan tunggu ${RATE_LIMIT_WINDOW_MINUTES} menit sebelum mencoba kembali.`,
      };
    }

    // Cari akun berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // MITIGASI TIMING ATTACK & USER ENUMERATION:
    // Jika email tidak ada di database, tetap jalankan bcrypt.compare dengan DUMMY_HASH.
    const isPasswordValid = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(password, DUMMY_HASH).catch(() => false);

    // Jika user tidak ditemukan ATAU password salah:
    if (!user || !isPasswordValid) {
      // Catat log kegagalan login ke tabel ActivityLog
      await prisma.activityLog.create({
        data: {
          aksi: "LOGIN_FAILED",
          detail: `Percobaan login gagal untuk email: ${email}`,
          ip: clientIp,
          userId: user ? user.id : null,
        },
      });

      const remainingAttempts = MAX_FAILED_ATTEMPTS - (recentFailedCount + 1);
      const remainingNotice =
        remainingAttempts > 0 && remainingAttempts <= 2
          ? ` (Peringatan: sisa ${remainingAttempts} percobaan sebelum akun dibatasi sementara)`
          : "";

      // Pesan error umum: Mencegah penyerang mengetahui apakah email valid atau tidak
      return {
        success: false,
        message: `Email atau kata sandi salah. Silakan periksa kembali.${remainingNotice}`,
      };
    }

    // Jika verifikasi lolos: Terbitkan tanda tangan digital token JWT (HS256)
    const token = await signToken({
      userId: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    });

    // Simpan token ke dalam Cookie HttpOnly + Secure + SameSite=Lax
    cookies().set(SESSION_COOKIE_OPTIONS.name, token, SESSION_COOKIE_OPTIONS);

    // Catat log keberhasilan login
    await prisma.activityLog.create({
      data: {
        aksi: "LOGIN_SUCCESS",
        detail: `Login berhasil sebagai peran ${user.role}`,
        ip: clientIp,
        userId: user.id,
      },
    });

    // Arahkan ke dashboard sesuai peran (RBAC)
    const destination = user.role === Role.ADMIN ? "/admin" : "/dashboard";

    return {
      success: true,
      message: "Login berhasil. Mengalihkan ke dashboard...",
      redirectTo: destination,
    };
  } catch (error) {
    console.error("Kesalahan internal saat login:", error);
    return {
      success: false,
      message: "Terjadi kendala saat memproses login. Silakan coba lagi.",
    };
  }
}

/**
 * 3. SERVER ACTION: LOGOUT PENGGUNA
 */
export async function logoutAction() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const clientIp = getClientIp();

  if (token) {
    const session = await verifyToken(token);
    if (session) {
      try {
        await prisma.activityLog.create({
          data: {
            aksi: "LOGOUT",
            detail: `Pengguna ${session.email} (${session.role}) keluar dari sesi.`,
            ip: clientIp,
            userId: session.userId,
          },
        });
      } catch (err) {
        console.error("Gagal mencatat log logout:", err);
      }
    }
  }

  // Hapus cookie sesi dari browser
  cookies().delete(SESSION_COOKIE_NAME);

  // Arahkan kembali ke halaman login
  redirect("/login");
}
