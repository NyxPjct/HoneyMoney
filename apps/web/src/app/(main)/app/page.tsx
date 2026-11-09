import type { Metadata } from "next";
import { ProjectList } from "./project-list";

export const metadata: Metadata = { title: "Projetos" };

export default function ProjectsPage() {
  return <ProjectList />;
}
