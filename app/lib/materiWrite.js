/**
 * Bentuk baris tabel `materi` dari payload form admin, sekalian validasinya.
 * Dipisah dari route handler karena dipakai dua kali (bikin baru & edit) — dan
 * karena file `route.js` sebaiknya cuma export handler HTTP.
 */
export function normalizeMateri(payload) {
  const judul = payload?.judul?.trim();
  if (!judul) return { error: "Judul materi masih kosong." };

  const urutan = Number(payload?.urutan);

  return {
    row: {
      judul,
      kategori: payload?.kategori?.trim() || null,
      konten: payload?.konten?.trim() || null,
      file_url: payload?.fileUrl?.trim() || null,
      urutan: Number.isFinite(urutan) ? Math.trunc(urutan) : 0,
    },
  };
}
