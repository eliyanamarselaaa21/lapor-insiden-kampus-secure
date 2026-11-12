import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <span className="text-3xl font-extrabold text-slate-900 block font-mono">404</span>
        <h1 className="text-lg font-bold text-slate-800 mt-1">Halaman Tidak Ditemukan</h1>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Alamat rute yang Anda tuju tidak tersedia atau telah dipindahkan ke rute aman lainnya.
        </p>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
