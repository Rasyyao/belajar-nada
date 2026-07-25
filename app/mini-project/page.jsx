import Link from "next/link";
import { getMiniProjects, SEASONS } from "../lib/projects";

export const metadata = {
  title: "Mini Project — Playground Belajar",
  description:
    "Kumpulan mini project: program utuh yang minta input, dijalankan step-by-step.",
};

function SeasonBadge({ musim, tema }) {
  const season = SEASONS[musim];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg px-2.5 py-1 text-[11px] font-medium text-text-2">
      <span aria-hidden>{season?.emoji ?? "•"}</span>
      {season?.label ?? musim}
      <span className="text-border">·</span>
      <code className="font-mono font-semibold text-accent">{tema}</code>
    </span>
  );
}

export default async function MiniProjectList() {
  const projects = await getMiniProjects();

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-1">Mini Project</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-2">
            Bukan soal drill — ini program utuh yang minta jawaban dulu, baru
            nentuin hasilnya. Dua project di bawah nyambung ceritanya: musim
            gugur nimbun, musim dingin bongkar.
          </p>
        </div>
        <Link
          href="/"
          className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 transition-colors hover:bg-bg"
        >
          ← Playground
        </Link>
      </header>

      <ol className="grid gap-4 md:grid-cols-2">
        {projects.map((project, index) => (
          <li key={project.id} className="flex">
            <Link
              href={`/mini-project/${project.id}`}
              className="group flex flex-1 flex-col gap-3 rounded-app border border-border bg-surface p-5 transition-colors hover:border-accent/50 hover:bg-accent-soft/30"
            >
              <div className="flex items-center justify-between gap-3">
                <SeasonBadge musim={project.musim} tema={project.tema} />
                <span className="font-mono text-[11px] text-text-2">
                  bagian {index + 1} dari {projects.length}
                </span>
              </div>

              <h2 className="font-heading text-xl text-text-1">
                {project.judul}
              </h2>

              <p className="text-[13px] leading-relaxed text-text-2">
                {project.cerita}
              </p>

              <p className="mt-auto flex items-center gap-2 text-[13px] font-semibold text-accent">
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
        ))}
      </ol>

      <p className="text-xs text-text-2">
        Materi masih dibaca dari <code className="font-mono">app/data/mini-projects.json</code>.
      </p>
    </div>
  );
}
