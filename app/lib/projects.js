import { isSupabaseConfigured, supabasePublic } from "./supabase";

/**
 * Satu-satunya pintu ke materi soal.
 *
 * Sumbernya sekarang tabel `cases` + `parts` di Supabase. Halaman-halaman
 * memanggil function di file ini, gak pernah nyentuh Supabase langsung — jadi
 * bentuk data yang dipakai runner tetap sama persis kayak waktu masih JSON.
 *
 * Ada DUA skema soal yang hidup berdampingan, dibedain kolom `tipe`:
 * - `mini`    : satu soal = satu halaman, programnya minta input lewat ambilInput().
 * - `berpart` : satu soal = beberapa part yang dikerjain berurutan lewat tab.
 * Keduanya disimpen di tabel yang sama; yang beda cuma kolom mana yang keisi.
 *
 * `slug` di database = `id` yang dipakai di URL dan di kode runner.
 *
 * Setelah migrasi, Supabase adalah satu-satunya sumber runtime. JSON tetap
 * disimpan sebagai sumber seed/migrasi, bukan fallback data aplikasi.
 */

/** PGRST205 = tabelnya gak ada di schema cache, alias belum pernah dibikin. */
const SCHEMA_BELUM_ADA = "PGRST205";

const CASE_COLUMNS =
  "id, slug, judul, cerita_utama, visual_theme, tipe, musim, urutan, created_at";
const PART_COLUMNS =
  "part_ke, judul_part, tema, cerita, deskripsi_soal, nama_function, starter_code, input_awal, hasil_akhir_tervalidasi, alur_data, catatan_konsep, hints, inputs, prompt_labels, bandingkan";

/** Baris `parts` → bentuk part yang dibaca PartProjectRunner. */
function toPart(row) {
  return {
    partKe: row.part_ke,
    judulPart: row.judul_part,
    tema: row.tema,
    cerita: row.cerita,
    deskripsiSoal: row.deskripsi_soal,
    namaFunction: row.nama_function,
    starterCode: row.starter_code,
    inputAwal: row.input_awal ?? {},
    hasilAkhirTervalidasi: row.hasil_akhir_tervalidasi ?? {},
    alurData: row.alur_data ?? null,
    catatanKonsep: row.catatan_konsep ?? [],
    hints: row.hints ?? [],
    bandingkan: row.bandingkan ?? undefined,
    // Dua ini cuma kepakai kalau case-nya bertipe `mini` — di soal berpart
    // nilainya null dan diabaikan.
    inputs: row.inputs ?? [],
    promptLabels: row.prompt_labels ?? [],
  };
}

/**
 * Baris `cases` (+ parts-nya) → bentuk project yang dibaca runner.
 *
 * Mini project diratakan: satu-satunya part-nya dilebur ke level atas, karena
 * ProjectRunner emang gak kenal konsep part sama sekali.
 */
function toProject(row) {
  const parts = [...(row.parts ?? [])]
    .sort((a, b) => a.part_ke - b.part_ke)
    .map(toPart);

  if (row.tipe === "mini") {
    const part = parts[0];
    if (!part) return null; // case mini tanpa part = data setengah jadi, sembunyiin
    return {
      tipe: "mini",
      id: row.slug,
      judul: row.judul,
      createdAt: row.created_at ?? null,
      tema: part.tema,
      musim: row.musim,
      cerita: row.cerita_utama ?? part.cerita,
      visualTheme: row.visual_theme,
      deskripsiSoal: part.deskripsiSoal,
      starterCode: part.starterCode,
      inputAwal: part.inputAwal,
      inputs: part.inputs ?? [],
      promptLabels: part.promptLabels ?? [],
      hasilAkhirTervalidasi: part.hasilAkhirTervalidasi,
      alurData: part.alurData,
      catatanKonsep: part.catatanKonsep,
      hints: part.hints,
    };
  }

  if (parts.length === 0) return null;

  return {
    tipe: "berpart",
    id: row.slug,
    judul: row.judul,
    createdAt: row.created_at ?? null,
    ceritaUtama: row.cerita_utama,
    visualTheme: row.visual_theme,
    parts,
  };
}

/** Semua soal, sudah dalam bentuk yang siap dipakai runner. */
export async function getAllProjects() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi untuk Mini Project.");
  }

  const { data, error } = await supabasePublic()
    .from("cases")
    .select(`${CASE_COLUMNS}, parts(${PART_COLUMNS})`)
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: true });

  if (error?.code === SCHEMA_BELUM_ADA) {
    throw new Error("Tabel cases/parts belum ada. Jalankan supabase/schema.sql terlebih dahulu.");
  }
  if (error) throw new Error(`Gagal ambil daftar soal dari Supabase: ${error.message}`);

  return (data ?? []).map(toProject).filter(Boolean);
}

export async function getMiniProjects() {
  const all = await getAllProjects();
  return all.filter((project) => project.tipe === "mini");
}

export async function getPartProjects() {
  const all = await getAllProjects();
  return all.filter((project) => project.tipe === "berpart");
}

/**
 * Satu soal berdasarkan slug — dipakai halaman detail.
 * Balikin `null` kalau gak ketemu, biar pemanggilnya yang mutusin `notFound()`.
 */
export async function getProject(slug) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi untuk Mini Project.");
  }

  const { data, error } = await supabasePublic()
    .from("cases")
    .select(`${CASE_COLUMNS}, parts(${PART_COLUMNS})`)
    .eq("slug", slug)
    .maybeSingle();

  if (error?.code === SCHEMA_BELUM_ADA) {
    throw new Error("Tabel cases/parts belum ada. Jalankan supabase/schema.sql terlebih dahulu.");
  }
  if (error) throw new Error(`Gagal ambil soal "${slug}": ${error.message}`);
  if (!data) return null;
  return toProject(data);
}

/**
 * Urutan semua soal buat navigasi "lanjut ke soal berikutnya".
 * Query-nya ringan (gak ikut narik parts) karena yang dibutuhin cuma judul.
 */
export async function getProjectSequence() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi untuk Mini Project.");
  }

  const { data, error } = await supabasePublic()
    .from("cases")
    .select("slug, judul, urutan, created_at")
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: true });

  if (error?.code === SCHEMA_BELUM_ADA) {
    throw new Error("Tabel cases belum ada. Jalankan supabase/schema.sql terlebih dahulu.");
  }
  if (error) throw new Error(`Gagal ambil urutan soal: ${error.message}`);
  return (data ?? []).map((row) => ({ id: row.slug, judul: row.judul }));
}

export async function getNextProject(id) {
  const sequence = await getProjectSequence();
  const index = sequence.findIndex((item) => item.id === id);
  if (index < 0) return null;
  return sequence[index + 1] ?? null;
}
