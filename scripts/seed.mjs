/**
 * Migrasi soal dari file JSON lama ke Supabase.
 *
 *   node scripts/seed.mjs
 *
 * Aman diulang: case dicocokin lewat `slug`, part-nya dihapus dulu baru
 * ditulis ulang. Jadi kalau file JSON-nya diedit, tinggal jalanin lagi.
 *
 * Butuh NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY di `.env`.
 * Jalankan SETELAH `supabase/schema.sql` dieksekusi di SQL Editor Supabase.
 */

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { mainFunctionName } from "../app/lib/functionDirectory.js";

const root = new URL("..", import.meta.url);

/**
 * Pembaca `.env` seadanya — cukup buat KEY=value satu baris, dengan atau tanpa
 * tanda kutip. Sengaja gak nambah dependency dotenv cuma buat satu script.
 */
async function loadEnv() {
  let raw;
  try {
    raw = await readFile(new URL(".env", root), "utf8");
  } catch {
    return; // gak ada .env — mungkin env-nya udah di-export dari shell
  }

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const readJson = async (name) =>
  JSON.parse(await readFile(new URL(`app/data/${name}`, root), "utf8"));

async function readOptionalRootJson(name) {
  try {
    return JSON.parse(await readFile(new URL(name, root), "utf8"));
  } catch {
    return null;
  }
}

/** Mini project: satu case + satu part yang nampung semua isinya. */
function miniToRows(project, urutan) {
  return {
    caseRow: {
      slug: project.id,
      judul: project.judul,
      cerita_utama: project.cerita,
      visual_theme: project.visualTheme,
      tipe: "mini",
      musim: project.musim ?? null,
      urutan,
    },
    partRows: [
      {
        part_ke: 1,
        judul_part: project.judul,
        tema: project.tema ?? null,
        cerita: project.cerita ?? null,
        deskripsi_soal: project.deskripsiSoal ?? null,
        nama_function: mainFunctionName(project.daftarFunction, project.id),
        starter_code: project.starterCode,
        input_awal: project.inputAwal ?? null,
        hasil_akhir_tervalidasi: project.hasilAkhirTervalidasi ?? null,
        daftar_function: project.daftarFunction ?? null,
        catatan_konsep: project.catatanKonsep ?? null,
        hints: project.hints ?? null,
        inputs: project.inputs ?? [],
        prompt_labels: project.promptLabels ?? [],
        bandingkan: null,
      },
    ],
  };
}

/** Soal berpart: satu case + satu baris `parts` per part. */
function partProjectToRows(project, urutan) {
  return {
    caseRow: {
      slug: project.id,
      judul: project.judul,
      cerita_utama: project.ceritaUtama,
      visual_theme: project.visualTheme,
      tipe: "berpart",
      musim: null,
      urutan,
    },
    partRows: project.parts.map((part) => ({
      part_ke: part.partKe,
      judul_part: part.judulPart,
      tema: part.tema ?? null,
      cerita: part.cerita ?? null,
      deskripsi_soal: part.deskripsiSoal ?? null,
      nama_function: part.namaFunction,
      starter_code: part.starterCode,
      input_awal: part.inputAwal ?? null,
      hasil_akhir_tervalidasi: part.hasilAkhirTervalidasi ?? null,
      daftar_function: part.daftarFunction ?? null,
      catatan_konsep: part.catatanKonsep ?? null,
      hints: part.hints ?? null,
      inputs: null,
      prompt_labels: null,
      bandingkan: part.bandingkan ?? null,
    })),
  };
}

async function main() {
  await loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Penamaan baru Supabase duluan, penamaan lama sebagai cadangan.
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      "Butuh NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SECRET_KEY di .env dulu.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Cek schema lebih awal supaya migrasi tidak terlihat sukses sebagian.
  for (const table of ["cases", "parts", "review_soal", "quiz_set", "quiz_soal"]) {
    const { error: schemaCheckError } = await supabase
      .from(table)
      .select("id")
      .limit(1);
    if (schemaCheckError) {
      console.error(
        `Tabel ${table} belum siap (${schemaCheckError.code}). Jalankan supabase/schema.sql di Supabase SQL Editor, lalu ulangi node scripts/seed.mjs.`,
      );
      process.exit(1);
    }
  }

  const [minis, partProjects] = await Promise.all([
    readJson("mini-projects.json"),
    readJson("part-projects.json"),
  ]);
  const reviews = await readJson("review-soal.json");
  const quizSets = await readJson("quiz-sets.json");
  const extraCase = await readOptionalRootJson("data.json");

  // Urutan di daftar soal ikut urutan file lama: mini project dulu (ceritanya
  // nyambung), baru soal berpart.
  const all = [
    ...minis.map((project, i) => miniToRows(project, i + 1)),
    ...partProjects.map((project, i) => partProjectToRows(project, minis.length + i + 1)),
    ...(extraCase ? [miniToRows(extraCase, minis.length + partProjects.length + 1)] : []),
  ];

  for (const { caseRow, partRows } of all) {
    const { data: saved, error: caseError } = await supabase
      .from("cases")
      .upsert(caseRow, { onConflict: "slug" })
      .select("id, slug")
      .single();

    if (caseError) {
      console.error(`✗ ${caseRow.slug}: ${caseError.message}`);
      process.exitCode = 1;
      continue;
    }

    // Hapus dulu baru tulis ulang: kalau part-nya berkurang di JSON, sisa part
    // lama di database ikut kebuang — upsert doang gak bisa ngelakuin itu.
    const { error: clearError } = await supabase
      .from("parts")
      .delete()
      .eq("case_id", saved.id);

    if (clearError) {
      console.error(`✗ ${caseRow.slug}: gagal hapus part lama — ${clearError.message}`);
      process.exitCode = 1;
      continue;
    }

    const { error: partError } = await supabase
      .from("parts")
      .insert(partRows.map((part) => ({ ...part, case_id: saved.id })));

    if (partError) {
      console.error(`✗ ${caseRow.slug}: gagal nulis part — ${partError.message}`);
      process.exitCode = 1;
      continue;
    }

    console.log(`✓ ${caseRow.slug} (${caseRow.tipe}, ${partRows.length} part)`);
  }

  for (const review of reviews) {
    const { error } = await supabase.from("review_soal").upsert(
      {
        slug: review.id,
        judul: review.judul,
        level: review.level,
        kode_lengkap: review.kodeLengkap,
        variabel_ditebak: review.variabelDitebak,
        hasil_akhir_tervalidasi: review.hasilAkhirTervalidasi,
        jejak_tervalidasi: review.jejakTervalidasi,
        catatan_konsep: review.catatanKonsep ?? null,
        urutan: review.urutan ?? 0,
      },
      { onConflict: "slug" },
    );

    if (error) {
      console.error(`✗ ${review.id}: ${error.message}`);
      process.exitCode = 1;
    } else {
      console.log(`✓ ${review.id} (Review Mode)`);
    }
  }

  for (const quizSet of quizSets) {
    const { data: savedSet, error: setError } = await supabase
      .from("quiz_set")
      .upsert(
        {
          slug: quizSet.slug,
          judul: quizSet.judul,
          urutan: quizSet.urutan ?? 0,
        },
        { onConflict: "slug" },
      )
      .select("id, slug")
      .single();

    if (setError) {
      console.error(`✗ ${quizSet.slug}: ${setError.message}`);
      process.exitCode = 1;
      continue;
    }

    const { error: clearQuizError } = await supabase
      .from("quiz_soal")
      .delete()
      .eq("quiz_set_id", savedSet.id);

    if (clearQuizError) {
      console.error(`✗ ${quizSet.slug}: gagal hapus soal lama — ${clearQuizError.message}`);
      process.exitCode = 1;
      continue;
    }

    const { error: questionError } = await supabase.from("quiz_soal").insert(
      (quizSet.soal ?? []).map((question) => ({
        quiz_set_id: savedSet.id,
        nomor: question.nomor,
        cerita_singkat: question.ceritaSingkat,
        variabel_tersedia: question.variabelTersedia ?? [],
        kode_dengan_blank: question.kodeDenganBlank,
        jawaban_benar: question.jawabanBenar,
        penjelasan_singkat: question.penjelasanSingkat,
      })),
    );

    if (questionError) {
      console.error(`✗ ${quizSet.slug}: gagal nulis soal — ${questionError.message}`);
      process.exitCode = 1;
    } else {
      console.log(`✓ ${quizSet.slug} (Quiz Quick Review, ${quizSet.soal.length} soal)`);
    }
  }

  if (process.exitCode) {
    console.error("\nAda yang gagal — cek pesan di atas.");
  } else {
    console.log(`\nBeres. ${all.length} soal + ${reviews.length} Review Mode + ${quizSets.length} Quiz set ada di database.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
