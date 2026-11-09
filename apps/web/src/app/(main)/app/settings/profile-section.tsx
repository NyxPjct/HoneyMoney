"use client";

import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select } from "@honeymoney/ui";
import { LOCALE_LABELS } from "@/lib/labels";
import { trpc } from "@/lib/trpc/client";

export function ProfileSection() {
  const me = trpc.profile.me.useQuery();
  const update = trpc.profile.update.useMutation();
  if (!me.data) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            update.mutate({ displayName: String(f.get("name") ?? ""), locale: String(f.get("locale")) as "pt-BR" });
          }}
        >
          <p className="text-sm text-stone-500">{me.data.email}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={me.data.display_name ?? ""} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="locale">Idioma</Label>
              <Select id="locale" name="locale" defaultValue={me.data.locale}>
                {Object.entries(LOCALE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {update.isSuccess && <Alert tone="success">Perfil salvo.</Alert>}
          {update.error && <Alert tone="error">{update.error.message}</Alert>}
          <Button type="submit" variant="outline" disabled={update.isPending}>
            Salvar perfil
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
