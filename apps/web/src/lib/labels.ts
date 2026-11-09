import type { AgentName } from "@honeymoney/agents";

export const STATUS_LABELS: Record<string, { label: string; tone: "neutral" | "amber" | "green" | "blue" | "red" }> = {
  draft: { label: "Rascunho", tone: "neutral" },
  generating: { label: "Gerando", tone: "amber" },
  review: { label: "Revisão", tone: "blue" },
  published: { label: "Publicado", tone: "green" },
};

export const FORMAT_LABELS: Record<string, string> = {
  ebook: "E-book",
  course: "Curso",
  spreadsheet: "Planilha",
  mentoring: "Mentoria",
  template: "Template",
  other: "Outro",
};

export const PROVIDER_LABELS: Record<string, string> = {
  instance: "Modelo gratuito da instância",
  google: "Google Gemini (sua chave)",
  openai: "OpenAI (sua chave)",
  anthropic: "Anthropic Claude (sua chave)",
};

export const LOCALE_LABELS: Record<string, string> = { "pt-BR": "Português (Brasil)", es: "Español", en: "English" };

export const AGENT_ORDER: AgentName[] = ["manager", "researcher", "strategist", "copywriter", "designer", "sentinel"];

/** Field labels for deliverables and page blocks (pt-BR). Unknown keys are humanized. */
export const FIELD_LABELS: Record<string, string> = {
  niche: "Nicho",
  subNiche: "Subnicho",
  audienceProfile: "Perfil do público",
  pains: "Dores",
  desires: "Desejos",
  objections: "Objeções",
  awarenessLevel: "Nível de consciência",
  vocabulary: "Vocabulário do público",
  productName: "Nome do produto",
  promise: "Promessa",
  format: "Formato",
  formatRationale: "Por que esse formato",
  suggestedPrice: "Preço sugerido",
  amountCents: "Valor em centavos",
  currency: "Moeda",
  rationale: "Justificativa",
  modules: "Módulos",
  lessons: "Aulas / seções",
  bonuses: "Bônus",
  guarantee: "Garantia",
  differentiators: "Diferenciais",
  headline: "Título principal",
  subheadline: "Subtítulo",
  salesPage: "Página de vendas",
  hook: "Gancho",
  problem: "Problema",
  solution: "Solução",
  benefits: "Benefícios",
  forWho: "Para quem é",
  notForWho: "Para quem não é",
  faq: "Perguntas frequentes",
  question: "Pergunta",
  answer: "Resposta",
  guaranteeText: "Texto da garantia",
  cta: "Texto do botão",
  ctaLabel: "Texto do botão",
  emails: "E-mails",
  subject: "Assunto",
  body: "Mensagem",
  ads: "Anúncios",
  primaryText: "Texto principal",
  description: "Descrição",
  title: "Título",
  items: "Itens",
  text: "Texto",
  priceLabel: "Preço exibido",
  note: "Observação",
  summary: "Resumo",
  issues: "Ajustes",
  status: "Status",
  questions: "Perguntas",
  rejectionReason: "Motivo",
  approved: "Aprovado",
  agent: "Responsável",
  severity: "Gravidade",
  category: "Categoria",
  location: "Onde",
  suggestion: "Sugestão",
};

export const ENUM_OPTIONS: Record<string, readonly string[]> = {
  format: ["ebook", "course", "spreadsheet", "mentoring", "template", "other"],
  currency: ["BRL", "USD", "EUR"],
  awarenessLevel: ["unaware", "problem_aware", "solution_aware", "product_aware", "most_aware"],
  accent: ["amber", "emerald", "sky", "violet", "rose", "slate"],
  style: ["clean", "bold"],
};

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export const CATEGORY_LABELS: Record<string, string> = {
  income_claim: "Promessa de renda",
  guaranteed_result: "Resultado garantido",
  health_claim: "Alegação de saúde",
  prohibited_topic: "Tema proibido",
  price_mismatch: "Preço incoerente",
  language: "Português / idioma",
  copied_text: "Texto copiado",
  consistency: "Consistência",
  other: "Outro",
};
