import Link from "next/link";
import MateriForm from "../../components/MateriForm";

export default function NewMateri() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/admin/materi"
          className="text-[13px] font-semibold text-text-2 transition-colors hover:text-text-1"
        >
          ← Kelola Materi
        </Link>
        <h1 className="mt-1 font-heading text-2xl text-text-1">Materi Baru</h1>
      </div>

      <MateriForm />
    </div>
  );
}
