import type {
  AudienceMap,
  Briefing,
  Copy,
  ManagerOutput,
  ModelCaller,
  ModelRequest,
  OfferSkeleton,
  PageDocument,
  SentinelReport,
} from "../src";

export const briefing: Briefing = {
  skill: "Organizo o orçamento da minha família há 10 anos com uma planilha simples",
  audience: "Pessoas CLT que chegam ao fim do mês sem saber para onde foi o salário",
  format: "spreadsheet",
  priceCents: 2700,
  currency: "BRL",
  language: "pt-BR",
};

export const managerReady: ManagerOutput = {
  status: "ready",
  summary: "Planilha de orçamento para trabalhadores CLT.",
  questions: [],
  rejectionReason: null,
};

export const audience: AudienceMap = {
  niche: "Educação financeira",
  subNiche: "Orçamento doméstico para CLT",
  audienceProfile: "Trabalhadores com carteira assinada, 25 a 45 anos, que recebem salário fixo.",
  pains: ["Não sabe para onde vai o salário", "Usa o cheque especial todo mês", "Briga em casa por dinheiro"],
  desires: ["Ter controle dos gastos", "Montar uma reserva"],
  objections: ["Já tentei planilha e desisti", "Não tenho tempo"],
  awarenessLevel: "problem_aware",
  vocabulary: ["salário", "boletos", "cartão"],
};

export const offer: OfferSkeleton = {
  productName: "Planilha Salário no Controle",
  promise: "Saiba para onde vai cada real do seu salário em 15 minutos por semana.",
  format: "spreadsheet",
  formatRationale: "Planilha é simples de usar e entregar.",
  suggestedPrice: { amountCents: 2700, currency: "BRL", rationale: "Preço acessível para iniciantes." },
  modules: [
    { title: "Configuração", description: "Preencha sua renda e contas fixas.", lessons: ["Renda", "Contas fixas"] },
    { title: "Gastos do dia a dia", description: "Registre gastos variáveis.", lessons: ["Categorias"] },
    { title: "Revisão semanal", description: "Rotina de 15 minutos.", lessons: ["Checklist"] },
  ],
  bonuses: [{ title: "Guia de categorias", description: "PDF com exemplos de categorias." }],
  guarantee: "7 dias de garantia incondicional.",
  differentiators: ["Feita para quem nunca usou planilha"],
};

export const copy: Copy = {
  headline: "Descubra para onde vai o seu salário",
  subheadline: "Uma planilha simples para organizar o mês em 15 minutos por semana.",
  salesPage: {
    hook: "O salário cai e some?",
    problem: "Sem controle, as contas se acumulam.",
    solution: "A planilha organiza tudo em categorias.",
    benefits: ["Visão clara dos gastos", "Alertas de contas", "Rotina semanal simples"],
    forWho: ["Quem recebe salário fixo", "Quem nunca usou planilha"],
    notForWho: ["Quem busca investimentos"],
    faq: [
      { question: "Funciona no celular?", answer: "Sim, no Google Planilhas." },
      { question: "Preciso saber Excel?", answer: "Não." },
      { question: "Tem garantia?", answer: "Sim, 7 dias." },
    ],
    guaranteeText: "Se não gostar, devolvemos seu dinheiro em até 7 dias.",
    cta: "Quero minha planilha",
  },
  emails: [
    { subject: "Seu salário sumiu?", body: "Olá! ..." },
    { subject: "15 minutos por semana", body: "Olá! ..." },
    { subject: "Última chamada", body: "Olá! ..." },
  ],
  ads: [
    { primaryText: "Organize seu salário.", headline: "Planilha simples", description: "Para CLT" },
    { primaryText: "Chega de cheque especial.", headline: "Controle", description: "Planilha" },
  ],
};

export const page: PageDocument = {
  theme: { accent: "emerald", style: "clean" },
  checkoutUrl: "",
  blocks: [
    { type: "hero", headline: copy.headline, subheadline: copy.subheadline, ctaLabel: "Quero minha planilha" },
    { type: "benefits", title: "O que você ganha", items: copy.salesPage.benefits },
    { type: "price", title: "Investimento", priceLabel: "R$ 27,00", ctaLabel: "Comprar", note: "Pagamento único" },
    { type: "guarantee", title: "Garantia", text: "7 dias de garantia incondicional." },
  ],
};

export const approvedReport: SentinelReport = { approved: true, summary: "Tudo certo.", issues: [] };

/** Which agent a request is for, read from the system prompt. */
export function agentOf(req: ModelRequest): string {
  const match = /You are "?([A-Za-zçã]+)"?/.exec(req.system);
  const name = match?.[1] ?? "";
  const map: Record<string, string> = {
    Gerente: "manager",
    Pesquisadora: "researcher",
    Estrategista: "strategist",
    Copywriter: "copywriter",
    Designer: "designer",
    Sentinela: "sentinel",
  };
  return map[name] ?? "unknown";
}

/** Fake model: each agent gets a queue of responses (strings or objects); the last one repeats. */
export function fakeModel(responses: Record<string, Array<unknown>>): ModelCaller & { calls: ModelRequest[] } {
  const calls: ModelRequest[] = [];
  const counters: Record<string, number> = {};
  const caller = (async (req: ModelRequest) => {
    calls.push(req);
    const agent = agentOf(req);
    const queue = responses[agent];
    if (!queue || queue.length === 0) throw new Error(`No fake response for ${agent}`);
    const i = counters[agent] ?? 0;
    counters[agent] = i + 1;
    const value = queue[Math.min(i, queue.length - 1)];
    return { text: typeof value === "string" ? value : JSON.stringify(value), usage: { inputTokens: 10, outputTokens: 20 } };
  }) as ModelCaller & { calls: ModelRequest[] };
  caller.calls = calls;
  return caller;
}

export const happyResponses = () => ({
  manager: [managerReady],
  researcher: [audience],
  strategist: [offer],
  copywriter: [copy],
  designer: [page],
  sentinel: [approvedReport],
});
