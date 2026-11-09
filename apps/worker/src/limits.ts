/** Limits shared by the web app (before enqueueing) and the worker (defense in depth). */
export function readLimits(env: Record<string, string | undefined> = process.env) {
  const int = (v: string | undefined, fallback: number) => {
    const n = Number.parseInt(v ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  return {
    /** Agent runs per user per hour, any key. */
    hourlyRuns: int(env.GENERATION_HOURLY_LIMIT, 60),
    /** Agent runs per user per day on the instance's free model. */
    instanceDailyRuns: int(env.INSTANCE_DAILY_RUN_LIMIT, 40),
  };
}

export function instanceModelConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.INSTANCE_AI_KEY && env.INSTANCE_AI_KEY.trim());
}
