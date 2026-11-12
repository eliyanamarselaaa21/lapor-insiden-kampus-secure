import Link from "next/link";
import { ShieldCheck, Lock, EyeOff, FileText, Bell, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header / Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-800 tracking-tight">SIPEKAN</span>
              <span className="text-xs text-emerald-700 block -mt-1 font-medium">Sistem Keamanan Kampus</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
            >
              Daftar Akun
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center text-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6">
          <Lock className="w-3.5 h-3.5" />
          Platform Pelaporan Terenkripsi & Terlindungi (Cyber Security Project)
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl">
          Lapor Insiden Keamanan & Pelanggaran Kampus Secara <span className="text-emerald-600">Aman & Terpercaya</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl">
          Wadah terintegrasi bagi mahasiswa dan staf untuk melaporkan kehilangan barang, pelanggaran tata tertib, hingga insiden keamanan siber dengan perlindungan privasi ketat.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="px-6 py-3.5 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Mulai Buat Laporan
          </Link>
          <Link
            href="/register"
            className="px-6 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm transition flex items-center justify-center gap-2"
          >
            Registrasi Akun Baru
          </Link>
        </div>

        {/* Security Features Showcase (Bahan Demo Mata Kuliah Cyber Security) */}
        <div className="mt-20 w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Hashing Password Bcrypt</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Kata sandi di-hash menggunakan algoritma <code>bcrypt</code> dengan salt otomatis. Kata sandi mentah tidak pernah disimpan di database.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">JWT di Cookie HttpOnly</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Token autentikasi ditandatangani dengan library <code>jose</code> dan disimpan dalam cookie <code>HttpOnly</code>, mencegah pencurian token melalui serangan Cross-Site Scripting (XSS).
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Validasi Zod & ORM Prisma</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Semua input divalidasi ketat dengan skema <code>Zod</code> untuk mencegah malformed data, serta query berbasis parameter Prisma untuk menangkal ancaman SQL Injection.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>Proyek Keamanan Siber &mdash; Sistem Pelaporan Insiden Kampus (SIPEKAN)</p>
      </footer>
    </main>
  );
}
