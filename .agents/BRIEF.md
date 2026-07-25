# PROJECT SPEC — Playground Belajar: Pseudocode, Kode, Visualisasi

> File ini disiapkan untuk langsung dieksekusi oleh Claude Code. Semua kode yang ditandai "SUDAH TERVALIDASI" itu udah dicoba jalan beneran (via Node.js) sebelum ditaruh di sini — pakai persis, jangan diganti logic-nya kecuali ada alasan teknis yang kuat.
>
> **Perubahan dari versi sebelumnya:** pendekatan visualisasi diganti dari "Proxy method interception" jadi "step-by-step interpreter" — alasannya di Bagian 5.

## 1. Konteks & Tujuan

Ini tools internal buat sesi belajar coding 1-on-1 (pengajar & 1 siswa pemula, progress baru sampai array + `push()` di JavaScript). Tujuannya: satu "playground" yang dipakai LIVE pas ngajar — pengajar kasih soal, breakdown bareng jadi pseudocode, tulis kode, jalankan, dan liat hasilnya divisualisasikan step-by-step — TERMASUK isi for-loop, if-else, dan variabel biasa, bukan cuma manipulasi array.

**Target ship: MALAM INI.** Prioritaskan working software di atas kelengkapan fitur.

## 2. Scope MVP (Ship Sekarang)

**HARUS ADA:**
- Satu halaman utama dengan 3 panel: **Soal**, **Pseudocode**, **Code + Visualisasi**
- Code editor pakai **Monaco Editor** (editor yang sama kayak VS Code / LeetCode), bukan `<textarea>` polos
- Kode dijalankan BENERAN via step-by-step interpreter, bisa nampilin: baris kode yang lagi aktif, isi variabel (termasuk array) di titik itu
- Navigasi step (sebelumnya/berikutnya) buat scrub sepanjang eksekusi
- Tombol "Share" — generate link yang kalau dibuka orang lain, nunjukin state (soal+pseudocode+kode) yang PERSIS sama

**SENGAJA TIDAK ADA di MVP ini (jangan dibangun dulu, biar gak molor):**
- Database / backend penyimpanan apapun
- API AI / LLM call apapun (alasan lengkap di Bagian 6)
- Live sync simultan (WebSocket, Firebase Realtime, dst)
- Login/autentikasi
- Halaman riwayat sesi

## 3. Tech Stack

| Bagian | Keputusan |
|---|---|
| Framework | **Next.js** (App Router, `next@14.2.5` atau lebih baru yang stabil) |
| Bahasa | JavaScript biasa (`.jsx`), **bukan TypeScript** — prioritas kecepatan ship |
| Code editor | **Monaco Editor** via package `@monaco-editor/react` |
| Step-by-step execution | **JS-Interpreter** via package `js-interpreter` (library Neil Fraser, dipakai juga di Blockly) — lihat Bagian 5 |
| Styling | **Tailwind CSS** (utility classes), design tokens tetap didefinisikan tapi lewat `tailwind.config.js` — lihat Bagian 7 |
| State management | React `useState` bawaan |
| Database | **TIDAK ADA** untuk sekarang |
| AI API | **TIDAK ADA** untuk sekarang |
| Hosting target | **Vercel** |
| Package manager | npm |

**Dependencies yang perlu diinstall:**
```
npm install next react react-dom js-interpreter @monaco-editor/react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 4. Struktur Halaman & Komponen

```
app/
  layout.jsx          <- root layout, import globals.css
  page.jsx            <- halaman utama Playground (client component, "use client")
  globals.css         <- @tailwind directives + custom CSS variables (lihat Bagian 7)
tailwind.config.js    <- extend theme pakai design tokens Bagian 7
postcss.config.js     <- dibuat otomatis sama `npx tailwindcss init -p`
```

`page.jsx` WAJIB diawali `"use client"` di baris pertama — semua logic (interpreter, Monaco, hash URL) cuma jalan di browser.

`globals.css` isinya minimal:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* design tokens, lihat Bagian 7 */
}
```

## 5. Logic Inti — Step-by-Step Interpreter (SUDAH TERVALIDASI)

### 5.1 Kenapa Bukan Proxy Lagi

Pendekatan awal (Proxy interception ke method array) cuma nangkep momen `push()`/`pop()`/`sort()` dipanggil — kalau kodenya cuma `for (let i=0; i<arr.length; i++) { total += arr[i]; }` TANPA manggil method array apapun, Proxy itu gak nangkep apa-apa. Padahal justru progress `i` dan `total` di dalam loop itu yang paling penting buat divisualisasikan buat pemula.

