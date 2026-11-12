import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { exchangeCodeForSession } }),
}));

const { GET } = await import("@/app/auth/callback/route");
const go = async (qs: string) => (await GET(new NextRequest(`https://honey.example/auth/callback?${qs}`))).headers.get("location");

beforeEach(() => exchangeCodeForSession.mockReset());

describe("/auth/callback", () => {
  it("signs in when the code can be exchanged (same browser)", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    expect(await go("code=c1&next=/app")).toBe("https://honey.example/app");
  });

  it("tells the user the e-mail is confirmed when the link was opened in another browser", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "code verifier not found" } });
    expect(await go("code=c1&next=/app")).toBe("https://honey.example/login?confirmed=1&next=%2Fapp");
  });

  it("asks to finish password recovery in the same browser", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "code verifier not found" } });
    expect(await go("code=c1&next=/reset-password")).toBe("https://honey.example/login?error=recovery-device");
  });

  it("explains expired links reported by Supabase", async () => {
    expect(await go("error=access_denied&error_code=otp_expired")).toBe("https://honey.example/login?error=confirm");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("falls back to a generic message without a code", async () => {
    expect(await go("")).toBe("https://honey.example/login?error=callback");
  });
});
