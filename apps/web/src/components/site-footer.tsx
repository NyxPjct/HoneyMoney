import Link from "next/link";
import { APP_NAME, GITHUB_URL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 py-10 text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {APP_NAME} é software livre (AGPL-3.0). Grátis, sem planos pagos e sem promessas de renda.
        </p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/terms" className="hover:underline">
            Termos
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacidade
          </Link>
          <a href={GITHUB_URL} className="hover:underline">
            Código-fonte
          </a>
        </nav>
      </div>
    </footer>
  );
}
