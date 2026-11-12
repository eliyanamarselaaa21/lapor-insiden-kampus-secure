"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  FileText,
  MapPin,
  Tag,
  AlignLeft,
} from "lucide-react";
import { createReportAction } from "@/actions/reports";

export default function BuatLaporanPage() {
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
    const result = await createReportAction(null, formData);

    if (!result.success) {
      setErrorMessage(result.message);
      if (result.errors) setFieldErrors(result.errors);
      setIsLoading(false);
      return;
    }

    router.push("/dashboard?created=success");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
          <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
            Formulir Pelaporan Terenkripsi
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Buat Laporan Insiden Baru</h1>
              <p className="text-sm text-slate-500">
                Data Anda dilindungi enkripsi sesi dan diproses secara rahasia oleh Tim Keamanan Kampus.
              </p>
            </div>
          </div>

          {/* Pesan Kesalahan Global */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Pembuatan Laporan */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Judul Laporan */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Judul Singkat Laporan <span className="text-rose-500">*</span>
              </label>
              <input
                name="judul"
                type="text"
                required
                placeholder="Contoh: Kehilangan Laptop Lenovo di Perpustakaan Pusat Lt. 2"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
              {fieldErrors?.judul && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.judul[0]}</p>
              )}
            </div>

            {/* Kategori Insiden & Lokasi (Grid 2 Kolom) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  Kategori Insiden <span className="text-rose-500">*</span>
                </label>
                <select
                  name="kategori"
                  required
                  defaultValue="KEHILANGAN"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white"
                >
                  <option value="KEHILANGAN">Pencurian / Kehilangan Barang</option>
                  <option value="PELANGGARAN">Pelanggaran Tata Tertib Kampus</option>
                  <option value="SIBER">Insiden Keamanan Siber / IT</option>
                  <option value="LAINNYA">Keamanan Fisik / Lainnya</option>
                </select>
                {fieldErrors?.kategori && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.kategori[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Lokasi Kejadian <span className="text-rose-500">*</span>
                </label>
                <input
                  name="lokasi"
                  type="text"
                  required
                  placeholder="Contoh: Gedung Rektorat Sayap Timur"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
                {fieldErrors?.lokasi && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.lokasi[0]}</p>
                )}
              </div>
            </div>

            {/* Kronologi & Deskripsi */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-emerald-600" />
                Kronologi & Deskripsi Kejadian <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="deskripsi"
                rows={6}
                required
                placeholder="Tuliskan urutan waktu kejadian, ciri-ciri pelaku/barang, nomor kontak alternatif, atau saksi yang melihat kejadian secara mendetail..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition leading-relaxed"
              ></textarea>
              {fieldErrors?.deskripsi && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.deskripsi[0]}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">Minimal 20 karakter agar petugas dapat segera melakukan investigasi.</p>
            </div>

            {/* Tombol Kirim */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan Laporan...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Kirim Laporan Resmi
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
