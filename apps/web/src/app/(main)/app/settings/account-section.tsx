"use client";

import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@honeymoney/ui";
import { Download } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

export function AccountSection() {
  const utils = trpc.useUtils();
  const [confirm, setConfirm] = useState("");
  const [exporting, setExporting] = useState(false);
  const del = trpc.account.delete.useMutation({ onSuccess: () => window.location.assign("/") });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seus dados (LGPD)</CardTitle>
        <CardDescription>Baixe tudo o que guardamos sobre você ou exclua sua conta de forma definitiva.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button
          variant="outline"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              const data = await utils.account.export.fetch();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `honeymoney-dados-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            } finally {
              setExporting(false);
            }
          }}
        >
          <Download aria-hidden /> Exportar meus dados (JSON)
        </Button>

        <div className="space-y-2 rounded-lg border border-red-200 p-4 dark:border-red-900">
          <p className="font-medium text-red-700 dark:text-red-400">Excluir conta</p>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Apaga perfil, projetos, entregas dos agentes, páginas (inclusive as publicadas) e suas chaves de IA. Não dá para
            desfazer.
          </p>
          <Label htmlFor="confirm-delete">Digite EXCLUIR para confirmar</Label>
          <Input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
          {del.error && <Alert tone="error">{del.error.message}</Alert>}
          <Button variant="destructive" disabled={confirm !== "EXCLUIR" || del.isPending} onClick={() => del.mutate({ confirm: "EXCLUIR" })}>
            Excluir minha conta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
