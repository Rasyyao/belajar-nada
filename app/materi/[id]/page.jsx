import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "../../components/Markdown";
import { getMateri } from "../../lib/materi";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const materi = await getMateri(id);
  if (!materi) return { title: "Materi tidak ditemukan" };
  return {
    title: `${materi.judul} — Materi`,
    description: materi.konten?.slice(0, 160) ?? undefined,
  };
}

/** PDF di-embed langsung; format lain cukup dikasih tautan unduh. */
const isPdf = (url) => /\.pdf(\?|#|$)/i.test(url);

function namaFile(url) {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.slice(path.lastIndexOf("/") + 1)) || "file";
  } catch {
    return "file";
  }
}

export default async function MateriDetail({ params }) {
  const { id } = await params;
  const materi = await getMateri(id);
  if (!materi) notFound();

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-5 px-4 py-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/materi"
          className="text-[13px] font-semibold text-text-2 transition-colors hover:text-text-1"
        >
          ← Materi
        </Link>

        <h1 className="font-heading text-2xl text-text-1">{materi.judul}</h1>

        {materi.kategori && (
          <span className="self-start rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-text-2">
            {materi.kategori}
          </span>
        )}
      </header>

      {materi.konten && (
        <article className="rounded-app border border-border bg-surface px-5 py-4">
          <Markdown>{materi.konten}</Markdown>
        </article>
      )}

      {materi.file_url && (
        <section className="flex flex-col gap-3 rounded-app border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-heading text-base text-text-1">File materi</h2>
            <a
              href={materi.file_url}
              target="_blank"
              rel="noreferrer noopener"
              className="ml-auto flex h-9 items-center gap-2 rounded-[10px] border border-border bg-surface px-3.5 text-[13px] font-semibold text-text-1 transition-colors hover:bg-bg"
            >
              <span aria-hidden>📎</span>
              {namaFile(materi.file_url)}
            </a>
          </div>

          {isPdf(materi.file_url) && (
            <iframe
              src={materi.file_url}
              title={`Pratinjau ${materi.judul}`}
              className="h-[70vh] w-full rounded-app border border-border bg-bg"
            />
          )}
        </section>
      )}

      {!materi.konten && !materi.file_url && (
        <p className="rounded-app border border-dashed border-border px-6 py-12 text-center text-sm text-text-2">
          Materi ini belum ada isinya.
        </p>
      )}
    </div>
  );
}
