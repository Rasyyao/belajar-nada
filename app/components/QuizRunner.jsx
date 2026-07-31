"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { cocokJawaban } from "../lib/quizAnswer";

const AUTO_NEXT_MS = 800;

function renderCode(code, answer, input, onChange, onSubmit, disabled) {
    const parts = code.split("___BLANK___");
    return (
        <pre className="no-liga wrap-break-word whitespace-pre-wrap rounded-app bg-code-bg p-4 font-mono text-[13px] leading-7 text-code-text">
            {parts.map((part, index) => (
                <span key={`${part}-${index}`}>
                    {part}
                    {index < parts.length - 1 && (
                        <input
                            value={input}
                            onChange={(event) => onChange(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    onSubmit();
                                }
                            }}
                            disabled={disabled}
                            spellCheck={false}
                            aria-label={`Jawaban soal ${answer.nomor}`}
                            className="mx-1 inline-block h-8 w-28 rounded-md border border-code-accent/70 bg-code-bg px-2 text-center font-mono text-[13px] font-semibold text-white outline-none focus:border-white disabled:opacity-70"
                            autoFocus
                        />
                    )}
                </span>
            ))}
        </pre>
    );
}

function Summary({ quizSet, firstTry, attempts }) {
    const total = quizSet.soal.length;
    const percentage = total ? Math.round((firstTry / total) * 100) : 0;

    return (
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-5 px-4 py-8">
            <div className="rounded-app border border-success/35 bg-success-soft p-6 text-center">
                <p className="text-[11px] font-semibold tracking-widest text-success uppercase">Set selesai</p>
                <h2 className="mt-2 font-heading text-3xl text-text-1">{quizSet.judul}</h2>
                <p className="mt-3 text-sm text-text-2">Benar di percobaan pertama</p>
                <p className="mt-1 font-mono text-4xl font-bold text-success">{firstTry}/{total}</p>
                <p className="mt-1 text-[13px] text-text-2">{percentage}% · {attempts} total percobaan</p>
            </div>

            <div className="rounded-app border border-border bg-surface p-5">
                <h3 className="font-heading text-lg text-text-1">Yang perlu diingat</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-text-2">
                    Jawaban pertama menunjukkan bagian yang sudah otomatis. Soal yang sempat salah tetap latihan yang berguna—ulang set untuk membangun refleks.
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
                <Link href={`/quiz/${quizSet.slug}`} className="flex h-10 items-center rounded-[10px] bg-accent px-4 text-sm font-semibold text-white hover:bg-accent/90">
                    Ulangi set
                </Link>
                <Link href="/quiz" className="flex h-10 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 hover:bg-bg">
                    Pilih set lain
                </Link>
            </div>
        </div>
    );
}

export default function QuizRunner({ quizSet }) {
    const questions = useMemo(
        () => [...quizSet.soal].sort((a, b) => a.nomor - b.nomor),
        [quizSet.soal],
    );
    const [current, setCurrent] = useState(0);
    const [answer, setAnswer] = useState("");
    const [feedback, setFeedback] = useState(null);
    const [firstTry, setFirstTry] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [finished, setFinished] = useState(false);
    const question = questions[current];
    const firstAttempt = feedback === null;

    const advance = useCallback(() => {
        if (current >= questions.length - 1) {
            setFinished(true);
            return;
        }
        setCurrent((value) => value + 1);
        setAnswer("");
        setFeedback(null);
    }, [current, questions.length]);

    const checkAnswer = useCallback(() => {
        if (!question || feedback === "correct") return;
        const correct = cocokJawaban(answer, question.jawabanBenar);
        setAttempts((value) => value + 1);
        if (correct) {
            if (firstAttempt) setFirstTry((value) => value + 1);
            setFeedback("correct");
            window.setTimeout(advance, AUTO_NEXT_MS);
        } else {
            setFeedback("wrong");
        }
    }, [advance, answer, feedback, firstAttempt, question]);

    if (finished) return <Summary quizSet={quizSet} firstTry={firstTry} attempts={attempts} />;
    if (!question) return null;

    const progress = ((current + 1) / questions.length) * 100;
    const cardTone = feedback === "correct"
        ? "quiz-correct border-success/50 bg-success-soft"
        : feedback === "wrong"
            ? "quiz-wrong border-error/50 bg-error-soft"
            : "border-border bg-surface";

    return (
        <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-5 px-4 py-6">
            <header className="flex flex-wrap items-center gap-3">
                <Link href="/quiz" className="text-[13px] font-semibold text-text-2 hover:text-text-1">← Quiz Quick Review</Link>
                <h1 className="font-heading text-xl text-text-1">{quizSet.judul}</h1>
                <span className="rounded-full border border-accent/25 bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">Set {quizSet.urutan}</span>
                <Link href="/review" className="ml-auto text-[13px] font-semibold text-accent hover:underline">Review Mode</Link>
            </header>

            <section aria-label="Progress quiz" className="rounded-app border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-3 text-[12px] font-semibold text-text-2">
                    <span>Soal {current + 1} dari {questions.length}</span>
                    <span className="font-mono text-accent">{Math.round(progress)}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
                    <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${progress}%` }} />
                </div>
            </section>

            <main className={`rounded-app border p-5 transition-colors ${cardTone}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full border border-border bg-surface/70 px-2.5 py-1 font-mono text-[11px] font-semibold text-text-2">#{question.nomor}</span>
                    {feedback === "correct" && <span className="font-semibold text-success">✓ Benar</span>}
                    {feedback === "wrong" && <span className="font-semibold text-error">Belum tepat</span>}
                </div>
                <p className="mt-5 text-base leading-relaxed text-text-1">{question.ceritaSingkat}</p>
                <div className="mt-5">
                    {renderCode(
                        question.kodeDenganBlank,
                        question,
                        answer,
                        setAnswer,
                        checkAnswer,
                        feedback === "correct",
                    )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={checkAnswer}
                        disabled={!answer.trim() || feedback === "correct"}
                        className="h-10 rounded-[10px] bg-accent px-5 text-sm font-semibold text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        {feedback === "correct" ? "Benar ✓" : "Cek jawaban"}
                    </button>
                    <span className="text-[11px] text-text-2">Tekan Enter di input untuk mengirim</span>
                </div>
                {feedback === "wrong" && (
                    <div className="mt-4 rounded-[10px] border border-error/25 bg-surface/70 px-3 py-2.5 text-[12.5px] leading-relaxed text-text-1">
                        {question.penjelasanSingkat}
                    </div>
                )}
            </main>
        </div>
    );
}
