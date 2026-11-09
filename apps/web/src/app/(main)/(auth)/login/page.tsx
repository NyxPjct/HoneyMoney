import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { GoogleButton } from "@/components/google-button";
import { safeNextPath } from "@/lib/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
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
        <LoginForm next={target} initialError={error ? "Não foi possível entrar com esse link. Tente de novo." : null} />
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
