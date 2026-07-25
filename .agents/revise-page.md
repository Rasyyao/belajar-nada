# PROJECT SPEC — Halaman Mini Project (Full Sistem, Cerita, Visualisasi)

> Extension dari `PROJECT-SPEC-for-claude-code.md`. Reuse Monaco Editor, Tailwind config, dan prinsip "tidak pakai AI/database" dari file itu. **Bedanya dari versi draft sebelumnya:** dulu mini-project cuma 1 function dipanggil sekali ke input tetap — sekarang FULL PROGRAM interaktif (banyak langkah, ada input berurutan), setara kompleksitasnya sama `proyek-kasir-toko.html`/`proyek-todo-list.html` yang udah pernah dibikin sebelumnya, TAPI temanya baru (bukan batu gunting kertas / tebak angka).
>
> Semua kode di bawah SUDAH TERVALIDASI jalan bener via Node.js sebelum ditaruh di sini.

## 1. Kenapa Perlu Update dari Versi Sebelumnya

Versi draft awal (`packing-koper` / `bongkar-kado`) itu terlalu simpel — cuma 1 function, 1 kali panggil, input tetap. Padahal biar berasa kayak "mini project" beneran (bukan soal drill), butuh alur PROGRAM: minta input dari pengguna step demi step, keputusan program berdasarkan itu, dan hasil akhir yang baru ketauan di ujung. Ini juga yang bikin visualisasinya lebih hidup — ada momen "nunggu jawaban", bukan langsung run-lalu-selesai.

**Masalah teknis yang perlu diselesaikan:** program interaktif butuh cara buat "minta input" — biasanya pakai `readline-sync`, tapi `js-interpreter` (yang dipakai buat step-tracer) jalan di sandbox terisolasi yang GAK punya akses ke modul Node asli. Solusinya: suntikin function custom pengganti `readline-sync` ke dalam sandbox interpreter, yang ngambil jawaban dari daftar input yang udah ditentuin di awal (persis pola yang dipakai di proyek-proyek sebelumnya lewat Web Worker, sekarang diadaptasi ke `js-interpreter`). Sudah divalidasi jalan benar.

**Cakupan materi:** kedua mini-project SEKARANG juga pakai `function` (parameter & return) sebagai bagian dari alurnya — bukan cuma loop+push/pop polos. Ini biar satu mini-project nyentuh beberapa materi sekaligus (function, for-loop, if-else, array push/pop), bukan cuma satu konsep doang. Kombinasi function + input interaktif + push/pop udah divalidasi jalan bareng dengan bener di step-tracer.

**Prinsip pemakaian `ambilInput()` — PENTING:** jangan dipakai kalau datanya sebenernya udah bisa dikasih langsung sebagai array. Contoh: di Mini Project 1, awalnya kepikiran pola "tanya dulu jumlah kacangnya berapa, baru loop tanya jenisnya satu-satu" (kayak pola readline-sync lama di Kasir Toko) — tapi itu gak perlu, karena kita bisa langsung kasih `kacangDitemukan = ["Kenari", "Almond", "Kastanye"]` sebagai array, terus tinggal di-loop. `ambilInput()` cuma dipakai kalau nilainya BENERAN gak bisa ditentuin di awal (contoh: Mini Project 2 nanya "musim dingin berapa hari?" — itu genuinely variabel yang beda-beda tiap kali dijalankan, gak bisa diganti array tetap).

## 2. Cerita: Tupai dan Simpanan Kacang (2 Musim, 1 Narasi Berkelanjutan)

Dua mini-project ini SALING NYAMBUNG ceritanya — musim gugur (nimbun, push) lanjut ke musim dingin (bongkar, pop). Ini sengaja, biar kerasa kayak satu cerita utuh yang dipecah 2 sesi, bukan 2 soal random gak nyambung.

### 2.1 Mini Project 1 — "Tupai Menimbun Kacang" (tema: `push`)

