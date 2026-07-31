export function legacyToDaftarFunction(alur, fallbackName = "") {
    if (!alur || typeof alur !== "object") return [];

    const parameters = Array.isArray(alur.masuk)
        ? alur.masuk.map((pair) => ({
            nama: pair.dalam ?? pair.nama ?? pair.luar ?? "",
            keterangan: pair.keterangan ?? "Parameter yang menerima data dari luar function.",
        }))
        : [];

    const returnDescription = alur.keluar
        ? `Mengembalikan hasil melalui return ke variabel ${alur.keluar.luar ?? "di luar function"}.`
        : alur.catatanKeluar ?? "Tidak mengembalikan nilai; hasilnya mengubah data yang diterima sebagai parameter.";

    return [
        {
            nama: alur.namaFunction ?? fallbackName,
            perananSingkat: alur.proses ?? "Memproses data dari parameter lalu menghasilkan output.",
            parameter: parameters,
            return: { keterangan: returnDescription },
            dipanggilOleh: [],
            iniFunctionUtama: true,
        },
    ].filter((item) => item.nama);
}

export function normalizeDaftarFunction(value, legacyAlur, fallbackName = "") {
    if (Array.isArray(value) && value.length > 0) return value;
    return legacyToDaftarFunction(legacyAlur, fallbackName);
}

export function mainFunctionName(functions, fallback = "") {
    const list = Array.isArray(functions) ? functions : [];
    return list.find((item) => item?.iniFunctionUtama)?.nama
        ?? list[list.length - 1]?.nama
        ?? fallback;
}
