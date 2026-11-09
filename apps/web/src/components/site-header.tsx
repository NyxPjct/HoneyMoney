import { buttonVariants, cn } from "@honeymoney/ui";
import Link from "next/link";
import { GITHUB_URL } from "@/lib/site";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[var(--background)]/90 backdrop-blur dark:border-stone-800">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href="/demo" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
            Ver o escritório
          </Link>
          <Link href="/download" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden md:inline-flex")}>
            Baixar
          </Link>
          <a href={GITHUB_URL} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
            GitHub
          </a>
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Entrar
          </Link>
          <Link href="/signup" className={buttonVariants({ size: "sm" })}>
            Começar grátis
          </Link>
        </nav>
      </div>
    </header>
  );
}
