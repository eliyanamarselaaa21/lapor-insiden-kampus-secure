import { requireAdmin, getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { AdminReportList } from "@/components/AdminReportList";
import {
  ShieldAlert,
  LogOut,
  Download,
  Clock,
  Search,
  CheckCircle2,
  FolderOpen,
  Activity,
  Lock,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const user = await getCurrentUser();

  // Ambil semua laporan beserta identitas pelapor
  const allReports = await prisma.incidentReport.findMany({
    include: {
      user: {
        select: {
          nama: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Ambil 10 log aktivitas terbaru untuk tampilan Audit Trail keamanan
  const recentLogs = await prisma.activityLog.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          nama: true,
          email: true,
        },
      },
    },
  });

  // Hitung statistik kampus
  const total = allReports.length;
  const baruCount = allReports.filter((r) => r.status === "BARU").length;
  const diprosesCount = allReports.filter((r) => r.status === "DIPROSES").length;
  const selesaiCount = allReports.filter((r) => r.status === "SELESAI").length;

  const kehilanganCount = allReports.filter((r) => r.kategori === "KEHILANGAN").length;
  const pelanggaranCount = allReports.filter((r) => r.kategori === "PELANGGARAN").length;
  const siberCount = allReports.filter((r) => r.kategori === "SIBER").length;
  const lainnyaCount = allReports.filter((r) => r.kategori === "LAINNYA").length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Top Navbar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-600 text-slate-950 p-2 rounded-lg font-bold">
              <ShieldAlert className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">SIPEKAN &mdash; ADMIN</span>
              <span className="text-xs text-amber-500 block -mt-1 font-medium">Konsol Investigasi Keamanan</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-200">{user?.nama}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Export Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
              <Lock className="w-3.5 h-3.5" />
              Konsol Petugas Keamanan Kampus (RBAC: ADMIN)
            </div>
            <h1 className="text-2xl font-bold text-white">
              Pusat Komando & Investigasi Insiden
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Menangani laporan masuk dari seluruh civitas akademika, memperbarui status penyelidikan, dan audit log.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/export-csv"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition font-bold"
            >
              <Download className="w-4 h-4" />
              Ekspor CSV (Seluruh Kampus)
            </a>
          </div>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Seluruh Laporan</span>
              <FolderOpen className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-3xl font-extrabold text-white">{total}</p>
            <p className="text-xs text-slate-500 mt-1">Laporan dari mahasiswa/staf</p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Menunggu (BARU)</span>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-3xl font-extrabold text-amber-400">{baruCount}</p>
            <p className="text-xs text-slate-500 mt-1">Perlu verifikasi awal</p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-sky-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Dalam Investigasi</span>
              <Search className="w-4 h-4" />
            </div>
            <p className="text-3xl font-extrabold text-sky-400">{diprosesCount}</p>
            <p className="text-xs text-slate-500 mt-1">Sedang ditindaklanjuti</p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Selesai Ditangani</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-400">{selesaiCount}</p>
            <p className="text-xs text-slate-500 mt-1">Kasus berhasil ditutup</p>
          </div>
        </div>

        {/* Global Category Breakdown */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Sebaran Kategori Insiden Kampus
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-orange-950/30 border border-orange-900/50">
              <span className="text-xs text-orange-400 font-medium block">Kehilangan Barang</span>
              <span className="text-xl font-bold text-orange-300">{kehilanganCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-900/50">
              <span className="text-xs text-purple-400 font-medium block">Pelanggaran Tata Tertib</span>
              <span className="text-xl font-bold text-purple-300">{pelanggaranCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50">
              <span className="text-xs text-rose-400 font-medium block font-mono">Insiden Siber / IT</span>
              <span className="text-xl font-bold text-rose-300">{siberCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
              <span className="text-xs text-slate-400 font-medium block">Lainnya</span>
              <span className="text-xl font-bold text-slate-200">{lainnyaCount}</span>
            </div>
          </div>
        </div>

        {/* Admin Reports Management Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Konsol Manajemen Insiden</h2>
            <span className="text-xs text-slate-400">Pembaruan status real-time & audit trail otomatis</span>
          </div>
          <AdminReportList initialReports={allReports} />
        </div>

        {/* Security Audit Trail Live Feed (ActivityLog) */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold text-sm">
            <Activity className="w-4 h-4" />
            Jejak Log Keamanan Real-Time (ActivityLog Audit Trail)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="pb-2">Waktu</th>
                  <th className="pb-2">Aksi</th>
                  <th className="pb-2">Detail Aktivitas</th>
                  <th className="pb-2">Alamat IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded font-mono font-semibold bg-slate-900 border border-slate-700 text-amber-300">
                        {log.aksi}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-200">{log.detail || "-"}</td>
                    <td className="py-2.5 font-mono text-slate-400">{log.ip || "127.0.0.1"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
