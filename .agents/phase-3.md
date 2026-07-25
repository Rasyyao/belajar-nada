# PROJECT SPEC — Kasus Baru: Loket Karcis Wahana

> Extension dari `PROJECT-SPEC-mini-projects.md` dan `PROJECT-SPEC-antrian-perosotan.md`. Reuse semua fondasi teknis (Monaco Editor, `collectStepsInteractive`, Tailwind config, fitur Hint Berjenjang, skema "1 soal banyak part") dari 2 file itu. File ini nambahin 1 kasus baru lagi ke koleksi.

## 1. Kenapa Kasus Ini Beda dari 2 Kasus Sebelumnya

| Kasus | Pola Utama |
|---|---|
| Tupai Menimbun & Membongkar | push semua dulu, baru pop semua (2 fase terpisah) |
| Antrian Perosotan | push & pop DICAMPUR dalam 1 loop, DAN push ke 2 tujuan beda tergantung index |
| **Loket Karcis Wahana (baru)** | **if-else buat nentuin NILAI yang di-push** (Part 1), **DAN akumulasi murni tanpa push/pop sama sekali** (Part 2) |

Kasus ini sengaja beda: `push` bukan lagi soal "masuk apa enggak" atau "masuk ke mana", tapi soal **"masuk dengan nilai berapa"** — keputusan if-else-nya mempengaruhi ISI yang di-push, bukan APAKAH/KE MANA push-nya kejadian. Part 2-nya malah gak ada push/pop sama sekali — biar keliatan pola akumulasi lama (yang udah dipelajari duluan) masih relevan dipake, gak semua soal harus soal push/pop.

## 2. Cerita: Loket Karcis Wahana

Operator wahana di taman bermain nyatet umur tiap pengunjung yang beli tiket. Anak-anak dapet harga lebih murah, dewasa harga penuh. Di akhir hari, dia perlu tau berapa total pendapatannya.

### Part 1 — "Menentukan Harga Tiket per Pengunjung" (if-else nentuin nilai + push)

**Cerita:** Tiap pengunjung yang beli tiket dicatet umurnya. Yang umurnya di bawah 12 dapet harga anak, sisanya harga dewasa. Operator mau punya daftar harga tiket buat tiap orang, urut sesuai kedatangan.

**Kode acuan (SUDAH TERVALIDASI):**
```js
function buatDaftarHarga(daftarUmur, hargaAnak, hargaDewasa) {
  var daftarHarga = [];
  for (var i = 0; i < daftarUmur.length; i++) {
    var harga;
    if (daftarUmur[i] < 12) {
      harga = hargaAnak;
    } else {
      harga = hargaDewasa;
    }
    daftarHarga.push(harga);
  }
  return daftarHarga;
}

var daftarUmur = [8, 15, 10, 22];
var daftarHarga = buatDaftarHarga(daftarUmur, 15000, 30000);
```
**Hasil akhir tervalidasi:** `daftarHarga` → `[15000, 30000, 15000, 30000]`

**PENTING buat narasi di UI:** tekenin ke siswa bedanya sama kasus Antrian Perosotan — di sana if-else mutusin "push atau pop" / "push ke array A atau B". Di sini if-else cuma mutusin "ANGKA BERAPA yang bakal di-push" — `push`-nya sendiri SELALU kejadian tiap putaran, gak pernah di-skip.

### Part 2 — "Menghitung Total Pendapatan Hari Ini" (akumulasi murni, lanjutan dari Part 1)

**Cerita:** Dari daftar harga tiket yang udah disusun di Part 1, operator sekarang mau tau: total duit yang masuk hari ini berapa?

**Kode acuan (SUDAH TERVALIDASI) — GAK ADA push/pop di part ini sama sekali:**
```js
function hitungTotalPendapatan(daftarHarga) {
  var total = 0;
  for (var i = 0; i < daftarHarga.length; i++) {
    total = total + daftarHarga[i];
  }
  return total;
}

var daftarHarga = [15000, 30000, 15000, 30000];
var totalPendapatan = hitungTotalPendapatan(daftarHarga);
```
**Hasil akhir tervalidasi:** `totalPendapatan` → `90000`

**PENTING buat narasi di UI:** `daftarHarga` yang jadi input Part 2 ini itu OUTPUT dari Part 1 — momen bagus buat nunjukin gimana hasil satu function bisa jadi bahan buat function lain, bukan cuma dipake sekali terus dibuang. Juga tekenin: Part 2 ini MURNI pola akumulasi (nambah ke satu variabel angka) yang udah pernah dipelajari duluan — dipake lagi di sini, bukan berarti tiap soal baru harus soal push/pop baru.

