import { notFound } from "next/navigation";
import ProjectRunner from "../../components/ProjectRunner";
import { getMiniProject, getMiniProjects } from "../../lib/projects";

export async function generateStaticParams() {
  const projects = await getMiniProjects();
  return projects.map((project) => ({ id: project.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const project = await getMiniProject(id);
  if (!project) return { title: "Mini project tidak ditemukan" };
  return {
    title: `${project.judul} — Mini Project`,
    description: project.cerita,
  };
}

export default async function MiniProjectDetail({ params }) {
  // Next 16: `params` sampai sebagai Promise, harus di-await.
  const { id } = await params;
  const project = await getMiniProject(id);
  if (!project) notFound();

  const all = await getMiniProjects();
  const index = all.findIndex((item) => item.id === id);
  const next = index >= 0 ? (all[index + 1] ?? null) : null;

  return (
    // `key` per id: pindah project = komponen di-mount ulang, jadi kode, input,
    // dan progress hint mulai dari nol lagi — gak kebawa dari project sebelumnya.
    <ProjectRunner
      key={project.id}
      project={project}
      nextProject={next ? { id: next.id, judul: next.judul } : null}
    />
  );
}
