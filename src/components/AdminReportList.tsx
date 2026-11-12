"use client";

import { useState } from "react";
import {
  FileText,
  MapPin,
  Calendar,
  User,
  Mail,
  ShieldCheck,
  Edit3,
  Trash2,
  X,
  Check,
  Loader2,
  MessageSquare,
  Filter,
} from "lucide-react";
import { updateStatusAdminAction, deleteReportAdminAction } from "@/actions/reports";

interface AdminReportItem {
  id: string;
  judul: string;
  deskripsi: string;
  lokasi: string;
  kategori: "KEHILANGAN" | "PELANGGARAN" | "SIBER" | "LAINNYA";
  status: "BARU" | "DIPROSES" | "SELESAI";
  catatanAdmin: string | null;
  createdAt: Date;
  user: {
    nama: string;
    email: string;
  };
}

export function AdminReportList({ initialReports }: { initialReports: AdminReportItem[] }) {
  const [selectedReport, setSelectedReport] = useState<AdminReportItem | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter Kategori & Status
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const filteredReports = initialReports.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && r.kategori !== categoryFilter) return false;
    return true;
  });

  const getStatusBadge = (status: AdminReportItem["status"]) => {
    switch (status) {
      case "BARU":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">BARU (Menunggu Verifikasi)</span>;
      case "DIPROSES":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">DIPROSES (Dalam Investigasi)</span>;
      case "SELESAI":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">SELESAI (Ditutup)</span>;
    }
  };

  const getCategoryBadge = (cat: AdminReportItem["kategori"]) => {
    switch (cat) {
      case "KEHILANGAN":
        return <span className="text-xs font-medium px-2 py-0.5 rounded bg-orange-900/40 text-orange-300 border border-orange-800/50">Kehilangan</span>;
      case "PELANGGARAN":
        return <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-800/50">Pelanggaran</span>;
      case "SIBER":
        return <span className="text-xs font-medium px-2 py-0.5 rounded bg-rose-900/40 text-rose-300 border border-rose-800/50 font-mono">Keamanan Siber</span>;
      case "LAINNYA":
        return <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Lainnya</span>;
    }
  };

  async function handleStatusSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedReport) return;
    setActionLoading(true);
    setActionError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateStatusAdminAction(selectedReport.id, formData);

    if (!result.success) {
      setActionError(result.message);
      setActionLoading(false);
      return;
    }

    setSelectedReport(null);
    setActionLoading(false);
  }

  async function handleDelete(reportId: string) {
    if (!confirm("Konfirmasi Petugas: Anda yakin ingin menghapus laporan ini secara permanen dari sistem?")) {
      return;
    }

    setIsDeletingId(reportId);
    const result = await deleteReportAdminAction(reportId);
    if (!result.success) {
      alert(result.message);
    }
    setIsDeletingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls Bar */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <Filter className="w-4 h-4 text-amber-500" />
          Filter Konsol Investigasi:
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="BARU">Status: BARU</option>
            <option value="DIPROSES">Status: DIPROSES</option>
            <option value="SELESAI">Status: SELESAI</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="KEHILANGAN">Kehilangan</option>
            <option value="PELANGGARAN">Pelanggaran</option>
            <option value="SIBER">Siber / IT</option>
            <option value="LAINNYA">Lainnya</option>
          </select>

          <span className="text-xs text-slate-400">
            Ditemukan: <strong className="text-white">{filteredReports.length}</strong> laporan
          </span>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-slate-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="font-medium text-sm">Tidak ada laporan yang sesuai dengan filter saat ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-sm hover:border-slate-700 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
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
                <h3 className="text-lg font-bold text-white tracking-tight">{report.judul}</h3>
                
                {/* Info Identitas Pelapor (Khusus Akses ADMIN) */}
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1.5 font-medium text-amber-400">
                    <User className="w-3.5 h-3.5" /> Pelapor: {report.user.nama}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Mail className="w-3.5 h-3.5" /> {report.user.email}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Lokasi: {report.lokasi}
                  </span>
                </div>

                <p className="text-sm text-slate-200 mt-3 whitespace-pre-wrap leading-relaxed bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80 font-normal">
                  {report.deskripsi}
                </p>
              </div>

              {/* Catatan Admin Saat Ini */}
              {report.catatanAdmin && (
                <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-amber-200 mb-0.5">Catatan Investigasi Petugas:</span>
                    <p className="whitespace-pre-wrap">{report.catatanAdmin}</p>
                  </div>
                </div>
              )}

              {/* Action Bar Admin */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-slate-500">
                  ID: <code className="font-mono bg-slate-900 px-1 py-0.5 rounded text-slate-400">{report.id}</code>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 rounded-lg transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Tindak Lanjut & Status
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    disabled={isDeletingId === report.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-lg transition disabled:opacity-50"
                  >
                    {isDeletingId === report.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tindak Lanjut Petugas Keamanan */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-lg w-full p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Tindak Lanjut Insiden</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{selectedReport.judul}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Ubah Status Investigasi
                </label>
                <select
                  name="status"
                  defaultValue={selectedReport.status}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="BARU">BARU &mdash; Menunggu Pemeriksaan Lapangan</option>
                  <option value="DIPROSES">DIPROSES &mdash; Sedang Ditangani Tim Keamanan</option>
                  <option value="SELESAI">SELESAI &mdash; Investigasi Selesai / Ditutup</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Catatan Tindak Lanjut Petugas (Opsional)
                </label>
                <textarea
                  name="catatanAdmin"
                  defaultValue={selectedReport.catatanAdmin || ""}
                  rows={4}
                  placeholder="Contoh: Petugas telah memeriksa rekaman CCTV lantai 2 perpustakaan pada pukul 14:00. Saksi telah dihubungi."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed placeholder:text-slate-500"
                ></textarea>
                <p className="text-xs text-slate-500 mt-1">Catatan ini dapat dibaca oleh mahasiswa pelapor di dashboard mereka.</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 disabled:opacity-50 font-bold"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Simpan Status & Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
