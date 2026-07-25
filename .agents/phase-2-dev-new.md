# PROJECT SPEC — Kasus Baru: Soal dengan Part 1 / Part 2

> Extension dari `PROJECT-SPEC-mini-projects.md`. Reuse semua fondasi teknis (Monaco Editor, `collectStepsInteractive`, Tailwind config, fitur Hint Berjenjang) dari file itu. File ini nambahin struktur data BARU: 1 soal yang punya beberapa **part** (babak) di dalamnya, bukan beberapa project terpisah kayak kasus Tupai sebelumnya.

## 1. Bedanya dari Struktur Sebelumnya

**Kasus Tupai (sebelumnya):** 2 project TERPISAH di halaman daftar (2 kartu beda, `tupai-menimbun-kacang` dan `tupai-membongkar-simpanan`), masing-masing bisa dibuka independen.

**Kasus ini (baru):** 1 soal, TAPI di dalamnya ada beberapa **part** — Part 1 dan Part 2 — yang harus dikerjain berurutan dalam satu halaman yang sama, kayak sub-soal dari 1 cerita besar. Bukan 2 kartu terpisah di daftar, tapi 1 kartu yang begitu dibuka nampilin tab/step Part 1 → Part 2.

**Kenapa perlu pola baru (bukan reuse pola push-lalu-pop kayak Tupai):** biar variatif dan gak keliatan "reskin" doang. Kasus ini pakai 2 pola yang GENUINELY beda dari sebelumnya:
- Part 1: `push` dan `pop` DICAMPUR dalam SATU loop, tergantung kondisi (bukan "push semua dulu, baru pop semua" kayak Tupai)
- Part 2: `push` ke ARRAY TUJUAN YANG BEDA-BEDA tergantung kondisi (bukan cuma push ke 1 array)

## 2. Cerita: Antrian Perosotan Taman Bermain

Di taman bermain, ada perosotan yang lagi ngehits. Anak-anak antri, tapi kadang ada yang berubah pikiran pas udah di posisi belakang antrian dan bilang "batal!".

### Part 1 — "Mencatat Antrian dengan Pembatalan" (push + pop dicampur)

**Cerita:** Penjaga taman nyatet siapa aja yang masuk antrian dari daftar kejadian. Tiap item di daftar itu bisa nama anak (berarti dia masuk antrian), atau teks `"batal"` (berarti anak yang PALING BELAKANG antrian — paling terakhir masuk — berubah pikiran dan keluar).

**Kode acuan (SUDAH TERVALIDASI):**
```js
function catatAntrian(daftarAksi) {
  var antrian = [];
  for (var i = 0; i < daftarAksi.length; i++) {
    if (daftarAksi[i] === "batal") {
      antrian.pop();
    } else {
      antrian.push(daftarAksi[i]);
    }
  }
  return antrian;
}

var daftarAksi = ["Ani", "Budi", "batal", "Citra", "Dedi", "batal"];
var antrian = catatAntrian(daftarAksi);
```
**Hasil akhir tervalidasi:** `antrian` → `["Ani", "Citra"]`
**Jejak manual (buat pegangan pengajar):** Ani masuk → `[Ani]`; Budi masuk → `[Ani,Budi]`; batal → pop Budi → `[Ani]`; Citra masuk → `[Ani,Citra]`; Dedi masuk → `[Ani,Citra,Dedi]`; batal → pop Dedi → `[Ani,Citra]`.

### Part 2 — "Bagi Antrian ke 2 Jalur Perosotan" (push kondisional ke 2 tujuan berbeda)

**Cerita:** Antrian dari Part 1 sekarang mau dibagi ke 2 jalur perosotan biar gak numpuk di satu jalur — anak di POSISI GENAP (index 0, 2, 4, ...) masuk Jalur A, yang POSISI GANJIL (index 1, 3, 5, ...) masuk Jalur B.

**Kode acuan (SUDAH TERVALIDASI) — perhatiin function ini GAK PAKAI `return` sama sekali, karena `jalurGenap` dan `jalurGanjil` dioper sebagai PARAMETER dan diubah langsung dari dalam (reuse konsep "array nyambung by reference" dari kasus Tupai sebelumnya):**
```js
function bagiJalur(antrian, jalurGenap, jalurGanjil) {
  for (var i = 0; i < antrian.length; i++) {
    if (i % 2 === 0) {
      jalurGenap.push(antrian[i]);
    } else {
      jalurGanjil.push(antrian[i]);
    }
  }
}

var antrian = ["Ani", "Citra", "Eka", "Fani"];
var jalurGenap = [];
var jalurGanjil = [];
bagiJalur(antrian, jalurGenap, jalurGanjil);
```
**Hasil akhir tervalidasi:** `jalurGenap` → `["Ani", "Eka"]`, `jalurGanjil` → `["Citra", "Fani"]`

