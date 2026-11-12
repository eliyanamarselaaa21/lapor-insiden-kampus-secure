// ===================================================================
// Skrip Seeding Database SIPEKAN (prisma/seed.ts)
// Fungsi: Membuat akun awal untuk ADMIN dan USER secara aman
// Keamanan:
// 1. Password TIDAK ditulis langsung di kode (*Zero Hardcoded Secrets*).
//    Kredensial dibaca langsung dari Environment Variable (.env).
// 2. Password di-hash menggunakan algoritma bcrypt (cost factor 12).
// ===================================================================

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔒 Memulai proses database seeding yang aman...");

  // 1. Baca kredensial dari Environment Variables
  const adminName = process.env.SEED_ADMIN_NAME || "Komandan Keamanan Kampus";
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin.keamanan@kampus.ac.id";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  const userName = process.env.SEED_USER_NAME || "Mahasiswa Pelapor";
  const userEmail = process.env.SEED_USER_EMAIL || "mahasiswa@kampus.ac.id";
  const userPassword = process.env.SEED_USER_PASSWORD;

  // Validasi: Cegah proses seeding jika password belum diatur di .env
  if (!adminPassword || !userPassword) {
    throw new Error(
      "❌ KEGAGALAN KEAMANAN: Variabel SEED_ADMIN_PASSWORD dan SEED_USER_PASSWORD wajib diisi di file .env Anda sebelum menjalankan seed!"
    );
  }

  // 2. Hashing Password dengan Bcrypt (Cost Factor 12)
  // Cost factor 12 memberikan keseimbangan tinggi antara keamanan terhadap brute-force dan performa server
  console.log("🔑 Melakukan hashing password dengan bcrypt (salt rounds: 12)...");
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
  const hashedUserPassword = await bcrypt.hash(userPassword, 12);

  // 3. Upsert Akun ADMIN (Petugas Keamanan Kampus)
  // Menggunakan 'upsert' agar skrip aman dijalankan berulang kali tanpa error duplikasi email
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      nama: adminName,
      passwordHash: hashedAdminPassword,
      role: Role.ADMIN,
    },
    create: {
      nama: adminName,
      email: adminEmail,
      passwordHash: hashedAdminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Akun ADMIN berhasil disiapkan: ${adminUser.email} (Role: ${adminUser.role})`);

  // 4. Upsert Akun USER (Mahasiswa / Staf Pelapor)
  const regularUser = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      nama: userName,
      passwordHash: hashedUserPassword,
      role: Role.USER,
    },
    create: {
      nama: userName,
      email: userEmail,
      passwordHash: hashedUserPassword,
      role: Role.USER,
    },
  });
  console.log(`✅ Akun USER berhasil disiapkan: ${regularUser.email} (Role: ${regularUser.role})`);

  // 5. Catat jejak audit inisialisasi ke tabel ActivityLog
  await prisma.activityLog.create({
    data: {
      aksi: "SYSTEM_SEED",
      detail: `Inisialisasi akun percontohan untuk role ADMIN (${adminUser.email}) dan USER (${regularUser.email}).`,
      ip: "127.0.0.1",
      userId: adminUser.id,
    },
  });
  console.log("📝 Jejak audit inisialisasi berhasil dicatat ke tabel activity_logs.");

  console.log("🎉 Database seeding selesai dengan aman!");
}

main()
  .catch((e) => {
    console.error("Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
