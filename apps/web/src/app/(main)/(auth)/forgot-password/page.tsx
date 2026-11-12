"use client";

import { Alert, Button, Input, Label } from "@honeymoney/ui";
import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <AuthShell title="Recuperar senha" description="Enviaremos um link para você criar uma nova senha.">
      {sent ? (
        <Alert tone="success">
          Se existir uma conta com esse e-mail, o link já está a caminho. Abra o link <strong>neste mesmo navegador</strong>{" "}
          (se o e-mail abrir em outro app, copie o link e cole aqui).
        </Alert>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            const email = String(new FormData(e.currentTarget).get("email"));
            await getSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            });
            // Same message whether or not the account exists (no user enumeration).
            setSent(true);
            setLoading(false);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Enviar link
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-amber-700 hover:underline dark:text-amber-400">
          Voltar para o login
        </Link>
      </p>
    </AuthShell>
  );
}
