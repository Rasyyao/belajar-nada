"use client";

import { useMemo } from "react";
import AccessStrip from "./AccessStrip";
import TrackCompare from "./TrackCompare";
import VarBoard from "./VarBoard";
import { readAccess } from "../lib/access";

const NO_LOGS = [];

/** Label tombol "Sederhanakan tampilan" sesuai fase AI-nya saat ini. */
function aiButtonLabel({ phase, showAi }) {
  if (phase === "loading") return "AI lagi mikir…";
  if (phase === "ready") return showAi ? "✨ Disederhanakan AI · klik buat balik" : "✨ Pakai versi AI";
  if (phase === "error") return "✨ Coba lagi";
  return "✨ Sederhanakan tampilan";
}

/**
 * Toolbar kecil buat toggle refinement AI (Fase 2) — cuma nongol kalau ada
 * array yang layak disederhanakan. Baseline rule-based udah kepasang duluan,
 * jadi telat/gagalnya panggilan Groq gak pernah bikin tampilan blank.
 */
function AiSimplifyBar({ ai }) {
  if (!ai?.available) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px]">
      <button
        type="button"
        onClick={ai.onToggle}
        disabled={ai.phase === "loading"}
        className={`flex h-7 items-center gap-1.5 rounded-full border px-3 font-medium transition-colors disabled:opacity-60 ${
          ai.phase === "ready" && ai.showAi
            ? "border-worked/40 bg-worked-soft text-worked"
            : "border-border bg-surface text-text-1 hover:bg-bg"
        }`}
      >
        {ai.phase === "loading" && (
          <span className="size-1.5 animate-pulse rounded-full bg-accent" />
        )}
        {aiButtonLabel(ai)}
      </button>
      {ai.phase === "ready" && ai.showAi && ai.reason && (
        <span className="text-text-2">{ai.reason}</span>
      )}
      {ai.phase === "error" && (
        <span className="text-text-2">
          AI-nya lagi gak bisa dihubungi — tampilan rule-based tetap dipakai.
        </span>
      )}
    </div>
  );
}

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
  layoutHints = null,
  // Kontrol toggle "Sederhanakan tampilan" (Fase 2 — lihat useAiSimplify).
  // Biarkan null kalau pemanggilnya belum wire AI refinement.
  ai = null,
  // Nomor langkah yang lagi ditampilin. Dipakai VarBoard sebagai bagian dari
  // `key` biar animasi "baru masuk" / "bakal keluar" main ulang tiap langkah.
  stepKey = 0,
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

      <AiSimplifyBar ai={ai} />

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
        stepKey={stepKey}
        layoutHints={layoutHints}
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
