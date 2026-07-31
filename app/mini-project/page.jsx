import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Pagination from "../components/Pagination";
import { parsePage } from "../lib/pagination";
import { getProjectsPage } from "../lib/projects";
import ProjectBrowser from "./ProjectBrowser";

export const metadata = {
  title: "Mini Project — Playground Belajar",
  description:
    "Kumpulan mini project: program utuh yang minta input, dijalankan step-by-step.",
};

// Soalnya sekarang bisa ditambah lewat /admin kapan aja. Halaman ini dirender
// per request supaya soal baru langsung kelihatan tanpa build ulang.
export const dynamic = "force-dynamic";

export default async function MiniProjectList({ searchParams }) {
  const params = await searchParams;
  const page = parsePage(params?.page);
  const { items: all, total, page: currentPage } = await getProjectsPage(page);
  const projects = all.filter((project) => project.tipe === "mini");
  const partProjects = all.filter((project) => project.tipe === "berpart");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-screen-2xl flex-col gap-5 px-3 py-5 sm:px-5 lg:px-6">
      <header className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl text-text-1">Mini Project</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-2">
            Kumpulan soal untuk latihan
          </p>
        </div>
        <SiteNav current="/mini-project" />
      </header>

      {all.length > 0 && (
        <ProjectBrowser projects={projects} partProjects={partProjects} />
      )}

      {all.length > 0 && <Pagination page={currentPage} total={total} />}

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
