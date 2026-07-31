"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CodeEditor from "./CodeEditor";
import ErrorBox from "./ErrorBox";
import ExpectedResult from "./ExpectedResult";
import HintDialog from "./HintDialog";
import InputFeed from "./InputFeed";
import Panel from "./Panel";
import ParamReturnDiagram from "./ParamReturnDiagram";
import PseudocodeDialog from "./PseudocodeDialog";
import ResultCheck from "./ResultCheck";
import StepView, { buildVarOrder } from "./StepView";
import Transport from "./Transport";
import { readDraft, writeDraft } from "../lib/draft";
import { es5ify, runCode } from "../lib/interpreter";
import { SEASONS, themeIcon } from "../lib/themes";
import { useStepPlayer } from "../lib/useStepPlayer";

const NO_STEPS = [];
const NO_LOGS = [];

const sameInputs = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Catatan pseudocode disimpen per project, biar gak ilang kalau halamannya kebuka ulang. */
const notesKey = (id) => `pseudocode:${id}`;
const draftKey = (id) => `draft:mini-project:${id}`;

function readNotes(id) {
  try {
    return localStorage.getItem(notesKey(id)) ?? "";
  } catch (e) {
    return "";
  }
}

export default function ProjectRunner({ project, nextProject }) {
  const [code, setCode] = useState(project.starterCode);
  const [inputs, setInputs] = useState(project.inputs);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [visualizing, setVisualizing] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  // 0 = hint belum pernah dibuka. Ke-reset sendiri kalau pindah project, karena
  // halaman detail me-mount ulang komponen ini per id (lihat `key` di page-nya).
  const [hintLevel, setHintLevel] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);

  const steps = result ? result.steps : NO_STEPS;
  const logs = result ? result.logs : NO_LOGS;
  const error = result ? result.error : null;
  const stale =
    result !== null &&
    (result.ranCode !== code || !sameInputs(result.ranInputs, inputs));

  const player = useStepPlayer(steps);
  const resetPlayer = player.reset;
  const varOrder = useMemo(() => buildVarOrder(steps), [steps]);
  const codeLines = useMemo(() => code.split("\n"), [code]);

  const executeCode = useCallback(async () => {
    setRunning(true);
    try {
      const next = await runCode(code, { inputs });
      // Simpan kode & input yang dipakai, biar bisa dibilang kalau hasil yang
      // ditampilkan udah gak nyambung sama isi editor sekarang. `runId` cuma
      // penanda run ke berapa — dipakai sebagai `key` panel hasil supaya
      // animasi "cocok!" main lagi tiap kali dijalanin, bukan sekali doang.
      setResult({ ...next, ranCode: code, ranInputs: inputs, runId: Date.now() });
      resetPlayer();
      return next;
    } finally {
      setRunning(false);
    }
  }, [code, inputs, resetPlayer]);

  const handleCheck = useCallback(async () => {
    setVisualizing(false);
    await executeCode();
  }, [executeCode]);

  const handleVisualize = useCallback(async () => {
    setVisualizing(true);
    if (result === null || stale) await executeCode();
  }, [executeCode, result, stale]);

  const updateCode = useCallback((value) => {
    setVisualizing(false);
    setCode(value);
  }, []);

  const updateInputs = useCallback((value) => {
    setVisualizing(false);
    setInputs(value);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const draft = readDraft(draftKey(project.id));
      if (draft) {
        if (typeof draft.code === "string") setCode(draft.code);
        if (Array.isArray(draft.inputs)) setInputs(draft.inputs);
        if (typeof draft.notes === "string") setNotes(draft.notes);
        if (Number.isInteger(draft.hintLevel)) {
          setHintLevel(Math.max(0, draft.hintLevel));
        }
      }
      setDraftReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [project.id]);

  useEffect(() => {
    if (!draftReady) return;
    writeDraft(draftKey(project.id), { code, inputs, notes, hintLevel });
  }, [code, draftReady, hintLevel, inputs, notes, project.id]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        handleCheck();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleCheck]);

  // Catatan dibaca pas popup-nya dibuka (bukan lewat effect) supaya isi textarea
  // gak beda antara hasil render server dan browser.
  const openNotes = useCallback(() => {
    setNotes((current) => current || readNotes(project.id));
    setNotesOpen(true);
  }, [project.id]);

  const changeNotes = useCallback(
    (value) => {
      setNotes(value);
      try {
        localStorage.setItem(notesKey(project.id), value);
      } catch (e) {
        // Storage diblokir (mode privat, dll) — catatan tetap jalan buat sesi ini.
      }
    },
    [project.id],
  );

  const hints = project.hints ?? [];

  // Buka popup hint: kalau belum pernah dibuka, mulai dari level 1. Kalau udah,
  // lanjut dari level terakhir — nutup popup gak nge-reset progress.
  const openHint = useCallback(() => {
    setHintLevel((level) => (level === 0 ? 1 : level));
    setHintOpen(true);
  }, []);

  const nextHint = useCallback(() => {
    setHintLevel((level) => Math.min(level + 1, hints.length));
  }, [hints.length]);

  const season = SEASONS[project.musim];
  // Ikon panel visualisasi ngikut `visualTheme` soal — identitas visual per
  // cerita, biar panelnya gak kelihatan sama persis di semua soal.
  const ikon = themeIcon(project.visualTheme);
  const codeIsStarter = code === project.starterCode;
  const inputsAreDefault = sameInputs(inputs, project.inputs);
  return (
    <div className="flex min-h-dvh flex-col xl:h-dvh xl:overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link
          href="/mini-project"
          className="text-[13px] font-semibold text-text-2 transition-colors hover:text-text-1"
        >
          ← Mini project
        </Link>

        <h1 className="font-heading text-xl leading-none text-text-1">
          {project.judul}
        </h1>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-text-2">
          <span aria-hidden>{season?.emoji ?? "•"}</span>
          {season?.label ?? project.musim}
          <span className="text-border">·</span>
          <code className="font-mono font-semibold text-accent">
            {project.tema}
          </code>
        </span>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full bg-accent-soft px-3 py-1.5 text-[11px] font-medium text-accent lg:inline">
            Mode ES5 · pakai <code className="font-mono">var</code>, bukan{" "}
            <code className="font-mono">let</code>
          </span>
          <button
            type="button"
            onClick={openNotes}
            className="flex h-9 items-center gap-2 rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 transition-colors hover:bg-bg"
          >
            Pseudocode
            {notes.trim().length > 0 && (
              <span
                aria-label="ada catatan"
                className="size-1.5 rounded-full bg-accent"
              />
            )}
          </button>
          {nextProject && (
            <Link
              href={`/mini-project/${nextProject.id}`}
              className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 transition-colors hover:bg-bg"
            >
              {nextProject.judul} →
            </Link>
          )}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 px-4 pb-3 xl:grid-cols-[24rem_minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Kolom kiri: cerita + jawaban yang bakal disuapin ke program. */}
        <div className="flex min-h-0 flex-col gap-3">
          <Panel title="Cerita" hint={`musim ${project.musim}`} className="flex-1">
            <div className="flex flex-col gap-3 p-4">
              <p className="text-sm leading-relaxed text-text-1">
                {project.cerita}
              </p>

              <div>
                <h3 className="mb-1 text-[10px] font-semibold tracking-wider text-text-2 uppercase">
                  Yang dikerjain
                </h3>
                <p className="text-sm leading-relaxed text-text-1">
                  {project.deskripsiSoal}
                </p>
              </div>

              <ParamReturnDiagram alur={project.alurData} />

              {(project.catatanKonsep ?? []).map((note) => (
                <div
                  key={note.judul}
                  className="rounded-app border border-worked/30 bg-worked-soft px-3 py-2.5"
                >
                  <h3 className="mb-1 text-[10px] font-semibold tracking-wider text-worked uppercase">
                    {note.judul}
                  </h3>
                  <p className="text-[12.5px] leading-relaxed text-text-1">
                    {note.isi}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          {!visualizing && (
            <Panel title="Input" className="shrink-0 xl:max-h-[62%]">
              <InputFeed
                inputs={inputs}
                labels={project.promptLabels}
                consumed={player.step ? player.step.inputCount : null}
                onChange={updateInputs}
                onReset={() => updateInputs(project.inputs)}
                isDefault={inputsAreDefault}
                needsInput={project.inputs.length > 0}
              />
            </Panel>
          )}
        </div>

        {/* Kolom tengah: kode. */}
        <Panel
          title="Kode"
          hint={
            project.inputs.length > 0
              ? "ambilInput() ngambil jawaban berikutnya"
              : "JavaScript"
          }
          action={
            <div className="flex shrink-0 items-center gap-2">
              {!codeIsStarter && (
                <button
                  type="button"
                  onClick={() => setCode(project.starterCode)}
                  className="h-9 rounded-[10px] border border-border bg-surface px-3 text-xs font-semibold text-text-2 transition-colors hover:bg-bg hover:text-text-1"
                >
                  Balikin kode awal
                </button>
              )}
              {hints.length > 0 && (
                <button
                  type="button"
                  onClick={openHint}
                  className="flex h-9 items-center gap-1.5 rounded-[10px] border border-hint/40 bg-hint-soft px-3.5 text-sm font-semibold text-hint transition-colors hover:bg-hint/10"
                >
                  <span aria-hidden>💡</span>
                  Hint
                  {hintLevel > 0 && (
                    <span className="font-mono text-[11px] font-normal tabular-nums">
                      {Math.min(hintLevel, hints.length)}/{hints.length}
                    </span>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={handleCheck}
                disabled={running}
                className="flex h-9 items-center rounded-[10px] border border-success/40 bg-success-soft px-3.5 text-sm font-semibold text-success transition-colors hover:bg-success/15 disabled:opacity-60"
              >
                {running ? "Mengecek…" : "Cek kode"}
              </button>
              <button
                type="button"
                onClick={handleVisualize}
                disabled={running || !result || stale}
                className="flex h-9 items-center gap-2 rounded-[10px] bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
              >
                {running ? "Menyiapkan…" : "Jalankan visualisasi"}
                <kbd className="hidden rounded bg-white/20 px-1.5 py-0.5 font-mono text-[10px] font-normal 2xl:inline">
                  ⌘↵
                </kbd>
              </button>
            </div>
          }
        >
          <div className="h-full min-h-72 xl:min-h-0">
            <CodeEditor
              value={code}
              onChange={updateCode}
              activeLine={player.step ? player.step.line : null}
              onRun={handleCheck}
            />
          </div>
        </Panel>

        {/* Kolom kanan: apa yang terjadi di langkah ini. */}
        <Panel
          title={`${ikon} Visualisasi`}
          hint={
            steps.length > 0
              ? `langkah ${player.current + 1} dari ${steps.length}`
              : "belum dijalankan"
          }
          bodyClass="p-4"
        >
          <div
            className={`flex flex-col gap-4 ${steps.length === 0 ? "min-h-full" : ""}`}
          >
            {!visualizing && (
              <ExpectedResult
                expected={project.hasilAkhirTervalidasi}
                inputExample={project.inputAwal}
                starterCode={project.starterCode}
                inputs={inputs}
                labels={project.promptLabels}
                edited={!inputsAreDefault}
                onResetInputs={() => updateInputs(project.inputs)}
              />
            )}

            {stale && (
              <p className="rounded-app border border-border bg-bg px-3 py-2 text-[12px] text-text-2">
                Kode atau input-nya berubah setelah ini dijalankan — jalankan
                ulang biar visualisasinya nyusul.
              </p>
            )}

            <ErrorBox
              error={error}
              stepCount={steps.length}
              onFixLetConst={() => setCode((c) => es5ify(c))}
            />

            {visualizing && steps.length > 0 ? (
              <>
                <StepView
                  step={player.step}
                  prevStep={player.prevStep}
                  codeLines={codeLines}
                  varOrder={varOrder}
                  logs={logs}
                  showAllLogs={player.atEnd}
                  stepKey={player.current}
                />

                <ResultCheck
                  key={result.runId}
                  expected={project.hasilAkhirTervalidasi}
                  lastStep={player.lastStep}
                />

                <Transport
                  embedded
                  player={player}
                  steps={steps}
                  totalLines={codeLines.length}
                />
              </>
            ) : result && !visualizing && steps.length > 0 ? (
              <>
                <ResultCheck
                  key={result.runId}
                  expected={project.hasilAkhirTervalidasi}
                  lastStep={player.lastStep}
                />
                <button
                  type="button"
                  onClick={handleVisualize}
                  disabled={running || stale}
                  className="flex h-9 items-center justify-center self-start rounded-[10px] bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {stale
                    ? "Cek ulang sebelum visualisasi"
                    : "▶ Lanjutkan visualisasi"}
                </button>
              </>
            ) : (
              <div className="my-auto rounded-app border border-dashed border-border px-6 py-12 text-center">
                <p className="font-heading text-lg text-text-1">
                  Siap dijalankan
                </p>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-2">
                  {inputs.length > 0 ? (
                    <>
                      {inputs.length} jawaban di panel Input bakal disuapin ke
                      program satu per satu tiap ketemu{" "}
                      <code className="font-mono">ambilInput()</code>.{" "}
                    </>
                  ) : (
                    <>
                      Data awalnya udah ditulis langsung di kode, jadi program
                      ini gak nanya apa-apa dulu.{" "}
                    </>
                  )}
                  Klik{" "}
                  <strong className="text-text-1">
                    Cek kode
                  </strong>{" "}
                  buat lihat jalannya.
                </p>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <PseudocodeDialog
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        value={notes}
        onChange={changeNotes}
        projectTitle={project.judul}
      />

      <HintDialog
        open={hintOpen}
        onClose={() => setHintOpen(false)}
        hints={hints}
        level={hintLevel}
        onNext={nextHint}
      />
    </div>
  );
}
