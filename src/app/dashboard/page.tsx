import { requireAuth, getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/actions/auth";
import { ShieldCheck, User, LogOut, FileText, CheckCircle2 } from "lucide-react";

export default async function DashboardPage() {
  // Verifikasi otentikasi di level server
  const session = await requireAuth();
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-4">
            <CheckCircle2 className="w-4 h-4" />
            Sesi Terotentikasi &mdash; Role: {session.role}
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Selamat Datang, <span className="text-emerald-700">{user?.nama}</span>!
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Anda berhasil masuk melalui cookie sesi HttpOnly yang terenkripsi tanda tangan digital JWT. Hak akses Anda saat ini adalah <strong>{session.role}</strong> (Mahasiswa/Pelapor).
          </p>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <p><strong>Status Proteksi RBAC:</strong> Aktif. Anda tidak dapat mengakses rute /admin karena middleware memblokirnya secara otomatis.</p>
            <p><strong>Fitur Pelaporan Insiden:</strong> Formulir pelaporan insiden kampus berkeamanan tinggi akan diimplementasikan penuh pada Tahap 6.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
