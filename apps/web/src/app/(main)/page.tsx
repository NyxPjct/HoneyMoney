import { AGENT_META, AgentSprite, OFFICE_CSS, OfficeScene, type VisualState } from "@honeymoney/ui/office";
import { Badge, buttonVariants, cn } from "@honeymoney/ui";
import { BadgeCheck, Code2, HandCoins, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AGENT_ORDER } from "@/lib/labels";
import { GITHUB_URL } from "@/lib/site";

const HERO_STATES: Record<(typeof AGENT_ORDER)[number], VisualState> = {
  manager: "working",
  researcher: "done",
  strategist: "handoff",
  copywriter: "working",
  designer: "waiting",
  sentinel: "waiting",
};

const STEPS = [
  { title: "Conte o que você sabe", text: "Um briefing curto: sua habilidade, para quem é, o formato e o preço que imagina." },
  { title: "Os agentes trabalham", text: "Pesquisa de público, promessa, estrutura do produto, copy e página, um passo de cada vez." },
  { title: "A Sentinela revisa", text: "Nada de promessa de renda, alegação de saúde ou texto copiado. O que tiver problema volta para ajuste." },
  { title: "Você edita e publica", text: "Ajuste qualquer entrega, cole o link do seu checkout e publique a página num subdomínio." },
];

const PRINCIPLES = [
  { icon: HandCoins, title: "Grátis de verdade", text: "Sem planos pagos e sem moeda interna. Use sua própria chave de IA ou o modelo gratuito da instância." },
  { icon: BadgeCheck, title: "Honesto", text: "Nenhuma promessa ou estimativa de renda. A Sentinela barra exageros antes de qualquer publicação." },
  { icon: ShieldCheck, title: "Criar valor, não apostar", text: "Ajudamos a criar e vender produtos próprios. Trading, apostas e esquemas de “sócio” ficam de fora." },
  { icon: Code2, title: "Aberto", text: "Código público sob AGPL-3.0, fácil de hospedar e de contribuir." },
];

const FAQ = [
  {
    q: "Quanto custa?",
    a: "Nada. O HoneyMoney não tem plano pago. O custo de IA é de quem roda: você conecta sua chave (Gemini, OpenAI ou Claude) ou usa o modelo gratuito da instância, com limite diário.",
  },
  {
    q: "Minha chave de IA fica segura?",
    a: "Ela é criptografada no Supabase Vault, usada só no servidor e nunca volta para o navegador. Você vê apenas os últimos 4 dígitos e pode apagá-la quando quiser.",
  },
  {
    q: "O app diz quanto eu vou ganhar?",
    a: "Não, e nunca vai. Resultados dependem de muitas coisas fora do nosso controle. O app ajuda a criar um bom produto e uma página honesta.",
  },
  {
    q: "Posso hospedar minha própria versão?",
    a: "Sim. O código está no GitHub com instruções de instalação. Pela licença AGPL, quem oferecer uma versão modificada como serviço precisa publicar o código.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:py-20 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Badge tone="amber">Grátis e open source</Badge>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Crie sua oferta digital do zero, com uma equipe de agentes de IA.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-stone-600 dark:text-stone-300">
              Produto, página de vendas e copy prontos para você revisar e publicar. Você traz o que sabe; os agentes
              fazem o trabalho pesado, e você acompanha tudo num escritório animado.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                Começar grátis
              </Link>
              <Link href="/demo" className={buttonVariants({ size: "lg", variant: "outline" })}>
                Ver o escritório
              </Link>
            </div>
            <p className="mt-4 text-sm text-stone-500">Sem cartão, sem assinatura e sem promessas de renda.</p>
          </div>
          <OfficeScene states={HERO_STATES} title="Escritório de agentes" />
        </section>

        <section id="como-funciona" className="border-y border-stone-200 bg-white/60 py-16 dark:border-stone-800 dark:bg-stone-900/40">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold tracking-tight">Como funciona</h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <style>{OFFICE_CSS}</style>
          <h2 className="text-3xl font-bold tracking-tight">Sua equipe</h2>
          <p className="mt-2 max-w-2xl text-stone-600 dark:text-stone-400">
            Cada etapa é um personagem com mesa própria. O que você vê na tela é o estado real da tarefa.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AGENT_ORDER.map((agent) => {
              const meta = AGENT_META[agent];
              return (
                <li key={agent} className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                  <div className="shrink-0 rounded-lg bg-amber-50">
                    <AgentSprite agent={agent} state="waiting" size={96} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{meta.name}</h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400">{meta.title}</p>
                    <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">Entrega: {meta.deliverable}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bg-stone-900 py-16 text-stone-100">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold tracking-tight">Princípios</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PRINCIPLES.map(({ icon: Icon, title, text }) => (
                <div key={title}>
                  <Icon className="h-7 w-7 text-amber-400" aria-hidden />
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-stone-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight">Perguntas frequentes</h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <summary className="cursor-pointer font-semibold">{item.q}</summary>
                <p className="mt-2 text-stone-600 dark:text-stone-400">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-12 rounded-2xl bg-amber-100 p-8 text-center text-amber-950">
            <h2 className="text-2xl font-bold">Pronto para criar a sua oferta?</h2>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                Criar conta grátis
              </Link>
              <a href={GITHUB_URL} className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-amber-300")}>
                Ver no GitHub
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
