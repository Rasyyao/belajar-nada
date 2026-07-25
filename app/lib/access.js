/**
 * Baca baris kode yang lagi aktif, lalu terjemahkan jadi "apa yang lagi disentuh".
 *
 * Tujuannya buat ngajar: pas kodenya nulis `arr[i]`, siswa harus lihat bahwa
 * `i` itu NUNJUK ke kotak nomor berapa di `arr`, dan isi kotak itu apa.
 *
 * Ini murni lapisan tampilan — sumber kebenarannya tetap snapshot variabel dari
 * interpreter. Di sini cuma dicocokkan: teks baris + nilai variabel di titik itu.
 * Kalau ada bentuk yang gak dikenali, dia diam (gak nebak-nebak).
 */

const INDEX_ACCESS = /([A-Za-z_$][\w$]*)\s*\[\s*([^[\]]+?)\s*\]/g;
const METHOD_CALL =
  /([A-Za-z_$][\w$]*)\s*\.\s*(push|pop|shift|unshift|splice|sort|reverse)\s*\(/g;
const LENGTH_READ = /([A-Za-z_$][\w$]*)\s*\.\s*length\b/g;

/** Method yang nambah isi array — dipakai buat nampilin slot tujuan. */
const ADDING_METHODS = new Set(["push", "unshift"]);

/**
 * Method yang ngeluarin isi array, plus kotak mana yang bakal keluar.
 * Dipakai biar "berkurang" kelihatan sejelas "nambah": pas baris pop() lagi
 * aktif, isinya masih utuh di snapshot ini — yang bakal hilang baru ditandain,
 * hilangnya kejadian di langkah berikutnya.
 */
const REMOVING_METHODS = {
  pop: (array) => array.length - 1,
  shift: () => 0,
};

const METHOD_VERB = {
  push: "ditambah di belakang",
  unshift: "ditambah di depan",
  pop: "diambil dari belakang",
  shift: "diambil dari depan",
  splice: "dipotong/disisipkan",
  sort: "diurutkan",
  reverse: "dibalik urutannya",
};

function resolveOperand(token, vars) {
  if (/^\d+$/.test(token)) return Number(token);
  const value = vars[token];
  return typeof value === "number" ? value : null;
}

/**
 * Hitung nilai ekspresi indeks. Sengaja cuma dukung bentuk yang beneran muncul
 * di materi pemula: angka (`arr[0]`), variabel (`arr[i]`), dan penjumlahan/
 * pengurangan sederhana (`arr[i + 1]`). Selain itu dianggap gak dikenali.
 */
function evaluateIndex(expression, vars) {
  const expr = expression.trim();
  if (!expr) return null;

  if (/^\d+$/.test(expr)) {
    return { value: Number(expr), detail: null };
  }

  if (/^[A-Za-z_$][\w$]*$/.test(expr)) {
    const value = vars[expr];
    if (typeof value !== "number") return null;
    return { value, detail: `${expr} = ${value}` };
  }

  const math = expr.match(
    /^([A-Za-z_$][\w$]*|\d+)\s*([+-])\s*([A-Za-z_$][\w$]*|\d+)$/,
  );
  if (math) {
    const left = resolveOperand(math[1], vars);
    const right = resolveOperand(math[3], vars);
    if (left === null || right === null) return null;
    const value = math[2] === "+" ? left + right : left - right;
    return { value, detail: `${expr} = ${value}` };
  }

  return null;
}

/**
 * @returns {{
 *   reads: Array<{ name, indexExpr, index, value, inRange, source, detail }>,
 *   calls: Array<{ name, method, verb, adds, nextIndex }>,
 *   lengths: Array<{ name, value }>,
 * }}
 */
export function readAccess(line, vars) {
  const empty = { reads: [], calls: [], lengths: [] };
  if (!line || !vars) return empty;

  const reads = [];
  const seenReads = new Set();
  for (const match of line.matchAll(INDEX_ACCESS)) {
    const [source, name, indexExpr] = match;
    const target = vars[name];
    if (!Array.isArray(target)) continue;

    const index = evaluateIndex(indexExpr, vars);
    if (!index || !Number.isInteger(index.value) || index.value < 0) continue;

    const key = `${name}[${index.value}]`;
    if (seenReads.has(key)) continue;
    seenReads.add(key);

    const inRange = index.value < target.length;
    reads.push({
      name,
      indexExpr: indexExpr.trim(),
      index: index.value,
      value: inRange ? target[index.value] : undefined,
      inRange,
      source,
      detail: index.detail,
    });
  }

  const calls = [];
  for (const match of line.matchAll(METHOD_CALL)) {
    const [, name, method] = match;
    const target = vars[name];
    if (!Array.isArray(target)) continue;
    const findLeaving = REMOVING_METHODS[method];
    // Array kosong gak punya kotak yang bisa keluar — pop()-nya sah, cuma gak
    // ngasilin apa-apa, jadi jangan nunjuk kotak yang gak ada.
    const leavingIndex =
      findLeaving && target.length > 0 ? findLeaving(target) : null;
    calls.push({
      name,
      method,
      verb: METHOD_VERB[method] ?? method,
      adds: ADDING_METHODS.has(method),
      nextIndex: method === "push" ? target.length : 0,
      leavingIndex,
      leavingValue: leavingIndex === null ? undefined : target[leavingIndex],
    });
  }

  const lengths = [];
  for (const match of line.matchAll(LENGTH_READ)) {
    const [, name] = match;
    const target = vars[name];
    if (!Array.isArray(target)) continue;
    if (lengths.some((item) => item.name === name)) continue;
    lengths.push({ name, value: target.length });
  }

  return { reads, calls, lengths };
}

/** Kelompokkan pembacaan per nama array, biar kartu variabel gampang nyarinya. */
export function groupReadsByName(reads) {
  const map = new Map();
  for (const read of reads) {
    if (!map.has(read.name)) map.set(read.name, []);
    map.get(read.name).push(read);
  }
  return map;
}

/** Variabel apa saja yang lagi dipakai sebagai indeks — buat nandai kartunya. */
export function indexUsage(reads) {
  const map = new Map();
  for (const read of reads) {
    if (!/^[A-Za-z_$][\w$]*$/.test(read.indexExpr)) continue;
    if (!map.has(read.indexExpr)) map.set(read.indexExpr, []);
    map.get(read.indexExpr).push(read);
  }
  return map;
}
