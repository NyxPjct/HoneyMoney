import { buttonVariants, Card } from "@honeymoney/ui";
import { Apple, Laptop, MonitorDown, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import { InstallAppButton } from "@/components/pwa";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { GITHUB_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Baixar o app",
  description: "Instale o HoneyMoney no computador ou no celular.",
};

const RELEASES = `${GITHUB_URL}/releases/latest`;

export default function DownloadPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Baixar o app</h1>
        <p className="mt-2 max-w-2xl text-stone-600 dark:text-stone-400">
          O jeito mais simples é instalar direto do navegador. Se preferir, baixe o aplicativo para Windows, macOS, Linux ou
          Android na página de versões do GitHub.
        </p>

        <Card className="mt-8 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MonitorDown className="h-5 w-5 text-amber-500" aria-hidden /> Instalar pelo navegador (recomendado)
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-stone-700 dark:text-stone-300">
            <li>
              <strong>Computador (Chrome ou Edge):</strong> clique no ícone de instalar na barra de endereço ou no botão
              abaixo.
            </li>
            <li>
              <strong>Android (Chrome):</strong> menu ⋮ → <em>Instalar app</em>.
            </li>
            <li>
              <strong>iPhone e iPad (Safari):</strong> botão Compartilhar → <em>Adicionar à Tela de Início</em>.
            </li>
          </ul>
          <InstallAppButton className="mt-4" />
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Laptop className="h-5 w-5 text-amber-500" aria-hidden /> Computador
            </h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Windows (.exe), macOS (.dmg) e Linux (.AppImage). Na primeira vez, o app pergunta o endereço do servidor
              HoneyMoney que você usa.
            </p>
            <a href={RELEASES} className={buttonVariants({ className: "mt-4" })}>
              Baixar para computador
            </a>
          </Card>
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Smartphone className="h-5 w-5 text-amber-500" aria-hidden /> Android
            </h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Arquivo .apk para instalar fora da Play Store (permita “instalar apps desconhecidos” quando o Android pedir).
            </p>
            <a href={RELEASES} className={buttonVariants({ className: "mt-4" })}>
              Baixar para Android
            </a>
          </Card>
        </div>

        <p className="mt-6 flex items-start gap-2 text-sm text-stone-500">
          <Apple className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          No iPhone, use a instalação pelo Safari. Um app na App Store depende de uma conta de desenvolvedor Apple e está
          fora desta primeira versão.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Os arquivos ainda não são assinados digitalmente: o Windows e o macOS podem mostrar um aviso de segurança na
          primeira abertura. O código de cada versão é público no GitHub.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
