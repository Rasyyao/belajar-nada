import { supabaseAdmin } from "./supabase";
import { normalizeDaftarFunction } from "./functionDirectory";
import { clampPage, PAGE_SIZE } from "./pagination";

/**
 * Pembacaan khusus halaman admin.
 *
 * Beda dari `projects.js` yang ngasih bentuk siap-render buat siswa, di sini
 * yang dibutuhin justru bentuk MENTAH-nya: termasuk `id` uuid (buat tombol edit
 * & hapus) dan kolom yang di sisi siswa gak pernah kelihatan.
 *
 * Pakai service role, bukan anon key — halaman yang manggil ini udah dijaga
 * `app/admin/layout.jsx`, dan dengan begini daftar admin tetap lengkap walau
 * nanti policy RLS buat publik diperketat.
 */

/** PGRST205 = tabelnya belum ada, alias `supabase/schema.sql` belum dijalanin. */
const SCHEMA_BELUM_ADA = "PGRST205";

/**
 * Tabelnya udah dibikin belum? Dicek sekali di layout admin supaya yang muncul
 * pas belum disiapin adalah instruksi yang jelas, bukan halaman error merah.
 */
export async function schemaReady() {
  const { error } = await supabaseAdmin().from("cases").select("id").limit(1);
  if (!error) return true;
  if (error.code === SCHEMA_BELUM_ADA) return false;
  throw new Error(`Gagal nyambung ke database: ${error.message}`);
}

export async function listCases(page = 1, pageSize = PAGE_SIZE) {
  const { count: total, error: countError } = await supabaseAdmin()
    .from("cases")
    .select("id", { count: "exact", head: true });
  if (countError) throw new Error(`Gagal menghitung daftar soal: ${countError.message}`);

  if (!total) return { items: [], total: 0, page: 1 };

  const safePage = clampPage(page, total ?? 0, pageSize);
  const from = (safePage - 1) * pageSize;
  const { data, error } = await supabaseAdmin()
    .from("cases")
    .select("id, slug, judul, tipe, visual_theme, urutan, created_at, parts(count)", {
      count: "exact",
    })
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: true })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(`Gagal ambil daftar soal: ${error.message}`);

  return {
    items: (data ?? []).map((row) => ({
      ...row,
      // Supabase balikin agregat count sebagai array satu elemen.
      jumlahPart: row.parts?.[0]?.count ?? 0,
    })),
    total: total ?? 0,
    page: safePage,
  };
}

/** Satu case lengkap, sudah dalam bentuk yang dipakai state form. */
export async function getCaseForEdit(id) {
  const { data, error } = await supabaseAdmin()
    .from("cases")
    .select("*, parts(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null; // id di URL bukan uuid yang sah
    throw new Error(`Gagal ambil soal: ${error.message}`);
  }
  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    judul: data.judul,
    ceritaUtama: data.cerita_utama ?? "",
    visualTheme: data.visual_theme ?? "",
    tipe: data.tipe,
    musim: data.musim ?? "",
    urutan: data.urutan ?? 0,
    parts: [...(data.parts ?? [])]
      .sort((a, b) => a.part_ke - b.part_ke)
      .map((part) => ({
        partKe: part.part_ke,
        judulPart: part.judul_part ?? "",
        tema: part.tema ?? "",
        cerita: part.cerita ?? "",
        deskripsiSoal: part.deskripsi_soal ?? "",
        namaFunction: part.nama_function ?? "",
        starterCode: part.starter_code ?? "",
        inputAwal: part.input_awal ?? null,
        hasilAkhirTervalidasi: part.hasil_akhir_tervalidasi ?? null,
        daftarFunction: normalizeDaftarFunction(
          part.daftar_function,
          part.alur_data,
          part.nama_function ?? "",
        ),
        catatanKonsep: part.catatan_konsep ?? null,
        hints: part.hints ?? [],
        inputs: part.inputs ?? [],
        promptLabels: part.prompt_labels ?? [],
        bandingkan: part.bandingkan ?? null,
      })),
  };
}

export async function listMateriForAdmin(page = 1, pageSize = PAGE_SIZE) {
  const { count: total, error: countError } = await supabaseAdmin()
    .from("materi")
    .select("id", { count: "exact", head: true });
  if (countError) throw new Error(`Gagal menghitung daftar materi: ${countError.message}`);

  if (!total) return { items: [], total: 0, page: 1 };

  const safePage = clampPage(page, total ?? 0, pageSize);
  const from = (safePage - 1) * pageSize;
  const { data, error } = await supabaseAdmin()
    .from("materi")
    .select("id, judul, kategori, file_url, urutan, created_at", { count: "exact" })
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: true })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(`Gagal ambil daftar materi: ${error.message}`);
  return { items: data ?? [], total: total ?? 0, page: safePage };
}

export async function getMateriForEdit(id) {
  const { data, error } = await supabaseAdmin()
    .from("materi")
    .select("id, judul, kategori, konten, file_url, urutan")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Gagal ambil materi: ${error.message}`);
  }
  return data;
}
