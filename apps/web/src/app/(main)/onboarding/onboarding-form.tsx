"use client";

import { Alert, Button, Input, Label, Select } from "@honeymoney/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LOCALE_LABELS } from "@/lib/labels";
import { trpc } from "@/lib/trpc/client";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const complete = trpc.profile.completeOnboarding.useMutation({
    onSuccess: () => {
      router.replace("/app");
      router.refresh();
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ageConfirmed) return;
        const form = new FormData(e.currentTarget);
        complete.mutate({
          ageConfirmed: true,
          displayName: String(form.get("name") ?? ""),
          locale: String(form.get("locale")) as "pt-BR",
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Como quer ser chamada(o)?</Label>
        <Input id="name" name="name" defaultValue={defaultName} maxLength={80} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="locale">Idioma preferido</Label>
        <Select id="locale" name="locale" defaultValue="pt-BR">
          {Object.entries(LOCALE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-amber-500"
          checked={ageConfirmed}
          onChange={(e) => setAgeConfirmed(e.target.checked)}
        />
        <span>
          Confirmo que tenho 18 anos ou mais e aceito os{" "}
          <Link href="/terms" className="underline">
            termos
          </Link>{" "}
          e a{" "}
          <Link href="/privacy" className="underline">
            política de privacidade
          </Link>
          .
        </span>
      </label>
      {complete.error && <Alert tone="error">{complete.error.message}</Alert>}
      <Button type="submit" className="w-full" disabled={!ageConfirmed || complete.isPending}>
        Continuar
      </Button>
    </form>
  );
}
