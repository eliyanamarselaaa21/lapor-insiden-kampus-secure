"use server";

// ===================================================================
// Server Actions Autentikasi & Manajemen Sesi (src/actions/auth.ts)
//
// ALASAN KEAMANAN (Materi Demo Cyber Security):
// 1. Eksekusi 100% di Sisi Server (Next.js Server Actions):
//    Seluruh logika validasi, pengecekan database, dan manipulasi token berjalan
//    di lingkungan server terisolasi. Kunci rahasia dan logika hashing tidak
//    pernah dikirimkan ke peramban (browser) pengguna.
// 2. Pencegahan User Enumeration (CWE-204):
//    Saat login gagal, sistem tidak pernah memberitahukan apakah email terdaftar
//    atau tidak. Pesan kegagalan selalu identik ("Email atau kata sandi salah.").
//    Selain itu, kita menggunakan teknik perbandingan hash semu (Dummy Hash)
//    untuk menyamakan waktu respons (Timing Attack Mitigation).
// 3. Pencegahan Privilege Escalation / Mass Assignment:
//    Fungsi registrasi mengunci peran pengguna secara mutlak ke 'USER'.
//    Tidak ada celah bagi pengguna baru untuk menyusupkan peran 'ADMIN'.
// 4. Rekam Jejak Audit Keamanan Otomatis (Security Audit Trail):
//    Setiap kejadian penting (REGISTER, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT)
//    langsung dicatat ke database lengkap dengan stempel waktu dan alamat IP.
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
 * 2. SERVER ACTION: LOGIN PENGGUNA (MAHASISWA / ADMIN KEAMANAN)
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
    // Cari akun berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // MITIGASI TIMING ATTACK & USER ENUMERATION:
    // Jika email tidak ada di database, tetap jalankan bcrypt.compare dengan DUMMY_HASH.
    // Hal ini membuat durasi respons identik sehingga penyerang tidak bisa mengukur waktu komputasi.
    const isPasswordValid = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(password, DUMMY_HASH).catch(() => false);

    // Jika user tidak ditemukan ATAU password salah:
    if (!user || !isPasswordValid) {
      // Catat log kegagalan login untuk mendeteksi potensi serangan brute force
      await prisma.activityLog.create({
        data: {
          aksi: "LOGIN_FAILED",
          detail: `Upaya login gagal untuk identitas: ${email}`,
          ip: clientIp,
          userId: user ? user.id : null,
        },
      });

      // Pesan error umum: Mencegah penyerang mengetahui apakah email valid atau tidak
      return {
        success: false,
        message: "Email atau kata sandi salah. Silakan periksa kembali.",
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
      // Catat aktivitas logout ke dalam database
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
