import { type NextRequest, NextResponse } from "next/server";
import { safeNextPath } from "@/lib/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** OAuth / e-mail confirmation / password recovery: /auth/callback?code=...&next=/path */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=callback`);
}
