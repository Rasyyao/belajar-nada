"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CodeEditor from "./CodeEditor";
import ErrorBox from "./ErrorBox";
import ExpectedResult from "./ExpectedResult";
import HintDialog from "./HintDialog";
import InitialData from "./InitialData";
import Panel from "./Panel";
import ParamReturnDiagram from "./ParamReturnDiagram";
import PseudocodeDialog from "./PseudocodeDialog";
import ResultCheck, { matchesExpected } from "./ResultCheck";
import StepView, { buildVarOrder } from "./StepView";
import Transport from "./Transport";
import { es5ify, runCode } from "../lib/interpreter";
import { partTheme } from "../lib/projects";
import { useStepPlayer } from "../lib/useStepPlayer";

const NO_STEPS = [];
const NO_LOGS = [];

/** Catatan pseudocode dipisah per part — tiap part soalnya beda. */
const notesKey = (id, partKe) => `pseudocode:${id}:part-${partKe}`;

function readNotes(id, partKe) {
  try {
    return localStorage.getItem(notesKey(id, partKe)) ?? "";
  } catch (e) {
    return "";
  }
}

/** Ganti satu elemen state per-part tanpa nyentuh part yang lain. */
const replaceAt = (list, index, value) =>
  list.map((item, i) => (i === index ? value : item));

/**
 * Nyari data awal part ini yang sebenernya HASIL dari part sebelumnya.
 *
 * Di soal kayak Loket Karcis, `daftarHarga` yang jadi input Part 2 itu bukan
 * angka yang kebetulan mirip — itu persis output Part 1. Kalau gak ditandain,
 * siswa gampang baca dua part itu sebagai dua soal yang gak nyambung.
 * Dicocokin lewat nama + isi, jadi berlaku sendiri buat soal berpart lain yang
 * polanya sama tanpa perlu nulis apa-apa lagi di JSON-nya.
 */
function findInputOrigins(parts, activeIndex) {
  const active = parts[activeIndex];
  const origins = {};

  for (const [name, value] of Object.entries(active.inputAwal ?? {})) {
    for (let i = 0; i < activeIndex; i++) {
      const hasil = parts[i].hasilAkhirTervalidasi ?? {};
      if (
        name in hasil &&
        JSON.stringify(hasil[name]) === JSON.stringify(value)
      ) {
        origins[name] = parts[i].partKe;
        break;
      }
    }
  }

  return origins;
}

/**
 * Satu soal yang dikerjain bertahap: Part 1 dan Part 2 tinggal di HALAMAN YANG
 * SAMA, dipindah lewat tab.
 *
 * Semua state yang bisa ilang (kode, hasil run, level hint, catatan) disimpan
 * PER PART di komponen ini, bukan di dalam panel yang di-render — jadi pindah
 * tab bolak-balik gak ngehapus kodenya siswa. Yang sengaja gak disimpan cuma
 * posisi langkah: balik ke satu part = mulai lagi dari langkah pertama.
 *
 * Part-nya gak dikunci: Part 2 boleh dibuka duluan. Urutan ngerjain tetap
 * keputusan pengajar.
 */
