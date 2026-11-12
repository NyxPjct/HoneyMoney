import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { safeNextPath } from "@/lib/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EMAIL_TYPES: readonly EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

/**
 * E-mail links (sign-up confirmation, password recovery, e-mail change):
 *   /auth/confirm?token_hash=...&type=email&next=/app
 * Unlike the PKCE `?code=` flow, a token hash works in any browser or device, e.g. when the
 * e-mail is opened in the Gmail app instead of the browser used to sign up.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"), type === "recovery" ? "/reset-password" : "/app");

  if (tokenHash && type && EMAIL_TYPES.includes(type)) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=${type === "recovery" ? "recovery" : "confirm"}`);
}