**Solusinya: JS-Interpreter** — parse kode jadi AST, lalu eksekusi SATU INSTRUKSI PER SATU INSTRUKSI (`interpreter.step()`), dan di titik manapun kita bisa baca isi semua variabel yang lagi aktif. Ini generic — nangkep SEMUA jenis kode (loop, kondisi, array, variabel biasa), bukan cuma method tertentu.

Sudah dites jalan benar: untuk kode `for` loop yang nge-total isi array `[5,2,8,1]`, berhasil nangkep `i` naik `0→1→2→3→4` dan `total` numpuk `0→5→7→15→16` (match: 5+2+8+1=16), plus nomor baris yang aktif di tiap titik.

### 5.2 Fungsi `collectSteps` — SUDAH TERVALIDASI, Pakai Persis

Versi ini bisa nangkep variabel LOKAL di dalam function (bukan cuma top-level) — divalidasi khusus untuk kasus "function yang punya variabel hasil, di-loop, di-`push`" dan berhasil nunjukin interaksinya step-by-step: `i` naik 0→1→2→...dan `hasil` berubah `[]` → `[8]` → `[8,22]` → `[8,22,10]` PERSIS di baris `push()` dipanggil.

```js
import Interpreter from 'js-interpreter';

const SKIP_KEYS = new Set(['window', 'self', 'this', 'arguments']);

function safeConvert(interpreter, raw) {
  if (raw === null || raw === undefined) return raw;
  if (typeof raw !== 'object') return raw; // number, string, boolean primitif
  if (raw.class === 'Array') return interpreter.pseudoToNative(raw);
  if (raw.class === 'Function') return undefined; // skip, gak perlu divisualisasikan
  if (raw.class === 'Object') {
    try { return interpreter.pseudoToNative(raw); } catch (e) { return undefined; }
  }
  return undefined; // skip tipe lain yang gak dikenal (termasuk window/global yang circular)
}

function collectSteps(code, maxSteps = 2000) {
  const interpreter = new Interpreter(code);
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
    if (line > totalLines) continue; // skip baris dari kode internal library (polyfill push/pop dst)
    if (line === lastLine) continue; // cuma simpen 1 snapshot per baris yang BERUBAH
    lastLine = line;

    // Jalan dari scope PALING DALAM (misal: di dalam for-loop, di dalam function)
    // ke scope PALING LUAR (global) — variabel yang ketemu duluan (lebih lokal) menang,
    // biar shadowing antara variabel lokal & global gak ketuker.
    const vars = {};
    for (let s = stack.length - 1; s >= 0; s--) {
      const state = stack[s];
      if (state.scope && state.scope.object && state.scope.object.properties) {
        const props = state.scope.object.properties;
        for (const key in props) {
          if (SKIP_KEYS.has(key) || vars[key] !== undefined) continue;
          try {
            const raw = interpreter.getProperty(state.scope.object, key);
            const val = safeConvert(interpreter, raw);
            if (val !== undefined) vars[key] = val;
          } catch (e) { /* variabel belum ke-declare di titik ini, skip */ }
        }
      }
    }

    steps.push({ line, vars });
  }

  return steps;
}
```

**Kenapa ini beda dari versi awal (yang cuma baca `interpreter.globalObject`):** versi awal cuma nangkep variabel top-level, jadi kalau soalnya berbentuk function (yang paling sering dipakai di materi kita — kayak `ambilAngkaGenap`, `hitungRataRata`, dst), variabel LOKAL di dalamnya (`hasil`, `i`, `total`) gak kebaca sama sekali. Versi di atas jalan ke SELURUH `stack` (dari scope paling dalam/lokal sampai global), jadi nangkep variabel di level manapun — persis yang dibutuhin buat visualisasiin "loop yang berinteraksi sama variabel hasil di dalam function".

### 5.3 Encode/Decode State ke URL (Fitur Share) — SUDAH TERVALIDASI

Tidak berubah dari versi sebelumnya, tetap dipakai persis:

```js
function encodeState(obj) {
  const json = JSON.stringify(obj);
  const utf8Safe = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g,
    function toBytes(match, p1) { return String.fromCharCode('0x' + p1); });
  return btoa(utf8Safe);
}

function decodeState(str) {
  const utf8Safe = atob(str);
  const json = decodeURIComponent(Array.prototype.map.call(utf8Safe, function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(json);
}
```

