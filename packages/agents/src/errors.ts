const KEY_PATTERNS = [
  /sk-ant-[A-Za-z0-9_-]{6,}/g,
  /sk-(?:proj-)?[A-Za-z0-9_-]{10,}/g,
  /AIza[0-9A-Za-z_-]{20,}/g,
  /Bearer\s+[A-Za-z0-9._-]{10,}/gi,
  /x-api-key["':\s]+[A-Za-z0-9._-]{10,}/gi,
];

/** Remove anything that looks like a credential. Used before storing or logging errors. */
export function redactSecrets(text: string, secrets: readonly string[] = []): string {
  let out = text;
  for (const secret of secrets) {
    if (secret && secret.length >= 6) out = out.split(secret).join("[redacted]");
  }
  for (const pattern of KEY_PATTERNS) out = out.replace(pattern, "[redacted]");
  return out;
}

export function safeErrorMessage(err: unknown, secrets: readonly string[] = []): string {
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return redactSecrets(message, secrets).slice(0, 500);
}

export class AgentOutputError extends Error {
  override name = "AgentOutputError";
  constructor(
    public readonly agent: string,
    public readonly attempts: number,
    public readonly lastProblem: string,
  ) {
    super(`${agent} returned invalid output after ${attempts} attempt(s): ${lastProblem}`);
  }
}
