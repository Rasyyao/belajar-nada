import Link from "next/link";
import { listMateriForAdmin } from "../../lib/adminRead";
import DeleteButton from "../components/DeleteButton";

const tanggal = (value) =>
  new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function AdminMateri() {
  const list = await listMateriForAdmin();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-1">Kelola Materi</h1>
          <p className="mt-1.5 text-[13px] text-text-2">
            {list.length} materi di database, tampil di{" "}
            <Link href="/materi" className="font-semibold text-accent">
              /materi
            </Link>
            .
          </p>
        </div>
        <Link
          href="/admin/materi/new"
          className="flex h-10 items-center rounded-[10px] bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          + Tambah Materi
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="rounded-app border border-dashed border-border px-6 py-12 text-center text-sm text-text-2">
          Belum ada materi sama sekali.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-app border border-border bg-surface px-4 py-3"
            >
              <div className="min-w-[12rem] flex-1">
                <p className="font-heading text-base text-text-1">{item.judul}</p>
                <p className="text-[11.5px] text-text-2">
                  {item.kategori || "tanpa kategori"}
                  {item.file_url && " · ada file"}
                </p>
              </div>

              <span className="text-[12.5px] text-text-2">
                {tanggal(item.created_at)}
              </span>

              <div className="flex items-center gap-2">
                <Link
                  href={`/materi/${item.id}`}
                  className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-3 text-[12.5px] font-semibold text-text-2 transition-colors hover:bg-bg hover:text-text-1"
                >
                  Lihat
                </Link>
                <Link
                  href={`/admin/materi/${item.id}`}
                  className="flex h-9 items-center rounded-[10px] border border-accent/40 bg-accent-soft px-3 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent/10"
                >
                  Edit
                </Link>
                <DeleteButton url={`/api/admin/materi/${item.id}`} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
