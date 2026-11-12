// ===================================================================
// Utilitas Pertahanan CSRF (Cross-Site Request Forgery) (src/lib/csrf.ts)
//
// ALASAN KEAMANAN (Materi Demo Cyber Security):
// 1. Lapisan Pertahanan Ganda CSRF:
//    - Lapisan 1: Cookie sesi menggunakan SameSite="Lax". Browser menolak
//      mengirimkan cookie ini pada request POST lintas domain (Cross-Origin).
//    - Lapisan 2: Next.js App Router Server Actions secara otomatis memvalidasi
//      bahwa header 'Origin' cocok dengan header 'Host'.
//    - Lapisan 3: Fungsi verifySameOrigin() ini melakukan pemeriksaan deterministik
//      terhadap header Origin dan Referer untuk memastikan request mutasi
//      berasal dari aplikasi kita sendiri, bukan dari situs peretas.
// ===================================================================

import { headers } from "next/headers";

/**
 * Memvalidasi apakah request POST / mutasi berasal dari Same-Origin.
 * @returns boolean true jika request valid dan aman, false jika dicurigai serangan CSRF.
 */
export function verifySameOrigin(): boolean {
  const headerList = headers();
  const host = headerList.get("host") || headerList.get("x-forwarded-host");
  const origin = headerList.get("origin");
  const referer = headerList.get("referer");

  if (!host) {
    return false;
  }

  // Periksa header Origin terlebih dahulu
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      return originHost === host;
    } catch {
      return false;
    }
  }

  // Jika Origin tidak ada, periksa header Referer
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      return refererHost === host;
    } catch {
      return false;
    }
  }

  // Pada request yang sah dari browser saat pengiriman form, minimal salah satu pasti ada.
  return true;
}
