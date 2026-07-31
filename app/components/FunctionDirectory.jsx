"use client";

import { useState } from "react";

function FunctionCard({ item, expanded, onToggle }) {
    const parameters = Array.isArray(item.parameter) ? item.parameter : [];
    const callers = Array.isArray(item.dipanggilOleh) ? item.dipanggilOleh : [];
    const returnText = typeof item.return === "string"
        ? item.return
        : item.return?.keterangan;

    return (
        <article className="overflow-hidden rounded-app border border-border bg-surface">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={expanded}
                className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-bg"
            >
                <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                        <code className="no-liga font-mono text-[13px] font-semibold text-text-1">
                            {item.nama}
                        </code>
                        {item.iniFunctionUtama && (
                            <span className="rounded-full border border-worked/30 bg-worked-soft px-2 py-0.5 text-[10px] font-semibold text-worked">
                                ★ Function Utama
                            </span>
                        )}
                    </span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-text-2">
                        {item.perananSingkat}
                    </span>
                </span>
                <span aria-hidden className="shrink-0 text-text-2">{expanded ? "⌃" : "⌄"}</span>
            </button>

            {expanded && (
                <div className="flex flex-col gap-3 border-t border-border px-3 py-3">
                    <div>
                        <h4 className="mb-1 text-[10px] font-semibold tracking-wider text-accent uppercase">Parameter</h4>
                        {parameters.length > 0 ? (
                            <ul className="flex flex-col gap-1.5">
                                {parameters.map((parameter, index) => (
                                    <li key={`${parameter.nama}-${index}`} className="text-[12px] leading-relaxed text-text-1">
                                        <code className="no-liga mr-1.5 rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[11px] text-accent">
                                            {parameter.nama}
                                        </code>
                                        <span className="text-text-2">{parameter.keterangan}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-[12px] text-text-2">Tidak menerima parameter.</p>
                        )}
                    </div>

                    <div>
                        <h4 className="mb-1 text-[10px] font-semibold tracking-wider text-worked uppercase">Return</h4>
                        <p className="text-[12px] leading-relaxed text-text-2">
                            {returnText || "Function ini tidak mengembalikan nilai."}
                        </p>
                    </div>

                    {callers.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-semibold tracking-wider text-text-2 uppercase">Dipanggil dari:</span>
                            {callers.map((caller) => (
                                <code key={caller} className="no-liga rounded-full border border-border bg-bg px-2 py-0.5 font-mono text-[10px] text-text-1">
                                    {caller}
                                </code>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}

export default function FunctionDirectory({ functions = [] }) {
    const items = functions.filter((item) => item?.nama);
    const defaultExpanded = items.length <= 2
        ? new Set(items.map((item) => item.nama))
        : new Set(items.filter((item) => item.iniFunctionUtama).map((item) => item.nama));
    const [expanded, setExpanded] = useState(defaultExpanded);

    if (items.length === 0) return null;

    const toggle = (name) => {
        setExpanded((current) => {
            const next = new Set(current);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    return (
        <section className="flex flex-col gap-2 rounded-app border border-border bg-bg p-3">
            <div className="flex items-baseline justify-between gap-2">
                <div>
                    <h3 className="font-heading text-base text-text-1">Daftar Function</h3>
                    <p className="mt-0.5 text-[11px] text-text-2">Peran tiap function, tanpa mencampur hasil eksekusi.</p>
                </div>
                <span className="font-mono text-[10px] text-text-2">{items.length} function</span>
            </div>
            <div className="flex flex-col gap-2">
                {items.map((item) => (
                    <FunctionCard
                        key={item.nama}
                        item={item}
                        expanded={expanded.has(item.nama)}
                        onToggle={() => toggle(item.nama)}
                    />
                ))}
            </div>
        </section>
    );
}
