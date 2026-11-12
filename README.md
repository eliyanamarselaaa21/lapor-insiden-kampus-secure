# SIPEKAN &mdash; Sistem Pelaporan Insiden & Keamanan Kampus

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-Serverless-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Security Headers](https://img.shields.io/badge/Security_Headers-Grade_A-brightgreen?style=for-the-badge)](https://securityheaders.com/)

Aplikasi web siap pakai, berkeamanan tinggi, dan siap publikasi yang dirancang untuk memenuhi tugas proyek mata kuliah **Cyber Security**. **SIPEKAN** berfungsi sebagai portal pelaporan terpadu bagi civitas akademika untuk melaporkan kejadian kehilangan barang, pelanggaran tata tertib kampus, maupun insiden keamanan siber di lingkungan kampus dengan menerapkan prinsip *Defense-in-Depth* dan kepatuhan terhadap standar **OWASP Top 10**.

🌐 **URL Aplikasi Publik (Live Demo):** [https://lapor-insiden-kampus-secure.vercel.app](https://lapor-insiden-kampus-secure.vercel.app)

---

## 📌 Fitur Utama Berdasarkan Peran (RBAC)

### 1. Portal Pelapor / Mahasiswa (`USER`):
- **Registrasi & Autentikasi Mandiri:** Kebijakan kata sandi kuat (kombinasi huruf kapital, angka, dan simbol) dengan hashing `bcrypt` (cost factor 12).
- **Formulir Pelaporan Insiden:** Input divalidasi ketat dengan skema `Zod` (Judul, Kategori: *Kehilangan, Pelanggaran, Siber, Lainnya*, Lokasi, dan Kronologi).
- **Dashboard Aduan Saya (Anti-IDOR):** Mahasiswa hanya dapat melihat daftar laporan miliknya sendiri.
- **Kontrol Alur Bisnis (State Integrity):** Laporan hanya dapat diubah (*edit*) atau dibatalkan (*delete*) selama statusnya masih `BARU`. Jika status telah `DIPROSES` atau `SELESAI`, laporan otomatis terkunci demi integritas barang bukti.
- **Ekspor CSV Data Mandiri:** Unduh rekapitulasi aduan pribadi dalam format CSV yang steril dari celah *CSV Formula Injection*.

### 2. Konsol Investigasi Petugas / Tim Keamanan (`ADMIN`):
- **Pusat Komando Insiden:** Meninjau seluruh laporan masuk dari seluruh civitas akademika kampus lengkap dengan identitas pelapor (nama dan email).
- **Tindak Lanjut & Investigasi:** Memperbarui status laporan (`BARU` $\rightarrow$ `DIPROSES` $\rightarrow$ `SELESAI`) serta menambahkan catatan investigasi resmi petugas keamanan.
- **Filter Konsol Investigasi:** Menyaring laporan berdasarkan status penanganan maupun kategori kejadian secara dinamis.
- **Penghapusan Laporan Berwenang:** Hak menghapus laporan yang tidak valid atau telah usang.
- **Ekspor CSV Terpadu:** Mengunduh seluruh rekapitulasi data kampus untuk pelaporan pimpinan universitas.
- **Live Audit Trail Feed:** Memantau rekam jejak aktivitas keamanan (*ActivityLog*) secara *real-time* lengkap dengan alamat IP klien.

---

## 🛡️ Arsitektur Keamanan Siber (*Defense-in-Depth*)

Aplikasi ini mengintegrasikan standar keamanan tingkat lanjut pada setiap lapisan:

1. **Zero Hardcoded Secrets Policy:** Kredensial sensitif (`DATABASE_URL`, `JWT_SECRET`, password akun) tidak pernah ditulis di dalam kode sumber. Semuanya dikelola melalui berkas `.env` lokal dan Environment Variables terenkripsi Vercel. Berkas `.gitignore` secara ketat memblokir `.env*`.
2. **Kriptografi Password Bcrypt (Cost Factor 12):** Menggunakan $2^{12} = 4.096$ iterasi dan *salt* unik otomatis untuk menangkal serangan *Dictionary Attack* dan *Rainbow Tables*.
3. **Sesi JWT "jose" di Cookie HttpOnly:** Token sesi ditandatangani secara digital dengan algoritma simetris HS256, disimpan dalam cookie berbendera:
   - `HttpOnly`: Kebal terhadap pencurian token via serangan Cross-Site Scripting (XSS).
   - `Secure`: Cookie hanya dikirimkan melalui jalur terenkripsi HTTPS.
   - `SameSite=Lax`: Melindungi sistem dari serangan Cross-Site Request Forgery (CSRF).
4. **Pencegahan Timing Attack & User Enumeration (CWE-204):** Pesan kesalahan login dibuat umum (*"Email atau kata sandi salah"*), dipadukan dengan komputasi `DUMMY_HASH` agar durasi respons server selalu identik baik saat email terdaftar maupun tidak.
5. **Rate Limiting Login Berbasis Database:** Membatasi percobaan gagal maksimal 5 kali dalam 15 menit per kombinasi IP + Email dari tabel `ActivityLog` untuk mencegah *Brute Force*.
6. **Proteksi Anti-IDOR (Insecure Direct Object References):** Seluruh operasi mutasi data memverifikasi bahwa `userId` pelapor identik dengan `session.userId` di level server sebelum query dieksekusi.
7. **Pencegahan SQL Injection:** Seluruh query database menggunakan *Parameterized Queries / Prepared Statements* melalui Prisma ORM tanpa ada raw SQL.
8. **Pencegahan Stored XSS:** React Engine secara otomatis mensterilkan teks (*HTML entity escaping*) dan menghindari penggunaan `dangerouslySetInnerHTML`.
9. **Mitigasi CSV Formula Injection (CWE-1236):** Seluruh sel ekspor CSV yang diawali karakter formula (`=`, `+`, `-`, `@`, `\t`, `\r`) otomatis diawali tanda petik tunggal (`'`).
10. **HTTP Security Headers Lengkap (Grade A di SecurityHeaders.com):**
    - `Content-Security-Policy (CSP)`
    - `X-Frame-Options: DENY` (Anti-Clickjacking)
    - `X-Content-Type-Options: nosniff` (Anti-MIME Sniffing)
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
    - `Strict-Transport-Security (HSTS)`
    - `poweredByHeader: false` (Anti-Server Fingerprinting)

---

## 💻 Stack Teknologi

- **Frontend & Backend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling UI:** Tailwind CSS, Lucide React Icons
- **Database:** PostgreSQL (Neon Serverless Cloud Database)
- **ORM:** Prisma ORM v5
- **Hashing Kriptografis:** `bcryptjs`
- **Manajemen Token:** `jose` (Web Crypto API)
- **Validasi Skema:** `zod`
- **Deployment Platform:** Vercel Serverless Platform

---

## 🚀 Panduan Instalasi & Menjalankan di Localhost

### 1. Prasyarat Sistem
- Node.js versi 18.18+ atau versi lebih baru (Rekomendasi: Node.js 20 LTS atau 22).
- Akun database PostgreSQL di [Neon.tech](https://neon.tech) (gratis).

### 2. Kloning Repositori
```bash
git clone https://github.com/eliyanamarselaaa21/lapor-insiden-kampus-secure.git
cd lapor-insiden-kampus-secure
```

### 3. Instal Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment Variables
Salin berkas template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

### 5. Jalankan Migrasi Database & Seeding
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 6. Jalankan Server Development
```bash
npm run dev
```
Buka peramban di: `http://localhost:3000`.

---

## 📋 Ringkasan Akun Pengujian Demo

| Peran (*Role*) | Email Demo | Password Demo | Rute Masuk |
| :--- | :--- | :--- | :--- |
| **ADMIN (Petugas)** | `admin.keamanan@kampus.ac.id` | *(Sesuai `SEED_ADMIN_PASSWORD` Anda)* | `/login` $\rightarrow$ `/admin` |
| **USER (Mahasiswa)** | `mahasiswa@kampus.ac.id` | *(Sesuai `SEED_USER_PASSWORD` Anda)* | `/login` $\rightarrow$ `/dashboard` |

---

## 🤖 Pemanfaatan AI Agent & Ringkasan Self-Testing

Proyek ini dikembangkan secara bertahap menggunakan **Google Antigravity** sebagai *pair programmer* dan *security engineer mentor* tanpa pernah membagikan kredensial rahasia ke dalam *prompt*. Seluruh kode dan konfigurasi keamanan telah diverifikasi melalui pengujian mandiri (*self-testing*):

- **Audit Kode & Build:** `npx tsc --noEmit` (0 error) dan `npm run build` (100% lulus).
- **Pemindaian HTTP Security Headers:** Mendapatkan skor **Grade A** di [securityheaders.com](https://securityheaders.com) dengan konfigurasi CSP, HSTS, `X-Frame-Options: DENY`, dan `X-Content-Type-Options: nosniff`.
- **Uji Celah Keamanan (OWASP Top 10):**
  - *SQL Injection & Stored XSS:* Ditolak/ter-escape otomatis oleh Prisma ORM dan React JSX.
  - *Broken Access Control & IDOR:* Rute `/admin` terlindungi di Edge Middleware dan mutasi laporan divalidasi kepemilikannya (`existing.userId === session.userId`) di server dengan pencatatan `SECURITY_IDOR_ATTEMPT`.
  - *Autentikasi & Rate Limiting:* Kebijakan password kuat (`bcrypt` cost 12), cookie sesi `HttpOnly + Secure + SameSite=Lax`, serta pemblokiran login otomatis setelah 5 kali gagal dalam 15 menit.
  - *Audit Secret & Dependensi:* Pemeriksaan `git log` memastikan nol kebocoran kredensial; hasil `npm audit` dievaluasi dengan *Contextual Risk Acceptance*.
