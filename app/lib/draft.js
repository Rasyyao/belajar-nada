/** Baca draft browser tanpa pernah mengganggu render server. */
export function readDraft(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function writeDraft(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage bisa diblokir mode privat; sesi aktif tetap berjalan normal.
    }
}