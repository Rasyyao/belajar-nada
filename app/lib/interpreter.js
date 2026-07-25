/**
 * Eksekusi step-by-step pakai JS-Interpreter (Neil Fraser).
 * Inti `collectSteps` di bawah dipakai persis seperti versi yang sudah
 * divalidasi di BRIEF Bagian 5.2 — yang ditambahkan cuma hal di sekelilingnya
 * (binding `console.log`, batas aman, dan penerjemahan pesan error).
 */

// `console` dan `ambilInput` ikut di-skip karena keduanya kita sendiri yang
// suntikkan ke global scope — bukan variabel bikinan siswa, jadi gak perlu
// nongol sebagai kartu variabel.
const SKIP_KEYS = new Set([
  "window",
  "self",
  "this",
  "arguments",
  "console",
  "ambilInput",
]);

/**
 * Batas aman. Angka di brief (2000) ternyata kekecil: loop 200 iterasi saja
 * sudah ~10.600 langkah interpreter, jadi contoh belajar yang wajar bisa
 * kena stop padahal gak salah. 100.000 langkah masih selesai di bawah ~0,2 detik,
 * tapi infinite loop tetap kepotong seketika.
 */
const MAX_STEPS = 100000;

/** Batas jumlah snapshot yang disimpan, biar UI-nya tetap enteng buat di-scrub. */
const MAX_SNAPSHOTS = 4000;

function safeConvert(interpreter, raw) {
  if (raw === null || raw === undefined) return raw;
  if (typeof raw !== "object") return raw; // number, string, boolean primitif
  if (raw.class === "Array") return interpreter.pseudoToNative(raw);
  if (raw.class === "Function") return undefined; // skip, gak perlu divisualisasikan
  if (raw.class === "Object") {
    try {
      return interpreter.pseudoToNative(raw);
    } catch (e) {
      return undefined;
    }
  }
  return undefined; // skip tipe lain yang gak dikenal (termasuk window/global yang circular)
}

/** Format satu nilai jadi teks buat panel Output (mirip console beneran). */
function formatLogValue(value) {
  if (typeof value === "string") return value;
  if (value === undefined) return "undefined";
  try {
    return JSON.stringify(value);
  } catch (e) {
    return String(value);
  }
}

/**
 * JS-Interpreter jalan di sandbox kosong — `console` gak ada sama sekali.
 * Tanpa ini, kode siswa yang isinya `console.log(...)` (alias: hampir semua
 * kode pemula) langsung mati dengan "console is not defined".
 *
 * `feed` dipakai buat program interaktif: sandbox gak bisa nyentuh `prompt`
 * atau `readline-sync`, jadi `ambilInput()` disuntikkan di sini dan jawabannya
 * diambil berurutan dari daftar input yang sudah disiapkan.
 */
function makeInitFunc(logs, feed) {
  return function initFunc(interp, globalObject) {
    const consoleObj = interp.createObjectProto(interp.OBJECT_PROTO);
    interp.setProperty(globalObject, "console", consoleObj);

    const logFn = interp.createNativeFunction(function (...args) {
      const parts = args.map((arg) => formatLogValue(safeConvert(interp, arg)));
      logs.push(parts.join(" "));
    });

    interp.setProperty(consoleObj, "log", logFn);
    interp.setProperty(consoleObj, "info", logFn);
    interp.setProperty(consoleObj, "warn", logFn);
    interp.setProperty(consoleObj, "error", logFn);

    interp.setProperty(
      globalObject,
      "ambilInput",
      interp.createNativeFunction(function () {
        if (feed.index < feed.inputs.length) {
          return String(feed.inputs[feed.index++]);
        }
        const err = new Error(
          "Program masih minta input, tapi daftar input-nya sudah habis.",
        );
        err.isInputExhausted = true;
        throw err;
      }),
    );
  };
}

