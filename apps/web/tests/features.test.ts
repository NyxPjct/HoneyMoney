import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("feature switches", () => {
  it("hides Google sign-in unless explicitly enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "");
    expect((await import("@/lib/features")).googleAuthEnabled).toBe(false);
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "true");
    expect((await import("@/lib/features")).googleAuthEnabled).toBe(true);
  });

  it("is a plain boolean, not a client reference", async () => {
    const mod = await import("@/lib/features");
    expect(typeof mod.googleAuthEnabled).toBe("boolean");
  });
});
