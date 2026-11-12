/**
 * Inngest keys can arrive under the standard names (INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY) or with a
 * project prefix: the Vercel integration may create e.g. HONEY_MONEY_INNGEST_SIGNING_KEY. Accept both.
 */
export function inngestEnv(
  name: "INNGEST_EVENT_KEY" | "INNGEST_SIGNING_KEY" | "INNGEST_SIGNING_KEY_FALLBACK",
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  const exact = env[name]?.trim();
  if (exact) return exact;
  const prefixed = Object.keys(env)
    .filter((key) => key.endsWith(`_${name}`) && env[key]?.trim())
    .sort();
  return prefixed.length ? env[prefixed[0]!]!.trim() : undefined;
}
