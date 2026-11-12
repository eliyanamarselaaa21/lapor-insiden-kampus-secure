"use server";

// ===================================================================
// Server Actions Pengelolaan Laporan Insiden (src/actions/reports.ts)
//
// ALASAN KEAMANAN (Materi Demo Cyber Security):
// 1. Perlindungan Mutlak Terhadap IDOR (Insecure Direct Object References):
//    - Setiap operasi pengubahan (Update) dan penghapusan (Delete) oleh mahasiswa (USER)
//      selalu memeriksa kepemilikan: `existing.userId === session.userId`.
//    - Jika penyerang memanipulasi ID laporan di browser ke ID milik mahasiswa lain,
//      server langsung menolak request dengan status gagal.
// 2. Kontrol Alur Bisnis Keamanan (State & Tampering Protection):
//    - Mahasiswa HANYA boleh mengedit atau menghapus laporan selama statusnya masih `BARU`.
//    - Jika status sudah `DIPROSES` atau `SELESAI`, laporan dikunci demi menjaga
//      integritas bukti penyelidikan oleh tim keamanan.
// 3. Hak Istimewa Admin (Principle of Separation of Duties):
//    - Fungsi pembaruan status dan pengisian catatan investigasi diproteksi dengan `requireAdmin()`.
// 4. Jejak Audit Kritis (Audit Trail):
//    - Setiap penambahan, pembaruan, dan penghapusan data dicatat ke `ActivityLog`.
// ===================================================================

import { revalidatePath } from "next/cache";
import { StatusLaporan, KategoriInsiden } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, getClientIp } from "@/lib/session";
import { verifySameOrigin } from "@/lib/csrf";
import {
  createReportSchema,
  updateStatusSchema,
  type CreateReportInput,
  type UpdateStatusInput,
} from "@/lib/validations";

export interface ReportActionResult {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  reportId?: string;
}

/**
 * 1. USER: MEMBUAT LAPORAN INSIDEN BARU
 */
