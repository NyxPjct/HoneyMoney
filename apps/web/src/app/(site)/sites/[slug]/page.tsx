import { PageDocumentSchema, SLUG_PATTERN } from "@honeymoney/agents";
import { PageRenderer } from "@honeymoney/ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createSupabaseAnonClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const loadPage = cache(async (slug: string) => {
  if (!SLUG_PATTERN.test(slug)) return null;
  const { data } = await createSupabaseAnonClient().rpc("get_published_page", { p_slug: slug });
  const row = data?.[0];
  if (!row) return null;
  const doc = PageDocumentSchema.safeParse(row.blocks);
  return doc.success ? { title: row.title, doc: doc.data } : null;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return { title: "Página não encontrada" };
  const hero = page.doc.blocks.find((b) => b.type === "hero");
  return {
    title: page.title,
    description: hero && hero.type === "hero" ? hero.subheadline : undefined,
  };
}

export default async function PublishedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();
  return <PageRenderer doc={page.doc} />;
}
