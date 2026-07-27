import { notFound } from "next/navigation";
import PartProjectRunner from "../../components/PartProjectRunner";
import ProjectRunner from "../../components/ProjectRunner";
import { getNextProject, getProject } from "../../lib/projects";

// Soalnya hidup di database dan bisa diubah lewat /admin, jadi halamannya
// dirender per request — bukan di-generate sekali pas build. Ini yang bikin
// soal baru langsung kebuka tanpa deploy ulang.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return { title: "Mini project tidak ditemukan" };

  return {
    title: `${project.judul} — Mini Project`,
    description: project.tipe === "mini" ? project.cerita : project.ceritaUtama,
  };
}

export default async function MiniProjectDetail({ params }) {
  // Next 16: `params` sampai sebagai Promise, harus di-await.
  const { id } = await params;

  const project = await getProject(id);
  if (!project) notFound();

  const next = await getNextProject(id);

  // Satu route buat dua skema soal: mini project (satu soal satu halaman) dan
  // soal berpart (beberapa part dalam satu halaman). Dibedain lewat kolom
  // `tipe`, bukan di URL, biar tautan dari daftar tetap seragam.
  //
  // `key` per id: pindah soal = komponen di-mount ulang, jadi kode, input,
  // dan progress hint mulai dari nol lagi — gak kebawa dari soal sebelumnya.
  return project.tipe === "mini" ? (
    <ProjectRunner key={project.id} project={project} nextProject={next} />
  ) : (
    <PartProjectRunner key={project.id} project={project} nextProject={next} />
  );
}
