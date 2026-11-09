import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ConsentBanner } from "@/components/consent-banner";
import { appUrl } from "@/lib/site";
import { TRPCProvider } from "@/lib/trpc/client";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "HoneyMoney — crie sua oferta digital com agentes de IA", template: "%s · HoneyMoney" },
  description:
    "App grátis e open source: agentes de IA ajudam você a criar produto, página de vendas e copy do zero. Sem planos pagos e sem promessas de renda.",
  openGraph: { type: "website", siteName: "HoneyMoney" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffdf7" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh antialiased">
        <TRPCProvider>{children}</TRPCProvider>
        <ConsentBanner />
      </body>
    </html>
  );
}
