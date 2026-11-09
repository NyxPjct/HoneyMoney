import type { ReactNode } from "react";
import "../globals.css";

/** Published sales pages: no app chrome, no analytics, no session. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-white antialiased">{children}</body>
    </html>
  );
}
