# PROJECT SPEC — Halaman Mini Project (Full Sistem, Cerita, Visualisasi)

> Extension dari `PROJECT-SPEC-for-claude-code.md`. Reuse Monaco Editor, Tailwind config, dan prinsip "tidak pakai AI/database" dari file itu. **Bedanya dari versi draft sebelumnya:** dulu mini-project cuma 1 function dipanggil sekali ke input tetap — sekarang FULL PROGRAM interaktif (banyak langkah, ada input berurutan), setara kompleksitasnya sama `proyek-kasir-toko.html`/`proyek-todo-list.html` yang udah pernah dibikin sebelumnya, TAPI temanya baru (bukan batu gunting kertas / tebak angka).
>
> Semua kode di bawah SUDAH TERVALIDASI jalan bener via Node.js sebelum ditaruh di sini.

## 1. Kenapa Perlu Update dari Versi Sebelumnya

Versi draft awal (`packing-koper` / `bongkar-kado`) itu terlalu simpel — cuma 1 function, 1 kali panggil, input tetap. Padahal biar berasa kayak "mini project" beneran (bukan soal drill), butuh alur PROGRAM: minta input dari pengguna step demi step, keputusan program berdasarkan itu, dan hasil akhir yang baru ketauan di ujung. Ini juga yang bikin visualisasinya lebih hidup — ada momen "nunggu jawaban", bukan langsung run-lalu-selesai.

**Masalah teknis yang perlu diselesaikan:** program interaktif butuh cara buat "minta input" — biasanya pakai `readline-sync`, tapi `js-interpreter` (yang dipakai buat step-tracer) jalan di sandbox terisolasi yang GAK punya akses ke modul Node asli. Solusinya: suntikin function custom pengganti `readline-sync` ke dalam sandbox interpreter, yang ngambil jawaban dari daftar input yang udah ditentuin di awal (persis pola yang dipakai di proyek-proyek sebelumnya lewat Web Worker, sekarang diadaptasi ke `js-interpreter`). Sudah divalidasi jalan benar.

**Cakupan materi:** kedua mini-project SEKARANG juga pakai `function` (parameter & return) sebagai bagian dari alurnya — bukan cuma loop+push/pop polos. Ini biar satu mini-project nyentuh beberapa materi sekaligus (function, for-loop, if-else, array push/pop), bukan cuma satu konsep doang. Kombinasi function + input interaktif + push/pop udah divalidasi jalan bareng dengan bener di step-tracer.

## 2. Cerita: Tupai dan Simpanan Kacang (2 Musim, 1 Narasi Berkelanjutan)

Dua mini-project ini SALING NYAMBUNG ceritanya — musim gugur (nimbun, push) lanjut ke musim dingin (bongkar, pop). Ini sengaja, biar kerasa kayak satu cerita utuh yang dipecah 2 sesi, bukan 2 soal random gak nyambung.

### 2.1 Mini Project 1 — "Tupai Menimbun Kacang" (tema: `push`)

**Cerita:** Musim gugur, Tupai sibuk nyari kacang buat disimpen sebelum musim dingin tiba. Tiap kali nemu kacang, dia masukin ke lubang simpanan di pohon.

**Alur program:**
1. Tanya berapa kacang yang ditemukan hari ini (`jumlahKacang`)
2. Loop sebanyak itu — tiap putaran, tanya jenis kacangnya apa, panggil function `simpanKacang(tumpukan, kacang)` buat masukin ke `tumpukanKacang`
3. Tampilkan seluruh isi tumpukan
4. Tampilkan total kacang yang berhasil dikumpulin

**Kode acuan (SUDAH TERVALIDASI) — sengaja pakai function biar nyambung ke materi function (parameter & return), bukan cuma loop+push polos:**
```js
function simpanKacang(tumpukan, kacang) {
  tumpukan.push(kacang);
  return tumpukan;
}

var jumlahKacang = Number(ambilInput());
var tumpukanKacang = [];
for (var i = 1; i <= jumlahKacang; i++) {
  var jenisKacang = ambilInput();
  tumpukanKacang = simpanKacang(tumpukanKacang, jenisKacang);
}
```
**Input contoh:** `["3", "Kenari", "Almond", "Kastanye"]` (jumlah dulu, baru tiap jenis kacang)
**Hasil akhir `tumpukanKacang`:** `["Kenari", "Almond", "Kastanye"]`

