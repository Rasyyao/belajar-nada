"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import CodeEditor from "./CodeEditor";
import ErrorBox from "./ErrorBox";
import Panel from "./Panel";
import ResultCheck from "./ResultCheck";
import StepView, { buildVarOrder } from "./StepView";
import Transport from "./Transport";
import { runCode } from "../lib/interpreter";
import { useAiSimplify } from "../lib/useAiSimplify";
import { useStepPlayer } from "../lib/useStepPlayer";
import { buildBaselineLayout, selectStepLayout } from "../lib/visualizationRefinement";

const FIELD_LABELS = {
    iSebelum: "i-nya berapa (sebelum dicek)",
    nilaiSebelum: "Nilainya berapa (sebelum dicek)",
    lolos: "Boleh lanjut?",
    hasilSesudah: "Hasil jadi berapa",
    iSesudah: "i jadi berapa",
    nilaiSesudah: "Nilainya jadi berapa",
};

function formatValue(value) {
    if (value === null || value === undefined) return "—";
    if (typeof value === "string") return value;
    return JSON.stringify(value);
}

function parseValue(value) {
    const text = String(value ?? "").trim();
    if (!text) return null;
    if (text === "null") return null;
    if (text === "true") return true;
    if (text === "false") return false;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function createRow(fields) {
    return Object.fromEntries(
        fields.map((field) => [field, field === "lolos" ? null : ""]),
    );
}

function firstValueField(fields) {
    return fields.find((field) => field.endsWith("Sebelum")) ?? fields[0];
}

function predictionValues(row, fields) {
    return Object.fromEntries(
        fields.map((field) => [
            field,
            field === "lolos" ? row[field] : parseValue(row[field]),
        ]),
    );
}

function sameValue(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

function firstMismatch(rows, actual, fields) {
    const count = Math.max(rows.length, actual.length);

    for (let index = 0; index < count; index++) {
        const predicted = rows[index] ? predictionValues(rows[index], fields) : null;
        const expected = actual[index] ?? null;
        if (!predicted || !expected) return index;

        if (fields.some((field) => !sameValue(predicted[field], expected[field]))) {
            return index;
        }
    }

    return -1;
}

function PredictionTable({ fields, rows, onChange, disabled = false }) {
    const updateRow = (rowIndex, field, value) => {
        onChange(
            rows.map((row, index) =>
                index === rowIndex ? { ...row, [field]: value } : row,
            ),
        );
    };

    return (
        <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-152 border-collapse text-left">
                <thead>
                    <tr className="border-b border-border text-[10px] tracking-wider text-text-2 uppercase">
                        <th className="px-2 py-2 font-semibold">Putaran</th>
                        {fields.map((field) => (
                            <th key={field} className="px-2 py-2 font-semibold">
                                {FIELD_LABELS[field] ?? field}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-[12px]">
                    {rows.map((row, index) => (
                        <tr key={index} className="border-b border-border/70">
                            <td className="px-2 py-2 font-mono font-semibold text-text-2">
                                {index + 1}
                            </td>
                            {fields.map((field) => (
                                <td key={field} className="px-2 py-2 align-top">
                                    {field === "lolos" ? (
                                        <div className="flex gap-1">
                                            {[true, false].map((value) => (
                                                <button
                                                    key={String(value)}
                                                    type="button"
                                                    onClick={() => updateRow(index, field, value)}
                                                    disabled={disabled}
                                                    className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${row[field] === value
                                                        ? "border-accent bg-accent-soft text-accent"
                                                        : "border-border bg-surface text-text-2 hover:bg-bg"
                                                        } disabled:cursor-not-allowed disabled:opacity-60`}
                                                >
                                                    {value ? "Ya" : "Tidak"}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <input
                                            value={row[field]}
                                            onChange={(event) =>
                                                updateRow(index, field, event.target.value)
                                            }
                                            disabled={disabled}
                                            placeholder="…"
                                            aria-label={`${FIELD_LABELS[field] ?? field} putaran ${index + 1}`}
                                            className="no-liga h-8 w-full min-w-24 rounded-md border border-border bg-surface px-2 font-mono text-[12px] text-text-1 outline-none focus:border-accent disabled:cursor-not-allowed disabled:bg-bg disabled:opacity-75"
                                        />
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function CompareTrace({
    fields,
    rows,
    actual,
    mismatch,
    activeTraceIndex,
    traceStepIndices,
    onSelectRow,
}) {
    const count = Math.max(rows.length, actual.length);

    return (
        <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-2xl border-collapse text-left">
                <thead>
                    <tr className="border-b border-border text-[10px] tracking-wider text-text-2 uppercase">
                        <th className="px-2 py-2 font-semibold">Putaran</th>
                        <th className="px-2 py-2 font-semibold">Prediksi kamu</th>
                        <th className="px-2 py-2 font-semibold">Jejak asli</th>
                    </tr>
                </thead>
                <tbody className="text-[12px]">
                    {Array.from({ length: count }, (_, index) => {
                        const predicted = rows[index]
                            ? predictionValues(rows[index], fields)
                            : null;
                        const expected = actual[index] ?? null;
                        const mismatchRow = mismatch === index;
                        const activeRow = activeTraceIndex === index;
                        const stepIndex = traceStepIndices[index];

                        return (
                            <tr
                                key={index}
                                className={`${mismatchRow
                                    ? "bg-error-soft"
                                    : activeRow
                                        ? "bg-accent-soft/70"
                                        : "border-b border-border/70"
                                    }`}
                            >
                                <td className="px-2 py-2 font-mono font-semibold text-text-2">
                                    <button
                                        type="button"
                                        onClick={() => onSelectRow?.(index)}
                                        disabled={stepIndex === undefined}
                                        className="rounded-md px-1.5 py-1 text-left transition-colors hover:bg-accent-soft disabled:cursor-default disabled:hover:bg-transparent"
                                        title={stepIndex === undefined ? "Putaran ini belum terhubung ke langkah visualisasi" : "Lihat putaran ini di visualisasi"}
                                    >
                                        {index + 1}
                                        {activeRow && <span className="ml-1.5 text-accent">●</span>}
                                    </button>
                                </td>
                                <td className="px-2 py-2 align-top">
                                    {predicted ? (
                                        fields.map((field) => (
                                            <div key={field} className="flex gap-2">
                                                <span className="text-text-2">{FIELD_LABELS[field] ?? field}:</span>
                                                <code className="no-liga font-mono text-text-1">
                                                    {formatValue(predicted[field])}
                                                </code>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-text-2">Tidak diprediksi</span>
                                    )}
                                </td>
                                <td className="px-2 py-2 align-top">
                                    {expected ? (
                                        fields.map((field) => (
                                            <div key={field} className="flex gap-2">
                                                <span className="text-text-2">{FIELD_LABELS[field] ?? field}:</span>
                                                <code className="no-liga font-mono text-text-1">
                                                    {formatValue(expected[field])}
                                                </code>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-text-2">Tidak ada putaran</span>
                                    )}
                                    {mismatchRow && (
                                        <p className="mt-1 text-[10px] font-semibold text-error">
                                            Titik pertama yang meleset
                                        </p>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function findLoopConditionLine(codeLines) {
    const index = codeLines.findIndex((line) => /\b(?:while|for)\s*\(/.test(line));
    return index < 0 ? null : index + 1;
}

function fieldVariable(field) {
    return field.replace(/Sesudah$|Sebelum$/, "");
}

/**
 * Satu baris trace mewakili satu kali kondisi loop dicek. Semua snapshot
 * sampai kondisi berikutnya tetap diberi nomor putaran yang sama, sehingga
 * tabel prediksi bisa mengikuti langkah visualisasi, bukan cuma dibandingkan
 * setelah program selesai.
 */
function buildTraceStepIndices(steps, actual, codeLines, beforeField) {
    const conditionLine = findLoopConditionLine(codeLines);
    const beforeVariable = fieldVariable(beforeField);
    let activeIndex = -1;
    let nextActualIndex = 0;

    return steps.map((step) => {
        if (step.line === conditionLine) {
            const foundIndex = actual.findIndex(
                (row, index) =>
                    index >= nextActualIndex &&
                    sameValue(step.vars?.[beforeVariable], row[beforeField]),
            );
            if (foundIndex >= 0) {
                activeIndex = foundIndex;
                nextActualIndex = foundIndex + 1;
            }
        }
        return activeIndex;
    });
}

function ActiveTrace({ fields, actual, predictedRows, index }) {
    if (index < 0 || !actual[index]) {
        return (
            <p className="rounded-app border border-dashed border-border px-3 py-2 text-[12px] text-text-2">
                Visualisasi sedang menyiapkan putaran. Geser langkah untuk
                menghubungkannya ke tabel trace.
            </p>
        );
    }

    const expected = actual[index];
    const predicted = predictedRows[index]
        ? predictionValues(predictedRows[index], fields)
        : null;

    return (
        <div className="rounded-app border border-accent/35 bg-accent-soft/45 px-3 py-2.5">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[10px] font-semibold tracking-wider text-accent uppercase">
                    Putaran {index + 1} sedang divisualisasikan
                </h3>
                <span className="text-[10px] text-text-2">
                    biru = baris yang sedang dilihat
                </span>
            </div>
            <div className="grid gap-x-4 gap-y-1 text-[11px] sm:grid-cols-2">
                {fields.map((field) => (
                    <div key={field} className="min-w-0">
                        <span className="text-text-2">{FIELD_LABELS[field] ?? field}: </span>
                        <code className="no-liga break-all font-mono text-text-1">
                            {formatValue(expected[field])}
                        </code>
                        {predicted && !sameValue(predicted[field], expected[field]) && (
                            <span className="ml-1 font-semibold text-error">≠ prediksi</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ReviewRunner({ review }) {
    const fields = useMemo(
        () => Object.keys(review.jejakTervalidasi[0] ?? {}).filter((field) => field !== "putaran"),
        [review.jejakTervalidasi],
    );
    const beforeField = firstValueField(fields);
    const [rows, setRows] = useState([]);
    const [result, setResult] = useState(null);
    const [running, setRunning] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const steps = useMemo(() => result?.steps ?? [], [result]);
    const player = useStepPlayer(steps);
    const resetPlayer = player.reset;
    const codeLines = useMemo(() => review.kodeLengkap.split("\n"), [review.kodeLengkap]);
    const varOrder = useMemo(() => buildVarOrder(steps), [steps]);
    const traceStepIndices = useMemo(
        () => buildTraceStepIndices(steps, review.jejakTervalidasi, codeLines, beforeField),
        [beforeField, codeLines, review.jejakTervalidasi, steps],
    );
    const currentStep = player.current;
    // AI refinement (Fase 2) gak pernah ikut nge-block eksekusi — baseline
    // rule-based di bawah kepasang instan, ini cuma nawarin upgrade opsional
    // lewat tombol "Sederhanakan tampilan" di StepView.
    const ai = useAiSimplify(result);
    const layoutHints = useMemo(
        () => selectStepLayout(ai.activeLayout, currentStep),
        [ai.activeLayout, currentStep],
    );
    const activeTraceIndex = traceStepIndices[currentStep] ?? -1;
    const mismatch = result
        ? firstMismatch(rows, review.jejakTervalidasi, fields)
        : -1;
    const ready =
        rows.length > 0 &&
        rows.every((row) => {
            if (row[beforeField] === "" || row.lolos === null) return false;
            if (row.lolos === true) {
                return fields
                    .filter((field) => field !== "lolos" && field !== beforeField)
                    .every((field) => row[field] !== "");
            }
            return true;
        });

    const addRow = () => setRows((current) => [...current, createRow(fields)]);

    const handleRun = useCallback(async () => {
        if (!ready) return;
        setSubmitted(true);
        setRunning(true);
        try {
            const next = await runCode(review.kodeLengkap);
            const visualizationLayout = buildBaselineLayout({
                steps: next.steps,
                codeLines: review.kodeLengkap.split("\n"),
            });
            resetPlayer();
            setResult({ ...next, ranCode: review.kodeLengkap, visualizationLayout });
        } finally {
            setRunning(false);
        }
    }, [ready, resetPlayer, review.kodeLengkap]);

    const actualLast = steps[steps.length - 1] ?? null;
    const actualValue = actualLast?.vars?.[review.variabelDitebak];
    const finalMatches = JSON.stringify(actualValue) === JSON.stringify(review.hasilAkhirTervalidasi);

    return (
        <div className="flex min-h-dvh flex-col xl:h-dvh xl:overflow-hidden">
            <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <Link href="/review" className="text-[13px] font-semibold text-text-2 hover:text-text-1">
                    ← Review Mode
                </Link>
                <h1 className="font-heading text-xl leading-none text-text-1">{review.judul}</h1>
                <span className="rounded-full border border-accent/25 bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
                    Level {review.level}
                </span>
                <Link
                    href="/mini-project"
                    className="ml-auto flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 hover:bg-bg"
                >
                    Mini project
                </Link>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 px-4 pb-3 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)]">
                <Panel title="Kode lengkap" hint="Baca dulu — tidak bisa diedit">
                    <div className="h-full min-h-72">
                        <CodeEditor
                            value={review.kodeLengkap}
                            onChange={() => { }}
                            activeLine={player.step?.line ?? null}
                            onRun={handleRun}
                            readOnly
                        />
                    </div>
                </Panel>

                <div className="flex min-h-0 flex-col gap-3">
                    <Panel
                        title="Prediksi kamu"
                        hint={submitted ? "terkunci — sedang dibandingkan" : `hasil akhir: ${review.variabelDitebak}`}
                        className="shrink-0"
                    >
                        <div className="flex flex-col gap-3 p-4">
                            <p className="text-[12.5px] leading-relaxed text-text-2">
                                {submitted
                                    ? "Prediksi tetap terlihat di sini. Ikuti titik biru di tabel untuk melihat baris yang sedang dijalankan."
                                    : "Isi minimal satu putaran. Jangan jalankan kode sebelum kamu menebak apa yang terjadi."}
                            </p>
                            <PredictionTable
                                fields={fields}
                                rows={rows}
                                onChange={setRows}
                                disabled={submitted}
                            />
                            {!submitted && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={addRow}
                                        className="h-9 rounded-[10px] border border-border bg-surface px-3 text-[12.5px] font-semibold text-text-1 hover:bg-bg"
                                    >
                                        + Tambah putaran
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRun}
                                        disabled={!ready || running}
                                        className="h-9 rounded-[10px] bg-accent px-3.5 text-[12.5px] font-semibold text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-45"
                                    >
                                        {running ? "Menjalankan…" : "Cek prediksi & jalankan"}
                                    </button>
                                </div>
                            )}
                            {!ready && !submitted && rows.length > 0 && (
                                <p className="text-[11px] text-hint">
                                    Isi nilai sebelum, pilih ya/tidak, lalu isi nilai sesudah
                                    untuk putaran yang lolos.
                                </p>
                            )}
                        </div>
                    </Panel>

                    {submitted && result && (
                        <Panel
                            title="Prediksi vs jejak asli"
                            hint={mismatch < 0 ? "semua cocok" : `mulai meleset di putaran ${mismatch + 1}`}
                            className="shrink-0"
                        >
                            <div className="flex flex-col gap-3 p-4">
                                <CompareTrace
                                    fields={fields}
                                    rows={rows}
                                    actual={review.jejakTervalidasi}
                                    mismatch={mismatch}
                                    activeTraceIndex={activeTraceIndex}
                                    traceStepIndices={traceStepIndices.reduce((map, traceIndex, stepIndex) => {
                                        if (traceIndex >= 0 && map[traceIndex] === undefined) map[traceIndex] = stepIndex;
                                        return map;
                                    }, {})}
                                    onSelectRow={(traceIndex) => {
                                        const stepIndex = traceStepIndices.findIndex((value) => value === traceIndex);
                                        if (stepIndex >= 0) player.seek(stepIndex);
                                    }}
                                />
                                <div className={`rounded-app border px-3 py-2 text-[12px] ${mismatch < 0 ? "border-success/40 bg-success-soft text-success" : "border-hint/40 bg-hint-soft text-text-1"}`}>
                                    {mismatch < 0
                                        ? "Prediksimu cocok dengan seluruh jejak."
                                        : `Mulai dari putaran ${mismatch + 1}, bandingkan lagi nilai sebelum kondisi dicek.`}
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSubmitted(false);
                                            setResult(null);
                                        }}
                                        className="h-9 rounded-[10px] border border-border px-3 text-[12.5px] font-semibold text-text-1 hover:bg-bg"
                                    >
                                        Coba prediksi lagi
                                    </button>
                                    <span className={`font-mono text-[12px] font-semibold ${finalMatches ? "text-success" : "text-error"}`}>
                                        {review.variabelDitebak} = {formatValue(actualValue)}
                                    </span>
                                </div>
                            </div>
                        </Panel>
                    )}

                    {review.catatanKonsep?.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {review.catatanKonsep.map((note) => (
                                <div
                                    key={note.judul}
                                    className="rounded-app border border-worked/30 bg-worked-soft px-3 py-2.5"
                                >
                                    <h3 className="mb-1 text-[10px] font-semibold tracking-wider text-worked uppercase">
                                        {note.judul}
                                    </h3>
                                    <p className="text-[12px] leading-relaxed text-text-1">
                                        {note.isi}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    <Panel
                        title="Visualisasi"
                        hint={steps.length
                            ? `${activeTraceIndex >= 0 ? `putaran ${activeTraceIndex + 1} · ` : ""}langkah ${player.current + 1} dari ${steps.length}`
                            : "terkunci sampai prediksi diisi"}
                        className="min-h-0 flex-1"
                        bodyClass="p-4"
                    >
                        {!submitted ? (
                            <div className="flex h-full min-h-48 items-center justify-center text-center">
                                <p className="max-w-xs text-sm leading-relaxed text-text-2">
                                    Visualisasi dibuka setelah prediksimu dikirim.
                                </p>
                            </div>
                        ) : running || !result ? (
                            <div className="flex h-full min-h-48 items-center justify-center text-center">
                                <p className="text-sm text-text-2">Menjalankan kode…</p>
                            </div>
                        ) : result?.error ? (
                            <ErrorBox error={result.error} stepCount={steps.length} />
                        ) : (
                            <div className="flex flex-col gap-4">
                                <StepView
                                    step={player.step}
                                    prevStep={player.prevStep}
                                    codeLines={codeLines}
                                    varOrder={varOrder}
                                    logs={result.logs}
                                    showAllLogs={player.atEnd}
                                    stepKey={player.current}
                                    layoutHints={layoutHints}
                                    ai={{
                                        available: ai.available,
                                        phase: ai.phase,
                                        showAi: ai.showAi,
                                        reason: ai.reason,
                                        onToggle: ai.toggle,
                                    }}
                                />
                                <ActiveTrace
                                    fields={fields}
                                    actual={review.jejakTervalidasi}
                                    predictedRows={rows}
                                    index={activeTraceIndex}
                                />
                                <ResultCheck
                                    expected={{ [review.variabelDitebak]: review.hasilAkhirTervalidasi }}
                                    lastStep={actualLast}
                                />
                                <Transport
                                    embedded
                                    player={player}
                                    steps={steps}
                                    totalLines={codeLines.length}
                                />
                            </div>
                        )}
                    </Panel>
                </div>
            </div>
        </div>
    );
}