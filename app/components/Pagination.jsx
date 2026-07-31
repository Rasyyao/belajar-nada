import Link from "next/link";
import { PAGE_SIZE, pageCount } from "../lib/pagination";

function hrefFor(page) {
    return `?page=${page}`;
}

export default function Pagination({ page, total, pageSize = PAGE_SIZE }) {
    const totalPages = pageCount(total, pageSize);
    if (totalPages <= 1) return null;

    return (
        <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
        >
            <p className="text-[12px] text-text-2">
                Halaman <strong className="text-text-1">{page}</strong> dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
                {page > 1 ? (
                    <Link
                        href={hrefFor(page - 1)}
                        className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-3 text-[13px] font-semibold text-text-2 transition-colors hover:bg-bg hover:text-text-1"
                    >
                        ← Sebelumnya
                    </Link>
                ) : (
                    <span className="flex h-9 items-center rounded-[10px] border border-border/60 px-3 text-[13px] font-semibold text-text-2/40">
                        ← Sebelumnya
                    </span>
                )}
                {page < totalPages ? (
                    <Link
                        href={hrefFor(page + 1)}
                        className="flex h-9 items-center rounded-[10px] bg-accent px-3 text-[13px] font-semibold text-white transition-colors hover:bg-accent/90"
                    >
                        Berikutnya →
                    </Link>
                ) : (
                    <span className="flex h-9 items-center rounded-[10px] bg-accent/40 px-3 text-[13px] font-semibold text-white/70">
                        Berikutnya →
                    </span>
                )}
            </div>
        </nav>
    );
}
