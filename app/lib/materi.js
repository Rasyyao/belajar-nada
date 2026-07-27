import { isSupabaseConfigured, supabasePublic } from "./supabase";

/**
 * Pintu ke tabel `materi` — bacaan/penjelasan, bukan soal.
 *
 * Beda dari soal, materi gak punya versi JSON bawaan: kalau Supabase belum
 * disiapkan (env kosong ATAU tabelnya belum dibikin), daftarnya memang kosong —
 * halamannya ngasih tahu itu baik-baik, bukan lempar error.
 */

const COLUMNS = "id, judul, kategori, konten, file_url, urutan, created_at";

/** PGRST205 = tabelnya belum ada; 22P02 = id di URL bukan uuid yang sah. */
const SCHEMA_BELUM_ADA = "PGRST205";
const BUKAN_UUID = "22P02";

export async function getMateriList() {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabasePublic()
    .from("materi")
    .select(COLUMNS)
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: true });

  if (error?.code === SCHEMA_BELUM_ADA) return [];
  if (error) throw new Error(`Gagal ambil daftar materi: ${error.message}`);
  return data ?? [];
}

export async function getMateri(id) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabasePublic()
    .from("materi")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === BUKAN_UUID || error.code === SCHEMA_BELUM_ADA) return null;
    throw new Error(`Gagal ambil materi: ${error.message}`);
  }
  return data;
}

/**
 * Kelompokin per kategori buat halaman daftar, sambil jaga urutan kategorinya
 * ngikut urutan materi pertama yang muncul di tiap kategori.
 */
export function groupByKategori(list) {
  const groups = new Map();
  for (const item of list) {
    const key = item.kategori?.trim() || "Lain-lain";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()].map(([kategori, items]) => ({ kategori, items }));
}