## 3. Struktur Data — SUDAH TERVALIDASI

Sama skemanya kayak `antrian-perosotan` (1 object soal, array `parts`, tiap part punya `alurData` dan `catatanKonsep`):

```json
{
  "id": "loket-karcis-wahana",
  "judul": "Loket Karcis Wahana",
  "ceritaUtama": "Operator wahana di taman bermain nyatet umur tiap pengunjung yang beli tiket. Anak-anak dapet harga lebih murah, dewasa harga penuh. Di akhir hari, dia perlu tau berapa total pendapatannya.",
  "visualTheme": "loket-tiket",
  "parts": [
    {
      "partKe": 1,
      "judulPart": "Menentukan Harga Tiket per Pengunjung",
      "tema": "push + if-else buat nentuin nilai (bukan buat mutusin push/pop)",
      "cerita": "Tiap pengunjung yang beli tiket dicatet umurnya. Yang umurnya di bawah 12 dapet harga anak, sisanya harga dewasa. Operator mau punya daftar harga tiket buat tiap orang, urut sesuai kedatangan.",
      "deskripsiSoal": "Buat SATU function buatDaftarHarga(daftarUmur, hargaAnak, hargaDewasa) yang loop ke daftarUmur — kalau umurnya di bawah 12, harganya hargaAnak; kalau enggak, hargaDewasa. Push harga itu ke daftarHarga. Return daftarHarga di akhir.",
      "namaFunction": "buatDaftarHarga",
      "starterCode": "function buatDaftarHarga(daftarUmur, hargaAnak, hargaDewasa) {\n  var daftarHarga = [];\n  // tulis kodemu di sini\n\n  return daftarHarga;\n}\n\nvar daftarUmur = [8, 15, 10, 22];\nvar daftarHarga = buatDaftarHarga(daftarUmur, 15000, 30000);",
      "inputAwal": {
        "daftarUmur": [8, 15, 10, 22],
        "hargaAnak": 15000,
        "hargaDewasa": 30000
      },
      "hasilAkhirTervalidasi": { "daftarHarga": [15000, 30000, 15000, 30000] },
      "alurData": {
        "namaFunction": "buatDaftarHarga",
        "masuk": [
          { "luar": "daftarUmur", "dalam": "daftarUmur" },
          { "luar": "hargaAnak", "dalam": "hargaAnak" },
          { "luar": "hargaDewasa", "dalam": "hargaDewasa" }
        ],
        "proses": "bikin daftarHarga kosong → loop semua umur → if-else nentuin harga → push harga itu",
        "keluar": { "dalam": "daftarHarga", "luar": "daftarHarga" }
      },
      "catatanKonsep": [
        {
          "judul": "if-else di sini buat nentuin NILAI, bukan buat mutusin push/pop",
          "isi": "Beda dari kasus Antrian Perosotan (if-else mutusin push ATAU pop, atau push ke array MANA), di sini if-else cuma nentuin ANGKA berapa yang bakal di-push. Push-nya selalu kejadian tiap putaran — yang beda cuma nilainya."
        }
      ],
      "hints": [
        "Sebelum push, kamu butuh 1 variabel sementara (misal harga) buat nampung hasil keputusan if-else di putaran itu.",
        "Cek daftarUmur[i] < 12 — kalau true, harga = hargaAnak. Kalau enggak, harga = hargaDewasa.",
        "Setelah if-else selesai nentuin harga, baru push harga itu ke daftarHarga. Push-nya di LUAR blok if-else (jalan tiap putaran, bukan cuma pas salah satu kondisi).",
        "Ini process flow lengkapnya:\n1. Set daftarHarga = []\n2. Untuk i dari 0 sampai (panjang daftarUmur - 1), ulangi:\n   2.1. Jika daftarUmur[i] < 12, set harga = hargaAnak\n   2.2. Kalau enggak, set harga = hargaDewasa\n   2.3. Push harga ke daftarHarga\n3. Return daftarHarga"
      ]
    },
    {
      "partKe": 2,
      "judulPart": "Menghitung Total Pendapatan Hari Ini",
      "tema": "akumulasi murni dari hasil Part 1 (gak ada push/pop sama sekali)",
      "cerita": "Dari daftar harga tiket yang udah disusun di Part 1, operator sekarang mau tau: total duit yang masuk hari ini berapa?",
      "deskripsiSoal": "Buat SATU function hitungTotalPendapatan(daftarHarga) yang loop ke daftarHarga, jumlahin semuanya ke satu variabel total. Return total di akhir.",
      "namaFunction": "hitungTotalPendapatan",
      "starterCode": "function hitungTotalPendapatan(daftarHarga) {\n  var total = 0;\n  // tulis kodemu di sini\n\n  return total;\n}\n\nvar daftarHarga = [15000, 30000, 15000, 30000];\nvar totalPendapatan = hitungTotalPendapatan(daftarHarga);",
      "inputAwal": {
        "daftarHarga": [15000, 30000, 15000, 30000]
      },
      "hasilAkhirTervalidasi": { "totalPendapatan": 90000 },
      "alurData": {
        "namaFunction": "hitungTotalPendapatan",
        "masuk": [{ "luar": "daftarHarga", "dalam": "daftarHarga" }],
        "proses": "loop semua harga → tambahin ke total tiap putaran",
        "keluar": { "dalam": "total", "luar": "totalPendapatan" }
      },
      "catatanKonsep": [
        {
          "judul": "Part 2 ini nerusin hasil Part 1",
          "isi": "daftarHarga yang jadi input di sini itu OUTPUT dari Part 1 — nunjukin gimana hasil satu function bisa jadi bahan buat function lain, bukan cuma dipake sekali terus dibuang."
        },
        {
          "judul": "Gak ada push/pop di Part 2 ini sama sekali",
          "isi": "Murni pola akumulasi (nambah ke satu variabel angka) yang udah pernah dipelajari — dikombinasiin lagi di sini biar keliatan pola lama juga masih relevan, gak semua soal harus push/pop."
        }
      ],
      "hints": [
        "total itu mulai dari 0, sebelum loop mulai.",
        "Tiap putaran, tambahin daftarHarga[i] ke total — pola yang sama kayak soal 'total belanja' atau 'total nilai' yang udah pernah dikerjain.",
        "Gak perlu if-else sama sekali di Part 2 ini — murni loop + akumulasi doang.",
        "Ini process flow lengkapnya:\n1. Set total = 0\n2. Untuk i dari 0 sampai (panjang daftarHarga - 1), ulangi:\n   2.1. total = total + daftarHarga[i]\n3. Return total"
      ]
    }
  ]
}
```

