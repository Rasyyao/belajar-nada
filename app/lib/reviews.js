import { isSupabaseConfigured, supabasePublic } from "./supabase";
import { clampPage, PAGE_SIZE } from "./pagination";

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

/** Ambil maksimal satu halaman Review Mode dari database. */
export async function getReviewsPage(page = 1, pageSize = PAGE_SIZE) {
    if (!isSupabaseConfigured()) {
        throw new Error("Supabase belum dikonfigurasi untuk Review Mode.");
    }

    const { count: total, error: countError } = await supabasePublic()
        .from("review_soal")
        .select("id", { count: "exact", head: true });

    if (countError?.code === SCHEMA_BELUM_ADA) {
        throw new Error("Tabel review_soal belum ada. Jalankan supabase/schema.sql terlebih dahulu.");
    }
    if (countError) throw new Error(`Gagal menghitung Review Mode: ${countError.message}`);

    if (!total) return { items: [], total: 0, page: 1 };

    const safePage = clampPage(page, total ?? 0, pageSize);
    const from = (safePage - 1) * pageSize;
    const { data, error } = await supabasePublic()
        .from("review_soal")
        .select(COLUMNS)
        .order("urutan", { ascending: true })
        .order("created_at", { ascending: true })
        .range(from, from + pageSize - 1);

    if (error?.code === SCHEMA_BELUM_ADA) {
        throw new Error("Tabel review_soal belum ada. Jalankan supabase/schema.sql terlebih dahulu.");
    }
    if (error) throw new Error(`Gagal ambil halaman Review Mode: ${error.message}`);
    return { items: (data ?? []).map(toReview), total: total ?? 0, page: safePage };
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