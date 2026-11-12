import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyOtp = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { verifyOtp } }),
}));

const { GET } = await import("@/app/auth/confirm/route");
const req = (qs: string) => new NextRequest(`https://honey.example/auth/confirm?${qs}`);

beforeEach(() => verifyOtp.mockReset());

describe("/auth/confirm (e-mail links that work in any browser)", () => {
  it("verifies the token hash and goes to the app", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const res = await GET(req("token_hash=abc&type=email&next=/app"));
    expect(verifyOtp).toHaveBeenCalledWith({ type: "email", token_hash: "abc" });
    expect(res.headers.get("location")).toBe("https://honey.example/app");
  });

  it("sends password recovery to the new-password page by default", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const res = await GET(req("token_hash=abc&type=recovery"));
    expect(res.headers.get("location")).toBe("https://honey.example/reset-password");
  });

  it("explains expired or used links on the login page", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "expired" } });
    expect((await GET(req("token_hash=abc&type=email"))).headers.get("location")).toBe(
      "https://honey.example/login?error=confirm",
    );
    expect((await GET(req("token_hash=abc&type=recovery"))).headers.get("location")).toBe(
      "https://honey.example/login?error=recovery",
    );
  });

  it("rejects unknown types and open redirects", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    expect((await GET(req("token_hash=abc&type=bogus"))).headers.get("location")).toContain("/login?error=confirm");
    expect(verifyOtp).not.toHaveBeenCalled();
    const res = await GET(req("token_hash=abc&type=email&next=//evil.com"));
    expect(res.headers.get("location")).toBe("https://honey.example/app");
  });
});
