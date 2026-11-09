"use client";

import { Alert, Button, Input, Label } from "@honeymoney/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <AuthShell title="Nova senha" description="Escolha uma senha com pelo menos 8 caracteres.">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const password = String(form.get("password"));
          if (password.length < 8) return setError("A senha precisa de pelo menos 8 caracteres.");
          if (password !== String(form.get("confirm"))) return setError("As senhas não conferem.");
          setLoading(true);
          const { error } = await getSupabaseBrowserClient().auth.updateUser({ password });
          setLoading(false);
          if (error) return setError("O link expirou. Peça um novo em “Esqueci a senha”.");
          router.replace("/app");
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Repita a senha</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" className="w-full" disabled={loading}>
          Salvar senha
        </Button>
      </form>
    </AuthShell>
  );
}
