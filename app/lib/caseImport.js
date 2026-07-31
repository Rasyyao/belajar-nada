import { mainFunctionName, normalizeDaftarFunction } from "./functionDirectory.js";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function firstDefined(...values) {
    return values.find((value) => value !== undefined);
}

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function normalizePart(raw, index, type) {
    const partKe = Number.isFinite(Number(raw?.partKe ?? raw?.part_ke))
        ? Math.trunc(Number(raw.partKe ?? raw.part_ke))
        : index + 1;

    const daftarFunction = normalizeDaftarFunction(
        firstDefined(raw?.daftarFunction, raw?.daftar_function, null),
        firstDefined(raw?.alurData, raw?.alur_data, null),
        firstDefined(raw?.namaFunction, raw?.nama_function, raw?.alurData?.namaFunction, ""),
    );

    return {
        partKe,
        judulPart: firstDefined(raw?.judulPart, raw?.judul_part, type === "mini" ? raw?.judul : "") ?? "",
        tema: raw?.tema ?? "",
        cerita: raw?.cerita ?? "",
        deskripsiSoal: firstDefined(raw?.deskripsiSoal, raw?.deskripsi_soal, "") ?? "",
        namaFunction: firstDefined(
            raw?.namaFunction,
            raw?.nama_function,
            raw?.alurData?.namaFunction,
            mainFunctionName(daftarFunction, ""),
            "",
        ) ?? "",
        starterCode: firstDefined(raw?.starterCode, raw?.starter_code, "") ?? "",
        hints: asArray(raw?.hints),
        inputs: asArray(raw?.inputs),
        promptLabels: asArray(firstDefined(raw?.promptLabels, raw?.prompt_labels, [])),
        inputAwal: firstDefined(raw?.inputAwal, raw?.input_awal, null),
        hasilAkhirTervalidasi: firstDefined(
            raw?.hasilAkhirTervalidasi,
            raw?.hasil_akhir_tervalidasi,
            null,
        ),
        daftarFunction,
        catatanKonsep: firstDefined(raw?.catatanKonsep, raw?.catatan_konsep, null),
        bandingkan: raw?.bandingkan ?? null,
    };
}

function normalizeCase(raw, urutan) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return { error: "Item soal harus berupa object JSON." };
    }

    const rawParts = Array.isArray(raw.parts) ? raw.parts : null;
    const isMini = rawParts === null;
    const type = isMini ? "mini" : raw.tipe === "mini" ? "mini" : "berpart";
    const slug = String(firstDefined(raw.slug, raw.id, "")).trim();
    const title = String(raw.judul ?? "").trim();

    const parts = rawParts ?? [raw];
    const payload = {
        slug,
        judul: title,
        ceritaUtama: firstDefined(raw.ceritaUtama, raw.cerita, "") ?? "",
        visualTheme: raw.visualTheme ?? raw.visual_theme ?? "",
        tipe: type,
        musim: type === "mini" ? raw.musim ?? "" : "",
        urutan,
        parts: parts.map((part, index) => normalizePart(part, index, type)),
    };

    const errors = [];
    if (!slug) errors.push("slug/id masih kosong");
    else if (!SLUG_PATTERN.test(slug)) errors.push("slug hanya boleh huruf kecil, angka, dan tanda hubung");
    if (!title) errors.push("judul masih kosong");
    if (payload.parts.length === 0) errors.push("parts harus punya minimal satu item");
    if (type === "mini" && payload.parts.length > 1) errors.push("mini project hanya boleh punya satu part");

    const partNumbers = new Set();
    payload.parts.forEach((part, index) => {
        const label = `Part ${part.partKe || index + 1}`;
        if (partNumbers.has(part.partKe)) errors.push(`${label}: nomor part duplikat`);
        partNumbers.add(part.partKe);
        if (!String(part.judulPart).trim()) errors.push(`${label}: judul part kosong`);
        if (!String(part.namaFunction).trim()) errors.push(`${label}: nama function kosong`);
        if (!String(part.starterCode).trim()) errors.push(`${label}: starter code kosong`);
    });

    return errors.length > 0
        ? { error: `${slug || "Soal"}: ${errors.join("; ")}` }
        : { value: payload };
}

function rootsFromJson(value) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];
    for (const key of ["cases", "projects", "soal", "items"]) {
        if (Array.isArray(value[key])) return value[key];
    }
    return [value];
}

export function normalizeImportedFiles(files) {
    const values = [];
    const errors = [];
    let order = 1;

    for (const file of files) {
        for (const raw of rootsFromJson(file.value)) {
            const result = normalizeCase(raw, order);
            if (result.error) errors.push(`${file.name}: ${result.error}`);
            else {
                values.push({ ...result.value, _sourceFile: file.name });
                order += 1;
            }
        }
    }

    const seen = new Map();
    for (const item of values) {
        if (seen.has(item.slug)) {
            errors.push(`Slug duplikat "${item.slug}" (${seen.get(item.slug)} dan ${item._sourceFile}).`);
        } else {
            seen.set(item.slug, item._sourceFile);
        }
    }

    return {
        values: values.map((item) => {
            const copy = { ...item };
            delete copy._sourceFile;
            return copy;
        }),
        errors,
    };
}
