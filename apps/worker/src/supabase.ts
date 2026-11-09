import type { Database } from "@honeymoney/db";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AdminClient = SupabaseClient<Database>;

let cached: AdminClient | null = null;

/** Service-role client. Server/worker only: it bypasses RLS. */
export function getAdminClient(): AdminClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for the worker");
  cached = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
