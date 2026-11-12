"use client";

// ===================================================================
// Global Error Boundary (src/app/error.tsx)
//
// ALASAN KEAMANAN (Materi Demo Cyber Security):
// 1. Pencegahan Kebocoran Informasi Teknis (Information Disclosure):
//    Ketika terjadi crash/unhandled exception di server, Next.js tidak akan
//    menampilkan stack trace, query database, atau struktur tabel ke peramban pengguna.
// 2. Pengguna hanya disajikan tampilan ramah dengan opsi pemulihan ("Coba Lagi").
// ===================================================================

import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Catat error teknis hanya di konsol server, jangan bocorkan ke UI publik
    console.error("Terdeteksi unhandled runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Terjadi Gangguan pada Sistem</h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Permintaan Anda tidak dapat diproses saat ini. Demi alasan keamanan, detail teknis kesalahan tidak ditampilkan.
        </p>

        {error.digest && (
          <p className="mt-3 text-xs font-mono text-slate-400 bg-slate-100 py-1 px-2 rounded inline-block">
            Kode Insiden: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Muat Ulang
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
