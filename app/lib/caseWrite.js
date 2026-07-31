import { supabaseAdmin } from "./supabase";
import { mainFunctionName } from "./functionDirectory";

/**
 * Terjemahan payload form admin → baris tabel, plus validasinya.
 *
 * Dipisah dari route handler karena dipakai dua kali (bikin baru & edit), dan
 * karena validasi soal itu urusan yang beda dari urusan HTTP. Form di browser
 * juga ngecek hal yang sama biar error-nya kelihatan cepat — tapi yang di sini
 * yang menentukan, karena API-nya bisa dipanggil tanpa lewat form.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Angka dari input form bisa datang sebagai string kosong — dianggap null. */
function toInt(value, fallback) {
  if (value === "" || value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/** Teks kosong disimpen sebagai null, bukan "" — biar query `is null` konsisten. */
function orNull(value) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Array/objek kosong juga jadi null, biar kolom jsonb-nya gak penuh sampah. */
function jsonOrNull(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.length === 0 ? null : value;
  if (typeof value === "object") {
    return Object.keys(value).length === 0 ? null : value;
  }
  return value;
}

function normalizePart(raw, index) {
  const partKe = toInt(raw?.partKe, index + 1);
  const judulPart = orNull(raw?.judulPart);
  const daftarFunction = jsonOrNull(raw?.daftarFunction);
  const namaFunction = orNull(
    raw?.namaFunction || mainFunctionName(daftarFunction, ""),
  );
  const starterCode = typeof raw?.starterCode === "string" ? raw.starterCode : "";

  if (!judulPart) return { error: `Part ${partKe}: judul part masih kosong.` };
  if (!namaFunction) return { error: `Part ${partKe}: nama function masih kosong.` };
  if (!Array.isArray(daftarFunction) || daftarFunction.length === 0) {
    return { error: `Part ${partKe}: daftar function harus berupa array yang berisi minimal satu function.` };
  }
  if (starterCode.trim() === "") {
    return { error: `Part ${partKe}: starter code masih kosong.` };
  }

  return {
    row: {
      part_ke: partKe,
      judul_part: judulPart,
      tema: orNull(raw?.tema),
      cerita: orNull(raw?.cerita),
      deskripsi_soal: orNull(raw?.deskripsiSoal),
      nama_function: namaFunction,
      starter_code: starterCode,
      input_awal: jsonOrNull(raw?.inputAwal),
      hasil_akhir_tervalidasi: jsonOrNull(raw?.hasilAkhirTervalidasi),
      daftar_function: daftarFunction,
      catatan_konsep: jsonOrNull(raw?.catatanKonsep),
      hints: jsonOrNull(raw?.hints),
      inputs: jsonOrNull(raw?.inputs),
      prompt_labels: jsonOrNull(raw?.promptLabels),
      bandingkan: jsonOrNull(raw?.bandingkan),
    },
  };
}

export function normalizeCasePayload(payload) {
  const slug = orNull(payload?.slug);
  const judul = orNull(payload?.judul);
  const tipe = payload?.tipe === "mini" ? "mini" : "berpart";
  const parts = Array.isArray(payload?.parts) ? payload.parts : [];

  if (!slug) return { error: "Slug masih kosong." };
  if (!SLUG_PATTERN.test(slug)) {
    return {
      error:
        "Slug cuma boleh huruf kecil, angka, dan tanda hubung (contoh: loket-karcis-wahana).",
    };
  }
  if (!judul) return { error: "Judul masih kosong." };
  if (parts.length === 0) return { error: "Soal harus punya minimal satu part." };
  if (tipe === "mini" && parts.length > 1) {
    return {
      error:
        "Mini project cuma boleh punya satu part. Ganti tipenya jadi soal berpart kalau mau lebih.",
    };
  }

  const partRows = [];
  for (const [index, raw] of parts.entries()) {
    const { row, error } = normalizePart(raw, index);
    if (error) return { error };
    partRows.push(row);
  }

  const nomorPart = partRows.map((row) => row.part_ke);
  if (new Set(nomorPart).size !== nomorPart.length) {
    return { error: "Ada dua part dengan nomor yang sama." };
  }

  return {
    caseRow: {
      slug,
      judul,
      cerita_utama: orNull(payload?.ceritaUtama),
      visual_theme: orNull(payload?.visualTheme),
      tipe,
      musim: tipe === "mini" ? orNull(payload?.musim) : null,
      urutan: toInt(payload?.urutan, 0),
    },
    partRows,
  };
}

/**
 * Tulis satu case + semua part-nya.
 *
 * Part-nya dihapus dulu baru ditulis ulang (bukan di-upsert satu-satu) supaya
 * part yang dibuang di form ikut kebuang di database. Ini bukan transaksi —
 * kalau insert part gagal setelah delete sukses, case-nya bakal kosong part
 * sementara; makanya error-nya dibalikin apa adanya biar admin langsung nyimpen
 * ulang, bukan didiemin.
 */
export async function writeCase({ id, caseRow, partRows, upsert = false }) {
  const supabase = supabaseAdmin();

  let targetId = id;
  if (!targetId && upsert) {
    const { data: existing, error: lookupError } = await supabase
      .from("cases")
      .select("id")
      .eq("slug", caseRow.slug)
      .maybeSingle();

    if (lookupError) return { error: lookupError.message, status: 500 };
    targetId = existing?.id;
  }

  const query = targetId
    ? supabase.from("cases").update(caseRow).eq("id", targetId)
    : supabase.from("cases").insert(caseRow);

  const { data: saved, error: caseError } = await query.select("id, slug").single();

  if (caseError) {
    // 23505 = unique violation, satu-satunya yang bisa dibenerin sendiri sama admin.
    if (caseError.code === "23505") {
      return { error: `Slug "${caseRow.slug}" udah dipakai soal lain.`, status: 409 };
    }
    return { error: caseError.message, status: 500 };
  }

  const { error: clearError } = await supabase
    .from("parts")
    .delete()
    .eq("case_id", saved.id);

  if (clearError) return { error: clearError.message, status: 500 };

  const { error: insertError } = await supabase
    .from("parts")
    .insert(partRows.map((row) => ({ ...row, case_id: saved.id })));

  if (insertError) return { error: insertError.message, status: 500 };

  return { data: saved };
}
