import Link from "next/link";
import { getMateriList, groupByKategori } from "../lib/materi";

export const metadata = {
  title: "Materi — Playground Belajar",
  description: "Bacaan dan penjelasan konsep, dikelompokkan per topik.",
};

// Materi bisa ditambah lewat /admin/materi kapan aja.
export const dynamic = "force-dynamic";

export default async function MateriList() {
  const list = await getMateriList();
  const groups = groupByKategori(list);

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-1">Materi</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-2">
            Bacaan buat nemenin latihan: penjelasan konsep, catatan, dan file
            yang bisa diunduh.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/mini-project"
            className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 transition-colors hover:bg-bg"
          >
            Mini project
          </Link>
          <Link
            href="/"
            className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-1 transition-colors hover:bg-bg"
          >
            ← Playground
          </Link>
        </div>
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
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.kategori} className="flex flex-col gap-3">
              <h2 className="flex items-baseline gap-2 font-heading text-lg text-text-1">
                {group.kategori}
                <span className="text-[12px] font-normal text-text-2">
                  {group.items.length} materi
                </span>
              </h2>

              <ul className="grid gap-3 md:grid-cols-2">
                {group.items.map((item) => (
                  <li key={item.id} className="flex">
                    <Link
                      href={`/materi/${item.id}`}
                      className="group flex flex-1 flex-col gap-2 rounded-app border border-border bg-surface p-4 transition-colors hover:border-accent/50 hover:bg-accent-soft/30"
                    >
                      <h3 className="font-heading text-base text-text-1">
                        {item.judul}
                      </h3>

                      {item.konten && (
                        <p className="line-clamp-3 text-[12.5px] leading-relaxed text-text-2">
                          {item.konten}
                        </p>
                      )}

                      <p className="mt-auto flex items-center gap-2 pt-1 text-[12.5px] font-semibold text-accent">
                        {item.file_url && <span aria-hidden>📎</span>}
                        Baca
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
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