**PENTING buat narasi di UI:** ini kesempatan bagus buat NGULANG konsep "array by reference" dari sudut yang beda — kali ini malah GAK ADA `return` sama sekali, dan itu SENGAJA, bukan lupa. Tekenin ke siswa: "kok gak ada return tapi hasilnya tetep kesimpen? karena `jalurGenap` dan `jalurGanjil` di luar itu VARIABEL YANG SAMA PERSIS sama yang di dalam function — bukan disalin, tapi 'dipinjemin'."

## 3. Struktur Data — 1 Soal, Banyak Part

Beda dari skema `mini-projects.json` (array of project independen), kasus ini pakai skema BARU: 1 object soal, isinya array `parts`.

```json
{
  "id": "antrian-perosotan",
  "judul": "Antrian Perosotan Taman Bermain",
  "ceritaUtama": "Di taman bermain, ada perosotan yang lagi ngehits. Anak-anak antri, tapi kadang ada yang berubah pikiran pas udah di posisi belakang antrian.",
  "visualTheme": "taman-bermain",
  "parts": [
    {
      "partKe": 1,
      "judulPart": "Mencatat Antrian dengan Pembatalan",
      "tema": "push + pop dicampur dalam 1 loop",
      "cerita": "Penjaga taman nyatet siapa yang masuk antrian dari daftar kejadian. Kalau ada anak bilang \"batal\", itu tandanya anak yang PALING BELAKANG antrian berubah pikiran dan keluar.",
      "deskripsiSoal": "Buat SATU function catatAntrian(daftarAksi) yang loop ke daftarAksi — kalau elemennya persis \"batal\", pop dari antrian; kalau bukan, push elemen itu (nama) ke antrian. Return antrian di akhir.",
      "namaFunction": "catatAntrian",
      "starterCode": "function catatAntrian(daftarAksi) {\n  var antrian = [];\n  // tulis kodemu di sini\n\n  return antrian;\n}\n\nvar daftarAksi = [\"Ani\", \"Budi\", \"batal\", \"Citra\", \"Dedi\", \"batal\"];\nvar antrian = catatAntrian(daftarAksi);",
      "inputAwal": { "daftarAksi": ["Ani", "Budi", "batal", "Citra", "Dedi", "batal"] },
      "hasilAkhirTervalidasi": { "antrian": ["Ani", "Citra"] },
      "hints": [
        "Tiap elemen di daftarAksi itu bisa dua jenis: nama biasa, atau teks khusus \"batal\". Kamu perlu if-else buat bedain dua kasus itu.",
        "Kalau elemennya PERSIS sama dengan teks \"batal\" (pakai ===), berarti harus pop dari antrian. Kalau bukan, berarti itu nama, push ke antrian.",
        "Loop-nya jalan ke SEMUA elemen daftarAksi (pakai daftarAksi.length), push ATAU pop tergantung hasil pengecekan di tiap putaran — bukan push semua dulu baru pop semua kayak kasus Tupai.",
        "Ini process flow lengkapnya:\n1. Set antrian = []\n2. Untuk i dari 0 sampai (panjang daftarAksi - 1), ulangi:\n   2.1. Jika daftarAksi[i] sama dengan \"batal\", pop dari antrian\n   2.2. Kalau enggak, push daftarAksi[i] ke antrian\n3. Return antrian"
      ]
    },
    {
      "partKe": 2,
      "judulPart": "Bagi Antrian ke 2 Jalur Perosotan",
      "tema": "push kondisional ke 2 array tujuan berbeda (by reference, tanpa return)",
      "cerita": "Antrian mau dibagi ke 2 jalur perosotan biar gak numpuk — anak di posisi GENAP (index 0, 2, 4, ...) masuk Jalur A, yang GANJIL (index 1, 3, 5, ...) masuk Jalur B.",
      "deskripsiSoal": "Buat SATU function bagiJalur(antrian, jalurGenap, jalurGanjil) yang loop ke antrian — kalau index-nya genap, push ke jalurGenap; kalau ganjil, push ke jalurGanjil. Function ini GAK PERLU return apa-apa.",
      "namaFunction": "bagiJalur",
      "starterCode": "function bagiJalur(antrian, jalurGenap, jalurGanjil) {\n  // tulis kodemu di sini\n\n}\n\nvar antrian = [\"Ani\", \"Citra\", \"Eka\", \"Fani\"];\nvar jalurGenap = [];\nvar jalurGanjil = [];\nbagiJalur(antrian, jalurGenap, jalurGanjil);",
      "inputAwal": { "antrian": ["Ani", "Citra", "Eka", "Fani"], "jalurGenap": [], "jalurGanjil": [] },
      "hasilAkhirTervalidasi": { "jalurGenap": ["Ani", "Eka"], "jalurGanjil": ["Citra", "Fani"] },
      "hints": [
        "Function ini nerima 3 array sebagai parameter: antrian (yang mau dibagi), jalurGenap dan jalurGanjil (dua-duanya kosong, siap diisi). Gak perlu return apa-apa — array yang dioper sebagai parameter bisa diubah langsung dari dalam function (inget konsep 'array nyambung by reference').",
        "Loop ke antrian pakai index i. Buat mutusin genap/ganjil, cek i % 2 === 0.",
        "Kalau i genap (0, 2, 4, ...), push antrian[i] ke jalurGenap. Kalau ganjil (1, 3, 5, ...), push ke jalurGanjil.",
        "Ini process flow lengkapnya:\n1. Untuk i dari 0 sampai (panjang antrian - 1), ulangi:\n   1.1. Jika i % 2 sama dengan 0, push antrian[i] ke jalurGenap\n   1.2. Kalau enggak, push antrian[i] ke jalurGanjil\n(Function ini gak return apa-apa — hasilnya langsung nempel ke jalurGenap dan jalurGanjil yang dioper sebagai parameter)"
      ]
    }
  ]
}
```