/** Sintaks ES6+ yang gak dimengerti interpreter (parser-nya ES5). */
function findModernSyntax(code) {
  const found = [];
  if (/(^|[^.\w])(let|const)\s/.test(code)) found.push("let / const");
  if (/=>/.test(code)) found.push("arrow function (=>)");
  if (/`/.test(code)) found.push("template literal (backtick)");
  if (/(^|[^.\w])class\s/.test(code)) found.push("class");
  return found;
}

/**
 * Ganti `let`/`const` jadi `var` — dipakai tombol perbaikan cepat di UI
 * kalau kode kena syntax error gara-gara sintaks ES6.
 */
export function es5ify(code) {
  return code.replace(/(^|[^.\w])(let|const)(\s)/g, "$1var$3");
}

export function hasLetOrConst(code) {
  return /(^|[^.\w])(let|const)\s/.test(code);
}

function toSyntaxError(err, code) {
  const modern = findModernSyntax(code);
  const line = err && err.loc ? err.loc.line : null;

  if (modern.length > 0) {
    return {
      kind: "syntax",
      line,
      title: "Sintaksnya belum didukung interpreter",
      message:
        "Interpreter step-by-step ini cuma paham JavaScript ES5, jadi " +
        modern.join(", ") +
        " belum bisa dipakai. Tulis pakai `var` dan `function` biasa ya.",
      raw: err.message,
      canFixLetConst: hasLetOrConst(code),
    };
  }

  return {
    kind: "syntax",
    line,
    title: "Ada yang salah di penulisan kode",
    message:
      "Kode belum bisa dibaca — biasanya ada kurung/kurawal yang belum ditutup atau titik koma yang kelewat.",
    raw: err.message,
    canFixLetConst: false,
  };
}

/**
 * Jalankan kode dan rekam snapshot per baris.
 *
 * @param {string} code
 * @param {{ inputs?: string[] }} [options] Daftar jawaban buat `ambilInput()`,
 *   dipakai halaman mini project yang programnya minta input berurutan.
 *
 * Selalu mengembalikan `{ steps, logs, error, inputsUsed }` — kalau error
 * terjadi di tengah jalan, step yang sudah kekumpul tetap dikembalikan supaya
 * siswa bisa scrub sampai titik error-nya, bukan cuma dapat pesan merah kosong.
 */
export async function runCode(code, options = {}) {
  const { default: Interpreter } = await import("js-interpreter");

  const logs = [];
  const feed = { inputs: options.inputs ?? [], index: 0 };
  let interpreter;

  try {
    interpreter = new Interpreter(code, makeInitFunc(logs, feed));
  } catch (err) {
    return {
      steps: [],
      logs,
      error: toSyntaxError(err, code),
      inputsUsed: 0,
    };
  }

  const totalLines = code.split("\n").length;
  const steps = [];
  let lastLine = null;
  let count = 0;
  let error = null;

  try {
    while (interpreter.step()) {
      count++;
      if (count > MAX_STEPS) {
        error = {
          kind: "limit",
          line: lastLine,
          title: "Kode dihentikan otomatis",
          message:
            "Langkahnya kebanyakan (lebih dari " +
            MAX_STEPS.toLocaleString("id-ID") +
            "). Kemungkinan ada loop yang gak pernah berhenti — cek lagi kondisi berhentinya.",
        };
        break;
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
            } catch (e) {
              /* variabel belum ke-declare di titik ini, skip */
            }
          }
        }
      }

      steps.push({
        line,
        vars,
        logCount: logs.length,
        inputCount: feed.index,
      });

      if (steps.length >= MAX_SNAPSHOTS) {
        error = {
          kind: "limit",
          line,
          title: "Rekaman dipotong di " + MAX_SNAPSHOTS.toLocaleString("id-ID") + " langkah",
          message:
            "Kalau kode ini harusnya selesai cepat, kemungkinan ada loop yang gak pernah berhenti — cek lagi kondisi berhentinya. Kalau datanya yang memang banyak, coba kecilkan dulu biar visualisasinya gampang diikuti.",
        };
        break;
      }
    }
  } catch (err) {
    error = err?.isInputExhausted
      ? {
          kind: "input",
          line: lastLine,
          title: "Daftar input-nya habis",
          message:
            "Program masih manggil ambilInput(), tapi jawaban yang disiapkan sudah kepakai semua (" +
            feed.inputs.length +
            " input). Tambah input di panel sebelah, atau kecilkan angka yang nentuin banyaknya perulangan.",
        }
      : {
          kind: "runtime",
          line: lastLine,
          title: "Error pas kode dijalankan",
          message: err && err.message ? err.message : String(err),
        };
  }

  return { steps, logs, error, inputsUsed: feed.index };
}
