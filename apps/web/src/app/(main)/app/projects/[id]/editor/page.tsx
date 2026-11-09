import type { Metadata } from "next";
import { PageEditor } from "./page-editor";

export const metadata: Metadata = { title: "Editor da página" };

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PageEditor projectId={id} />;
}
