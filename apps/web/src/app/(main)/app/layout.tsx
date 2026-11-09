import { buttonVariants } from "@honeymoney/ui";
import { FolderKanban, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { profile, user } = await requireUser();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-stone-200 bg-[var(--background)] dark:border-stone-800">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
          <Logo href="/app" />
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/app" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <FolderKanban aria-hidden />
              <span className="hidden sm:inline">Projetos</span>
            </Link>
            <Link href="/app/settings" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <Settings aria-hidden />
              <span className="hidden sm:inline">Configurações</span>
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className={buttonVariants({ variant: "ghost", size: "sm" })} title={user.email ?? undefined}>
                <LogOut aria-hidden />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {profile?.display_name && <p className="sr-only">Olá, {profile.display_name}</p>}
        {children}
      </main>
    </div>
  );
}
