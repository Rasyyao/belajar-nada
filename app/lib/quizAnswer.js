/** Normalisasi jawaban operator/kode pendek untuk perbandingan aman. */
export function normalisasiJawaban(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, "")
        .toLowerCase();
}

export function cocokJawaban(jawabanSiswa, jawabanBenar) {
    return normalisasiJawaban(jawabanSiswa) === normalisasiJawaban(jawabanBenar);
}
