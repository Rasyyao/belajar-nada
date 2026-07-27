/**
 * Migrasi soal dari file JSON lama ke Supabase.
 *
 *   node scripts/seed.mjs
 *
 * Aman diulang: case dicocokin lewat `slug`, part-nya dihapus dulu baru
 * ditulis ulang. Jadi kalau file JSON-nya diedit, tinggal jalanin lagi.
 *
 * Butuh NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY di `.env`.
 * Jalanin SETELAH `supabase/schema.sql` dieksekusi di SQL Editor Supabase.
 */

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

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
        nama_function: project.alurData?.namaFunction ?? project.id,
        starter_code: project.starterCode,
        input_awal: null,
        hasil_akhir_tervalidasi: project.hasilAkhirTervalidasi ?? null,
        alur_data: project.alurData ?? null,
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
      alur_data: part.alurData ?? null,
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

  const [minis, partProjects] = await Promise.all([
    readJson("mini-projects.json"),
    readJson("part-projects.json"),
  ]);

  // Urutan di daftar soal ikut urutan file lama: mini project dulu (ceritanya
  // nyambung), baru soal berpart.
  const all = [
    ...minis.map((project, i) => miniToRows(project, i + 1)),
    ...partProjects.map((project, i) => partProjectToRows(project, minis.length + i + 1)),
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

  if (process.exitCode) {
    console.error("\nAda yang gagal — cek pesan di atas.");
  } else {
    console.log(`\nBeres. ${all.length} soal ada di database.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
