import { requireAdmin, getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/actions/auth";
import { ShieldAlert, LogOut, CheckCircle2, ShieldCheck, Lock } from "lucide-react";

export default async function AdminDashboardPage() {
  // Verifikasi peran ADMIN di level server
  const session = await requireAdmin();
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top Navbar */}
      <header className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-600 text-white p-2 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">SIPEKAN &mdash; ADMIN</span>
              <span className="text-xs text-amber-500 block -mt-1 font-medium">Konsol Tim Keamanan Kampus</span>
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
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/80 p-6 sm:p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4" />
            Area Terproteksi Khusus &mdash; Hak Akses: {session.role}
          </div>

          <h1 className="text-2xl font-bold text-white">
            Konsol Komando Petugas Keamanan: <span className="text-amber-400">{user?.nama}</span>
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Selamat bertugas. Halaman ini hanya dapat diakses oleh akun dengan peran <strong>ADMIN</strong>. Mahasiswa atau pihak tanpa wewenang diblokir oleh Next.js Middleware.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300 space-y-1">
            <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> Enforced RBAC (Role-Based Access Control) Aktif
            </p>
            <p><strong>Fitur Investigasi & Tindak Lanjut:</strong> Panel investigasi, peninjauan bukti laporan, filter kategori, dan pengubahan status insiden akan hadir penuh pada Tahap 7.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
