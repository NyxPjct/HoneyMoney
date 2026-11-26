import type { ReactNode } from "react";
import "../globals.css";
// Typefaces of the sales pages (self-hosted: the pages CSP only allows fonts from this origin).
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/nunito";
import "@fontsource-variable/playfair-display";
import "@fontsource/dm-serif-display";
import "@fontsource/anton";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/manrope";
import "@fontsource-variable/outfit";

/** Published sales pages: no app chrome, no analytics, no session. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-white antialiased">{children}</body>
    </html>
  );
}