**Cara pakai di komponen:**
- Tombol "Share": `const encoded = encodeState({ soal, pseudocode, code }); window.location.hash = encoded; navigator.clipboard.writeText(window.location.href);`
- Saat komponen mount (`useEffect`): cek `window.location.hash`, kalau ada isi, decode dan isi ulang state React. Bungkus try/catch — hash rusak jangan sampai crash halaman.
- State di URL **hash** (`#...`), BUKAN query string — prinsip privasi, tidak pernah dikirim ke server.

## 6. Kenapa Tidak Pakai AI (Penjelasan buat Referensi)

Ini pertanyaan yang sempat muncul dan penting dicatat alasannya biar gak dipertanyakan ulang di tengah development:

1. **Eksekusi kode itu deterministik, AI itu menebak.** JS-Interpreter BENERAN menjalankan kode-nya — hasilnya pasti 100% benar. Kalau AI diminta "membayangkan" hasil dari membaca kode tanpa eksekusi asli, ada resiko salah tebak — untuk tools belajar, visualisasi yang salah bisa bikin siswa belajar konsep yang keliru tanpa sadar.
2. **Biaya & latency.** Setiap panggilan AI API itu bayar per-request dan ada delay 1-3 detik. Interpreter lokal gratis dan instan — penting untuk sesi ngajar live yang butuh feedback cepat (ubah kode, langsung lihat efeknya).
3. **AI tetap punya tempat di masa depan** — tapi sebagai LAPISAN NARASI di atas data yang sudah pasti benar (misalnya: "kenapa hasilnya begini" dalam bahasa santai), BUKAN sebagai sumber kebenaran soal apa yang terjadi di kode. Ini dicatat di Bagian 9 (Rencana Lanjutan), bukan untuk MVP sekarang.

## 7. Desain Visual (Design Tokens via Tailwind)

