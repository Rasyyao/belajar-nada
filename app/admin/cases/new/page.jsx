import Link from "next/link";
import CaseForm from "../../components/CaseForm";

export default function NewCase() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/admin"
          className="text-[13px] font-semibold text-text-2 transition-colors hover:text-text-1"
        >
          ← Kelola Soal
        </Link>
        <h1 className="mt-1 font-heading text-2xl text-text-1">Soal Baru</h1>
        <p className="mt-1.5 text-[13px] text-text-2">
          Isi ceritanya, tulis starter code, terus pakai{" "}
          <strong className="text-text-1">Test Run</strong> buat mastiin hasil
          akhirnya beneran keluar dari kode — sebelum disimpen.
        </p>
      </div>

      <CaseForm />
    </div>
  );
}