export default function PartProjectRunner({ project, nextProject }) {
  const parts = project.parts;

  const [active, setActive] = useState(0);
  const [codes, setCodes] = useState(() => parts.map((p) => p.starterCode));
  const [results, setResults] = useState(() => parts.map(() => null));
  const [hintLevels, setHintLevels] = useState(() => parts.map(() => 0));
  const [notes, setNotes] = useState(() => parts.map(() => ""));
  const [running, setRunning] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  const part = parts[active];
  const code = codes[active];
  const result = results[active];
  const hints = part.hints ?? [];
  const hintLevel = hintLevels[active];

  const steps = result ? result.steps : NO_STEPS;
  const logs = result ? result.logs : NO_LOGS;
  const error = result ? result.error : null;

  const player = useStepPlayer(steps);
  const resetPlayer = player.reset;
  const varOrder = useMemo(() => buildVarOrder(steps), [steps]);
  const codeLines = useMemo(() => code.split("\n"), [code]);
  const theme = partTheme(project.visualTheme);
  const inputOrigins = useMemo(
    () => findInputOrigins(parts, active),
    [parts, active],
  );

  const handleRun = useCallback(async () => {
    setRunning(true);
    try {
      // Soal berpart gak minta input lewat ambilInput() — data awalnya udah
      // ketulis di kode, jadi gak ada daftar input yang perlu disuapin.
      const next = await runCode(code);
      setResults((list) => replaceAt(list, active, { ...next, ranCode: code }));
      resetPlayer();
    } finally {
      setRunning(false);
    }
  }, [active, code, resetPlayer]);

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

  // Pindah tab: popup ditutup dan langkahnya balik ke awal, tapi kode dan hasil
  // run tiap part tetap kesimpen di state di atas.
  const goToPart = useCallback(
    (index) => {
      setActive(index);
      setHintOpen(false);
      setNotesOpen(false);
      resetPlayer();
    },
    [resetPlayer],
  );

  const setCode = useCallback(
    (value) => setCodes((list) => replaceAt(list, active, value)),
    [active],
  );

  const openHint = useCallback(() => {
    setHintLevels((list) =>
      replaceAt(list, active, list[active] === 0 ? 1 : list[active]),
    );
    setHintOpen(true);
  }, [active]);

  const nextHint = useCallback(() => {
    setHintLevels((list) =>
      replaceAt(list, active, Math.min(list[active] + 1, hints.length)),
    );
  }, [active, hints.length]);

  // Catatan dibaca pas popup-nya dibuka (bukan lewat effect) supaya isi textarea
  // gak beda antara hasil render server dan browser.
  const openNotes = useCallback(() => {
    setNotes((list) =>
      list[active]
        ? list
        : replaceAt(list, active, readNotes(project.id, parts[active].partKe)),
    );
    setNotesOpen(true);
  }, [active, parts, project.id]);

  const changeNotes = useCallback(
    (value) => {
      setNotes((list) => replaceAt(list, active, value));
      try {
        localStorage.setItem(notesKey(project.id, part.partKe), value);
      } catch (e) {
        // Storage diblokir (mode privat, dll) — catatan tetap jalan buat sesi ini.
      }
    },
    [active, part.partKe, project.id],
  );

  // Centang di tab: hasil akhir run TERAKHIR cocok semua, dan kodenya belum
  // diubah lagi sesudah itu.
  const solved = parts.map((item, index) => {
    const run = results[index];
    if (!run || run.ranCode !== codes[index]) return false;
    return matchesExpected(
      item.hasilAkhirTervalidasi,
      run.steps[run.steps.length - 1] ?? null,
    );
  });

  const codeIsStarter = code === part.starterCode;
  const stale = result !== null && result.ranCode !== code;

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
          <span aria-hidden>{theme.emoji}</span>
          Soal berpart
          <span className="text-border">·</span>
          <code className="font-mono font-semibold text-accent">
            {parts.length} part
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
            {notes[active].trim().length > 0 && (
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

      {/* Cerita utama ditulis sekali di paling atas: dia gak ikut berubah pas
          ganti tab, karena semua part masih cerita yang sama. */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 border-y border-border bg-surface px-4 py-2.5">
        <p className="min-w-[16rem] flex-1 text-[12.5px] leading-relaxed text-text-2">
          {project.ceritaUtama}
        </p>

        <nav
          aria-label="Bagian soal"
          className="flex shrink-0 flex-wrap items-center gap-2"
        >
          {parts.map((item, index) => (
            <div key={item.partKe} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden className="text-text-2">
                  →
                </span>
              )}
              <button
                type="button"
                onClick={() => goToPart(index)}
                aria-current={index === active ? "step" : undefined}
                className={`flex h-10 items-center gap-2 rounded-[10px] border px-3 transition-colors ${
                  index === active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border bg-surface text-text-2 hover:bg-bg hover:text-text-1"
                }`}
              >
                <span className="font-mono text-[11px] font-semibold">
                  Part {item.partKe}
                </span>
                <span className="text-[12.5px] font-semibold">
                  {item.judulPart}
                </span>
                {solved[index] && (
                  <span
                    title="hasil akhirnya udah cocok"
                    className="text-[13px] font-bold text-success"
                  >
                    ✓
                  </span>
                )}
              </button>
            </div>
          ))}
        </nav>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 px-4 py-3 xl:grid-cols-[20rem_minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Kolom kiri: cerita part yang lagi kebuka + data awal & targetnya. */}
        <div className="flex min-h-0 flex-col gap-3">
          <Panel
            title={`Cerita Part ${part.partKe}`}
            hint={part.tema}
            className="flex-1"
          >
            <div className="flex flex-col gap-3 p-4">
              <p className="text-[13px] leading-relaxed text-text-1">
                {part.cerita}
              </p>

              <div>
                <h3 className="mb-1 text-[10px] font-semibold tracking-wider text-text-2 uppercase">
                  Yang dikerjain
                </h3>
                <p className="text-[13px] leading-relaxed text-text-1">
                  {part.deskripsiSoal}
                </p>
              </div>

              <ParamReturnDiagram alur={part.alurData} />

              {(part.catatanKonsep ?? []).map((note) => (
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

          <Panel title="Data awal & target" className="shrink-0 xl:max-h-[62%]">
            <InitialData data={part.inputAwal} origins={inputOrigins} />
            <ExpectedResult expected={part.hasilAkhirTervalidasi} />
          </Panel>
        </div>

        {/* Kolom tengah: kode part yang lagi kebuka. */}
        <Panel
          title="Kode"
          hint={`Part ${part.partKe} · function ${part.namaFunction}()`}
          action={
            <div className="flex shrink-0 items-center gap-2">
              {!codeIsStarter && (
                <button
                  type="button"
                  onClick={() => setCode(part.starterCode)}
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
                onClick={handleRun}
                disabled={running}
                className="flex h-9 items-center gap-2 rounded-[10px] bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
              >
                {running ? "Menjalankan…" : "Jalankan & Visualisasikan"}
                <kbd className="hidden rounded bg-white/20 px-1.5 py-0.5 font-mono text-[10px] font-normal 2xl:inline">
                  ⌘↵
                </kbd>
              </button>
            </div>
          }
        >
          {/* `key` per part: tiap part dapat editor sendiri, jadi undo/redo-nya
              gak nyampur antar part. */}
          <div className="h-full min-h-72 xl:min-h-0">
            <CodeEditor
              key={part.partKe}
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
            {stale && (
              <p className="rounded-app border border-border bg-bg px-3 py-2 text-[12px] text-text-2">
                Kodenya berubah setelah ini dijalankan — jalankan ulang biar
                visualisasinya nyusul.
              </p>
            )}

            <ErrorBox
              error={error}
              stepCount={steps.length}
              onFixLetConst={() => setCode(es5ify(code))}
            />

            {steps.length === 0 ? (
              <div className="rounded-app border border-dashed border-border px-6 py-12 text-center">
                <p className="font-heading text-lg text-text-1">
                  Siap dijalankan
                </p>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-2">
                  Data awal Part {part.partKe} udah ditulis langsung di kode,
                  jadi program ini gak nanya apa-apa dulu. Klik{" "}
                  <strong className="text-text-1">
                    Jalankan &amp; Visualisasikan
                  </strong>{" "}
                  buat lihat jalannya.
                </p>
              </div>
            ) : (
              <>
                <StepView
                  step={player.step}
                  prevStep={player.prevStep}
                  codeLines={codeLines}
                  varOrder={varOrder}
                  logs={logs}
                  showAllLogs={player.atEnd}
                  compare={part.bandingkan}
                />

                <ResultCheck
                  expected={part.hasilAkhirTervalidasi}
                  lastStep={player.lastStep}
                />
              </>
            )}
          </div>
        </Panel>
      </div>

      <Transport
        player={player}
        steps={steps}
        totalLines={codeLines.length}
        idleHint={`Kontrol langkah muncul di sini setelah kode Part ${part.partKe} dijalankan.`}
      />

      <PseudocodeDialog
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        value={notes[active]}
        onChange={changeNotes}
        projectTitle={`${project.judul} — Part ${part.partKe}`}
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
