import { LogoMark } from "@/components/logo";

export const metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <LogoMark size={56} />
      <h1 className="text-2xl font-bold">Você está sem conexão</h1>
      <p className="max-w-sm text-stone-600 dark:text-stone-400">
        Os agentes trabalham no servidor e continuam de onde pararam. Assim que a internet voltar, é só recarregar.
      </p>
      <a href="/app" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-stone-950 hover:bg-amber-400">
        Tentar de novo
      </a>
    </main>
  );
}
