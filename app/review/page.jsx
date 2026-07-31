import Link from "next/link";
import { getAllReviews } from "../lib/reviews";

export const metadata = {
    title: "Review Mode — Playground Belajar",
    description: "Prediksi jalannya program sebelum melihat visualisasi step-by-step.",
};

export const dynamic = "force-dynamic";

export default async function ReviewList() {
    const reviews = await getAllReviews();

    return (
        <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl text-text-1">Review Mode</h1>
                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-2">
                        Baca kode, prediksi dulu, baru lihat jejak eksekusinya. Fokus ke
                        logika loop tanpa cerita tambahan.
                    </p>
                </div>
                <nav className="flex items-center gap-2">
                    <Link
                        href="/materi"
                        className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 transition-colors hover:bg-bg"
                    >
                        Materi
                    </Link>
                    <Link
                        href="/mini-project"
                        className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 transition-colors hover:bg-bg"
                    >
                        Mini project
                    </Link>
                    <Link
                        href="/quiz"
                        className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 transition-colors hover:bg-bg"
                    >
                        Quick Review
                    </Link>
                    <Link
                        href="/"
                        className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 transition-colors hover:bg-bg"
                    >
                        ← Playground
                    </Link>
                </nav>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
                {reviews.map((review) => (
                    <Link
                        key={review.id}
                        href={`/review/${review.id}`}
                        className="group flex flex-col gap-3 rounded-app border border-border bg-surface p-5 transition-colors hover:border-accent/50 hover:bg-accent-soft/30"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <span className="rounded-full border border-accent/25 bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
                                Level {review.level}
                            </span>
                            <span className="font-mono text-[11px] text-text-2">
                                {review.jejakTervalidasi.length} putaran
                            </span>
                        </div>
                        <h2 className="font-heading text-xl text-text-1">{review.judul}</h2>
                        <p className="text-[13px] leading-relaxed text-text-2">
                            Tebak nilai akhir <code className="font-mono">{review.variabelDitebak}</code>{" "}
                            dan isi jejak putarannya sebelum kode dijalankan.
                        </p>
                        <span className="mt-auto text-[13px] font-semibold text-accent">
                            Mulai review →
                        </span>
                    </Link>
                ))}
            </div>

            {reviews.length === 0 && (
                <p className="rounded-app border border-dashed border-border px-6 py-12 text-center text-sm text-text-2">
                    Belum ada soal Review Mode.
                </p>
            )}
        </div>
    );
}