**Cerita:** Musim gugur, Tupai sibuk nyari kacang buat disimpen sebelum musim dingin tiba. Tiap kali nemu kacang, dia masukin ke lubang simpanan di pohon.

**Alur program:**
1. Kacang yang ditemukan hari ini udah dikasih langsung sebagai array (`kacangDitemukan`)
2. SATU function `simpanSemuaKacang(kacangDitemukan)` yang ngerjain SEMUANYA — bikin tumpukan kosong, loop, push tiap kacang, sampai return hasil akhirnya. Loop-nya ada DI DALAM function, bukan di luar.
3. Di kode utama (global), tinggal panggil function itu SEKALI, hasilnya ditampung ke variabel `tumpukanKacang`

**Kode acuan (SUDAH TERVALIDASI) — loop dan push-nya SEKARANG DI DALAM function, bukan terpisah di luar:**
```js
function simpanSemuaKacang(kacangDitemukan) {
  var tumpukanKacang = [];
  for (var i = 0; i < kacangDitemukan.length; i++) {
    tumpukanKacang.push(kacangDitemukan[i]);
  }
  return tumpukanKacang;
}

var kacangDitemukan = ["Kenari", "Almond", "Kastanye"];
var tumpukanKacang = simpanSemuaKacang(kacangDitemukan);
```
**Input:** langsung array `["Kenari", "Almond", "Kastanye"]` sebagai `kacangDitemukan`
**Hasil akhir `tumpukanKacang`:** `["Kenari", "Almond", "Kastanye"]`

### 2.2 Mini Project 2 — "Tupai Membongkar Simpanan" (tema: `pop`)

**Cerita:** Musim dingin tiba. Tumpukan kacang dari musim gugur (`["Kenari", "Almond", "Kastanye"]`) udah siap — Tupai makan 1 kacang tiap hari, selalu ambil dari yang PALING ATAS (paling terakhir disimpen). Kalau tumpukannya abis sebelum musim dingin berakhir, dia harus puasa hari itu.

**Alur program:**
1. Tumpukan awal udah ada (`["Kenari", "Almond", "Kastanye"]`, dari hasil Project 1), dan jumlah hari musim dingin ditanya lewat `ambilInput()`
2. SATU function `bongkarSimpanan(tumpukanKacang, jumlahHari)` yang ngerjain SEMUANYA — loop sebanyak `jumlahHari`, di tiap putaran cek pakai if-else (tumpukan kosong atau masih ada isi), lalu return daftar kacang yang dimakan
3. Di kode utama (global), tinggal panggil function itu SEKALI, hasilnya ditampung ke variabel `kacangDimakan`

**Kode acuan (SUDAH TERVALIDASI, termasuk kasus kacang habis di tengah jalan) — loop dan if-else-nya SEKARANG DI DALAM function:**
```js
function bongkarSimpanan(tumpukanKacang, jumlahHari) {
  var kacangDimakan = [];
  for (var hari = 1; hari <= jumlahHari; hari++) {
    if (tumpukanKacang.length === 0) {
      kacangDimakan.push("Habis!");
    } else {
      kacangDimakan.push(tumpukanKacang.pop());
    }
  }
  return kacangDimakan;
}

var tumpukanKacang = ["Kenari", "Almond", "Kastanye"];
var jumlahHari = Number(ambilInput());
var kacangDimakan = bongkarSimpanan(tumpukanKacang, jumlahHari);
```
**Input contoh:** `["5"]` (musim dingin 5 hari, padahal cuma ada 3 kacang)
**Hasil akhir tervalidasi:**
- `kacangDimakan` → `["Kastanye", "Almond", "Kenari", "Habis!", "Habis!"]` (urutan KEBALIK karena LIFO, dan 2 hari terakhir kehabisan)
- `tumpukanKacang` (variabel global) → JUGA ikut jadi `[]` — walau function-nya cuma `return kacangDimakan`, bukan `return tumpukanKacang`. Ini kejadian karena array itu "nyambung by reference": `.pop()` yang dipanggil DI DALAM function beneran ngubah array yang SAMA yang ditunjuk variabel global `tumpukanKacang` di luar. Ini beda sama angka/teks biasa yang kalau diubah di dalam function, di luar gak ikut berubah — bagus dijadiin bahan diskusi tambahan kalau Nada nanya "kok tumpukanKacang di luar ikut kosong padahal gak di-return?"