### 2.2 Mini Project 2 — "Tupai Membongkar Simpanan" (tema: `pop`)

**Cerita:** Musim dingin tiba. Tumpukan kacang dari musim gugur (`["Kenari", "Almond", "Kastanye"]`) udah siap — Tupai makan 1 kacang tiap hari, selalu ambil dari yang PALING ATAS (paling terakhir disimpen). Kalau tumpukannya abis sebelum musim dingin berakhir, dia harus puasa hari itu.

**Alur program:**
1. Tumpukan awal udah ada (`["Kenari", "Almond", "Kastanye"]`, dari hasil Project 1)
2. Tanya musim dingin berapa hari (`jumlahHari`)
3. Loop sebanyak itu — tiap hari, panggil function `makanSatuKacang(tumpukan)` yang di DALAMNYA ada if-else: kalau tumpukan masih ada isi, `pop` dan return kacangnya; kalau udah kosong, return `"Habis!"`
4. Tampilkan urutan kacang yang dimakan + sisa tumpukan di akhir

**Kode acuan (SUDAH TERVALIDASI, termasuk kasus kacang habis di tengah jalan) — function di sini nunjukin pola "if-else di dalam function, return beda-beda tergantung kondisi", nyambung ke materi function DAN if-else sekaligus:**
```js
function makanSatuKacang(tumpukan) {
  if (tumpukan.length === 0) {
    return "Habis!";
  }
  return tumpukan.pop();
}

var tumpukanKacang = ["Kenari", "Almond", "Kastanye"];
var jumlahHari = Number(ambilInput());
var kacangDimakan = [];
for (var hari = 1; hari <= jumlahHari; hari++) {
  var kacang = makanSatuKacang(tumpukanKacang);
  kacangDimakan.push(kacang);
}
```
**Input contoh:** `["5"]` (musim dingin 5 hari, padahal cuma ada 3 kacang)
**Hasil akhir tervalidasi:**
- `kacangDimakan` → `["Kastanye", "Almond", "Kenari", "Habis!", "Habis!"]` (urutan KEBALIK karena LIFO, dan 2 hari terakhir kehabisan)
- `tumpukanKacang` → `[]`

**PENTING buat narasi di UI:** tekenin bahwa `Kastanye` dimakan PALING DULUAN — padahal itu kacang yang PALING TERAKHIR disimpen musim gugur kemarin. Ini reinforcement konsep LIFO yang udah pernah dibahas.

## 3. Perubahan Teknis — Dukungan Input Interaktif di Step-Tracer

### 3.1 Fungsi `collectSteps` Versi Baru — Dukung Input Berurutan

Tambahan dari versi sebelumnya: parameter `inputs` (array jawaban yang udah ditentuin), dan `initFunc` yang nyuntikin function `ambilInput()` ke sandbox.

