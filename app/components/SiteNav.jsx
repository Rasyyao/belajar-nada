import Link from "next/link";

const ITEMS = [
    { href: "/", label: "Playground" },
    { href: "/mini-project", label: "Mini Project" },
    { href: "/materi", label: "Materi" },
    { href: "/quiz", label: "Quick Review" },
    { href: "/review", label: "Review Mode" },
];

export default function SiteNav({ current }) {
    return (
        <nav
            aria-label="Navigasi utama"
            className="flex w-full max-w-full flex-wrap items-center gap-1 rounded-[10px] border border-border bg-surface p-1 sm:w-auto"
        >
            {ITEMS.map((item) => {
                const isCurrent = item.href === current;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isCurrent ? "page" : undefined}
                        className={`flex min-h-8 items-center whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${isCurrent
                                ? "bg-accent-soft text-accent"
                                : "text-text-2 hover:bg-bg hover:text-text-1"
                            }`}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
