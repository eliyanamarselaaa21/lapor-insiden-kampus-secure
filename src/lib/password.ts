// ===================================================================
// Utilitas Hashing Kata Sandi (src/lib/password.ts)
//
// ALASAN KEAMANAN (Materi Demo Cyber Security):
// 1. One-Way Cryptographic Hashing:
//    Kata sandi tidak pernah disimpan dalam bentuk plaintext maupun dienkripsi dua arah.
//    Bcrypt adalah fungsi hash satu arah yang tidak dapat didekripsi kembali.
// 2. Perlindungan Rainbow Table & Dictionary Attack via Salting:
//    Bcrypt secara otomatis menyisipkan 'salt' unik (string acak) untuk setiap hash,
//    sehingga dua pengguna dengan kata sandi yang sama akan menghasilkan nilai hash yang berbeda.
// 3. Ketahanan Brute-Force (Work Factor / Salt Rounds: 12):
//    Nilai 12 (2^12 = 4.096 iterasi) sengaja dipilih untuk memperlambat komputasi penyerang
//    (cracker) jika database bocor, namun tetap sangat responsif (~250ms) bagi pengguna sah.
// 4. Perlindungan Timing Attack:
//    Fungsi perbandingan bcrypt (bcrypt.compare) mengevaluasi hash dalam waktu konstan
//    (constant-time) untuk mencegah penyerang menebak karakter melalui selisih waktu respons.
// ===================================================================

import bcrypt from "bcryptjs";

// Jumlah putaran salt (12 adalah rekomendasi standar industri OWASP saat ini)
const SALT_ROUNDS = 12;

/**
 * Melakukan hashing kata sandi teks biasa menggunakan algoritma bcrypt.
 * @param plainPassword Kata sandi mentah dari input pengguna.
 * @returns String hash bcrypt yang aman disimpan ke database.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || plainPassword.length < 8) {
    throw new Error("Kata sandi tidak valid atau kurang dari 8 karakter.");
  }
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Memverifikasi kecocokan antara kata sandi teks biasa dengan hash di database.
 * @param plainPassword Kata sandi yang dimasukkan pengguna saat login.
 * @param hashedPassword Hash tersimpan di tabel database users.passwordHash.
 * @returns Boolean true jika cocok, false jika tidak cocok.
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  if (!plainPassword || !hashedPassword) {
    return false;
  }
  // bcrypt.compare aman dari serangan side-channel timing attack
  return await bcrypt.compare(plainPassword, hashedPassword);
}
