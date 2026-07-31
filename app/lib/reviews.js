import { isSupabaseConfigured, supabasePublic } from "./supabase";

const SCHEMA_BELUM_ADA = "PGRST205";
const COLUMNS =
    "id, slug, judul, level, kode_lengkap, variabel_ditebak, hasil_akhir_tervalidasi, jejak_tervalidasi, catatan_konsep, urutan, created_at";

function toReview(row) {
    return {
        id: row.slug,
        judul: row.judul,
        level: row.level,
        kodeLengkap: row.kode_lengkap,
        variabelDitebak: row.variabel_ditebak,
        hasilAkhirTervalidasi: row.hasil_akhir_tervalidasi,
        jejakTervalidasi: row.jejak_tervalidasi ?? [],
        catatanKonsep: row.catatan_konsep ?? [],
        urutan: row.urutan ?? 0,
        createdAt: row.created_at ?? null,
    };
}

export async function getAllReviews() {
    if (!isSupabaseConfigured()) {
        throw new Error("Supabase belum dikonfigurasi untuk Review Mode.");
    }

    const { data, error } = await supabasePublic()
        .from("review_soal")
        .select(COLUMNS)
        .order("urutan", { ascending: true })
        .order("created_at", { ascending: true });

    if (error?.code === SCHEMA_BELUM_ADA) {
        throw new Error("Tabel review_soal belum ada. Jalankan supabase/schema.sql terlebih dahulu.");
    }
    if (error) throw new Error(`Gagal ambil Review Mode: ${error.message}`);
    return (data ?? []).map(toReview);
}

export async function getReview(slug) {
    if (!isSupabaseConfigured()) {
        throw new Error("Supabase belum dikonfigurasi untuk Review Mode.");
    }

    const { data, error } = await supabasePublic()
        .from("review_soal")
        .select(COLUMNS)
        .eq("slug", slug)
        .maybeSingle();

    if (error?.code === SCHEMA_BELUM_ADA) {
        throw new Error("Tabel review_soal belum ada. Jalankan supabase/schema.sql terlebih dahulu.");
    }
    if (error) throw new Error(`Gagal ambil Review Mode: ${error.message}`);
    return data ? toReview(data) : null;
}