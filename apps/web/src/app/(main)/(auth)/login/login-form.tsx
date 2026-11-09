"use client";

import { Alert, Button, Input, Label } from "@honeymoney/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm({ next, initialError }: { next: string; initialError: string | null }) {
  const router = useRouter();
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setLoading(true);
        setError(null);
        const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({
          email: String(form.get("email")),
          password: String(form.get("password")),
        });
        if (error) {
          setError("E-mail ou senha incorretos.");
          setLoading(false);
          return;
        }
        router.replace(next);
        router.refresh();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