```js
import Interpreter from 'js-interpreter';

const SKIP_KEYS = new Set(['window', 'self', 'this', 'arguments']);

function safeConvert(interpreter, raw) {
  if (raw === null || raw === undefined) return raw;
  if (typeof raw !== 'object') return raw;
  if (raw.class === 'Array') return interpreter.pseudoToNative(raw);
  return undefined; // skip Function/Object/lainnya yang gak perlu divisualisasikan
}

function collectStepsInteractive(code, inputs, maxSteps = 3000) {
  let inputIndex = 0;

  function initFunc(interpreter, globalObject) {
    interpreter.setProperty(globalObject, 'ambilInput',
      interpreter.createNativeFunction(function () {
        if (inputIndex < inputs.length) return inputs[inputIndex++];
        throw new Error('Program masih minta input lebih banyak dari yang disediakan.');
      })
    );
  }

  const interpreter = new Interpreter(code, initFunc);
  const totalLines = code.split('\n').length;
  const steps = [];
  let lastLine = null;
  let count = 0;

  while (interpreter.step()) {
    count++;
    if (count > maxSteps) {
      throw new Error('Kelamaan/kebanyakan langkah (>' + maxSteps + '). Kemungkinan ada loop tak berhenti.');
    }

    const stack = interpreter.getStateStack();
    const node = stack[stack.length - 1].node;
    if (!node || !node.loc) continue;

    const line = node.loc.start.line;
    if (line > totalLines) continue;
    if (line === lastLine) continue;
    lastLine = line;

    const vars = {};
    for (let s = stack.length - 1; s >= 0; s--) {
      const state = stack[s];
      if (state.scope && state.scope.object && state.scope.object.properties) {
        for (const key in state.scope.object.properties) {
          if (SKIP_KEYS.has(key) || vars[key] !== undefined) continue;
          try {
            const raw = interpreter.getProperty(state.scope.object, key);
            const val = safeConvert(interpreter, raw);
            if (val !== undefined) vars[key] = val;
          } catch (e) { /* skip */ }
        }
      }
    }

    steps.push({ line, vars });
  }

  return steps;
}
```

**Catatan penting soal syntax kode siswa:** karena `ambilInput()` dipanggil TANPA argumen di kode acuan (bukan `ambilInput("teks pertanyaan")`), tampilan "pertanyaan apa yang lagi ditanya" HARUS diambil dari `inputAwal`/metadata project (lihat Bagian 4), BUKAN dari argumen function-nya — supaya kode siswa tetep simpel (gak perlu ribet nulis string pertanyaan tiap manggil `ambilInput`).

### 3.2 Kaitan dengan Panel Visualisasi

Karena sekarang ada input berurutan, panel visualisasi butuh tampilan tambahan: sebelum menjalankan, tunjukkan daftar `inputs` yang bakal "disuapin" ke program (biar pengajar/siswa tau apa yang lagi disimulasikan), baru navigasi step seperti biasa.

## 4. Data JSON — SUDAH TERVALIDASI

Skema `mini-projects.json` diperbarui — field `contohOutput` (single value) diganti `inputs` (array jawaban berurutan) dan `hasilAkhirTervalidasi` (buat referensi pengajar, bukan auto-grading):

