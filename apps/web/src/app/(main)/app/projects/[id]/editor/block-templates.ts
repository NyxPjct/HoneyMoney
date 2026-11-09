import type { PageBlock, PageBlockType } from "@honeymoney/agents";

export const BLOCK_LABELS: Record<PageBlockType, string> = {
  hero: "Topo (headline)",
  problem: "Problema",
  solution: "Solução",
  benefits: "Benefícios",
  modules: "Módulos / conteúdo",
  audience: "Para quem é",
  bonuses: "Bônus",
  price: "Preço",
  guarantee: "Garantia",
  faq: "Perguntas frequentes",
  cta: "Chamada final",
  text: "Texto livre",
};

export function newBlock(type: PageBlockType): PageBlock {
  switch (type) {
    case "hero":
      return { type, headline: "Título principal", subheadline: "Subtítulo", ctaLabel: "Quero agora" };
    case "problem":
      return { type, title: "O problema", text: "Descreva o problema." };
    case "solution":
      return { type, title: "A solução", text: "Descreva a solução." };
    case "benefits":
      return { type, title: "O que você recebe", items: ["Benefício"] };
    case "modules":
      return { type, title: "Conteúdo", items: [{ title: "Módulo 1", description: "Descrição" }] };
    case "audience":
      return { type, title: "Para quem é", forWho: ["Para quem…"], notForWho: [] };
    case "bonuses":
      return { type, title: "Bônus", items: [{ title: "Bônus", description: "Descrição" }] };
    case "price":
      return { type, title: "Investimento", priceLabel: "R$ 27,00", ctaLabel: "Comprar", note: "" };
    case "guarantee":
      return { type, title: "Garantia de 7 dias", text: "Se não gostar, devolvemos seu dinheiro." };
    case "faq":
      return { type, title: "Perguntas frequentes", items: [{ question: "Pergunta?", answer: "Resposta." }] };
    case "cta":
      return { type, headline: "Pronto para começar?", ctaLabel: "Quero agora" };
    case "text":
      return { type, title: "Título", text: "Texto." };
  }
}