Extend warna & radius bawaan Tailwind di `tailwind.config.js`, supaya bisa dipakai sebagai utility class (`bg-accent`, `text-text-2`, `rounded-app`, dst) — jangan bikin custom CSS class manual kalau bisa pakai utility class Tailwind:

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F5F8FC',
        surface: '#FFFFFF',
        border: '#E1E8F0',
        'text-1': '#1B2735',
        'text-2': '#5B6B7E',
        accent: '#3A66D6',
        'accent-soft': '#EAF0FD',
        success: '#24915F',
        'success-soft': '#E6F6EE',
        error: '#C64444',
        'error-soft': '#FBEAEA',
        worked: '#7A5AF8',
        'worked-soft': '#F1ECFF',
        'code-bg': '#10192B',
        'code-text': '#DCE6F7',
        'code-accent': '#7FB0FF',
      },
      borderRadius: {
        app: '14px',
      },
      fontFamily: {
        heading: ['Fraunces', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

**Font:** load `Fraunces`, `Inter`, `JetBrains Mono` dari Google Fonts di `app/layout.jsx` (pakai `next/font/google` bawaan Next.js, bukan `<link>` manual — lebih optimal buat performa).

**Layout 3 panel** pakai Tailwind Grid: `<div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.2fr] gap-4">` — otomatis stack vertikal di mobile (`grid-cols-1`), 3 kolom di desktop (`md:` breakpoint bawaan Tailwind = 768px, gak perlu breakpoint custom).

**Monaco Editor** tetap pakai tema gelap bawaan (`theme="vs-dark"`) — ini setting internal Monaco sendiri, bukan Tailwind, tapi warnanya udah senada sama `code-bg` yang didefinisikan di atas.

## 8. Komponen UI yang Dibutuhkan (dalam page.jsx)

Semua styling di bawah ini pakai Tailwind utility classes langsung di JSX (`className="..."`), BUKAN file CSS terpisah per komponen.

1. **Panel Soal** — `<textarea>` dengan `className="w-full rounded-app border border-border bg-surface p-4 font-body text-text-1"`, state `soal`
2. **Panel Pseudocode** — `<textarea>` mirip Panel Soal tapi `font-mono`, state `pseudocode`
3. **Panel Code** — komponen `<Editor>` dari `@monaco-editor/react`, `defaultLanguage="javascript"`, `theme="vs-dark"`, dibungkus `<div className="rounded-app overflow-hidden">`, state `code`, `onChange` update state
4. **Tombol "Jalankan & Visualisasikan"** — `className="bg-accent hover:bg-accent/90 text-white rounded-app px-6 py-3 font-body font-semibold"`, panggil `collectSteps(code)`, tangani error, simpan hasil ke state `steps`, reset `currentStep` ke 0
5. **Panel Visualisasi** — untuk `steps[currentStep]`: highlight baris `steps[currentStep].line` (Monaco decoration, atau render teks dengan `className="bg-accent-soft"` di baris aktif), render SEMUA variabel yang lagi aktif di step itu (termasuk variabel lokal di dalam function, kayak `i` dan `hasil`) sebagai kartu kecil berdampingan — variabel angka biasa (`i`) ditampilin sebagai kartu tunggal, variabel array (`hasil`) ditampilin sebagai kotak-kotak sejajar. Karena semua variabel dirender BERDAMPINGAN di step yang sama, keliatan jelas KAPAN loop (`i`) berubah vs KAPAN variabel hasil (`hasil`) ikut berubah — ini yang jadi bentuk "interaksi" antara loop dan variabel yang diminta.
6. **Navigasi step** — tombol Awal/Sebelumnya/Berikutnya/Akhir, `className="border border-border rounded-app px-4 py-2 hover:bg-bg"`
7. **Tombol "Share"** — encode state, copy link, feedback visual singkat (misal ganti teks tombol jadi "Link disalin!" sebentar via state)
8. **Error box** — `className="bg-error-soft border-l-4 border-error rounded-r-app px-4 py-3 font-mono text-sm"`, tampil kalau `collectSteps()` throw error

## 9. Kriteria Selesai (Definition of Done untuk Malam Ini)

- [ ] `npm run build` sukses tanpa error
- [ ] Tailwind config ke-load dengan benar (warna custom kayak `bg-accent` beneran nge-render, bukan class yang gak dikenali)
- [ ] `npm run dev` jalan lokal, 3 panel muncul, Monaco Editor bisa diketik & syntax highlighting jalan
- [ ] Klik "Jalankan & Visualisasikan" dengan kode contoh (function + loop + push ke variabel lokal) → dapat list steps, bisa navigasi, variabel lokal (`i`, `hasil`) keliatan berubah tiap step — dan momen `hasil` bertambah isi HARUS sinkron sama baris `push()` yang lagi aktif (bukan cuma keliatan di akhir doang)
- [ ] Kode dengan error/infinite loop → muncul pesan error yang jelas, gak nge-crash halaman
- [ ] Klik "Share" → URL berubah (ada hash), link ke-copy ke clipboard
- [ ] Buka URL hasil share di tab/browser baru → 3 panel keisi otomatis sesuai yang di-share
- [ ] Deploy ke Vercel sukses, bisa diakses via URL publik

## 10. Contoh Kode untuk Testing Manual

Isi default di panel Code — sengaja pakai function + loop + push, biar langsung kelihatan interaksi antara loop dan variabel hasil (bukan cuma variabel top-level polos):

```js
function ambilGenap(arr) {
  var hasil = [];
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] % 2 === 0) {
      hasil.push(arr[i]);
    }
  }
  return hasil;
}
var output = ambilGenap([3, 8, 15, 22, 7, 10]);
```

Harusnya menghasilkan step-step yang nunjukin `i` naik 0→1→2→3→4→5, dan `hasil` (variabel LOKAL di dalam function) berubah `[]` → `[8]` → `[8, 22]` → `[8, 22, 10]` — persis di titik `hasil.push(arr[i])` dipanggil, sementara `i` sendiri masih di angka yang sama saat itu. Ini yang dimaksud "interaksi" antara loop dan variabel: keliatan jelas bahwa perubahan `hasil` terjadi PAS iterasi ke berapa, bukan cuma hasil akhirnya doang.

**Catatan:** untuk MVP, tulis kode contoh pakai `var` (bukan `let`/`const`) di dalam for-loop kalau ada masalah scope — JS-Interpreter kadang lebih stabil dengan `var` untuk kasus sederhana. Perlu dicek ulang saat implementasi kalau `let` ternyata juga jalan baik.

## 11. Rencana Lanjutan (Fase 2 — Bukan Sekarang)

- Database (Supabase/Firebase — belum diputuskan) untuk riwayat sesi
- API AI (Anthropic Claude API lewat serverless function, JANGAN expose API key di client) untuk narasi bahasa manusia per step — prinsip: AI cuma MENJELASKAN snapshot yang sudah direkam `collectSteps()`, tidak pernah diminta menjalankan/menebak kode sendiri
- Dukungan visualisasi variabel di dalam scope function (bukan cuma top-level)
- Live sync simultan (WebSocket/Firebase Realtime)
- Autentikasi sederhana