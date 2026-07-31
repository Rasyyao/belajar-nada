"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

function matchesSearch(set, query) {
    if (!query) return true;
    return `${set.judul} ${set.slug} ${set.soal
        .map((question) => question.ceritaSingkat)
        .join(" ")}`
        .toLocaleLowerCase("id-ID")
        .includes(query);
}

export default function QuizBrowser({ sets }) {
    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState("");
    const [questionFilter, setQuestionFilter] = useState("all");
    const [sort, setSort] = useState("default");

    const visibleSets = useMemo(() => {
        const filtered = sets.filter((set) => {
            if (!matchesSearch(set, query)) return false;
            if (questionFilter === "short" && set.soal.length > 5) return false;
            if (questionFilter === "long" && set.soal.length <= 5) return false;
            return true;
        });

        return [...filtered].sort((a, b) => {
            if (sort === "questions-desc") return b.soal.length - a.soal.length;
            if (sort === "questions-asc") return a.soal.length - b.soal.length;
            if (sort === "newest") return (b.urutan ?? 0) - (a.urutan ?? 0);
            return (a.urutan ?? 0) - (b.urutan ?? 0);
        });
    }, [query, questionFilter, sets, sort]);

    const applySearch = (event) => {
        event.preventDefault();
        setQuery(searchInput.trim().toLocaleLowerCase("id-ID"));
    };

    const resetFilters = () => {
        setSearchInput("");
        setQuery("");
        setQuestionFilter("all");
        setSort("default");
    };

    const hasFilters = Boolean(searchInput || query || questionFilter !== "all" || sort !== "default");

    return (
        <>
            <section className="flex flex-col gap-3 rounded-app border border-border bg-surface p-4">
                <form
                    onSubmit={applySearch}
                    className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_auto] lg:items-end"
                >
                    <label className="flex min-w-0 flex-col gap-1.5">
                        <span className="text-[11px] font-semibold tracking-wider text-text-2 uppercase">
                            Cari quiz
                        </span>
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Cari judul atau topik…"
                            aria-label="Cari quiz"
                            className="h-10 w-full rounded-[10px] border border-border bg-bg px-3 text-[13px] text-text-1 outline-none transition-colors focus:border-accent"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold tracking-wider text-text-2 uppercase">
                            Filter soal
                        </span>
                        <select
                            value={questionFilter}
                            onChange={(event) => setQuestionFilter(event.target.value)}
                            className="h-10 rounded-[10px] border border-border bg-bg px-3 text-[13px] text-text-1 outline-none focus:border-accent"
                        >
                            <option value="all">Semua jumlah</option>
                            <option value="short">1–5 soal</option>
                            <option value="long">6+ soal</option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold tracking-wider text-text-2 uppercase">
                            Urutkan
                        </span>
                        <select
                            value={sort}
                            onChange={(event) => setSort(event.target.value)}
                            className="h-10 rounded-[10px] border border-border bg-bg px-3 text-[13px] text-text-1 outline-none focus:border-accent"
                        >
                            <option value="default">Urutan bawaan</option>
                            <option value="questions-desc">Soal terbanyak</option>
                            <option value="questions-asc">Soal tersedikit</option>
                            <option value="newest">Urutan terbalik</option>
                        </select>
                    </label>

                    <button
                        type="submit"
                        className="h-10 rounded-[10px] bg-accent px-5 text-[13px] font-semibold text-white transition-colors hover:bg-accent/90"
                    >
                        Cari
                    </button>
                </form>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[12px] text-text-2">
                    <p aria-live="polite">{visibleSets.length} set ditemukan</p>
                    {hasFilters && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="font-semibold text-accent hover:underline"
                        >
                            Reset filter
                        </button>
                    )}
                </div>
            </section>

            {visibleSets.length > 0 ? (
                <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {visibleSets.map((set) => (
                        <Link
                            key={set.id}
                            href={`/quiz/${set.slug}`}
                            className="group flex min-h-52 min-w-0 flex-col gap-3 rounded-app border border-border bg-surface p-4 transition-colors hover:border-accent/50 hover:bg-accent-soft/30"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span className="shrink-0 rounded-full border border-accent/25 bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
                                    Set {set.urutan}
                                </span>
                                <span className="truncate font-mono text-[11px] text-text-2">
                                    {set.soal.length} soal
                                </span>
                            </div>
                            <h2 className="line-clamp-2 min-h-14 font-heading text-xl text-text-1">
                                {set.judul}
                            </h2>
                            <p className="line-clamp-3 text-[13px] leading-relaxed text-text-2">
                                Quick drill untuk operator, batas loop, index, dan perubahan nilai.
                            </p>
                            <span className="mt-auto text-[13px] font-semibold text-accent">
                                Mulai set <span aria-hidden>→</span>
                            </span>
                        </Link>
                    ))}
                </section>
            ) : (
                <p className="rounded-app border border-dashed border-border px-6 py-12 text-center text-sm text-text-2">
                    Tidak ada set quiz yang cocok. Coba ubah pencarian atau filter.
                </p>
            )}
        </>
    );
}
