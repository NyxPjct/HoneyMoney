"use client";

import { Button } from "@honeymoney/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "hm-analytics-consent";

function readConsent(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeConsent(value: "granted" | "denied") {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage blocked: the banner just shows again next visit.
  }
}

async function startAnalytics() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const { default: posthog } = await import("posthog-js");
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    autocapture: false,
    capture_pageview: true,
    disable_session_recording: true,
  });
}

/** Analytics only load after explicit consent (LGPD). Without a PostHog key, nothing is shown. */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    const consent = readConsent();
    if (consent === "granted") void startAnalytics();
    else if (consent === null) setVisible(true);
  }, []);

  if (!visible) return null;
  return (
    <div
      role="dialog"
      aria-label="Consentimento de analytics"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-xl border border-stone-200 bg-white p-4 text-sm shadow-lg dark:border-stone-700 dark:bg-stone-900"
    >
      <p>
        Podemos usar analytics anônimos (PostHog) para melhorar o app? Nada é coletado sem a sua permissão.{" "}
        <Link href="/privacy" className="underline">
          Saiba mais
        </Link>
        .
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            writeConsent("denied");
            setVisible(false);
          }}
        >
          Recusar
        </Button>
        <Button
          size="sm"
          onClick={() => {
            writeConsent("granted");
            setVisible(false);
            void startAnalytics();
          }}
        >
          Aceitar
        </Button>
      </div>
    </div>
  );
}
