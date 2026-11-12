"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { loginAction } from "@/actions/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const redirectUrl = searchParams.get("redirect");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(null, formData);

    if (!result.success) {
      setErrorMessage(result.message);
      setIsLoading(false);
      return;
    }

    // Arahkan ke redirect target atau default role redirect
    const target = redirectUrl || result.redirectTo || "/dashboard";
    router.push(target);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
      {/* Brand & Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white mb-3">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Masuk ke SIPEKAN</h1>
        <p className="text-sm text-slate-500 mt-1">Sistem Pelaporan Insiden & Keamanan Kampus</p>
      </div>

      {/* Notifikasi Sukses Pendaftaran */}
      {registered === "success" && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          ✅ Akun Anda berhasil dibuat. Silakan masuk menggunakan email dan kata sandi Anda.
        </div>
      )}

      {/* Pesan Kesalahan Keamanan (Pencegahan User Enumeration) */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Login */}
      <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="nama@kampus.ac.id"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Kata Sandi
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Memverifikasi Kredensial...
            </>
          ) : (
            <>
              Masuk
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Link ke Registrasi */}
      <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
        Belum memiliki akun pelapor?{" "}
        <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
          Daftar di sini
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Suspense fallback={<div className="text-slate-500 text-sm">Memuat formulir masuk...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
