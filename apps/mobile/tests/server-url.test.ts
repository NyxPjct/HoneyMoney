import { describe, expect, it } from "vitest";
import { normalizeServerUrl } from "../www/server-url.js";

describe("mobile server address", () => {
  it("accepts https and local test servers", () => {
    expect(normalizeServerUrl("honeymoney.example.com")).toEqual({ ok: true, origin: "https://honeymoney.example.com" });
    expect(normalizeServerUrl("http://10.0.2.2:3000")).toEqual({ ok: true, origin: "http://10.0.2.2:3000" });
  });

  it("rejects insecure, malformed and self-referencing addresses", () => {
    expect(normalizeServerUrl("http://example.com").ok).toBe(false);
    expect(normalizeServerUrl("javascript:alert(1)").ok).toBe(false);
    expect(normalizeServerUrl("https://localhost").ok).toBe(false);
    expect(normalizeServerUrl("").ok).toBe(false);
  });
});
