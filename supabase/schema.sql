-- Skema database CodeQuest / Playground Belajar (Fase 2).
-- Jalanin sekali di SQL Editor Supabase, dari atas ke bawah.
--
-- Aman diulang: semua pakai `if not exists` / `drop policy if exists`, jadi
-- kalau ada yang gagal di tengah tinggal jalanin ulang seluruh file.

-- ---------------------------------------------------------------------------
-- 1. Tabel
-- ---------------------------------------------------------------------------

-- Satu baris = satu soal/kasus. Satu case selalu punya minimal satu part.
create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  judul text not null,
  cerita_utama text,
  visual_theme text,
  -- Nentuin runner mana yang dipakai halaman detail:
  --   'mini'    = satu part, program utuh yang minta input lewat ambilInput()
  --   'berpart' = beberapa part yang dikerjain berurutan lewat tab
  -- Sengaja kolom sendiri (bukan ditebak dari jumlah part) supaya soal berpart
  -- yang baru punya 1 part gak salah dirender sebagai mini project.
  tipe text not null default 'berpart' check (tipe in ('mini', 'berpart')),
  -- Khusus tipe 'mini': label musim buat badge di daftar ('gugur' / 'dingin').
  musim text,
  urutan integer default 0,
  created_at timestamptz default now()
);

-- Satu baris = satu part dari sebuah case.
create table if not exists parts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  part_ke integer not null,
  judul_part text not null,
  tema text,
  cerita text,
  deskripsi_soal text,
  nama_function text not null,
  starter_code text not null,
  input_awal jsonb,
  hasil_akhir_tervalidasi jsonb,
  alur_data jsonb,
  catatan_konsep jsonb,
  hints jsonb,
  -- Dua kolom di bawah dipakai tipe 'mini': jawaban yang disuapin ke
  -- ambilInput() berurutan, plus label pertanyaannya di panel input.
  inputs jsonb,
  prompt_labels jsonb,
  -- Konfigurasi panel TrackCompare (dua array dibandingin berdampingan).
  -- Null berarti panel itu gak ditampilin di part ini.
  bandingkan jsonb,
  created_at timestamptz default now(),
  unique (case_id, part_ke)
);

-- Konten belajar (bacaan/penjelasan, bukan soal).
create table if not exists materi (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  kategori text,
  konten text,
  file_url text,
  urutan integer default 0,
  created_at timestamptz default now()
);

-- Satu baris = satu latihan Review Mode. Kodenya sudah lengkap; siswa wajib
-- mengisi prediksi jejak sebelum boleh melihat visualisasi eksekusi.
create table if not exists review_soal (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  judul text not null,
  level integer not null,
  kode_lengkap text not null,
  variabel_ditebak text not null,
  hasil_akhir_tervalidasi jsonb not null,
  jejak_tervalidasi jsonb not null,
  catatan_konsep jsonb,
  urutan integer default 0,
  created_at timestamptz default now()
);

-- Urutan baca yang paling sering dipakai, biar gak sequential scan tiap request.
create index if not exists parts_case_id_idx on parts (case_id, part_ke);
create index if not exists cases_urutan_idx on cases (urutan, created_at);
create index if not exists materi_urutan_idx on materi (urutan, created_at);
create index if not exists review_soal_urutan_idx on review_soal (urutan, created_at);

-- Satu set = satu topik Quick Review. Soal-soalnya berupa isian manual.
create table if not exists quiz_set (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  judul text not null,
  urutan integer default 0,
  created_at timestamptz default now()
);

create table if not exists quiz_soal (
  id uuid primary key default gen_random_uuid(),
  quiz_set_id uuid references quiz_set(id) on delete cascade,
  nomor integer not null,
  cerita_singkat text not null,
  variabel_tersedia jsonb,
  kode_dengan_blank text not null,
  jawaban_benar text not null,
  penjelasan_singkat text not null,
  created_at timestamptz default now(),
  unique (quiz_set_id, nomor)
);

-- Aman untuk database yang sempat dibuat dari versi awal Quiz Quick Review.
alter table quiz_soal
  add column if not exists variabel_tersedia jsonb;

create index if not exists quiz_set_urutan_idx on quiz_set (urutan, created_at);
create index if not exists quiz_soal_set_nomor_idx on quiz_soal (quiz_set_id, nomor);

-- ---------------------------------------------------------------------------
-- 2. Row Level Security
-- ---------------------------------------------------------------------------
-- Publik (anon key) CUMA boleh baca. Semua tulis lewat API Route yang pakai
-- service role key — service role bypass RLS, jadi gak perlu policy tambahan.

alter table cases enable row level security;
alter table parts enable row level security;
alter table materi enable row level security;
alter table review_soal enable row level security;
alter table quiz_set enable row level security;
alter table quiz_soal enable row level security;

drop policy if exists "Publik boleh baca cases" on cases;
create policy "Publik boleh baca cases" on cases for select using (true);

drop policy if exists "Publik boleh baca parts" on parts;
create policy "Publik boleh baca parts" on parts for select using (true);

drop policy if exists "Publik boleh baca materi" on materi;
create policy "Publik boleh baca materi" on materi for select using (true);

drop policy if exists "Publik boleh baca review_soal" on review_soal;
create policy "Publik boleh baca review_soal" on review_soal for select using (true);

drop policy if exists "Publik boleh baca quiz_set" on quiz_set;
create policy "Publik boleh baca quiz_set" on quiz_set for select using (true);

drop policy if exists "Publik boleh baca quiz_soal" on quiz_soal;
create policy "Publik boleh baca quiz_soal" on quiz_soal for select using (true);

-- ---------------------------------------------------------------------------
-- 3. Storage — bucket buat file materi
-- ---------------------------------------------------------------------------
-- Public read: siswa bisa buka file tanpa login.
-- Upload TIDAK dikasih policy apa pun: satu-satunya jalan masuk file adalah
-- /api/admin/upload yang pakai service role key dan udah dijaga password admin.

insert into storage.buckets (id, name, public)
values ('materi-files', 'materi-files', true)
on conflict (id) do update set public = true;

drop policy if exists "Publik boleh baca file materi" on storage.objects;
create policy "Publik boleh baca file materi" on storage.objects
  for select using (bucket_id = 'materi-files');