## 4. Struktur Halaman & UI

Sama kayak kasus Antrian Perosotan (lihat `PROJECT-SPEC-antrian-perosotan.md` Bagian 4) — 1 kartu di halaman daftar, tab "Part 1"/"Part 2" di halaman detail, gak perlu locking antar part.

**Tambahan khusus buat kasus ini:** di Part 2, Panel Cerita/Soal sebaiknya nunjukin eksplisit bahwa `daftarHarga` yang jadi input itu SAMA PERSIS sama `hasilAkhirTervalidasi.daftarHarga` dari Part 1 (bukan kebetulan angkanya mirip) — kalau UI nanti punya cara buat "auto-isi input Part 2 dari hasil Part 1" (misal tombol "Pakai Hasil Part 1"), ini bagus banget buat ditambahin. Tapi BUKAN wajib buat MVP — boleh tetep manual (siswa ketik ulang atau `inputAwal` udah dihardcode kayak di JSON).

## 5. Kriteria Selesai (Definition of Done)

- [ ] Kartu "Loket Karcis Wahana" muncul di halaman daftar
- [ ] Part 1: lengkapi `buatDaftarHarga`, jalankan dengan `inputAwal` → `daftarHarga` sesuai `hasilAkhirTervalidasi`
- [ ] Part 2: lengkapi `hitungTotalPendapatan`, jalankan dengan `inputAwal.daftarHarga` → `totalPendapatan` = `90000`
- [ ] Visualisasi Part 1 nunjukin variabel sementara (`harga`) berubah nilai tiap putaran TERGANTUNG hasil if-else, dan `daftarHarga` nambah 1 elemen tiap putaran — dua-duanya harus tampil biar keliatan hubungannya
- [ ] Visualisasi Part 2 nunjukin `total` numpuk pelan-pelan tiap putaran (0 → 15000 → 45000 → 60000 → 90000) — pola akumulasi yang udah familiar, dipake lagi di konteks baru
- [ ] Hint di tiap part jalan sendiri-sendiri, 4 level, hint terakhir = process flow lengkap

## 6. Rencana Lanjutan (Bukan Hari Ini)

- Fitur "Pakai Hasil Part 1" buat auto-isi input Part 2 (disebut di Bagian 4) — nice-to-have, bukan blocker
- Kalau nanti ada kasus 3-part, bisa lanjut pola "hasil part sebelumnya jadi input part berikutnya" ini