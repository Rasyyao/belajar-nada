import { isSupabaseConfigured, supabasePublic } from "./supabase";

export { cocokJawaban, normalisasiJawaban } from "./quizAnswer";

const SCHEMA_BELUM_ADA = "PGRST205";
const SET_COLUMNS = "id, slug, judul, urutan, created_at";
const QUESTION_COLUMNS =
    "id, nomor, cerita_singkat, variabel_tersedia, kode_dengan_blank, jawaban_benar, penjelasan_singkat";

function toQuestion(row) {
    return {
        id: row.id,
        nomor: row.nomor,
        ceritaSingkat: row.cerita_singkat,
        variabelTersedia: row.variabel_tersedia ?? [],
        kodeDenganBlank: row.kode_dengan_blank,
        jawabanBenar: row.jawaban_benar,
        penjelasanSingkat: row.penjelasan_singkat,
    };
}

function toSet(row) {
    return {
        id: row.slug,
        slug: row.slug,
        judul: row.judul,
        urutan: row.urutan ?? 0,
        soal: (row.quiz_soal ?? []).sort((a, b) => a.nomor - b.nomor).map(toQuestion),
        createdAt: row.created_at ?? null,
    };
}

export async function getAllQuizSets() {
    if (!isSupabaseConfigured()) {
        throw new Error("Supabase belum dikonfigurasi untuk Quiz Quick Review.");
    }

    const { data, error } = await supabasePublic()
        .from("quiz_set")
        .select(`${SET_COLUMNS}, quiz_soal(${QUESTION_COLUMNS})`)
        .order("urutan", { ascending: true })
        .order("created_at", { ascending: true });

    if (error?.code === SCHEMA_BELUM_ADA) {
        throw new Error("Tabel quiz_set/quiz_soal belum ada. Jalankan supabase/schema.sql terlebih dahulu.");
    }
    if (error) throw new Error(`Gagal ambil Quiz Quick Review: ${error.message}`);
    return (data ?? []).map(toSet);
}

export async function getQuizSet(slug) {
    if (!isSupabaseConfigured()) {
        throw new Error("Supabase belum dikonfigurasi untuk Quiz Quick Review.");
    }

    const { data, error } = await supabasePublic()
        .from("quiz_set")
        .select(`${SET_COLUMNS}, quiz_soal(${QUESTION_COLUMNS})`)
        .eq("slug", slug)
        .maybeSingle();

    if (error?.code === SCHEMA_BELUM_ADA) {
        throw new Error("Tabel quiz_set/quiz_soal belum ada. Jalankan supabase/schema.sql terlebih dahulu.");
    }
    if (error) throw new Error(`Gagal ambil Quiz Quick Review: ${error.message}`);
    return data ? toSet(data) : null;
}
