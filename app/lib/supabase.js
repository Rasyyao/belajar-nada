import { createClient } from "@supabase/supabase-js";

/**
 * Dua pintu ke Supabase, sengaja dipisah tegas:
 *
 * - `supabasePublic()`  — anon key. Cuma bisa BACA, dibatasi RLS. Dipakai
 *   halaman publik (daftar soal, halaman materi).
 * - `supabaseAdmin()`   — service role key. Bisa baca-tulis SEMUA tanpa batas,
 *   jadi CUMA boleh dipanggil dari API Route (`app/api/**`) yang jalan di server
 *   dan sudah dijaga session admin. Jangan pernah diimpor dari komponen client.
 *
 * File ini gak boleh diimpor komponen `"use client"` — bukan cuma soal rahasia
 * (SUPABASE_SERVICE_ROLE_KEY memang gak akan ikut ke bundle browser karena
 * namanya gak berawalan NEXT_PUBLIC_), tapi juga supaya jelas mana kode yang
 * jalan di server.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Supabase lagi pindah penamaan key: yang lama `anon` / `service_role` (JWT
 * panjang), yang baru `publishable` / `secret` (awalan `sb_publishable_` dan
 * `sb_secret_`). Dua-duanya diterima di sini supaya project yang dibikin
 * sebelum atau sesudah pergantian itu sama-sama jalan tanpa ganti kode.
 *
 * Catatan: `process.env.X` gak bisa ditulis dinamis di Next — nilainya
 * disuntik pas build berdasarkan teks `process.env.NAMA` yang kebaca di kode.
 * Makanya dua-duanya ditulis lengkap, bukan lewat variabel.
 */
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Belum ada kredensial? Aplikasinya gak mati — data soal jatuh balik ke file
 * JSON bawaan (lihat `app/lib/projects.js`). Ini bikin repo tetap bisa
 * `npm run dev` langsung setelah clone, sebelum Supabase-nya disiapkan.
 */
export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}

export function hasServiceRole() {
  return Boolean(url && serviceRoleKey);
}

// Opsi yang sama buat dua klien: ini server-side, gak ada sesi user yang perlu
// disimpan atau di-refresh, jadi semua fitur auth persistence dimatiin.
const noSession = {
  auth: { persistSession: false, autoRefreshToken: false },
};

let publicClient = null;

export function supabasePublic() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di .env.",
    );
  }
  // Klien-nya di-cache biar gak bikin instance baru tiap request.
  if (!publicClient) publicClient = createClient(url, anonKey, noSession);
  return publicClient;
}

let adminClient = null;

export function supabaseAdmin() {
  if (!hasServiceRole()) {
    throw new Error(
      "SUPABASE_SECRET_KEY belum diisi di .env — halaman admin butuh ini buat nulis ke database.",
    );
  }
  if (!adminClient) adminClient = createClient(url, serviceRoleKey, noSession);
  return adminClient;
}

export const MATERI_BUCKET = "materi-files";