```json
[
  {
    "id": "tupai-menimbun-kacang",
    "judul": "Tupai Menimbun Kacang",
    "tema": "push",
    "musim": "gugur",
    "cerita": "Musim gugur, Tupai sibuk nyari kacang buat disimpen sebelum musim dingin tiba. Tiap kali nemu kacang, dia masukin ke lubang simpanan di pohon.",
    "visualTheme": "pohon-simpanan",
    "deskripsiSoal": "Buat function simpanKacang(tumpukan, kacang) yang push kacang ke tumpukan dan return tumpukannya. Lalu tanya berapa kacang ditemukan hari ini, dan untuk tiap kacang, tanya jenisnya dan panggil function itu.",
    "starterCode": "function simpanKacang(tumpukan, kacang) {\n  // tulis kodemu di sini\n\n}\n\nvar jumlahKacang = Number(ambilInput());\nvar tumpukanKacang = [];\nfor (var i = 1; i <= jumlahKacang; i++) {\n  var jenisKacang = ambilInput();\n  tumpukanKacang = simpanKacang(tumpukanKacang, jenisKacang);\n}",
    "inputs": ["3", "Kenari", "Almond", "Kastanye"],
    "promptLabels": ["Berapa kacang ditemukan hari ini?", "Kacang ke-1, jenisnya apa?", "Kacang ke-2, jenisnya apa?", "Kacang ke-3, jenisnya apa?"],
    "hasilAkhirTervalidasi": { "tumpukanKacang": ["Kenari", "Almond", "Kastanye"] }
  },
  {
    "id": "tupai-membongkar-simpanan",
    "judul": "Tupai Membongkar Simpanan",
    "tema": "pop",
    "musim": "dingin",
    "cerita": "Musim dingin tiba. Tupai makan 1 kacang tiap hari dari simpanannya, selalu ambil dari yang PALING ATAS (paling terakhir disimpen musim gugur kemarin). Kalau simpanannya abis, dia puasa hari itu.",
    "visualTheme": "pohon-simpanan",
    "deskripsiSoal": "Tumpukan awal udah ada dari hasil musim gugur. Buat function makanSatuKacang(tumpukan) yang pakai if-else: kalau tumpukan masih ada isi, pop dan return kacangnya; kalau kosong, return 'Habis!'. Lalu tanya musim dingin berapa hari, dan panggil function itu tiap hari.",
    "starterCode": "function makanSatuKacang(tumpukan) {\n  // tulis kodemu di sini (pakai if-else)\n\n}\n\nvar tumpukanKacang = [\"Kenari\", \"Almond\", \"Kastanye\"];\nvar jumlahHari = Number(ambilInput());\nvar kacangDimakan = [];\nfor (var hari = 1; hari <= jumlahHari; hari++) {\n  var kacang = makanSatuKacang(tumpukanKacang);\n  kacangDimakan.push(kacang);\n}",
    "inputs": ["5"],
    "promptLabels": ["Musim dingin berapa hari?"],
    "hasilAkhirTervalidasi": {
      "kacangDimakan": ["Kastanye", "Almond", "Kenari", "Habis!", "Habis!"],
      "tumpukanKacang": []
    }
  }
]
```

## 5. Struktur Halaman & UI (Tetap Sama Kayak Draft Sebelumnya)

- Halaman daftar: grid kartu, tambahkan badge `musim` di samping badge `tema` (misal: "🍂 Gugur — push" / "❄️ Dingin — pop") biar keliatan mereka satu rangkaian cerita
- Halaman detail: Panel Cerita (dari `cerita` + `deskripsiSoal`), Panel Code (Monaco, terisi `starterCode`), Panel Visualisasi (tampilkan `inputs` yang bakal disuapin sebelum run, lalu step-by-step hasil `collectStepsInteractive()`)
- Reuse Tailwind design tokens dari spec sebelumnya

## 6. Kriteria Selesai (Definition of Done)

- [ ] Halaman daftar menampilkan 2 kartu dengan badge musim+tema yang jelas
- [ ] Buka "Tupai Menimbun Kacang", lengkapi function `simpanKacang(tumpukan, kacang)`, jalankan dengan `inputs` dari data → `tumpukanKacang` akhir sesuai `hasilAkhirTervalidasi`
- [ ] Visualisasi nunjukin variabel LOKAL di dalam function `simpanKacang`/`makanSatuKacang` juga kebaca (bukan cuma variabel top-level) — reuse kemampuan step-tracer yang udah divalidasi di spec sebelumnya
- [ ] Buka "Tupai Membongkar Simpanan", lengkapi starter code, jalankan → `kacangDimakan` akhir `["Kastanye","Almond","Kenari","Habis!","Habis!"]`, urutannya KEBALIK dari urutan simpan (LIFO) — dan UI nampilin catatan singkat soal ini biar siswa gak ngira itu bug
- [ ] Visualisasi step-by-step nunjukin `tumpukanKacang` mengecil BERBARENGAN sama `kacangDimakan` yang nambah — dua variabel itu HARUS tampil berdampingan di tiap step biar interaksinya keliatan
- [ ] Program yang minta input lebih banyak dari yang disediakan di `inputs` → error yang jelas, gak nge-crash diam-diam

## 7. Rencana Lanjutan (Bukan Hari Ini)

- Tambah musim/mini-project lain kalau nanti lanjut ke topik baru (`shift`/`unshift` misalnya — bisa lanjut cerita Tupai "berbagi kacang ke yang paling depan antrian" dst)
- Pindah data JSON ke database kalau koleksinya udah banyak