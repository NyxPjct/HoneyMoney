"use client";

import { Button } from "@honeymoney/ui";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/** Set NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true once the Google provider is enabled in Supabase Auth. */
export const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

export function GoogleButton({ next = "/app" }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
        const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
        if (error) setLoading(false);
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.3 0-.6-.1-1.1-.2-1.6H12z" />
      </svg>
      Continuar com Google
    </Button>
  );
}
