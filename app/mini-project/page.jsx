import Link from "next/link";
import {
  getMiniProjects,
  getPartProjects,
  partTheme,
  SEASONS,
} from "../lib/projects";

export const metadata = {
  title: "Mini Project — Playground Belajar",
  description:
    "Kumpulan mini project: program utuh yang minta input, dijalankan step-by-step.",
};

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg px-2.5 py-1 text-[11px] font-medium text-text-2">
      {children}
    </span>
  );
}

/** Kulit kartu dipisah biar dua jenis soal kelihatan setara di daftar. */
function ProjectCard({ href, badge, meta, judul, cerita, children }) {
  return (
    <li className="flex">
      <Link
        href={href}
        className="group flex flex-1 flex-col gap-3 rounded-app border border-border bg-surface p-5 transition-colors hover:border-accent/50 hover:bg-accent-soft/30"
      >
        <div className="flex items-center justify-between gap-3">
          {badge}
          <span className="font-mono text-[11px] text-text-2">{meta}</span>
        </div>

        <h2 className="font-heading text-xl text-text-1">{judul}</h2>

        <p className="text-[13px] leading-relaxed text-text-2">{cerita}</p>

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

export default async function MiniProjectList() {
  const [projects, partProjects] = await Promise.all([
    getMiniProjects(),
    getPartProjects(),
  ]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-1">Mini Project</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-2">
            Bukan soal drill — ini program utuh yang minta jawaban dulu, baru
            nentuin hasilnya. Dua project Tupai nyambung ceritanya (musim gugur
            nimbun, musim dingin bongkar), sementara soal berpart dikerjain
            bertahap di satu halaman.
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
        {projects.map((project, index) => {
          const season = SEASONS[project.musim];
          return (
            <ProjectCard
              key={project.id}
              href={`/mini-project/${project.id}`}
              judul={project.judul}
              cerita={project.cerita}
              meta={`bagian ${index + 1} dari ${projects.length}`}
              badge={
                <Badge>
                  <span aria-hidden>{season?.emoji ?? "•"}</span>
                  {season?.label ?? project.musim}
                  <span className="text-border">·</span>
                  <code className="font-mono font-semibold text-accent">
                    {project.tema}
                  </code>
                </Badge>
              }
            />
          );
        })}

        {/* Soal berpart: tetap SATU kartu walau di dalamnya ada beberapa part —
            part-nya baru kelihatan setelah kartunya dibuka. */}
        {partProjects.map((project) => {
          const theme = partTheme(project.visualTheme);
          return (
            <ProjectCard
              key={project.id}
              href={`/mini-project/${project.id}`}
              judul={project.judul}
              cerita={project.ceritaUtama}
              meta={`${project.parts.length} part berurutan`}
              badge={
                <Badge>
                  <span aria-hidden>{theme.emoji}</span>
                  Soal berpart
                  <span className="text-border">·</span>
                  <code className="font-mono font-semibold text-accent">
                    {theme.tema}
                  </code>
                </Badge>
              }
            >
              <ol className="flex flex-col gap-1">
                {project.parts.map((part) => (
                  <li
                    key={part.partKe}
                    className="flex items-baseline gap-2 text-[12.5px] text-text-2"
                  >
                    <span className="shrink-0 rounded-[6px] border border-border bg-bg px-1.5 py-px font-mono text-[10px] font-semibold text-text-1">
                      Part {part.partKe}
                    </span>
                    {part.judulPart}
                  </li>
                ))}
              </ol>
            </ProjectCard>
          );
        })}
      </ol>

      <p className="text-xs text-text-2">
        Materi masih dibaca dari{" "}
        <code className="font-mono">app/data/mini-projects.json</code> dan{" "}
        <code className="font-mono">app/data/part-projects.json</code>.
      </p>
    </div>
  );
}
