import Link from "next/link";
import { notFound } from "next/navigation";
import { getCaseForEdit } from "../../../lib/adminRead";
import CaseForm from "../../components/CaseForm";

export default async function EditCase({ params }) {
  const { id } = await params;
  const initial = await getCaseForEdit(id);
  if (!initial) notFound();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/admin"
          className="text-[13px] font-semibold text-text-2 transition-colors hover:text-text-1"
        >
          ← Kelola Soal
        </Link>
        <h1 className="mt-1 font-heading text-2xl text-text-1">{initial.judul}</h1>
        <p className="no-liga mt-1 font-mono text-[12px] text-text-2">
          {initial.slug} · {initial.parts.length} part
        </p>
      </div>

      <CaseForm initial={initial} />
    </div>
  );
}
