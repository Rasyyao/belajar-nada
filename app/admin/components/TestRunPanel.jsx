"use client";

import { useCallback, useMemo, useState } from "react";
import CodeEditor from "../../components/CodeEditor";
import { runCode } from "../../lib/interpreter";

/**
 * Test Run — jalanin kode jawaban pakai engine YANG SAMA PERSIS dengan yang
 * dipakai siswa (`runCode` dari `app/lib/interpreter.js`), terus tunjukin nilai
 * akhir tiap variabel.
 *
 * Gunanya: mastiin `hasilAkhirTervalidasi` yang diisi itu beneran hasil yang
 * keluar dari kode, bukan tebakan. Sebelum ada ini, tiap bikin soal baru harus
 * divalidasi manual lewat Node.js dulu — dan Node.js itu ES2023 penuh, jadi
 * kode yang lolos di sana belum tentu lolos di interpreter ES5 ini.
 *
 * Kode jawabannya SENGAJA gak ikut disimpen ke database: itu kunci jawaban,
 * bukan bagian dari soal.
 */
export default function TestRunPanel({ starterCode, inputs, expected, onUseResult }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(starterCode);
  const [touched, setTouched] = useState(false);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [picked, setPicked] = useState(() => new Set());

  // Selama admin belum ngetik apa-apa di sini, kotaknya ngikut starter code yang
  // lagi diedit di atas — jadi gak perlu nyalin-nyalin manual.
  const effectiveCode = touched ? code : starterCode;

  const handleRun = useCallback(async () => {
    setRunning(true);
    try {
      const next = await runCode(effectiveCode, { inputs });
      setResult(next);

      const lastVars = next.steps[next.steps.length - 1]?.vars ?? {};
      // Yang dicentang duluan: variabel yang namanya udah kesebut di hasil akhir
      // sekarang. Kalau hasil akhirnya masih kosong, gak ada yang dicentang —
      // biar admin mikir dulu variabel mana yang beneran jadi jawaban.
      const wanted = Object.keys(expected ?? {});
      setPicked(new Set(wanted.filter((name) => name in lastVars)));
    } finally {
      setRunning(false);
    }
  }, [effectiveCode, inputs, expected]);

  const lastVars = useMemo(() => {
    if (!result || result.steps.length === 0) return {};
    return result.steps[result.steps.length - 1].vars;
  }, [result]);

  const names = Object.keys(lastVars);

  const toggle = (name) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const applyPicked = () => {
    const chosen = {};
    for (const name of names) {
      if (picked.has(name)) chosen[name] = lastVars[name];
    }
    onUseResult(chosen);
  };

  // Perbandingan cepat sama isi "hasil akhir" yang sekarang — ini yang bikin
  // admin langsung ngeh kalau yang diketik gak nyambung sama kodenya.
  const rows = Object.entries(expected ?? {}).map(([name, want]) => ({
    name,
    want,
    got: lastVars[name],
    match: JSON.stringify(want) === JSON.stringify(lastVars[name]),
  }));
  const allMatch = rows.length > 0 && rows.every((row) => row.match);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-[10px] border border-worked/40 bg-worked-soft px-3.5 py-2 text-[13px] font-semibold text-worked transition-colors hover:bg-worked/10"
      >
        ▶ Buka Test Run
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-app border border-worked/30 bg-worked-soft/40 p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-heading text-base text-text-1">Test Run</h4>
        <p className="flex-1 text-[12px] text-text-2">
          Kode jawaban di bawah cuma buat ngetes — gak ikut disimpen.
        </p>
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="h-9 rounded-[10px] bg-worked px-4 text-[13px] font-semibold text-white transition-colors hover:bg-worked/90 disabled:opacity-60"
        >
          {running ? "Menjalankan…" : "Jalankan"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-9 rounded-[10px] border border-border bg-surface px-3 text-[13px] font-semibold text-text-2 transition-colors hover:text-text-1"
        >
          Tutup
        </button>
      </div>

      <div className="h-64 overflow-hidden rounded-app border border-border">
        <CodeEditor
          value={effectiveCode}
          onChange={(value) => {
            setTouched(true);
            setCode(value);
          }}
          activeLine={null}
          onRun={handleRun}
        />
      </div>

      {result && (
        <div className="flex flex-col gap-3">
          {result.error && (
            <div className="rounded-app border border-error/40 bg-error-soft px-3 py-2.5">
              <p className="text-[13px] font-semibold text-error">
                {result.error.title}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-text-1">
                {result.error.message}
              </p>
            </div>
          )}

          <p className="text-[12px] text-text-2">
            {result.steps.length} langkah kerekam
            {result.logs.length > 0 && ` · ${result.logs.length} baris output`}
          </p>

          {result.logs.length > 0 && (
            <pre className="no-liga max-h-32 overflow-auto rounded-app bg-code-bg px-3 py-2 font-mono text-[12px] leading-relaxed text-code-text">
              {result.logs.join("\n")}
            </pre>
          )}

          {names.length === 0 ? (
            <p className="text-[12.5px] text-text-2">
              Gak ada variabel yang kerekam — kodenya belum sempat jalan.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold tracking-wider text-text-2 uppercase">
                Nilai akhir tiap variabel
              </p>

              <ul className="flex flex-col gap-1">
                {names.map((name) => (
                  <li key={name}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-[8px] px-2 py-1.5 transition-colors hover:bg-surface">
                      <input
                        type="checkbox"
                        checked={picked.has(name)}
                        onChange={() => toggle(name)}
                        className="mt-1"
                      />
                      <span className="no-liga font-mono text-[12.5px] break-all">
                        <span className="font-semibold text-text-1">{name}</span>
                        <span className="text-text-2"> = </span>
                        <span className="text-accent">
                          {JSON.stringify(lastVars[name])}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={applyPicked}
                disabled={picked.size === 0}
                className="self-start rounded-[10px] border border-accent bg-accent-soft px-3.5 py-2 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
              >
                Pakai {picked.size} variabel ini jadi hasil akhir
              </button>
            </div>
          )}

          {rows.length > 0 && (
            <div
              className={`rounded-app border px-3 py-2.5 ${
                allMatch ? "border-success/40 bg-success-soft" : "border-error/40 bg-error-soft"
              }`}
            >
              <p
                className={`text-[12.5px] font-semibold ${
                  allMatch ? "text-success" : "text-error"
                }`}
              >
                {allMatch
                  ? "✓ Hasil akhir yang kamu isi cocok sama kode ini."
                  : "✗ Hasil akhir yang kamu isi BEDA sama yang keluar dari kode ini."}
              </p>
              {!allMatch && (
                <ul className="mt-1.5 flex flex-col gap-0.5">
                  {rows
                    .filter((row) => !row.match)
                    .map((row) => (
                      <li
                        key={row.name}
                        className="no-liga font-mono text-[11.5px] break-all text-text-1"
                      >
                        {row.name}: diisi {JSON.stringify(row.want)} · keluarnya{" "}
                        {JSON.stringify(row.got)}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
