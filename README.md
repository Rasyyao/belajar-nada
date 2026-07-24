# Playground Belajar

Tools internal buat sesi belajar coding 1-on-1: satu halaman berisi **Soal → Pseudocode → Kode → Visualisasi step-by-step**.

Kode JavaScript-nya dijalankan BENERAN di browser lewat [JS-Interpreter](https://github.com/NeilFraser/JS-Interpreter) satu instruksi per satu instruksi, jadi isi variabel yang ditampilkan pasti sesuai eksekusi asli — bukan hasil tebakan.

## Jalanin lokal

```bash
npm install
npm run dev     # http://localhost:3000
```

## Cara pakai pas ngajar

1. Tulis soal di panel **Soal**, breakdown bareng siswa di panel **Pseudocode**.
2. Tulis kode di panel **Kode** (Monaco, sama kayak VS Code).
3. Klik **Jalankan & Visualisasikan**.
4. Telusuri langkahnya pakai tombol Awal/Sebelumnya/Berikutnya/Akhir, slider, atau tombol panah `←` `→` di keyboard.
   Baris yang lagi aktif ke-highlight di editor, dan semua variabel hidup (termasuk variabel lokal di dalam function) muncul sebagai kartu. Kartu yang isinya berubah di langkah itu ditandai ungu.
5. Klik **Share** untuk menyalin link yang isinya soal + pseudocode + kode yang sama persis. State disimpan di URL hash (`#...`), jadi tidak pernah dikirim ke server.

## Batasan yang perlu diingat

- **Interpreter-nya cuma paham JavaScript ES5.** Pakai `var` dan `function` biasa — `let`, `const`, arrow function, template literal, dan `class` belum didukung. Kalau kena error ini, ada tombol cepat "Ubah let/const jadi var".
- `console.log()` didukung dan hasilnya muncul di panel Output console.
- Eksekusi berhenti otomatis di 4.000 langkah rekaman, jadi loop tak berhenti gak bakal nge-hang halaman.

## Struktur

```
app/
  layout.jsx              root layout + font (Fraunces, Inter, JetBrains Mono)
  page.jsx                halaman playground (client component)
  globals.css             Tailwind v4 + design token lewat @theme
  components/
    CodeEditor.jsx        Monaco + highlight baris aktif
    VarBoard.jsx          kartu variabel & kotak array
  lib/
    interpreter.js        collectSteps — eksekusi step-by-step + rekam variabel
    share.js              encode/decode state ke URL hash
    defaults.js           isi awal soal/pseudocode/kode
```

Catatan: project ini pakai **Tailwind v4**, jadi design token didefinisikan lewat `@theme` di `app/globals.css`, bukan `tailwind.config.js` gaya v3. Utility class-nya tetap sama (`bg-accent`, `text-text-2`, `rounded-app`, dst).

## Deploy

Target hosting: Vercel. Belum ada backend/database/API key, jadi deploy-nya cukup:

```bash
npx vercel --prod
```