**PENTING buat narasi di UI:** tekenin bahwa `Kastanye` dimakan PALING DULUAN — padahal itu kacang yang PALING TERAKHIR disimpen musim gugur kemarin. Ini reinforcement konsep LIFO yang udah pernah dibahas.

### 2.3 Penjelasan yang Wajib Ada di UI — Parameter vs Return

**Struktur kode di kedua project SEKARANG konsisten:** SEMUA logic (bikin variabel kosong, loop, if-else, push/pop) ditaruh DI DALAM SATU function. Di luar function (di kode global), cukup 2 baris: siapin data awal, terus PANGGIL function itu SEKALI. Jangan taruh `for` loop di luar function yang manggil function lain berkali-kali — itu bikin bingung karena kesannya ada "2 tempat logic" padahal harusnya cuma 1.

Ini konsep yang sering bikin bingung, jadi harus dijelasin eksplisit di Panel Cerita atau di komentar kode, bukan diasumsikan siswa udah paham:

**Parameter = PINTU MASUK.** Cara kita masukin nilai DARI LUAR (variabel global) KE DALAM function. Contoh: `simpanSemuaKacang(kacangDitemukan)` — nilai `kacangDitemukan` yang ada di luar "dikirim masuk" lewat parameter, terus di dalam function namanya jadi `kacangDitemukan` juga (boleh beda nama, tapi di sini sengaja disamain biar gampang diikutin).

**Return + assignment = PINTU KELUAR.** Cara kita ngambil hasil DARI DALAM function BALIK KE variabel global. Contoh: `var tumpukanKacang = simpanSemuaKacang(kacangDitemukan)` — function selesai kerja, `return`-nya "dikirim keluar", ditangkep sama `var tumpukanKacang = ...` di luar.

**Diagram sederhana yang bisa dipakai di UI:**
```
   [luar/global]                [dalam function]
   kacangDitemukan   ---masuk lewat parameter--->   kacangDitemukan
                                     |
                                (loop, push, dst)
                                     |
   tumpukanKacang    <---keluar lewat return-----   return tumpukanKacang
```

