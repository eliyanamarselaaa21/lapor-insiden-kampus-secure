"use client";

import { useState } from "react";
import {
  FileText,
  MapPin,
  Calendar,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";
import { updateReportUserAction, deleteReportUserAction } from "@/actions/reports";

interface ReportItem {
  id: string;
  judul: string;
  deskripsi: string;
  lokasi: string;
  kategori: "KEHILANGAN" | "PELANGGARAN" | "SIBER" | "LAINNYA";
  status: "BARU" | "DIPROSES" | "SELESAI";
  catatanAdmin: string | null;
  createdAt: Date;
}

export function UserReportList({ reports }: { reports: ReportItem[] }) {
  const [editingReport, setEditingReport] = useState<ReportItem | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Status Badge Helper
  const getStatusBadge = (status: ReportItem["status"]) => {
    switch (status) {
      case "BARU":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Menunggu Verifikasi (BARU)</span>;
      case "DIPROSES":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-800 border border-sky-200">Sedang Diinvestigasi</span>;
      case "SELESAI":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Selesai Ditangani</span>;
    }
  };

  // Kategori Badge Helper
  const getCategoryBadge = (cat: ReportItem["kategori"]) => {
    switch (cat) {
      case "KEHILANGAN":
        return <span className="text-xs font-medium px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">Kehilangan</span>;
      case "PELANGGARAN":
        return <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">Pelanggaran Disiplin</span>;
      case "SIBER":
        return <span className="text-xs font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono">Keamanan Siber</span>;
      case "LAINNYA":
        return <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">Lainnya</span>;
    }
  };

  async function handleUpdateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingReport) return;
    setActionLoading(true);
    setActionError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateReportUserAction(editingReport.id, formData);

    if (!result.success) {
      setActionError(result.message);
      setActionLoading(false);
      return;
    }

    setEditingReport(null);
    setActionLoading(false);
  }

  async function handleDelete(reportId: string) {
    if (!confirm("Apakah Anda yakin ingin membatalkan dan menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    setIsDeletingId(reportId);
    const result = await deleteReportUserAction(reportId);
    if (!result.success) {
      alert(result.message);
    }
    setIsDeletingId(null);
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Belum Ada Riwayat Laporan</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Anda belum pernah mengirimkan laporan insiden atau pelanggaran. Klik tombol &ldquo;Buat Laporan Baru&rdquo; jika mengalami atau mengetahui insiden di kampus.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div
          key={report.id}
          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:border-slate-300 transition"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(report.status)}
              {getCategoryBadge(report.kategori)}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(report.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-lg font-bold text-slate-900">{report.judul}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Lokasi: {report.lokasi}
            </p>
            <p className="text-sm text-slate-700 mt-2.5 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {report.deskripsi}
            </p>
          </div>

          {/* Catatan Tindak Lanjut dari Petugas Keamanan (Jika Ada) */}
          {report.catatanAdmin && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
              <MessageSquare className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-amber-950 mb-0.5">Catatan Investigasi Tim Keamanan:</strong>
                <p className="whitespace-pre-wrap leading-relaxed">{report.catatanAdmin}</p>
              </div>
            </div>
          )}

          {/* Kontrol Edit & Hapus (Hanya Aktif Jika Status == BARU) */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">ID Laporan: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{report.id}</code></span>
            <div className="flex items-center gap-2">
              {report.status === "BARU" ? (
                <>
                  <button
                    onClick={() => setEditingReport(report)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Ubah
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    disabled={isDeletingId === report.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition disabled:opacity-50"
                  >
                    {isDeletingId === report.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Batalkan Laporan
                  </button>
                </>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  🔒 Laporan terkunci (dalam investigasi/selesai)
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Modal Edit Laporan */}
      {editingReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Ubah Laporan Insiden</h3>
              <button
                onClick={() => setEditingReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleUpdateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Laporan</label>
                <input
                  name="judul"
                  defaultValue={editingReport.judul}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    name="kategori"
                    defaultValue={editingReport.kategori}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="KEHILANGAN">Pencurian / Kehilangan</option>
                    <option value="PELANGGARAN">Pelanggaran Tata Tertib</option>
                    <option value="SIBER">Keamanan Siber / IT</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi</label>
                  <input
                    name="lokasi"
                    defaultValue={editingReport.lokasi}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kronologi Kejadian</label>
                <textarea
                  name="deskripsi"
                  defaultValue={editingReport.deskripsi}
                  rows={4}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
