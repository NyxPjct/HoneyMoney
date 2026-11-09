import "server-only";
import type { Database } from "@honeymoney/db";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { serverEnv } from "../env";

/** User-scoped client: every query runs under the user's RLS policies. */
export async function createSupabaseServerClient() {
  const env = serverEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: the middleware refreshes the session instead.
        }
      },
    },
  });
}

/** Anonymous client (no cookies) for public reads such as published pages. */
export function createSupabaseAnonClient() {
  const env = serverEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let admin: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Service-role client. Bypasses RLS: use only for the few privileged operations
 * (storing AI keys in Vault, status changes, publishing, account deletion), always
 * after checking ownership with the user-scoped client.
 */
export function createSupabaseAdminClient() {
  if (!admin) {
    const env = serverEnv();
    admin = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}
