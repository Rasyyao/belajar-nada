"use client";

import { useMemo } from "react";
import AccessStrip from "./AccessStrip";
import TrackCompare from "./TrackCompare";
import VarBoard from "./VarBoard";
import { readAccess } from "../lib/access";

const NO_LOGS = [];

/**
 * Isi panel Visualisasi untuk satu langkah: baris yang lagi jalan, penjabaran
 * apa yang disentuh baris itu, kartu variabel, dan output console.
 * Dipakai bareng Playground dan halaman Mini Project.
 */
export default function StepView({
  step,
  prevStep,
  codeLines,
  varOrder,
  logs = NO_LOGS,
  showAllLogs = false,
  compare = null,
}) {
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
    return showAllLogs ? logs : logs.slice(0, step.logCount);
  }, [step, showAllLogs, logs]);

  if (!step) return null;

  return (
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

      {/* Bagan tambahan buat soal yang ngebagi satu sumber ke beberapa array
          tujuan. Dirender di sini (bukan di halaman) supaya ikut kebagian
          `access` — jadi jalur yang LAGI diisi baris ini bisa ditandai, gak
          nunggu isinya keburu nambah dulu di langkah berikutnya. */}
      <TrackCompare
        config={compare}
        step={step}
        prevStep={prevStep}
        access={access}
      />

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
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-error" />
          bakal keluar (pop/shift)
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
  );
}

/** Urutan kartu variabel dikunci berdasarkan urutan kemunculan pertama,
 *  biar kartunya gak loncat-loncat posisi tiap kali langkahnya diganti. */
export function buildVarOrder(steps) {
  const order = [];
  for (const step of steps) {
    for (const name of Object.keys(step.vars)) {
      if (!order.includes(name)) order.push(name);
    }
  }
  return order;
}
