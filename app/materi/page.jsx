import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Pagination from "../components/Pagination";
import MateriBrowser from "./MateriBrowser";
import { parsePage } from "../lib/pagination";
import { getMateriPage } from "../lib/materi";

export const metadata = {
  title: "Materi — Playground Belajar",
  description: "Bacaan dan penjelasan konsep, dikelompokkan per topik.",
};

// Materi bisa ditambah lewat /admin/materi kapan aja.
export const dynamic = "force-dynamic";

export default async function MateriList({ searchParams }) {
  const params = await searchParams;
  const page = parsePage(params?.page);
  const { items: list, total, page: currentPage } = await getMateriPage(page);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-screen-2xl flex-col gap-5 px-3 py-5 sm:px-5 lg:px-6">
      <header className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl text-text-1">Materi</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-2">
            Bacaan buat nemenin latihan: penjelasan konsep, catatan, dan file
            yang bisa diunduh.
          </p>
        </div>
        <SiteNav current="/materi" />
      </header>

      {list.length === 0 ? (
        <p className="rounded-app border border-dashed border-border px-6 py-12 text-center text-sm text-text-2">
          Belum ada materi. Tambahin lewat{" "}
          <Link href="/admin/materi" className="font-semibold text-accent">
            halaman admin
          </Link>
          .
        </p>
      ) : (
        <>
          <MateriBrowser list={list} />
          <Pagination page={currentPage} total={total} />
        </>
      )}
    </div>
  );
}
