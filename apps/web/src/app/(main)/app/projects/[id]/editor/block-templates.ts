import type { PageBlock, PageBlockType } from "@honeymoney/agents";

export const BLOCK_LABELS: Record<PageBlockType, string> = {
  hero: "Topo (headline)",
  problem: "Problema",
  highlight: "Frase de destaque",
  solution: "Solução",
  comparison: "Antes e depois",
  benefits: "Benefícios",
  steps: "Como funciona",
  modules: "Módulos / conteúdo",
  audience: "Para quem é",
  bonuses: "Bônus",
  author: "Quem criou",
  price: "Preço",
  guarantee: "Garantia",
  faq: "Perguntas frequentes",
  cta: "Chamada final",
  text: "Texto livre",
};

export function newBlock(type: PageBlockType): PageBlock {
  switch (type) {
    case "hero":
      return {
        type,
        headline: "Título principal",
        subheadline: "Subtítulo",
        ctaLabel: "Quero agora",
        eyebrow: "Para quem é",
        highlights: ["Destaque"],
        trustLine: "Acesso imediato por e-mail · Garantia de 7 dias",
      };
    case "highlight":
      return { type, text: "A ideia central da sua oferta em uma frase." };
    case "comparison":
      return {
        type,
        title: "O que muda na sua rotina",
        withoutLabel: "Sem o método",
        withLabel: "Com o método",
        rows: [{ without: "Como é hoje", with: "Como fica" }],
      };
    case "steps":
      return {
        type,
        title: "Como funciona",
        items: [
          { title: "Garanta seu acesso", description: "Faça a compra no checkout seguro." },
          { title: "Receba por e-mail", description: "O acesso chega na hora." },
        ],
      };
    case "author":
      return { type, title: "Quem criou", name: "", text: "Conte sua história e por que criou este material." };
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
      return { type, title: "Investimento", priceLabel: "R$ 27,00", ctaLabel: "Quero começar", note: "", includes: [], badge: "Acesso imediato" };
    case "guarantee":
      return { type, title: "Garantia de 7 dias", text: "Se não gostar, devolvemos seu dinheiro.", days: 7 };
    case "faq":
      return { type, title: "Perguntas frequentes", items: [{ question: "Pergunta?", answer: "Resposta." }] };
    case "cta":
      return { type, headline: "Pronto para começar?", subheadline: "", ctaLabel: "Quero agora" };
    case "text":
      return { type, title: "Título", text: "Texto." };
  }
}
