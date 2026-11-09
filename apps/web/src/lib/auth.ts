import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

/** For server components under /app: the signed-in user and profile, or a redirect. */
export async function requireUser(options: { requireOnboarding?: boolean } = {}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, locale, role, age_confirmed_at")
    .eq("id", user.id)
    .single();
  if (options.requireOnboarding !== false && !profile?.age_confirmed_at) redirect("/onboarding");
  return { user, profile };
}
