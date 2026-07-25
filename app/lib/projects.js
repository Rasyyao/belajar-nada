import miniProjects from "../data/mini-projects.json";

/**
 * Satu-satunya pintu ke materi mini project.
 *
 * Sekarang sumbernya masih file JSON statis (`app/data/mini-projects.json`).
 * Semua halaman WAJIB lewat function di file ini — jadi pas nanti pindah ke
 * database, yang diganti cuma isi dua function ini, bukan halaman-halamannya.
 * Sengaja sudah `async` dari sekarang biar call site-nya gak perlu diubah.
 */

export async function getMiniProjects() {
  return miniProjects;
}

export async function getMiniProject(id) {
  return miniProjects.find((project) => project.id === id) ?? null;
}

/** Label musim buat badge di kartu — dipakai halaman daftar & detail. */
export const SEASONS = {
  gugur: { label: "Gugur", emoji: "🍂" },
  dingin: { label: "Dingin", emoji: "❄️" },
};
