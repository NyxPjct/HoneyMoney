"use client";

import { PROVIDER_LABELS as AI_PROVIDER_LABELS } from "@honeymoney/agents/providers";
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FieldHint, Input, Label, Select } from "@honeymoney/ui";
import { KeyRound, Trash2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

const WHERE_TO_GET: Record<string, string> = {
  google: "aistudio.google.com/apikey",
  openai: "platform.openai.com/api-keys",
  anthropic: "console.anthropic.com/settings/keys",
};

export function KeysManager() {
  const utils = trpc.useUtils();
  const keys = trpc.keys.list.useQuery();
  const [provider, setProvider] = useState<"google" | "openai" | "anthropic">("google");
  const [value, setValue] = useState("");
  const save = trpc.keys.save.useMutation({
    onSuccess: () => {
      setValue("");
      void utils.keys.list.invalidate();
    },
  });
  const remove = trpc.keys.remove.useMutation({ onSuccess: () => void utils.keys.list.invalidate() });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-500" aria-hidden /> Chaves de IA
        </CardTitle>
        <CardDescription>
          Sua chave é criptografada no Supabase Vault, usada só no servidor e nunca volta para o navegador. Aqui você vê
          apenas os últimos 4 dígitos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {keys.data?.instance.available && (
          <Alert tone="info">
            Esta instância oferece um modelo gratuito com limite de {keys.data.instance.dailyRuns} execuções de agente por dia.
          </Alert>
        )}

        <ul className="space-y-2">
          {keys.data?.keys.length === 0 && <li className="text-sm text-stone-500">Nenhuma chave salva.</li>}
          {keys.data?.keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 dark:border-stone-700">
              <div className="flex items-center gap-2 text-sm">
                <Badge tone="amber">{AI_PROVIDER_LABELS[k.provider]}</Badge>
                <span className="font-mono">••••{k.last4}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={remove.isPending}
                onClick={() => {
                  if (window.confirm("Apagar esta chave? Projetos que usam este provedor vão parar de gerar.")) remove.mutate({ id: k.id });
                }}
              >
                <Trash2 aria-hidden /> Apagar
              </Button>
            </li>
          ))}
        </ul>

        <form
          className="space-y-3 border-t border-stone-200 pt-4 dark:border-stone-800"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({ provider, key: value });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="provider">Provedor</Label>
              <Select id="provider" value={provider} onChange={(e) => setProvider(e.target.value as typeof provider)}>
                {(["google", "openai", "anthropic"] as const).map((p) => (
                  <option key={p} value={p}>
                    {AI_PROVIDER_LABELS[p]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="key">Chave</Label>
              <Input
                id="key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Cole sua chave aqui"
                required
              />
            </div>
          </div>
          <FieldHint>
            Onde conseguir: {WHERE_TO_GET[provider]}. Salvar de novo substitui a chave anterior desse provedor.
          </FieldHint>
          {save.error && <Alert tone="error">{save.error.message}</Alert>}
          {save.isSuccess && <Alert tone="success">Chave salva (••••{save.data.last4}).</Alert>}
          <Button type="submit" disabled={save.isPending || value.trim().length < 10}>
            Salvar chave
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
