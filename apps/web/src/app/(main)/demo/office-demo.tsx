"use client";

import type { AgentName } from "@honeymoney/agents";
import { Button } from "@honeymoney/ui";
import { AGENT_META, OfficeScene, type VisualState } from "@honeymoney/ui/office";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

type Frame = { states: Partial<Record<AgentName, VisualState>>; log: string };

const W: Record<AgentName, VisualState> = {
  manager: "waiting",
  researcher: "waiting",
  strategist: "waiting",
  copywriter: "waiting",
  designer: "waiting",
  sentinel: "waiting",
};

const FRAMES: Frame[] = [
  { states: { manager: "working" }, log: "Gerente lê o briefing e confere se falta alguma informação." },
  { states: { manager: "handoff", researcher: "working" }, log: "Pesquisadora mapeia nicho, dores e objeções do público." },
  { states: { manager: "working", researcher: "handoff", strategist: "working" }, log: "Estrategista define promessa, formato, preço e módulos." },
  { states: { manager: "working", researcher: "done", strategist: "handoff", copywriter: "working" }, log: "Copywriter escreve headline, página, e-mails e anúncios." },
  { states: { manager: "working", researcher: "done", strategist: "done", copywriter: "handoff", designer: "working" }, log: "Designer monta a página em blocos." },
  { states: { manager: "working", researcher: "done", strategist: "done", copywriter: "done", designer: "handoff", sentinel: "working" }, log: "Sentinela revisa tudo." },
  { states: { manager: "working", researcher: "done", strategist: "done", copywriter: "needs_changes", designer: "done", sentinel: "needs_changes" }, log: "Sentinela encontrou uma promessa exagerada na copy e devolve para a Copywriter." },
  { states: { manager: "working", researcher: "done", strategist: "done", copywriter: "working", designer: "done", sentinel: "waiting" }, log: "Copywriter reescreve só o trecho com problema." },
  { states: { manager: "working", researcher: "done", strategist: "done", copywriter: "handoff", designer: "working", sentinel: "waiting" }, log: "Designer atualiza a página com a copy nova." },
  { states: { manager: "working", researcher: "done", strategist: "done", copywriter: "done", designer: "handoff", sentinel: "working" }, log: "Sentinela revisa de novo." },
  { states: { manager: "done", researcher: "done", strategist: "done", copywriter: "done", designer: "done", sentinel: "done" }, log: "Aprovado! Agora você revisa, cola o link do checkout e publica." },
];

export function OfficeDemo() {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [selected, setSelected] = useState<AgentName | null>(null);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 2600);
    return () => window.clearInterval(id);
  }, [playing]);

  const current = FRAMES[frame]!;
  const states = { ...W, ...current.states };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      <OfficeScene states={states} selected={selected} onSelect={setSelected} />
      <aside className="space-y-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Etapa {frame + 1} de {FRAMES.length}
          </p>
          <p className="mt-2 min-h-12 text-sm" aria-live="polite">
            {current.log}
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
              {playing ? "Pausar" : "Continuar"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setFrame(0)}>
              <RotateCcw aria-hidden />
              Reiniciar
            </Button>
          </div>
        </div>
        {selected && (
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm dark:border-stone-800 dark:bg-stone-900">
            <p className="font-semibold">{AGENT_META[selected].name}</p>
            <p className="text-stone-600 dark:text-stone-400">{AGENT_META[selected].title}</p>
            <p className="mt-2 text-xs text-stone-500">
              No app, clicar no agente abre o que ele produziu ({AGENT_META[selected].deliverable.toLowerCase()}), e você pode
              editar antes de seguir.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
