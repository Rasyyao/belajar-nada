import miniProjects from "../data/mini-projects.json";
import partProjects from "../data/part-projects.json";

/**
 * Satu-satunya pintu ke materi soal.
 *
 * Sekarang sumbernya masih file JSON statis (`app/data/*.json`).
 * Semua halaman WAJIB lewat function di file ini — jadi pas nanti pindah ke
 * database, yang diganti cuma isi function di sini, bukan halaman-halamannya.
 * Sengaja sudah `async` dari sekarang biar call site-nya gak perlu diubah.
 *
 * Ada DUA skema soal yang hidup berdampingan:
 * - mini project (`mini-projects.json`): satu soal = satu halaman, berdiri sendiri.
 * - soal berpart (`part-projects.json`): satu soal = beberapa part yang dikerjain
 *   berurutan di HALAMAN YANG SAMA lewat tab.
 * Keduanya dipisah karena bentuk datanya beda; yang nyatuin cuma id-nya harus
 * unik lintas dua file, karena route detailnya sama (`/mini-project/[id]`).
 */

export async function getMiniProjects() {
  return miniProjects;
}

export async function getMiniProject(id) {
  return miniProjects.find((project) => project.id === id) ?? null;
}

export async function getPartProjects() {
  return partProjects;
}

export async function getPartProject(id) {
  return partProjects.find((project) => project.id === id) ?? null;
}

/**
 * Urutan semua soal buat navigasi "lanjut ke soal berikutnya".
 * Mini project duluan (ceritanya nyambung), baru soal berpart.
 */
export async function getProjectSequence() {
  return [
    ...miniProjects.map((project) => ({ id: project.id, judul: project.judul })),
    ...partProjects.map((project) => ({ id: project.id, judul: project.judul })),
  ];
}

export async function getNextProject(id) {
  const sequence = await getProjectSequence();
  const index = sequence.findIndex((item) => item.id === id);
  if (index < 0) return null;
  return sequence[index + 1] ?? null;
}

/** Label musim buat badge di kartu — dipakai halaman daftar & detail. */
export const SEASONS = {
  gugur: { label: "Gugur", emoji: "🍂" },
  dingin: { label: "Dingin", emoji: "❄️" },
};
