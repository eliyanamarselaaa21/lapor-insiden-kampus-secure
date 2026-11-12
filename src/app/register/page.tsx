"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, User, AlertCircle, ArrowRight, Loader2, Check } from "lucide-react";
import { registerAction } from "@/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setFieldErrors(null);

    const formData = new FormData(e.currentTarget);
    const result = await registerAction(null, formData);

    if (!result.success) {
      setErrorMessage(result.message);
      if (result.errors) setFieldErrors(result.errors);
      setIsLoading(false);
      return;
    }

    router.push(result.redirectTo || "/login?registered=success");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        {/* Brand & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registrasi Akun Baru</h1>
          <p className="text-sm text-slate-500 mt-1">Portal Pelaporan Mahasiswa & Staf Kampus</p>
        </div>

        {/* Global Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Registrasi */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                name="nama"
                type="text"
                required
                placeholder="Contoh: Ahmad Fauzi"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>
            {fieldErrors?.nama && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.nama[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Alamat Email Kampus
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="fauzi@kampus.ac.id"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>
            {fieldErrors?.email && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.email[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Kata Sandi Kuat
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Minimal 8 karakter (huruf besar, angka, simbol)"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>
            {fieldErrors?.password && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.password[0]}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Wajib minimal 8 karakter dengan huruf kapital, angka, dan simbol (!@#$%).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Konfirmasi Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Ulangi kata sandi"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>
            {fieldErrors?.confirmPassword && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.confirmPassword[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mendaftarkan Akun...
              </>
            ) : (
              <>
                Daftar Sebagai Pelapor
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link ke Login */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
          Sudah memiliki akun?{" "}
          <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Masuk sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
