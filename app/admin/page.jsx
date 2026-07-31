import Link from "next/link";
import { listCases } from "../lib/adminRead";
import { partTheme } from "../lib/themes";
import DeleteButton from "./components/DeleteButton";
import JsonCaseImporter from "./components/JsonCaseImporter";

const tanggal = (value) =>
  new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function AdminCases() {
  const cases = await listCases();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-1">Kelola Soal</h1>
          <p className="mt-1.5 text-[13px] text-text-2">
            {cases.length} soal di database. Yang disimpen di sini langsung
            kelihatan di halaman siswa — gak perlu deploy ulang.
          </p>
        </div>
        <Link
          href="/admin/cases/new"
          className="flex h-10 items-center rounded-[10px] bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          + Tambah Soal Baru
        </Link>
      </div>

      <JsonCaseImporter />

      {cases.length === 0 ? (
        <p className="rounded-app border border-dashed border-border px-6 py-12 text-center text-sm text-text-2">
          Belum ada soal. Kalau soal lama masih di file JSON, jalanin{" "}
          <code className="font-mono">node scripts/seed.mjs</code> buat mindahin
          semuanya ke database.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {cases.map((item) => {
            const theme = partTheme(item.visual_theme);
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-app border border-border bg-surface px-4 py-3"
              >
                <span aria-hidden className="text-xl">
                  {theme.emoji}
                </span>

                <div className="min-w-48 flex-1">
                  <p className="font-heading text-base text-text-1">{item.judul}</p>
                  <p className="no-liga font-mono text-[11.5px] text-text-2">
                    {item.slug}
                  </p>
                </div>

                <span className="rounded-full border border-border bg-bg px-2.5 py-1 text-[11px] font-medium text-text-2">
                  {item.tipe === "mini" ? "Mini project" : "Soal berpart"}
                </span>

                <span className="text-[12.5px] text-text-2 tabular-nums">
                  {item.jumlahPart} part
                </span>

                <span className="text-[12.5px] text-text-2">
                  {tanggal(item.created_at)}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/mini-project/${item.slug}`}
                    className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-3 text-[12.5px] font-semibold text-text-2 transition-colors hover:bg-bg hover:text-text-1"
                  >
                    Lihat
                  </Link>
                  <Link
                    href={`/admin/cases/${item.id}`}
                    className="flex h-9 items-center rounded-[10px] border border-accent/40 bg-accent-soft px-3 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent/10"
                  >
                    Edit
                  </Link>
                  <DeleteButton url={`/api/admin/cases/${item.id}`} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
