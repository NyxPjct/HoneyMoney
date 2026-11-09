import { describe, expect, it } from "vitest";
import { isExternalWebUrl, isSameOrigin, normalizeServerUrl } from "../src/server-url";

describe("server address", () => {
  it("accepts https servers and adds the scheme when missing", () => {
    expect(normalizeServerUrl("honeymoney.example.com")).toEqual({ ok: true, origin: "https://honeymoney.example.com" });
    expect(normalizeServerUrl(" https://app.example.com/app/projects ")).toEqual({ ok: true, origin: "https://app.example.com" });
  });

  it("allows plain http only for local development", () => {
    expect(normalizeServerUrl("http://localhost:3000")).toEqual({ ok: true, origin: "http://localhost:3000" });
    expect(normalizeServerUrl("http://127.0.0.1:3000").ok).toBe(true);
    expect(normalizeServerUrl("http://example.com").ok).toBe(false);
  });

  it("rejects other schemes, credentials and garbage", () => {
    expect(normalizeServerUrl("file:///etc/passwd").ok).toBe(false);
    expect(normalizeServerUrl("javascript:alert(1)").ok).toBe(false);
    expect(normalizeServerUrl("https://user:pass@example.com").ok).toBe(false);
    expect(normalizeServerUrl("").ok).toBe(false);
    expect(normalizeServerUrl("https://exa mple.com").ok).toBe(false);
  });

  it("keeps navigation on the configured server", () => {
    expect(isSameOrigin("https://app.example.com/app", "https://app.example.com")).toBe(true);
    expect(isSameOrigin("https://app.example.com.evil.com/", "https://app.example.com")).toBe(false);
    expect(isSameOrigin("http://app.example.com/", "https://app.example.com")).toBe(false);
  });

  it("only opens web links externally", () => {
    expect(isExternalWebUrl("https://pay.example.com")).toBe(true);
    expect(isExternalWebUrl("file:///C:/Windows/System32/calc.exe")).toBe(false);
    expect(isExternalWebUrl("smb://server/share")).toBe(false);
  });
});
