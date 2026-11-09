import type { Metadata } from "next";
import { ProjectOffice } from "./project-office";

export const metadata: Metadata = { title: "Escritório" };

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectOffice id={id} />;
}
