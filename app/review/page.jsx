import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Pagination from "../components/Pagination";
import { parsePage } from "../lib/pagination";
import { getReviewsPage } from "../lib/reviews";

export const metadata = {
    title: "Review Mode — Playground Belajar",
    description: "Prediksi jalannya program sebelum melihat visualisasi step-by-step.",
};

export const dynamic = "force-dynamic";

export default async function ReviewList({ searchParams }) {
    const params = await searchParams;
    const page = parsePage(params?.page);
    const { items: reviews, total, page: currentPage } = await getReviewsPage(page);

    return (
        <div className="mx-auto flex min-h-dvh w-full max-w-screen-2xl flex-col gap-5 px-3 py-5 sm:px-5 lg:px-6">
            <header className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-heading text-2xl text-text-1">Review Mode</h1>
                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-2">
                        Baca kode, prediksi dulu, baru lihat jejak eksekusinya. Fokus ke
                        logika loop tanpa cerita tambahan.
                    </p>
                </div>
                <SiteNav current="/review" />
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

            {reviews.length > 0 && <Pagination page={currentPage} total={total} />}

            {reviews.length === 0 && (
                <p className="rounded-app border border-dashed border-border px-6 py-12 text-center text-sm text-text-2">
                    Belum ada soal Review Mode.
                </p>
            )}
        </div>
    );
}