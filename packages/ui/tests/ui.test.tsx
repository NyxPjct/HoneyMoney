import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { deriveOfficeStates, OfficeScene, type RunLike } from "../src/office";
import { PageRenderer, safeCheckoutUrl } from "../src/page";

const t = (s: number) => new Date(Date.UTC(2026, 10, 9, 12, 0, s)).toISOString();
const run = (agent: RunLike["agent"], status: RunLike["status"], created: number, extra: Partial<RunLike> = {}): RunLike => ({
  agent,
  status,
  created_at: t(created),
  finished_at: status === "running" ? null : t(created + 1),
  ...extra,
});

describe("office states mirror the backend", () => {
  it("shows waiting, working, handoff and done from agent runs", () => {
    const runs = [run("manager", "succeeded", 0), run("researcher", "succeeded", 2), run("strategist", "running", 4)];
    const now = Date.parse(t(4));
    const s = deriveOfficeStates(runs, { status: "generating", awaiting_agent: null }, now);
    expect(s.researcher).toBe("handoff");
    expect(s.strategist).toBe("working");
    expect(s.copywriter).toBe("waiting");
    expect(s.manager).toBe("handoff");
    const later = deriveOfficeStates(runs, { status: "generating", awaiting_agent: null }, now + 60_000);
    expect(later.researcher).toBe("done");
    // The Manager keeps coordinating while the team works.
    expect(later.manager).toBe("working");
  });

  it("agents sent back by the Sentinel ask for changes until they redo the work", () => {
    const report = {
      approved: false,
      issues: [{ agent: "copywriter", severity: "blocker" }, { agent: "designer", severity: "warning" }],
    };
    const runs = [
      run("copywriter", "succeeded", 1),
      run("designer", "succeeded", 2),
      run("sentinel", "changes_requested", 3, { output: report }),
    ];
    const s = deriveOfficeStates(runs, { status: "generating", awaiting_agent: null }, Date.parse(t(60)));
    expect(s.sentinel).toBe("needs_changes");
    expect(s.copywriter).toBe("needs_changes");
    expect(s.designer).toBe("done");
    const redoing = deriveOfficeStates([...runs, run("copywriter", "running", 5)], { status: "generating", awaiting_agent: null });
    expect(redoing.copywriter).toBe("working");
  });

  it("shows errors and Manager questions", () => {
    const s = deriveOfficeStates(
      [run("manager", "needs_input", 0), run("researcher", "failed", 1)],
      { status: "draft", awaiting_agent: null },
    );
    expect(s.manager).toBe("needs_changes");
    expect(s.researcher).toBe("error");
  });

  it("renders all six desks", () => {
    const states = deriveOfficeStates([], { status: "draft", awaiting_agent: null });
    const html = renderToStaticMarkup(<OfficeScene states={states} />);
    for (const name of ["Gerente", "Pesquisadora", "Estrategista", "Copywriter", "Designer", "Sentinela"]) {
      expect(html).toContain(name);
    }
  });
});

describe("published page rendering", () => {
  const doc = {
    theme: { accent: "sky", style: "clean" },
    checkoutUrl: "javascript:alert(1)",
    blocks: [
      { type: "hero", headline: "<script>alert(1)</script>", subheadline: "Sub", ctaLabel: "Comprar" },
      { type: "faq", title: "Dúvidas", items: [{ question: "Q?", answer: "<img src=x onerror=alert(1)>" }] },
    ],
  } as const;

  it("escapes content and never renders unsafe links", () => {
    const html = renderToStaticMarkup(<PageRenderer doc={structuredClone(doc) as never} />);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("href");
  });

  it("renders https checkout links with safe rel attributes", () => {
    const html = renderToStaticMarkup(
      <PageRenderer doc={{ ...structuredClone(doc), checkoutUrl: "https://pay.example.com/x" } as never} />,
    );
    expect(html).toContain('href="https://pay.example.com/x"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
  });

  it("accepts only https links", () => {
    expect(safeCheckoutUrl("https://ok.example.com")).toBe("https://ok.example.com");
    expect(safeCheckoutUrl("http://no.example.com")).toBeNull();
    expect(safeCheckoutUrl('https://x.com/"onmouseover=')).toBeNull();
  });
});
