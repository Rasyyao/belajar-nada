"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { partTheme, SEASONS } from "../lib/themes";

const SEARCH_DELAY = 300;

function Badge({ children }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg px-2.5 py-1 text-[11px] font-medium text-text-2">
            {children}
        </span>
    );
}

function dateValue(project) {
    if (!project.createdAt) return null;
    const value = Date.parse(project.createdAt);
    return Number.isNaN(value) ? null : value;
}

function dateLabel(project) {
    if (!dateValue(project)) return null;
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(project.createdAt));
}

function themeName(item) {
    return item.kind === "mini"
        ? item.project.tema
        : partTheme(item.project.visualTheme).tema;
}

function searchableText(item) {
    const project = item.project;
    const parts =
        item.kind === "mini"
            ? [project.tema, project.musim, ...(project.promptLabels ?? [])]
            : [
                ...project.parts.flatMap((part) => [
                    part.judulPart,
                    part.tema,
                    part.cerita,
                    part.deskripsiSoal,
                ]),
            ];

    return [
        project.judul,
        project.cerita,
        project.ceritaUtama,
        themeName(item),
        ...parts,
    ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("id-ID");
}

function ProjectCard({ item, meta, children }) {
    const { project } = item;
    const date = dateLabel(project);
    const season = item.kind === "mini" ? SEASONS[project.musim] : null;
    const theme = item.kind === "mini" ? null : partTheme(project.visualTheme);

    return (
        <li className="flex">
            <Link
                href={`/mini-project/${project.id}`}
                className="group flex flex-1 flex-col gap-3 rounded-app border border-border bg-surface p-5 transition-colors hover:border-accent/50 hover:bg-accent-soft/30"
            >
                <div className="flex items-start justify-between gap-3">
                    <Badge>
                        <span aria-hidden>{season?.emoji ?? theme?.emoji ?? "•"}</span>
                        {item.kind === "mini" ? season?.label ?? project.musim : "Soal berpart"}
                        <span className="text-border">·</span>
                        <code className="font-mono font-semibold text-accent">
                            {themeName(item)}
                        </code>
                    </Badge>
                    <span className="shrink-0 text-right font-mono text-[11px] text-text-2">
                        <span className="block">{meta}</span>
                        {date && <span className="mt-0.5 block">{date}</span>}
                    </span>
                </div>

                <h2 className="font-heading text-xl text-text-1">{project.judul}</h2>

                <p className="text-[13px] leading-relaxed text-text-2">
                    {item.kind === "mini" ? project.cerita : project.ceritaUtama}
                </p>

                {children}

                <p className="mt-auto flex items-center gap-2 pt-1 text-[13px] font-semibold text-accent">
                    Kerjain
                    <span
                        aria-hidden
                        className="transition-transform group-hover:translate-x-0.5"
                    >
                        →
                    </span>
                </p>
            </Link>
        </li>
    );
}

export default function ProjectBrowser({ projects, partProjects }) {
    const items = useMemo(
        () => [
            ...projects.map((project) => ({ kind: "mini", project })),
            ...partProjects.map((project) => ({ kind: "berpart", project })),
        ],
        [projects, partProjects],
    );
    const [queryInput, setQueryInput] = useState("");
    const [query, setQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [themeFilter, setThemeFilter] = useState("all");
    const [sort, setSort] = useState("default");

    useEffect(() => {
        const timer = setTimeout(
            () => setQuery(queryInput.trim().toLocaleLowerCase("id-ID")),
            SEARCH_DELAY,
        );
        return () => clearTimeout(timer);
    }, [queryInput]);

    const themeOptions = useMemo(
        () =>
            [...new Set(items.map(themeName).filter(Boolean))].sort((a, b) =>
                a.localeCompare(b, "id-ID"),
            ),
        [items],
    );

    const visibleItems = useMemo(() => {
        const filtered = items.filter((item) => {
            if (typeFilter !== "all" && item.kind !== typeFilter) return false;
            if (themeFilter !== "all" && themeName(item) !== themeFilter) {
                return false;
            }
            return !query || searchableText(item).includes(query);
        });

        return filtered
            .map((item, index) => ({ item, index }))
            .sort((a, b) => {
                if (sort === "default") return a.index - b.index;

                const aDate = dateValue(a.item.project);
                const bDate = dateValue(b.item.project);
                if (aDate === null && bDate === null) return a.index - b.index;
                if (aDate === null) return 1;
                if (bDate === null) return -1;
                return sort === "newest" ? bDate - aDate : aDate - bDate;
            })
            .map(({ item }) => item);
    }, [items, query, sort, themeFilter, typeFilter]);

    const isDebouncing = queryInput.trim().toLocaleLowerCase("id-ID") !== query;
    const resetFilters = () => {
        setQueryInput("");
        setTypeFilter("all");
        setThemeFilter("all");
        setSort("default");
    };

    return (
        <>
            <section className="flex flex-col gap-3 rounded-app border border-border bg-surface p-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_10rem_10rem]">
                    <label className="flex min-w-0 flex-col gap-1.5">
                        <span className="text-[11px] font-semibold tracking-wider text-text-2 uppercase">
                            Cari soal
                        </span>
                        <div className="relative">
                            <input
                                type="search"
                                value={queryInput}
                                onChange={(event) => setQueryInput(event.target.value)}
                                placeholder="Cari judul, cerita, tema…"
                                aria-label="Cari soal"
                                className="h-10 w-full rounded-[10px] border border-border bg-bg px-3 pr-9 text-[13px] text-text-1 outline-none transition-colors focus:border-accent"
                            />
                            {queryInput && (
                                <button
                                    type="button"
                                    onClick={() => setQueryInput("")}
                                    aria-label="Hapus pencarian"
                                    className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-text-2 hover:bg-border/50 hover:text-text-1"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold tracking-wider text-text-2 uppercase">
                            Tipe
                        </span>
                        <select
                            value={typeFilter}
                            onChange={(event) => setTypeFilter(event.target.value)}
                            className="h-10 rounded-[10px] border border-border bg-bg px-3 text-[13px] text-text-1 outline-none focus:border-accent"
                        >
                            <option value="all">Semua tipe</option>
                            <option value="mini">Mini project</option>
                            <option value="berpart">Soal berpart</option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold tracking-wider text-text-2 uppercase">
                            Tema
                        </span>
                        <select
                            value={themeFilter}
                            onChange={(event) => setThemeFilter(event.target.value)}
                            className="h-10 rounded-[10px] border border-border bg-bg px-3 text-[13px] text-text-1 outline-none focus:border-accent"
                        >
                            <option value="all">Semua tema</option>
                            {themeOptions.map((theme) => (
                                <option key={theme} value={theme}>
                                    {theme}
                                </option>
                            ))}
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
                            <option value="newest">Terbaru</option>
                            <option value="oldest">Terlama</option>
                        </select>
                    </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[12px] text-text-2">
                    <p aria-live="polite">
                        {isDebouncing
                            ? "Mencari…"
                            : `${visibleItems.length} soal ditemukan`}
                    </p>
                    {(queryInput ||
                        typeFilter !== "all" ||
                        themeFilter !== "all" ||
                        sort !== "default") && (
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

            {visibleItems.length > 0 ? (
                <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {visibleItems.map((item, index) => {
                        const project = item.project;
                        return (
                            <ProjectCard
                                key={project.id}
                                item={item}
                                meta={
                                    item.kind === "mini"
                                        ? `bagian ${index + 1} dari ${visibleItems.length}`
                                        : `${project.parts.length} part berurutan`
                                }
                            >
                                {item.kind === "berpart" && (
                                    <ol className="flex flex-col gap-1">
                                        {project.parts.map((part) => (
                                            <li
                                                key={part.partKe}
                                                className="flex items-baseline gap-2 text-[12.5px] text-text-2"
                                            >
                                                <span className="shrink-0 rounded-md border border-border bg-bg px-1.5 py-px font-mono text-[10px] font-semibold text-text-1">
                                                    Part {part.partKe}
                                                </span>
                                                {part.judulPart}
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </ProjectCard>
                        );
                    })}
                </ol>
            ) : (
                <p className="rounded-app border border-dashed border-border px-6 py-12 text-center text-sm text-text-2">
                    Tidak ada soal yang cocok. Coba ubah kata pencarian atau filter.
                </p>
            )}
        </>
    );
}