export async function createReportAction(
  prevState: ReportActionResult | null,
  formData: FormData
): Promise<ReportActionResult> {
  // Validasi Same-Origin (Pertahanan Tambahan Anti-CSRF)
  if (!verifySameOrigin()) {
    return {
      success: false,
      message: "Permintaan ditolak: Indikasi manipulasi lintas situs (CSRF).",
    };
  }

  const session = await requireAuth();
  const clientIp = getClientIp();

  const rawData: Record<string, unknown> = {
    judul: formData.get("judul"),
    kategori: formData.get("kategori"),
    lokasi: formData.get("lokasi"),
    deskripsi: formData.get("deskripsi"),
  };

  // Validasi input dengan Zod
  const validated = createReportSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: "Data laporan tidak valid. Mohon lengkapi isian wajib.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { judul, kategori, lokasi, deskripsi } = validated.data;

  try {
    // Simpan laporan ke database terikat pada userId yang login
    const newReport = await prisma.incidentReport.create({
      data: {
        judul,
        kategori: kategori as KategoriInsiden,
        lokasi,
        deskripsi,
        status: StatusLaporan.BARU,
        userId: session.userId, // Anti-Spoofing: Menggunakan ID dari token JWT yang terverifikasi
      },
    });

    // Catat log aktivitas pembuatan laporan
    await prisma.activityLog.create({
      data: {
        aksi: "REPORT_CREATE",
        detail: `Membuat laporan "${judul}" (Kategori: ${kategori}, ID: ${newReport.id})`,
        ip: clientIp,
        userId: session.userId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return {
      success: true,
      message: "Laporan Anda berhasil dikirim dan tersimpan dengan aman.",
      reportId: newReport.id,
    };
  } catch (error) {
    console.error("Gagal membuat laporan:", error);
    return {
      success: false,
      message: "Terjadi gangguan sistem saat menyimpan laporan. Silakan coba lagi.",
    };
  }
}

/**
 * 2. USER: MENGUBAH LAPORAN MILIK SENDIRI (HANYA BISA JIKA STATUS == BARU)
 */
export async function updateReportUserAction(
  reportId: string,
  formData: FormData
): Promise<ReportActionResult> {
  if (!verifySameOrigin()) {
    return {
      success: false,
      message: "Permintaan ditolak: Indikasi manipulasi lintas situs (CSRF).",
    };
  }

  const session = await requireAuth();
  const clientIp = getClientIp();

  const rawData: Record<string, unknown> = {
    judul: formData.get("judul"),
    kategori: formData.get("kategori"),
    lokasi: formData.get("lokasi"),
    deskripsi: formData.get("deskripsi"),
  };

  const validated = createReportSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: "Data laporan yang diubah tidak valid.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    // Cari data laporan yang akan diubah
    const existing = await prisma.incidentReport.findUnique({
      where: { id: reportId },
    });

    if (!existing) {
      return {
        success: false,
        message: "Laporan tidak ditemukan.",
      };
    }

    // ===============================================================
    // PENGECEKAN KEAMANAN ANTI-IDOR (Insecure Direct Object Reference)
    // Pastikan pengguna hanya dapat mengubah laporan miliknya sendiri!
    // ===============================================================
    if (existing.userId !== session.userId) {
      // Catat percobaan akses ilegal ke ActivityLog
      await prisma.activityLog.create({
        data: {
          aksi: "SECURITY_IDOR_ATTEMPT",
          detail: `Upaya ilegal pengubahan laporan ID ${reportId} milik pengguna lain!`,
          ip: clientIp,
          userId: session.userId,
        },
      });

      return {
        success: false,
        message: "Akses ditolak: Anda tidak memiliki hak akses untuk mengubah laporan ini.",
      };
    }

    // Integritas Bukti: Hanya boleh diedit jika status masih BARU
    if (existing.status !== StatusLaporan.BARU) {
      return {
        success: false,
        message: "Laporan yang sedang ditangani atau telah selesai tidak dapat diubah kembali.",
      };
    }

    const { judul, kategori, lokasi, deskripsi } = validated.data;

    await prisma.incidentReport.update({
      where: { id: reportId },
      data: {
        judul,
        kategori: kategori as KategoriInsiden,
        lokasi,
        deskripsi,
      },
    });

    await prisma.activityLog.create({
      data: {
        aksi: "REPORT_UPDATE",
        detail: `Memperbarui isi laporan ID: ${reportId}`,
        ip: clientIp,
        userId: session.userId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return {
      success: true,
      message: "Laporan berhasil diperbarui.",
    };
  } catch (error) {
    console.error("Gagal memperbarui laporan:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memperbarui laporan.",
    };
  }
}

/**
 * 3. USER: MENGHAPUS LAPORAN MILIK SENDIRI (HANYA BISA JIKA STATUS == BARU)
 */
export async function deleteReportUserAction(reportId: string): Promise<ReportActionResult> {
  if (!verifySameOrigin()) {
    return {
      success: false,
      message: "Permintaan ditolak: Indikasi manipulasi lintas situs (CSRF).",
    };
  }

  const session = await requireAuth();
  const clientIp = getClientIp();

  try {
    const existing = await prisma.incidentReport.findUnique({
      where: { id: reportId },
    });

    if (!existing) {
      return { success: false, message: "Laporan tidak ditemukan." };
    }

    // PENGECEKAN ANTI-IDOR
    if (existing.userId !== session.userId) {
      await prisma.activityLog.create({
        data: {
          aksi: "SECURITY_IDOR_ATTEMPT",
          detail: `Upaya ilegal penghapusan laporan ID ${reportId} milik pengguna lain!`,
          ip: clientIp,
          userId: session.userId,
        },
      });

      return {
        success: false,
        message: "Akses ditolak: Anda bukan pemilik laporan ini.",
      };
    }

    // Cek status laporan
    if (existing.status !== StatusLaporan.BARU) {
      return {
        success: false,
        message: "Laporan tidak dapat dihapus karena sudah dalam proses investigasi atau telah selesai.",
      };
    }

    await prisma.incidentReport.delete({
      where: { id: reportId },
    });

    await prisma.activityLog.create({
      data: {
        aksi: "REPORT_DELETE",
        detail: `Pengguna menghapus laporan mandiri: "${existing.judul}"`,
        ip: clientIp,
        userId: session.userId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return {
      success: true,
      message: "Laporan berhasil dibatalkan dan dihapus.",
    };
  } catch (error) {
    console.error("Gagal menghapus laporan:", error);
    return {
      success: false,
      message: "Terjadi kendala saat menghapus laporan.",
    };
  }
}

/**
 * 4. ADMIN: MENGUBAH STATUS & MEMBERI CATATAN TINDAK LANJUT
 */
export async function updateStatusAdminAction(
  reportId: string,
  formData: FormData
): Promise<ReportActionResult> {
  if (!verifySameOrigin()) {
    return {
      success: false,
      message: "Permintaan ditolak: Indikasi manipulasi lintas situs (CSRF).",
    };
  }

  const session = await requireAdmin(); // Wajib ADMIN
  const clientIp = getClientIp();

  const rawData = {
    status: formData.get("status"),
    catatanAdmin: formData.get("catatanAdmin") || null,
  };

  const validated = updateStatusSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: "Format status atau catatan tindak lanjut tidak valid.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { status, catatanAdmin } = validated.data;

  try {
    const existing = await prisma.incidentReport.findUnique({
      where: { id: reportId },
    });

    if (!existing) {
      return { success: false, message: "Laporan tidak ditemukan." };
    }

    await prisma.incidentReport.update({
      where: { id: reportId },
      data: {
        status: status as StatusLaporan,
        catatanAdmin: catatanAdmin || null,
      },
    });

    // Catat jejak audit pengubahan status oleh petugas keamanan
    await prisma.activityLog.create({
      data: {
        aksi: "STATUS_UPDATE",
        detail: `Petugas keamanan mengubah status laporan "${existing.judul}" dari ${existing.status} menjadi ${status}`,
        ip: clientIp,
        userId: session.userId,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Status laporan berhasil diperbarui menjadi ${status}.`,
    };
  } catch (error) {
    console.error("Gagal mengubah status oleh admin:", error);
    return {
      success: false,
      message: "Terjadi kegagalan sistem saat memperbarui status laporan.",
    };
  }
}

/**
 * 5. ADMIN: MENGHAPUS LAPORAN MANA PUN
 */
export async function deleteReportAdminAction(reportId: string): Promise<ReportActionResult> {
  if (!verifySameOrigin()) {
    return {
      success: false,
      message: "Permintaan ditolak: Indikasi manipulasi lintas situs (CSRF).",
    };
  }

  const session = await requireAdmin(); // Wajib ADMIN
  const clientIp = getClientIp();

  try {
    const existing = await prisma.incidentReport.findUnique({
      where: { id: reportId },
    });

    if (!existing) {
      return { success: false, message: "Laporan tidak ditemukan." };
    }

    await prisma.incidentReport.delete({
      where: { id: reportId },
    });

    await prisma.activityLog.create({
      data: {
        aksi: "REPORT_DELETE_ADMIN",
        detail: `Petugas keamanan menghapus laporan ID ${reportId} ("${existing.judul}")`,
        ip: clientIp,
        userId: session.userId,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Laporan berhasil dihapus oleh admin.",
    };
  } catch (error) {
    console.error("Gagal menghapus laporan oleh admin:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus laporan.",
    };
  }
}
