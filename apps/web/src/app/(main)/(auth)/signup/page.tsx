import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { GoogleButton } from "@/components/google-button";
import { safeNextPath } from "@/lib/site";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Criar conta" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNextPath(next);
  return (
    <AuthShell title="Criar conta grátis" description="Sem cartão e sem plano pago. Só para maiores de 18 anos.">
      <div className="space-y-4">
        <GoogleButton next={target} />
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
          ou com e-mail
          <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
        </div>
        <SignupForm next={target} />
        <p className="text-center text-sm">
          Já tem conta?{" "}
          <Link href="/login" className="text-amber-700 hover:underline dark:text-amber-400">
            Entrar
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
