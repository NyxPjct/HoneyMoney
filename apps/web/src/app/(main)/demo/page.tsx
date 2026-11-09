import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { OfficeDemo } from "./office-demo";

export const metadata: Metadata = {
  title: "Escritório de agentes (demonstração)",
  description: "Veja como os agentes do HoneyMoney trabalham em sequência até a Sentinela aprovar a oferta.",
};

export default function DemoPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">O escritório em ação</h1>
        <p className="mt-2 max-w-2xl text-stone-600 dark:text-stone-400">
          Simulação de uma geração completa, com uma rodada de ajuste pedida pela Sentinela. No app, cada personagem
          reflete o estado real da tarefa no servidor.
        </p>
        <OfficeDemo />
      </main>
      <SiteFooter />
    </>
  );
}
