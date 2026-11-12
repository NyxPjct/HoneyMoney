import { Alert } from "@honeymoney/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { GoogleButton } from "@/components/google-button";
import { safeNextPath } from "@/lib/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

const LINK_ERRORS: Record<string, string> = {
  confirm:
    "Esse link de confirmação expirou ou já foi usado. Se você já confirmou seu e-mail, é só entrar com e-mail e senha.",
  recovery: "Esse link de recuperação expirou ou já foi usado. Peça um novo em “Esqueci a senha”.",
  "recovery-device":
    "Abra o link de recuperação no mesmo navegador em que você pediu a nova senha, ou peça um novo link por aqui.",
  callback:
    "Não foi possível concluir a entrada por esse link. Se você já confirmou seu e-mail, entre com e-mail e senha.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; confirmed?: string }>;
}) {
  const { next, error, confirmed } = await searchParams;
  const target = safeNextPath(next);
  return (
    <AuthShell title="Entrar" description="Bem-vinda de volta! Seus projetos estão te esperando.">
      <div className="space-y-4">
        <GoogleButton next={target} />
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
          ou com e-mail
          <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
        </div>
        {confirmed && !error && (
          <Alert tone="success">Seu e-mail foi confirmado! Agora é só entrar com seu e-mail e senha.</Alert>
        )}
        <LoginForm next={target} initialError={error ? (LINK_ERRORS[error] ?? LINK_ERRORS.callback!) : null} />
        <div className="flex justify-between text-sm">
          <Link href="/forgot-password" className="text-amber-700 hover:underline dark:text-amber-400">
            Esqueci a senha
          </Link>
          <Link href={`/signup?next=${encodeURIComponent(target)}`} className="text-amber-700 hover:underline dark:text-amber-400">
            Criar conta
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