## 4. Struktur Halaman & UI

- Di halaman daftar (list soal), kasus ini tetep tampil sebagai **1 kartu** (bukan 2), judulnya `judul` (bukan per-part)
- Klik kartu → masuk ke halaman detail yang punya **tab/stepper "Part 1" dan "Part 2"** di bagian atas Panel Code — bukan 2 halaman terpisah
- Part 2 boleh langsung diakses tanpa nunggu Part 1 kelar (gak perlu bikin logic "locked/unlocked" buat MVP ini — biar simpel, keputusan urutan ngerjain tetep di tangan pengajar/siswa)
- Tiap part punya Panel Code, tombol Jalankan, Panel Visualisasi, dan tombol Hint SENDIRI-SENDIRI (reuse komponen yang sama dari spec sebelumnya, cuma datanya ganti-ganti sesuai part yang lagi aktif)
- `ceritaUtama` ditampilin di paling atas halaman detail (sekali aja, gak berubah pas ganti tab), sementara `cerita` tiap part ditampilin di bawah tab-nya masing-masing (spesifik ke part itu)

## 5. Kriteria Selesai (Definition of Done)

- [ ] Kartu "Antrian Perosotan Taman Bermain" muncul di halaman daftar (1 kartu, bukan 2)
- [ ] Buka detail → ada 2 tab, "Part 1" dan "Part 2", bisa pindah-pindah bebas
- [ ] Part 1: lengkapi `catatAntrian`, jalankan dengan `inputAwal.daftarAksi` → hasil `antrian` sesuai `hasilAkhirTervalidasi`
- [ ] Part 2: lengkapi `bagiJalur`, jalankan dengan `inputAwal` (antrian + 2 array kosong) → `jalurGenap` dan `jalurGanjil` sesuai `hasilAkhirTervalidasi`
- [ ] Visualisasi Part 1 nunjukin `antrian` kadang NAMBAH (push) kadang BERKURANG (pop) di step yang berbeda-beda — bukan cuma nambah terus atau berkurang terus
- [ ] Visualisasi Part 2 nunjukin `jalurGenap` dan `jalurGanjil` DUA-DUANYA tampil berdampingan, dan keliatan jelas tiap step cuma SALAH SATU dari dua array itu yang nambah (gantian, tergantung index genap/ganjil)
- [ ] Hint di tiap part jalan sendiri-sendiri (4 level per part, hint terakhir = process flow lengkap punya part itu), popup-nya independen antara Part 1 dan Part 2

## 6. Rencana Lanjutan (Bukan Hari Ini)

- Kalau nanti ada kasus dengan 3+ part, struktur tab yang sama bisa dipakai lagi (tinggal nambah item di array `parts`)
- Locking Part 2 sampai Part 1 selesai — kalau kerasa perlu setelah nyoba beberapa sesi