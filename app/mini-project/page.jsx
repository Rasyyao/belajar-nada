import Link from "next/link";
import { getAllProjects } from "../lib/projects";
import ProjectBrowser from "./ProjectBrowser";

export const metadata = {
  title: "Mini Project — Playground Belajar",
  description:
    "Kumpulan mini project: program utuh yang minta input, dijalankan step-by-step.",
};

// Soalnya sekarang bisa ditambah lewat /admin kapan aja. Halaman ini dirender
// per request supaya soal baru langsung kelihatan tanpa build ulang.
export const dynamic = "force-dynamic";

export default async function MiniProjectList() {
  // Satu query buat dua jenis soal, dipisah di sini — supaya urutan `urutan`
  // dari database kejaga di dalam masing-masing kelompok.
  const all = await getAllProjects();
  const projects = all.filter((project) => project.tipe === "mini");
  const partProjects = all.filter((project) => project.tipe === "berpart");

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-1">Mini Project</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-2">
            Kumpulan soal untuk latihan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/materi"
            className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 transition-colors hover:bg-bg"
          >
            Materi
          </Link>
          <Link
            href="/"
            className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 transition-colors hover:bg-bg"
          >
            ← Playground
          </Link>
        </div>
      </header>

      {all.length > 0 && (
        <ProjectBrowser projects={projects} partProjects={partProjects} />
      )}

      {all.length === 0 && (
        <p className="rounded-app border border-dashed border-border px-6 py-12 text-center text-sm text-text-2">
          Belum ada soal sama sekali. Tambahin lewat{" "}
          <Link href="/admin" className="font-semibold text-accent">
            halaman admin
          </Link>
          .
        </p>
      )}
    </div>
  );
}
