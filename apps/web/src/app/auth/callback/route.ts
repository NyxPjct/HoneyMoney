import { type NextRequest, NextResponse } from "next/server";
import { safeNextPath } from "@/lib/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth / e-mail confirmation / password recovery (PKCE): /auth/callback?code=...&next=/path
 *
 * Supabase only redirects here with a `code` after it has already verified the e-mail link, so
 * a failed exchange (typically: the e-mail was opened in another browser or app, which lacks the
 * PKCE verifier cookie) still means the address is confirmed. Say so instead of showing an error.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (searchParams.get("error") || searchParams.get("error_code")) {
    // e.g. otp_expired: the link is old or was already used.
    return NextResponse.redirect(`${origin}/login?error=${next === "/reset-password" ? "recovery" : "confirm"}`);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    // Password recovery needs a session to set the new password, so it must finish in the same browser.
    if (next === "/reset-password") return NextResponse.redirect(`${origin}/login?error=recovery-device`);
    return NextResponse.redirect(`${origin}/login?confirmed=1&next=${encodeURIComponent(next)}`);
  }

  return NextResponse.redirect(`${origin}/login?error=callback`);
}
