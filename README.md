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

## Mini Project (`/mini-project`)

Selain playground bebas, ada halaman mini project: **program utuh** yang minta
jawaban dulu step demi step, baru nentuin hasilnya. Dua project pertama nyambung
ceritanya — 🍂 musim gugur nimbun kacang (`push`), ❄️ musim dingin bongkar
simpanan (`pop`).

Karena sandbox interpreter gak bisa nyentuh `prompt` atau `readline-sync`,
program interaktif minta jawaban lewat **`ambilInput()`** yang disuntikkan ke
sandbox. Jawabannya disiapkan dulu di panel **Input** (bisa diubah/ditambah pas
ngajar), lalu dikonsumsi berurutan tiap ketemu `ambilInput()`. Pas nge-scrub
langkah, baris input yang sudah kepakai ditandai — jadi kelihatan program lagi
ada di pertanyaan yang mana. Kalau jawabannya habis di tengah jalan, muncul
pesan error yang jelas dan langkah sebelum error tetap bisa ditelusuri.

Panel **Input & target** nunjukin dua hal berurutan biar kebacanya jadi satu
kalimat: jawaban yang bakal disuapin di atas, terus **hasil akhirnya harus jadi
apa** persis di bawahnya — kelihatan dari awal, gak nunggu dijalankan dulu.
Setelah dijalankan, panel **Cek hasil akhir** ngebandingin hasil beneran vs
target itu (alat bantu ngajar, bukan penilai otomatis).

Tombol **Pseudocode** di header buka popup buat nulis rencana pakai bahasa
sendiri sebelum ngoding — ada tombol "Pakai kerangka" buat nyalin kerangka
MULAI/ULANGI/SELESAI. Catatannya kesimpen di `localStorage` per project, jadi
gak ilang kalau halamannya kebuka ulang.

Tombol **💡 Hint** (di sebelah tombol Jalankan) buka hint berjenjang: sekali
klik = satu dorongan, bukan langsung semua. Hint terakhir isinya process flow
lengkap, jadi dia ditandain beda warna + peringatan. Progress-nya kesimpen
selama masih di project yang sama, dan ke-reset kalau pindah project.

Panel Cerita juga nampilin **diagram jalur data** — parameter sebagai pintu
masuk (nilai dari luar → ke dalam function) dan return sebagai pintu keluar
(hasil di dalam → ditangkep variabel di luar), pakai nama variabel project itu
sendiri. Ini konsep yang paling sering bikin bingung, jadi digambar eksplisit
bukan diasumsikan udah paham.

Soal `ambilInput()`: dipakai **cuma kalau nilainya beneran gak bisa ditentuin di
awal**. Mini project 1 gak pakai sama sekali (data kacangnya langsung ditulis
sebagai array di kode); mini project 2 pakai buat nanya "musim dingin berapa
hari?" — itu genuinely beda-beda tiap dijalankan.

## Materi mini project (JSON → database nanti)

Materi masih disimpan di `app/data/mini-projects.json`. Semua halaman
ngambilnya lewat `app/lib/projects.js` (`getMiniProjects()` /
`getMiniProject(id)`) yang sudah `async` dari sekarang — jadi pas pindah ke
database, yang diganti cuma isi dua function itu, halamannya gak perlu disentuh.

## Struktur

```
app/
  layout.jsx              root layout + font (Fraunces, Inter, JetBrains Mono)
  page.jsx                halaman playground (client component)
  globals.css             Tailwind v4 + design token lewat @theme
  data/
    mini-projects.json    materi mini project (sumber sementara sebelum database)
  mini-project/
    page.jsx              daftar mini project (server component)
    [id]/page.jsx         detail mini project (server component)
  components/
    CodeEditor.jsx        Monaco + highlight baris aktif
    VarBoard.jsx          kartu variabel, kotak array, penunjuk indeks
    AccessStrip.jsx       rantai substitusi `arr[i] → arr[3] → 22`
    StepView.jsx          isi panel visualisasi untuk satu langkah (dipakai 2 halaman)
    Transport.jsx         kontrol pemutaran langkah (dipakai 2 halaman)
    Timeline.jsx          jejak eksekusi + scrubber
    Panel.jsx             kartu panel standar
    ErrorBox.jsx          tampilan error
    ProjectRunner.jsx     UI interaktif halaman mini project
    InputFeed.jsx         daftar jawaban buat ambilInput()
    ResultCheck.jsx       bandingin hasil akhir vs data tervalidasi
  lib/
    interpreter.js        eksekusi step-by-step + rekam variabel + ambilInput()
    access.js             baca baris aktif jadi "apa yang lagi disentuh"
    projects.js           akses materi mini project (seam ke database)
    useStepPlayer.js      state pemutaran langkah + pintasan keyboard
    share.js              encode/decode state ke URL hash
    defaults.js           isi awal soal/pseudocode/kode playground
```

Catatan: project ini pakai **Tailwind v4**, jadi design token didefinisikan lewat `@theme` di `app/globals.css`, bukan `tailwind.config.js` gaya v3. Utility class-nya tetap sama (`bg-accent`, `text-text-2`, `rounded-app`, dst).

## Deploy

Target hosting: Vercel. Belum ada backend/database/API key, jadi deploy-nya cukup:

```bash
npx vercel --prod
```
