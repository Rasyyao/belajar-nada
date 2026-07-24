"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AccessStrip from "./components/AccessStrip";
import CodeEditor from "./components/CodeEditor";
import Timeline from "./components/Timeline";
import VarBoard from "./components/VarBoard";
import { readAccess } from "./lib/access";
import { es5ify, runCode } from "./lib/interpreter";
import { decodeState, encodeState } from "./lib/share";
import {
  DEFAULT_CODE,
  DEFAULT_PSEUDOCODE,
  DEFAULT_SOAL,
} from "./lib/defaults";

// Konstanta modul supaya referensinya stabil antar render (bikin useMemo di
// bawah gak ikut kehitung ulang tiap render pas belum ada hasil eksekusi).
const NO_STEPS = [];
const NO_LOGS = [];

const SPEEDS = [
  { label: "0,5×", ms: 850 },
  { label: "1×", ms: 420 },
  { label: "2×", ms: 170 },
];

function Panel({ title, hint, action, children, bodyClass = "", className = "" }) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-app border border-border bg-surface ${className}`}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h2 className="font-heading text-base leading-none text-text-1">
            {title}
          </h2>
          {hint ? (
            <span className="truncate text-[11px] text-text-2">{hint}</span>
          ) : null}
        </div>
        {action}
      </header>
      <div className={`thin-scroll min-h-0 flex-1 overflow-auto ${bodyClass}`}>
        {children}
      </div>
    </section>
  );
}

function TransportButton({ children, label, ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="flex h-10 items-center gap-2 rounded-[10px] border border-border bg-surface px-3 text-sm font-medium text-text-1 transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-35"
      {...props}
    >
      {children}
    </button>
  );
}

export default function Playground() {
  const [soal, setSoal] = useState(DEFAULT_SOAL);
  const [pseudocode, setPseudocode] = useState(DEFAULT_PSEUDOCODE);
  const [code, setCode] = useState(DEFAULT_CODE);

  const [result, setResult] = useState(null);
  const [current, setCurrent] = useState(0);
  const [running, setRunning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(SPEEDS[1].ms);
  const [shareLabel, setShareLabel] = useState("Salin link");

  // Kalau URL punya hash hasil share, isi ulang ketiga panel dari situ.
  // `hashchange` ikut didengarkan karena buka link share di tab yang SUDAH kebuka
  // cuma ganti hash — halamannya gak reload, jadi tanpa ini panelnya gak keisi.
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      try {
        const state = decodeState(hash);
        if (typeof state.soal === "string") setSoal(state.soal);
        if (typeof state.pseudocode === "string") setPseudocode(state.pseudocode);
        if (typeof state.code === "string") setCode(state.code);
      } catch (e) {
        // Hash rusak/kepotong pas dikirim — biarkan playground jalan dengan isi default.
        console.warn("Hash share tidak bisa dibaca:", e);
      }
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const steps = result ? result.steps : NO_STEPS;
  const logs = result ? result.logs : NO_LOGS;
  const error = result ? result.error : null;

  const step = steps[current] || null;
  const prevStep = current > 0 ? steps[current - 1] : null;
  const atEnd = current >= steps.length - 1;
  // Sampai di ujung = otomatis berhenti, tanpa perlu nulis balik state dari effect.
  const isPlaying = playing && !atEnd;

  // Urutan kartu variabel dikunci berdasarkan urutan kemunculan pertama,
  // biar kartunya gak loncat-loncat posisi tiap kali langkahnya diganti.
  const varOrder = useMemo(() => {
    const order = [];
    for (const s of steps) {
      for (const name of Object.keys(s.vars)) {
        if (!order.includes(name)) order.push(name);
      }
    }
    return order;
  }, [steps]);

  const codeLines = useMemo(() => code.split("\n"), [code]);
  const activeLine = step ? step.line : null;
  const activeSource = activeLine ? (codeLines[activeLine - 1] ?? "") : "";

  // Terjemahan baris aktif jadi "apa yang lagi disentuh" — dasar buat penunjuk
  // indeks di kartu array dan rantai substitusi `arr[i] → arr[3] → 22`.
  const access = useMemo(
    () => readAccess(activeSource, step ? step.vars : null),
    [activeSource, step],
  );

  const visibleLogs = useMemo(() => {
    if (!step) return NO_LOGS;
    return atEnd ? logs : logs.slice(0, step.logCount);
  }, [step, atEnd, logs]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setPlaying(false);
    try {
      const next = await runCode(code);
      setResult(next);
      setCurrent(0);
    } finally {
      setRunning(false);
    }
  }, [code]);

  const handleShare = useCallback(() => {
    const encoded = encodeState({ soal, pseudocode, code });
    window.location.hash = encoded;
    const url = window.location.href;

    const done = (label) => {
      setShareLabel(label);
      setTimeout(() => setShareLabel("Salin link"), 2000);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(
        () => done("Link tersalin"),
        () => done("Link ada di address bar"),
      );
    } else {
      done("Link ada di address bar");
    }
  }, [soal, pseudocode, code]);

  const togglePlay = useCallback(() => {
    if (steps.length === 0) return;
    if (isPlaying) {
      setPlaying(false);
      return;
    }
    if (atEnd) setCurrent(0);
    setPlaying(true);
  }, [isPlaying, atEnd, steps.length]);

  // Jalan otomatis: satu langkah per tick. Begitu nyampe langkah terakhir,
  // effect ini berhenti jadwalin tick berikutnya dengan sendirinya.
  useEffect(() => {
    if (!isPlaying) return;
    const id = setTimeout(
      () => setCurrent((c) => Math.min(c + 1, steps.length - 1)),
      speed,
    );
    return () => clearTimeout(id);
  }, [isPlaying, current, speed, steps.length]);

  // Pintasan keyboard buat ngajar: panah maju-mundur, spasi main/jeda,
  // Cmd/Ctrl+Enter jalanin ulang. Diabaikan pas lagi ngetik.
  useEffect(() => {
    const onKeyDown = (event) => {
      const el = document.activeElement;
      const typing =
        el &&
        (el.tagName === "TEXTAREA" ||
          el.tagName === "INPUT" ||
          el.closest?.(".monaco-editor"));

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        handleRun();
        return;
      }

      if (typing || steps.length === 0) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPlaying(false);
        setCurrent((c) => Math.min(c + 1, steps.length - 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPlaying(false);
        setCurrent((c) => Math.max(c - 1, 0));
      } else if (event.key === " " && el?.tagName !== "BUTTON") {
        event.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [steps.length, togglePlay, handleRun]);

  const seek = useCallback((index) => {
    setPlaying(false);
    setCurrent(index);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col xl:h-dvh xl:overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <h1 className="font-heading text-xl leading-none text-text-1">
          Playground Belajar
        </h1>
        <p className="hidden text-[13px] text-text-2 sm:block">
          Soal → pseudocode → kode → jalannya program, satu langkah demi satu langkah.
        </p>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full bg-accent-soft px-3 py-1.5 text-[11px] font-medium text-accent lg:inline">
            Mode ES5 · pakai <code className="font-mono">var</code>, bukan{" "}
            <code className="font-mono">let</code>
          </span>
          <button
            type="button"
            onClick={handleShare}
            className="h-9 rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 transition-colors hover:bg-bg"
          >
            {shareLabel}
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 px-4 pb-3 xl:grid-cols-[19rem_minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Kolom kiri: bahan yang dibaca, bukan yang dijalankan. */}
        <div className="flex min-h-0 flex-col gap-3">
          <Panel title="Soal" hint="apa yang mau dikerjain" className="flex-1">
            <textarea
              value={soal}
              onChange={(e) => setSoal(e.target.value)}
              spellCheck={false}
              className="h-full min-h-40 w-full xl:min-h-0 resize-none bg-transparent p-4 font-body text-[13px] leading-relaxed text-text-1 outline-none"
              placeholder="Tulis soalnya di sini…"
            />
          </Panel>

          <Panel
            title="Pseudocode"
            hint="rencana sebelum ngoding"
            className="flex-1"
          >
            <textarea
              value={pseudocode}
              onChange={(e) => setPseudocode(e.target.value)}
              spellCheck={false}
              className="no-liga h-full min-h-40 w-full xl:min-h-0 resize-none bg-transparent p-4 font-mono text-[12.5px] leading-relaxed text-text-1 outline-none"
              placeholder="MULAI …"
            />
          </Panel>
        </div>

        {/* Kolom tengah: kode. */}
        <Panel
          title="Kode"
          hint="JavaScript"
          action={
            <button
              type="button"
              onClick={handleRun}
              disabled={running}
              className="flex h-9 shrink-0 items-center gap-2 rounded-[10px] bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
            >
              {running ? "Menjalankan…" : "Jalankan & Visualisasikan"}
              <kbd className="hidden rounded bg-white/20 px-1.5 py-0.5 font-mono text-[10px] font-normal 2xl:inline">
                ⌘↵
              </kbd>
            </button>
          }
        >
          <div className="h-full min-h-72 xl:min-h-0">
            <CodeEditor
              value={code}
              onChange={setCode}
              activeLine={activeLine}
              onRun={handleRun}
            />
          </div>
        </Panel>

        {/* Kolom kanan: apa yang terjadi di langkah ini. */}
        <Panel
          title="Visualisasi"
          hint={
            steps.length > 0
              ? `langkah ${current + 1} dari ${steps.length}`
              : "belum dijalankan"
          }
          bodyClass="p-4"
        >
          <div
            className={`flex flex-col gap-4 ${
              steps.length === 0 ? "h-full justify-center" : ""
            }`}
          >
            {error && (
              <div className="rounded-r-app border-l-4 border-error bg-error-soft px-4 py-3 text-sm">
                <p className="font-mono font-semibold text-error">
                  {error.title}
                  {error.line ? ` · sekitar baris ${error.line}` : ""}
                </p>
                <p className="mt-1 leading-relaxed text-text-1">
                  {error.message}
                </p>
                {error.raw && (
                  <p className="mt-1 font-mono text-xs text-text-2">
                    {error.raw}
                  </p>
                )}
                {error.canFixLetConst && (
                  <button
                    type="button"
                    onClick={() => setCode((c) => es5ify(c))}
                    className="mt-2.5 rounded-[10px] border border-error bg-surface px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error-soft"
                  >
                    Ubah let/const jadi var
                  </button>
                )}
                {steps.length > 0 && (
                  <p className="mt-2 text-xs text-text-2">
                    {steps.length} langkah sebelum error tetap bisa ditelusuri.
                  </p>
                )}
              </div>
            )}

            {steps.length === 0 ? (
              <div className="rounded-app border border-dashed border-border px-6 py-12 text-center">
                <p className="font-heading text-lg text-text-1">
                  Belum ada yang dijalankan
                </p>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-2">
                  Klik <strong className="text-text-1">Jalankan &amp; Visualisasikan</strong>{" "}
                  di panel Kode. Setiap langkah bakal muncul di sini: baris yang
                  lagi jalan, isi tiap variabel, dan output console.
                </p>
              </div>
            ) : (
              <>
                <div className="no-liga flex items-stretch overflow-hidden rounded-app bg-code-bg font-mono text-sm">
                  <span className="flex shrink-0 items-center bg-code-accent/15 px-3 text-[11px] tracking-wide text-code-accent uppercase">
                    baris {activeLine}
                  </span>
                  <code className="thin-scroll flex-1 overflow-x-auto whitespace-pre px-3 py-3 text-code-text">
                    {activeSource}
                  </code>
                </div>

                <AccessStrip access={access} />

                <VarBoard
                  vars={step.vars}
                  prevVars={prevStep ? prevStep.vars : null}
                  order={varOrder}
                  access={access}
                />

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-2">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-accent" />
                    lagi dibaca di baris ini
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-worked" />
                    barusan berubah
                  </span>
                </div>

                {visibleLogs.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-text-2 uppercase">
                      Output console
                    </h3>
                    <pre className="no-liga thin-scroll overflow-x-auto rounded-app bg-code-bg px-4 py-3 font-mono text-sm text-code-text">
                      {visibleLogs.join("\n")}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </Panel>
      </div>

      {/* Kontrol pemutaran: dipatok di bawah biar selalu kejangkau pas ngajar. */}
      <footer className="sticky bottom-0 shrink-0 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur">
        {steps.length === 0 ? (
          <p className="text-center text-[13px] text-text-2">
            Kontrol langkah muncul di sini setelah kodenya dijalankan.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            <div className="flex items-center gap-1.5">
              <TransportButton
                label="Ke langkah pertama"
                onClick={() => seek(0)}
                disabled={current === 0}
              >
                ⏮
              </TransportButton>
              <TransportButton
                label="Mundur satu langkah"
                onClick={() => seek(Math.max(current - 1, 0))}
                disabled={current === 0}
              >
                ←
              </TransportButton>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Jeda" : atEnd ? "Putar ulang" : "Putar"}
                className="flex h-10 min-w-24 items-center justify-center gap-2 rounded-[10px] bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
              >
                {isPlaying ? "⏸ Jeda" : atEnd ? "↻ Ulangi" : "▶ Putar"}
              </button>
              <TransportButton
                label="Maju satu langkah"
                onClick={() => seek(Math.min(current + 1, steps.length - 1))}
                disabled={atEnd}
              >
                →
              </TransportButton>
              <TransportButton
                label="Ke langkah terakhir"
                onClick={() => seek(steps.length - 1)}
                disabled={atEnd}
              >
                ⏭
              </TransportButton>
            </div>

            <div className="flex h-10 items-center rounded-[10px] border border-border bg-surface p-1">
              {SPEEDS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setSpeed(option.ms)}
                  className={`h-8 rounded-[7px] px-2.5 font-mono text-xs transition-colors ${
                    speed === option.ms
                      ? "bg-accent-soft font-semibold text-accent"
                      : "text-text-2 hover:text-text-1"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Timeline
              steps={steps}
              current={current}
              totalLines={codeLines.length}
              onSeek={seek}
            />

            <div className="flex shrink-0 items-baseline gap-1.5 font-mono text-sm text-text-2 tabular-nums">
              <span className="text-lg font-semibold text-text-1">
                {current + 1}
              </span>
              <span>/ {steps.length}</span>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
