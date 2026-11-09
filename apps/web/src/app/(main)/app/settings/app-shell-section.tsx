"use client";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@honeymoney/ui";
import { useEffect, useState } from "react";

type Shell = "android" | "desktop" | null;

function detectShell(): Shell {
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  if (w.Capacitor?.isNativePlatform?.()) return "android";
  if (/\bElectron\//.test(navigator.userAgent)) return "desktop";
  return null;
}

/** Only visible inside the HoneyMoney desktop or Android app: lets the user point it at another server. */
export function AppShellSection() {
  const [shell, setShell] = useState<Shell>(null);
  useEffect(() => setShell(detectShell()), []);
  if (!shell) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Servidor do app</CardTitle>
        <CardDescription>Este app está conectado a {window.location.host}.</CardDescription>
      </CardHeader>
      <CardContent>
        {shell === "android" ? (
          <Button variant="outline" onClick={() => window.location.assign("https://localhost/?change=1")}>
            Trocar servidor
          </Button>
        ) : (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Para trocar, use o menu <strong>HoneyMoney → Trocar servidor…</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
