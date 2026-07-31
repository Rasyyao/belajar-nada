import Link from "next/link";
import { getAllQuizSets } from "../lib/quiz";

export const metadata = {
    title: "Quiz Quick Review — Playground Belajar",
    description: "Latihan singkat operator dan loop dengan jawaban manual.",
};

export const dynamic = "force-dynamic";

export default async function QuizList() {
    const sets = await getAllQuizSets();

    return (
        <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl text-text-1">Quiz Quick Review</h1>
                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-2">
                        Isi bagian kode yang kosong. Jawab manual, lalu lihat apakah human-error kecilmu sudah aman.
                    </p>
                </div>
                <nav className="flex flex-wrap items-center gap-2">
                    <Link href="/review" className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 hover:bg-bg">
                        Review Mode
                    </Link>
                    <Link href="/mini-project" className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 hover:bg-bg">
                        Mini project
                    </Link>
                    <Link href="/" className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 hover:bg-bg">
                        ← Playground
                    </Link>
                </nav>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
                {sets.map((set) => (
                    <Link
                        key={set.id}
                        href={`/quiz/${set.slug}`}
                        className="group flex min-h-52 flex-col gap-3 rounded-app border border-border bg-surface p-5 transition-colors hover:border-accent/50 hover:bg-accent-soft/30"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <span className="rounded-full border border-accent/25 bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
                                Set {set.urutan}
                            </span>
                            <span className="font-mono text-[11px] text-text-2">{set.soal.length} soal</span>
                        </div>
                        <h2 className="font-heading text-xl text-text-1">{set.judul}</h2>
                        <p className="text-[13px] leading-relaxed text-text-2">
                            Quick drill untuk arah operator, batas loop, index, dan perubahan nilai.
                        </p>
                        <span className="mt-auto text-[13px] font-semibold text-accent">Mulai set →</span>
                    </Link>
                ))}
            </section>

            {sets.length === 0 && (
                <p className="rounded-app border border-dashed border-border px-6 py-12 text-center text-sm text-text-2">
                    Belum ada set quiz.
                </p>
            )}
        </div>
    );
}