**Bonus poin edukasi (dari Project 2):** kalau parameternya berupa ARRAY (bukan angka/teks), array itu "nyambung by reference" — ngubah isinya (`push`/`pop`) DI DALAM function bakal ke-efek juga ke variabel yang SAMA di luar, WALAUPUN gak di-`return`. Ini beda sama angka/teks biasa. Lihat catatan di bagian 2.2 buat contoh konkretnya (`tumpukanKacang` di luar ikut jadi `[]`).

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
    "deskripsiSoal": "Buat SATU function simpanSemuaKacang(kacangDitemukan) yang di dalamnya bikin tumpukan kosong, loop ke semua kacang, push satu-satu, lalu return hasilnya. Loop-nya HARUS di dalam function ini, bukan di luar.",
    "starterCode": "function simpanSemuaKacang(kacangDitemukan) {\n  var tumpukanKacang = [];\n  // tulis kodemu di sini (loop + push)\n\n  return tumpukanKacang;\n}\n\nvar kacangDitemukan = [\"Kenari\", \"Almond\", \"Kastanye\"];\nvar tumpukanKacang = simpanSemuaKacang(kacangDitemukan);",
    "inputs": [],
    "promptLabels": [],
    "hasilAkhirTervalidasi": { "tumpukanKacang": ["Kenari", "Almond", "Kastanye"] },
    "hints": [
      "Inget lagi: array kosong itu ditulis []. Kamu butuh satu variabel buat nampung hasilnya SEBELUM loop mulai.",
      "Loop-nya harus jalan sebanyak jumlah elemen di kacangDitemukan — coba pakai for dengan i dari 0 sampai kacangDitemukan.length - 1.",
      "Di dalam loop, ambil elemen ke-i dari kacangDitemukan (pakai kacangDitemukan[i]), terus push ke tumpukanKacang.",
      "Ini process flow lengkapnya:\n1. Set tumpukanKacang = []\n2. Untuk i dari 0 sampai (panjang kacangDitemukan - 1), ulangi:\n   2.1. Push kacangDitemukan[i] ke tumpukanKacang\n3. Return tumpukanKacang"
    ]
  },
  {
    "id": "tupai-membongkar-simpanan",
    "judul": "Tupai Membongkar Simpanan",
    "tema": "pop",
    "musim": "dingin",
    "cerita": "Musim dingin tiba. Tupai makan 1 kacang tiap hari dari simpanannya, selalu ambil dari yang PALING ATAS (paling terakhir disimpen musim gugur kemarin). Kalau simpanannya abis, dia puasa hari itu.",
    "visualTheme": "pohon-simpanan",
    "deskripsiSoal": "Tumpukan awal udah ada dari hasil musim gugur. Buat SATU function bongkarSimpanan(tumpukanKacang, jumlahHari) yang di dalamnya loop sebanyak jumlahHari, pakai if-else tiap putaran (kalau tumpukan masih ada isi, pop; kalau kosong, catat 'Habis!'), lalu return daftar kacang yang dimakan.",
    "starterCode": "function bongkarSimpanan(tumpukanKacang, jumlahHari) {\n  var kacangDimakan = [];\n  // tulis kodemu di sini (loop + if-else + pop)\n\n  return kacangDimakan;\n}\n\nvar tumpukanKacang = [\"Kenari\", \"Almond\", \"Kastanye\"];\nvar jumlahHari = Number(ambilInput());\nvar kacangDimakan = bongkarSimpanan(tumpukanKacang, jumlahHari);",
    "inputs": ["5"],
    "promptLabels": ["Musim dingin berapa hari?"],
    "hasilAkhirTervalidasi": {
      "kacangDimakan": ["Kastanye", "Almond", "Kenari", "Habis!", "Habis!"],
      "tumpukanKacang": []
    },
    "hints": [
      "Kamu butuh loop yang jalan sebanyak jumlahHari — BUKAN sebanyak isi tumpukanKacang.",
      "Di tiap putaran, cek dulu: tumpukanKacang.length === 0 artinya kacangnya udah habis.",
      "Kalau belum habis, pakai tumpukanKacang.pop() buat ambil kacang paling atas, push hasilnya ke kacangDimakan. Kalau udah habis, push \"Habis!\" aja ke kacangDimakan.",
      "Ini process flow lengkapnya:\n1. Set kacangDimakan = []\n2. Untuk hari dari 1 sampai jumlahHari, ulangi:\n   2.1. Jika tumpukanKacang.length sama dengan 0, push \"Habis!\" ke kacangDimakan\n   2.2. Kalau enggak, pop dari tumpukanKacang, push hasilnya ke kacangDimakan\n3. Return kacangDimakan"
    ]
  }
]
```

## 5. Struktur Halaman & UI (Tetap Sama Kayak Draft Sebelumnya)

- Halaman daftar: grid kartu, tambahkan badge `musim` di samping badge `tema` (misal: "🍂 Gugur — push" / "❄️ Dingin — pop") biar keliatan mereka satu rangkaian cerita
- Halaman detail: Panel Cerita (dari `cerita` + `deskripsiSoal`), Panel Code (Monaco, terisi `starterCode`), Panel Visualisasi (tampilkan `inputs` yang bakal disuapin sebelum run, lalu step-by-step hasil `collectStepsInteractive()`)
- Reuse Tailwind design tokens dari spec sebelumnya

## 6. Fitur Hint Berjenjang (Kayak LeetCode)

**Tujuan:** siswa yang macet gak langsung dikasih jawaban penuh — dikasih dorongan bertahap dulu. Hint terakhir BARU berupa process flow lengkap (pseudocode utuh), bukan kode jadi.

### 6.1 Struktur Data — Tambahan Field di JSON

Tiap project di `mini-projects.json` (lihat Bagian 4) dapet field baru `hints` — array of string, urut dari yang PALING SAMAR ke yang PALING JELAS. Hint TERAKHIR di array selalu berisi process flow lengkap.

```json
{
  "id": "tupai-menimbun-kacang",
  "...": "...(field lain tetap sama)",
  "hints": [
    "Inget lagi: array kosong itu ditulis []. Kamu butuh satu variabel buat nampung hasilnya SEBELUM loop mulai.",
    "Loop-nya harus jalan sebanyak jumlah elemen di kacangDitemukan — coba pakai for dengan i dari 0 sampai kacangDitemukan.length - 1.",
    "Di dalam loop, ambil elemen ke-i dari kacangDitemukan (pakai kacangDitemukan[i]), terus push ke tumpukanKacang.",
    "Ini process flow lengkapnya:\n1. Set tumpukanKacang = []\n2. Untuk i dari 0 sampai (panjang kacangDitemukan - 1), ulangi:\n   2.1. Push kacangDitemukan[i] ke tumpukanKacang\n3. Return tumpukanKacang"
  ]
}
```

```json
{
  "id": "tupai-membongkar-simpanan",
  "...": "...(field lain tetap sama)",
  "hints": [
    "Kamu butuh loop yang jalan sebanyak jumlahHari — BUKAN sebanyak isi tumpukanKacang.",
    "Di tiap putaran, cek dulu: tumpukanKacang.length === 0 artinya kacangnya udah habis.",
    "Kalau belum habis, pakai tumpukanKacang.pop() buat ambil kacang paling atas, push hasilnya ke kacangDimakan. Kalau udah habis, push \"Habis!\" aja ke kacangDimakan.",
    "Ini process flow lengkapnya:\n1. Set kacangDimakan = []\n2. Untuk hari dari 1 sampai jumlahHari, ulangi:\n   2.1. Jika tumpukanKacang.length sama dengan 0, push \"Habis!\" ke kacangDimakan\n   2.2. Kalau enggak, pop dari tumpukanKacang, push hasilnya ke kacangDimakan\n3. Return kacangDimakan"
  ]
}
```

### 6.2 UI/UX — Tombol & Popup

- Tombol **"💡 Hint"** ditaruh di sebelah tombol "Jalankan & Visualisasikan" (Panel Code), styling beda warna (misal kuning/amber lembut) biar keliatan "bantuan", bukan aksi utama
- Klik tombol → buka **popup/modal** (bukan langsung nampilin semua hint sekaligus):
  - Nampilin **1 hint aja** sesuai level yang lagi dibuka, dengan label `"Hint 1 dari 4"` dst
  - Tombol **"Lihat hint berikutnya"** di dalam popup — tiap diklik, level naik 1, sampe mentok di hint terakhir
  - Tombol **"Tutup"** buat nutup popup tanpa reset progress (kalau dibuka lagi nanti, lanjut dari level terakhir yang udah dibuka, gak balik ke level 1)
  - **Hint TERAKHIR dikasih styling beda** (border/background warna beda dari hint biasa) plus label peringatan kecil: *"Ini udah process flow lengkap — kalau nyampe sini, coba tulis kodenya dari langkah-langkah ini."* Soalnya ini secara efektif udah kasih tau jawabannya, jadi perlu ditandain beda dari hint-hint sebelumnya yang masih berupa dorongan/petunjuk.
- State yang dibutuhkan di komponen: `hintLevel` (angka, 0 = belum dibuka sama sekali, 1..N = level hint yang lagi ditampilin), di-reset ke 0 kalau pindah project (misal siswa buka project lain dari daftar)

### 6.3 Kenapa Popup, Bukan Ditampilin Langsung di Halaman

Hint yang selalu keliatan di halaman (gak perlu diklik) godaannya gede buat langsung diintip duluan sebelum coba sendiri. Popup butuh 1 aksi sadar ("saya mau minta hint") — sedikit friksi ini penting biar hint beneran dipake pas macet, bukan jadi kebiasaan liat dulu sebelum nyoba.

## 7. Struktur Halaman & UI (Tetap Sama Kayak Draft Sebelumnya)

- Halaman daftar: grid kartu, tambahkan badge `musim` di samping badge `tema` (misal: "🍂 Gugur — push" / "❄️ Dingin — pop") biar keliatan mereka satu rangkaian cerita
- Halaman detail: Panel Cerita (dari `cerita` + `deskripsiSoal`), Panel Code (Monaco, terisi `starterCode`, plus tombol Hint di sebelahnya — lihat Bagian 6), Panel Visualisasi (tampilkan `inputs` yang bakal disuapin sebelum run, lalu step-by-step hasil `collectStepsInteractive()`)
- Reuse Tailwind design tokens dari spec sebelumnya

## 8. Kriteria Selesai (Definition of Done)

- [ ] Halaman daftar menampilkan 2 kartu dengan badge musim+tema yang jelas
- [ ] Buka "Tupai Menimbun Kacang", lengkapi function `simpanSemuaKacang(kacangDitemukan)`, jalankan (langsung pakai array `kacangDitemukan`, TANPA perlu isi `inputs`) → `tumpukanKacang` akhir sesuai `hasilAkhirTervalidasi`
- [ ] Visualisasi nunjukin variabel LOKAL di dalam function `simpanSemuaKacang`/`bongkarSimpanan` juga kebaca (bukan cuma variabel top-level) — reuse kemampuan step-tracer yang udah divalidasi di spec sebelumnya
- [ ] Panel Cerita atau area penjelasan menampilkan diagram/penjelasan Parameter vs Return (lihat Bagian 2.3) — bukan cuma soal teknis doang, tapi ada penjelasan eksplisit "kenapa" buat konsep ini
- [ ] Buka "Tupai Membongkar Simpanan", lengkapi starter code, jalankan → `kacangDimakan` akhir `["Kastanye","Almond","Kenari","Habis!","Habis!"]`, urutannya KEBALIK dari urutan simpan (LIFO) — dan UI nampilin catatan singkat soal ini biar siswa gak ngira itu bug
- [ ] Visualisasi step-by-step nunjukin `tumpukanKacang` mengecil BERBARENGAN sama `kacangDimakan` yang nambah — dua variabel itu HARUS tampil berdampingan di tiap step biar interaksinya keliatan
- [ ] Program yang minta input lebih banyak dari yang disediakan di `inputs` → error yang jelas, gak nge-crash diam-diam
- [ ] Tombol Hint jalan: klik pertama nampilin hint level 1 di popup, klik "hint berikutnya" naikin level sampe ke hint terakhir (process flow lengkap), hint terakhir keliatan beda styling-nya dari hint biasa
- [ ] Progress hint (`hintLevel`) ke-reset ke 0 kalau pindah ke project lain dari halaman daftar

## 9. Rencana Lanjutan (Bukan Hari Ini)

- Tambah musim/mini-project lain kalau nanti lanjut ke topik baru (`shift`/`unshift` misalnya — bisa lanjut cerita Tupai "berbagi kacang ke yang paling depan antrian" dst)
- Pindah data JSON ke database kalau koleksinya udah banyak