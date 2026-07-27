"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CodeEditor from "./components/CodeEditor";
import ErrorBox from "./components/ErrorBox";
import Panel from "./components/Panel";
import StepView, { buildVarOrder } from "./components/StepView";
import Transport from "./components/Transport";
import { es5ify, runCode } from "./lib/interpreter";
import { decodeState, encodeState } from "./lib/share";
import { useStepPlayer } from "./lib/useStepPlayer";
import {
  DEFAULT_CODE,
  DEFAULT_PSEUDOCODE,
  DEFAULT_SOAL,
} from "./lib/defaults";

// Konstanta modul supaya referensinya stabil antar render (bikin useMemo di
// bawah gak ikut kehitung ulang tiap render pas belum ada hasil eksekusi).
const NO_STEPS = [];
const NO_LOGS = [];

export default function Playground() {
  const [soal, setSoal] = useState(DEFAULT_SOAL);
  const [pseudocode, setPseudocode] = useState(DEFAULT_PSEUDOCODE);
  const [code, setCode] = useState(DEFAULT_CODE);

  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
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

  const player = useStepPlayer(steps);
  const varOrder = useMemo(() => buildVarOrder(steps), [steps]);
  const codeLines = useMemo(() => code.split("\n"), [code]);

  // `reset` dipisah dari objek player karena referensinya stabil — kalau
  // `player` yang dipakai sebagai dependency, handleRun bikin ulang tiap render.
  const resetPlayer = player.reset;

  const handleRun = useCallback(async () => {
    setRunning(true);
    try {
      const next = await runCode(code);
      setResult(next);
      resetPlayer();
    } finally {
      setRunning(false);
    }
  }, [code, resetPlayer]);

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

  // Cmd/Ctrl+Enter jalanin ulang dari mana saja (pintasan langkah diurus useStepPlayer).
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRun]);

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
          <Link
            href="/mini-project"
            className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 transition-colors hover:bg-bg"
          >
            Mini project
          </Link>
          <Link
            href="/materi"
            className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 transition-colors hover:bg-bg"
          >
            Materi
          </Link>
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
              className="h-full min-h-40 w-full resize-none bg-transparent p-4 font-body text-[13px] leading-relaxed text-text-1 outline-none xl:min-h-0"
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
              className="no-liga h-full min-h-40 w-full resize-none bg-transparent p-4 font-mono text-[12.5px] leading-relaxed text-text-1 outline-none xl:min-h-0"
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
              activeLine={player.step ? player.step.line : null}
              onRun={handleRun}
            />
          </div>
        </Panel>

        {/* Kolom kanan: apa yang terjadi di langkah ini. */}
        <Panel
          title="Visualisasi"
          hint={
            steps.length > 0
              ? `langkah ${player.current + 1} dari ${steps.length}`
              : "belum dijalankan"
          }
          bodyClass="p-4"
        >
          <div
            className={`flex flex-col gap-4 ${
              steps.length === 0 ? "h-full justify-center" : ""
            }`}
          >
            <ErrorBox
              error={error}
              stepCount={steps.length}
              onFixLetConst={() => setCode((c) => es5ify(c))}
            />

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
              <StepView
                step={player.step}
                prevStep={player.prevStep}
                codeLines={codeLines}
                varOrder={varOrder}
                logs={logs}
                showAllLogs={player.atEnd}
                stepKey={player.current}
              />
            )}
          </div>
        </Panel>
      </div>

      <Transport
        player={player}
        steps={steps}
        totalLines={codeLines.length}
        idleHint="Kontrol langkah muncul di sini setelah kodenya dijalankan."
      />
    </div>
  );
}
