/**
 * Wajah tiap soal: emoji + label singkat, dikunci ke `visualTheme`.
 *
 * Dipisah dari `app/lib/projects.js` karena file ini diimpor komponen
 * `"use client"` juga (badge di header runner, ikon di panel visualisasi),
 * sementara `projects.js` sekarang narik Supabase — server-only.
 *
 * Ditaruh di satu tempat supaya halaman daftar, halaman detail, dan dropdown di
 * form admin gak bisa beda sendiri-sendiri pas ada tema baru masuk.
 */

/** Label musim buat badge mini project. */
export const SEASONS = {
  gugur: { label: "Gugur", emoji: "🍂" },
  dingin: { label: "Dingin", emoji: "❄️" },
};

export const VISUAL_THEMES = {
  "pohon-simpanan": { emoji: "🐿️", label: "Pohon simpanan", tema: "push / pop" },
  "taman-bermain": { emoji: "🛝", label: "Taman bermain", tema: "push + pop" },
  "loket-tiket": { emoji: "🎟️", label: "Loket tiket", tema: "if-else + akumulasi" },
};

const THEME_FALLBACK = { emoji: "🧩", label: "Lainnya", tema: "array" };

export function partTheme(visualTheme) {
  return VISUAL_THEMES[visualTheme] ?? THEME_FALLBACK;
}

/** Cuma emoji-nya — dipakai di header Panel Visualisasi. */
export function themeIcon(visualTheme) {
  return partTheme(visualTheme).emoji;
}

/** Isi dropdown "visual theme" di form admin. */
export const THEME_OPTIONS = Object.entries(VISUAL_THEMES).map(
  ([value, theme]) => ({ value, label: `${theme.emoji} ${theme.label}` }),
);
