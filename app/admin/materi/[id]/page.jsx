import Link from "next/link";
import { notFound } from "next/navigation";
import { getMateriForEdit } from "../../../lib/adminRead";
import MateriForm from "../../components/MateriForm";

export default async function EditMateri({ params }) {
  const { id } = await params;
  const initial = await getMateriForEdit(id);
  if (!initial) notFound();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/admin/materi"
          className="text-[13px] font-semibold text-text-2 transition-colors hover:text-text-1"
        >
          ← Kelola Materi
        </Link>
        <h1 className="mt-1 font-heading text-2xl text-text-1">{initial.judul}</h1>
      </div>

      <MateriForm initial={initial} />
    </div>
  );
}
