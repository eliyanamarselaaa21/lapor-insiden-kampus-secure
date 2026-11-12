import Link from "next/link";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { UserReportList } from "@/components/UserReportList";
import {
  ShieldCheck,
  LogOut,
  PlusCircle,
  Download,
  Clock,
  Search,
  CheckCircle2,
  FolderLock,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await requireAuth();
  const user = await getCurrentUser();

  // Kueri laporan HANYA milik user yang login (Pencegahan IDOR)
  const userReports = await prisma.incidentReport.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  // Hitung statistik rekapitulasi data milik pengguna
  const totalReports = userReports.length;
  const baruCount = userReports.filter((r) => r.status === "BARU").length;
  const diprosesCount = userReports.filter((r) => r.status === "DIPROSES").length;
  const selesaiCount = userReports.filter((r) => r.status === "SELESAI").length;

  const kehilanganCount = userReports.filter((r) => r.kategori === "KEHILANGAN").length;
  const pelanggaranCount = userReports.filter((r) => r.kategori === "PELANGGARAN").length;
  const siberCount = userReports.filter((r) => r.kategori === "SIBER").length;
  const lainnyaCount = userReports.filter((r) => r.kategori === "LAINNYA").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-2 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-800 tracking-tight">SIPEKAN</span>
              <span className="text-xs text-emerald-700 block -mt-1 font-medium">Portal Mahasiswa / Pelapor</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">{user?.nama}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
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
        {/* Welcome & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Selamat Datang, <span className="text-emerald-700">{user?.nama}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pantau status penanganan insiden atau buat pengaduan baru dengan perlindungan privasi ketat.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <a
              href="/api/export-csv"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-sm transition"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Ekspor CSV (Data Saya)
            </a>
            <Link
              href="/lapor"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Buat Laporan Baru
            </Link>
          </div>
        </div>

        {/* Stats Recap Cards (Status Insiden) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Laporan Saya</span>
              <FolderLock className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{totalReports}</p>
            <p className="text-xs text-slate-400 mt-1">Riwayat aduan diajukan</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Menunggu (BARU)</span>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-3xl font-extrabold text-amber-600">{baruCount}</p>
            <p className="text-xs text-slate-400 mt-1">Belum diverifikasi petugas</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-sky-600 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Sedang Diinvestigasi</span>
              <Search className="w-4 h-4" />
            </div>
            <p className="text-3xl font-extrabold text-sky-600">{diprosesCount}</p>
            <p className="text-xs text-slate-400 mt-1">Dalam tindak lanjut lapangan</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Selesai Ditangani</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-600">{selesaiCount}</p>
            <p className="text-xs text-slate-400 mt-1">Telah diselesaikan resmi</p>
          </div>
        </div>

        {/* Category Breakdown Mini-Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Distribusi Kategori Laporan Anda
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
              <span className="text-xs text-orange-700 font-medium block">Kehilangan</span>
              <span className="text-xl font-bold text-orange-800">{kehilanganCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
              <span className="text-xs text-purple-700 font-medium block">Pelanggaran Disiplin</span>
              <span className="text-xl font-bold text-purple-800">{pelanggaranCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
              <span className="text-xs text-rose-700 font-medium block font-mono">Keamanan Siber</span>
              <span className="text-xl font-bold text-rose-800">{siberCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-600 font-medium block">Lainnya</span>
              <span className="text-xl font-bold text-slate-800">{lainnyaCount}</span>
            </div>
          </div>
        </div>

        {/* Report List Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Daftar Laporan Anda</h2>
            <span className="text-xs text-slate-400">
              Hanya menampilkan data yang Anda laporkan (Anti-IDOR Protected)
            </span>
          </div>
          <UserReportList reports={userReports} />
        </div>
      </main>
    </div>
  );
}
