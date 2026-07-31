"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

function matchesSearch(item, query) {
    if (!query) return true;
    return `${item.judul} ${item.kategori ?? ""} ${item.konten ?? ""}`
        .toLocaleLowerCase("id-ID")
        .includes(query);
}

export default function MateriBrowser({ list }) {
    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [fileFilter, setFileFilter] = useState("all");
    const [sort, setSort] = useState("default");

    const categories = useMemo(
        () => [...new Set(list.map((item) => item.kategori?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id-ID")),
        [list],
    );

    const visibleItems = useMemo(() => {
        const filtered = list.filter((item) => {
            if (!matchesSearch(item, query)) return false;
            if (categoryFilter !== "all" && (item.kategori?.trim() || "Lain-lain") !== categoryFilter) return false;
            if (fileFilter === "with-file" && !item.file_url) return false;
            if (fileFilter === "without-file" && item.file_url) return false;
            return true;
        });

        return [...filtered].sort((a, b) => {
            if (sort === "title") return a.judul.localeCompare(b.judul, "id-ID");
            if (sort === "newest") return Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? "");
            return 0;
        });
    }, [categoryFilter, fileFilter, list, query, sort]);

    const groupedItems = useMemo(() => {
        const groups = new Map();
        for (const item of visibleItems) {
            const category = item.kategori?.trim() || "Lain-lain";
            if (!groups.has(category)) groups.set(category, []);
            groups.get(category).push(item);
        }
        return [...groups.entries()].map(([kategori, items]) => ({ kategori, items }));
    }, [visibleItems]);

    const applySearch = (event) => {
        event.preventDefault();
        setQuery(searchInput.trim().toLocaleLowerCase("id-ID"));
    };

    const resetFilters = () => {
        setSearchInput("");
        setQuery("");
        setCategoryFilter("all");
        setFileFilter("all");
        setSort("default");
    };

    const hasFilters = Boolean(searchInput || query || categoryFilter !== "all" || fileFilter !== "all" || sort !== "default");

    return (
        <>
            <section className="flex flex-col gap-3 rounded-app border border-border bg-surface p-4">
                <form
                    onSubmit={applySearch}
                    className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_auto] lg:items-end"
                >
                    <label className="flex min-w-0 flex-col gap-1.5">
                        <span className="text-[11px] font-semibold tracking-wider text-text-2 uppercase">
                            Cari materi
                        </span>
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Cari judul atau isi…"
                            aria-label="Cari materi"
                            className="h-10 w-full rounded-[10px] border border-border bg-bg px-3 text-[13px] text-text-1 outline-none transition-colors focus:border-accent"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold tracking-wider text-text-2 uppercase">
                            Kategori
                        </span>
                        <select
                            value={categoryFilter}
                            onChange={(event) => setCategoryFilter(event.target.value)}
                            className="h-10 rounded-[10px] border border-border bg-bg px-3 text-[13px] text-text-1 outline-none focus:border-accent"
                        >
                            <option value="all">Semua kategori</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold tracking-wider text-text-2 uppercase">
                            File
                        </span>
                        <select
                            value={fileFilter}
                            onChange={(event) => setFileFilter(event.target.value)}
                            className="h-10 rounded-[10px] border border-border bg-bg px-3 text-[13px] text-text-1 outline-none focus:border-accent"
                        >
                            <option value="all">Semua materi</option>
                            <option value="with-file">Dengan file</option>
                            <option value="without-file">Tanpa file</option>
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
                    <p aria-live="polite">{visibleItems.length} materi ditemukan</p>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2">
                            <span>Urutkan</span>
                            <select
                                value={sort}
                                onChange={(event) => setSort(event.target.value)}
                                className="rounded-md border border-border bg-bg px-2 py-1 text-[12px] text-text-1 outline-none focus:border-accent"
                            >
                                <option value="default">Bawaan</option>
                                <option value="title">Judul A–Z</option>
                                <option value="newest">Terbaru</option>
                            </select>
                        </label>
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
                </div>
            </section>

            {groupedItems.length > 0 ? (
                <div className="flex flex-col gap-5">
                    {groupedItems.map((group) => (
                        <section key={group.kategori} className="flex flex-col gap-3">
                            <h2 className="flex items-baseline gap-2 font-heading text-lg text-text-1">
                                {group.kategori}
                                <span className="text-[12px] font-normal text-text-2">
                                    {group.items.length} materi
                                </span>
                            </h2>

                            <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {group.items.map((item) => (
                                    <li key={item.id} className="flex min-w-0">
                                        <Link
                                            href={`/materi/${item.id}`}
                                            className="group flex min-w-0 flex-1 flex-col gap-2 rounded-app border border-border bg-surface p-4 transition-colors hover:border-accent/50 hover:bg-accent-soft/30"
                                        >
                                            <h3 className="line-clamp-2 min-h-12 font-heading text-base text-text-1">
                                                {item.judul}
                                            </h3>

                                            {item.konten && (
                                                <p className="line-clamp-3 text-[12.5px] leading-relaxed text-text-2">
                                                    {item.konten}
                                                </p>
                                            )}

                                            <p className="mt-auto flex items-center gap-2 pt-1 text-[12.5px] font-semibold text-accent">
                                                {item.file_url && <span aria-hidden>📎</span>}
                                                Baca
                                                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                                                    →
                                                </span>
                                            </p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            ) : (
                <p className="rounded-app border border-dashed border-border px-6 py-12 text-center text-sm text-text-2">
                    Tidak ada materi yang cocok. Coba ubah pencarian atau filter.
                </p>
            )}
        </>
    );
}
