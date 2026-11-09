"use client";

import { Alert, Button, Input, Label } from "@honeymoney/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignupForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (sent) {
    return (
      <Alert tone="success">
        Conta criada! Enviamos um link de confirmação para o seu e-mail. Abra o link para entrar.
      </Alert>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        if (form.get("age") !== "on") {
          setError("É preciso ter 18 anos ou mais para usar o HoneyMoney.");
          return;
        }
        const password = String(form.get("password"));
        if (password.length < 8) {
          setError("A senha precisa de pelo menos 8 caracteres.");
          return;
        }
        setLoading(true);
        setError(null);
        const { data, error } = await getSupabaseBrowserClient().auth.signUp({
          email: String(form.get("email")),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            data: { name: String(form.get("name") ?? "").slice(0, 80), age_confirmed: "true", locale: "pt-BR" },
          },
        });
        setLoading(false);
        if (error) {
          setError("Não foi possível criar a conta. Verifique os dados e tente de novo.");
          return;
        }
        if (data.session) {
          router.replace(next);
          router.refresh();
        } else {
          setSent(true);
        }
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Como quer ser chamada(o)?</Label>
        <Input id="name" name="name" autoComplete="name" maxLength={80} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="age" className="mt-1 h-4 w-4 accent-amber-500" required />
        <span>
          Tenho 18 anos ou mais e aceito os{" "}
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
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando…" : "Criar conta"}
      </Button>
    </form>
  );
}
