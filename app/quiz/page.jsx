import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Pagination from "../components/Pagination";
import { parsePage } from "../lib/pagination";
import { getQuizSetsPage } from "../lib/quiz";
import QuizBrowser from "./QuizBrowser";

export const metadata = {
    title: "Quiz Quick Review — Playground Belajar",
    description: "Latihan singkat operator dan loop dengan jawaban manual.",
};

export const dynamic = "force-dynamic";

export default async function QuizList({ searchParams }) {
    const params = await searchParams;
    const page = parsePage(params?.page);
    const { items: sets, total, page: currentPage } = await getQuizSetsPage(page);

    return (
        <div className="mx-auto flex min-h-dvh w-full max-w-screen-2xl flex-col gap-5 px-3 py-5 sm:px-5 lg:px-6">
            <header className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-heading text-2xl text-text-1">Quiz Quick Review</h1>
                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-2">
                        Isi bagian kode yang kosong. Jawab manual, lalu cek jawabanmu.
                    </p>
                </div>
                <SiteNav current="/quiz" />
            </header>

            {sets.length > 0 ? (
                <>
                    <QuizBrowser sets={sets} />
                    <Pagination page={currentPage} total={total} />
                </>
            ) : (
                <p className="rounded-app border border-dashed border-border px-6 py-12 text-center text-sm text-text-2">
                    Belum ada set quiz. Tambahkan lewat{" "}
                    <Link href="/admin" className="font-semibold text-accent">
                        halaman admin
                    </Link>
                    .
                </p>
            )}
        </div>
    );
}
