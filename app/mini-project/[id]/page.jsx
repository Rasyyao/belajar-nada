import { notFound } from "next/navigation";
import PartProjectRunner from "../../components/PartProjectRunner";
import ProjectRunner from "../../components/ProjectRunner";
import {
  getMiniProject,
  getMiniProjects,
  getNextProject,
  getPartProject,
  getPartProjects,
} from "../../lib/projects";

export async function generateStaticParams() {
  const [projects, partProjects] = await Promise.all([
    getMiniProjects(),
    getPartProjects(),
  ]);
  return [...projects, ...partProjects].map((project) => ({ id: project.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const project = await getMiniProject(id);
  if (project) {
    return {
      title: `${project.judul} — Mini Project`,
      description: project.cerita,
    };
  }

  const partProject = await getPartProject(id);
  if (partProject) {
    return {
      title: `${partProject.judul} — Mini Project`,
      description: partProject.ceritaUtama,
    };
  }

  return { title: "Mini project tidak ditemukan" };
}

export default async function MiniProjectDetail({ params }) {
  // Next 16: `params` sampai sebagai Promise, harus di-await.
  const { id } = await params;

  // Satu route buat dua skema soal: mini project (satu soal satu halaman) dan
  // soal berpart (beberapa part dalam satu halaman). Dibedain di sini, bukan di
  // URL, biar tautan dari daftar tetap seragam.
  const project = await getMiniProject(id);
  const partProject = project ? null : await getPartProject(id);
  if (!project && !partProject) notFound();

  const next = await getNextProject(id);

  // `key` per id: pindah soal = komponen di-mount ulang, jadi kode, input,
  // dan progress hint mulai dari nol lagi — gak kebawa dari soal sebelumnya.
  return project ? (
    <ProjectRunner key={project.id} project={project} nextProject={next} />
  ) : (
    <PartProjectRunner
      key={partProject.id}
      project={partProject}
      nextProject={next}
    />
  );
}
