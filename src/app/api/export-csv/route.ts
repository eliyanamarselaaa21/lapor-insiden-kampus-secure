// ===================================================================
// Route Handler Ekspor CSV Aman (src/app/api/export-csv/route.ts)
//
// ALASAN KEAMANAN (Materi Demo Cyber Security):
// 1. Otorisasi Ketat & Anti-IDOR (Role-Based & Ownership Check):
//    - User biasa (Mahasiswa) HANYA mendapatkan baris laporan yang userId-nya cocok dengan sesi login.
//    - Admin Keamanan mendapatkan seluruh data laporan terpadu.
// 2. Proteksi CSV / Formula Injection:
//    Semua kolom difilter melalui fungsi sanitizeCsvCell untuk mencegah eksekusi formula Excel berbahaya.
// 3. Pencatatan Audit Trail:
//    Aksi pengunduhan data massal dicatat ke ActivityLog untuk memantau potensi kebocoran data.
// ===================================================================

import { NextResponse } from "next/server";
import { getSession, getClientIp } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buildCsvDocument } from "@/lib/csv";

export async function GET() {
  // 1. Verifikasi Sesi dari Cookie HttpOnly
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Akses ditolak: Anda harus login untuk mengunduh data." },
      { status: 401 }
    );
  }

  const clientIp = getClientIp();

  try {
    let headers: string[] = [];
    let rows: (string | number | null | undefined)[][] = [];

    // 2. Penegakan Batasan Akses Berdasarkan Peran (Anti-IDOR)
    if (session.role === "ADMIN") {
      // ADMIN: Mengambil seluruh laporan di kampus
      const reports = await prisma.incidentReport.findMany({
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

      headers = [
        "ID Laporan",
        "Tanggal Dibuat",
        "Kategori",
        "Status",
        "Judul",
        "Lokasi",
        "Kronologi/Deskripsi",
        "Catatan Petugas Admin",
        "Nama Pelapor",
        "Email Pelapor",
      ];

      rows = reports.map((r) => [
        r.id,
        r.createdAt.toISOString().replace("T", " ").substring(0, 19),
        r.kategori,
        r.status,
        r.judul,
        r.lokasi,
        r.deskripsi,
        r.catatanAdmin || "-",
        r.user.nama,
        r.user.email,
      ]);
    } else {
      // USER: HANYA mengambil laporan milik pengguna yang sedang login (Pencegahan IDOR)
      const reports = await prisma.incidentReport.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
      });

      headers = [
        "ID Laporan",
        "Tanggal Dibuat",
        "Kategori",
        "Status",
        "Judul",
        "Lokasi",
        "Kronologi/Deskripsi",
        "Catatan Petugas Admin",
      ];

      rows = reports.map((r) => [
        r.id,
        r.createdAt.toISOString().replace("T", " ").substring(0, 19),
        r.kategori,
        r.status,
        r.judul,
        r.lokasi,
        r.deskripsi,
        r.catatanAdmin || "-",
      ]);
    }

    // 3. Bangun dokumen CSV yang telah disanitasi dari Formula Injection
    const csvContent = buildCsvDocument(headers, rows);

    // 4. Catat jejak audit pengunduhan
    await prisma.activityLog.create({
      data: {
        aksi: "EXPORT_CSV",
        detail: `Ekspor data laporan insiden ke file CSV (${session.role}, total ${rows.length} baris)`,
        ip: clientIp,
        userId: session.userId,
      },
    });

    // 5. Kembalikan respons file download dengan header HTTP yang tepat
    const filename = `sipekan_laporan_${session.role.toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate", // Mencegah browser menyimpan cache data sensitif
      },
    });
  } catch (error) {
    console.error("Kesalahan saat mengekspor CSV:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat memproses ekspor CSV." },
      { status: 500 }
    );
  }
}
