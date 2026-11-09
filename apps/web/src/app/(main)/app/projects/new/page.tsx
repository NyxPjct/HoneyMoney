import type { Metadata } from "next";
import { BriefingForm } from "./briefing-form";

export const metadata: Metadata = { title: "Nova oferta" };

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Nova oferta</h1>
      <p className="mt-1 text-sm text-stone-500">
        Responda com suas palavras. Quanto mais concreto, melhor o trabalho dos agentes.
      </p>
      <BriefingForm />
    </div>
  );
}
