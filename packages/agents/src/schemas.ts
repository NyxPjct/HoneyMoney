import { z } from "zod";

const text = (max: number, min = 1) => z.string().trim().min(min).max(max);

export const LOCALES = ["pt-BR", "es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const PRODUCT_FORMATS = ["ebook", "course", "spreadsheet", "mentoring", "template", "other"] as const;
export type ProductFormat = (typeof PRODUCT_FORMATS)[number];

export const CURRENCIES = ["BRL", "USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

// ---------------------------------------------------------------------------
// Briefing (user input)
// ---------------------------------------------------------------------------

/** Max serialized briefing size accepted by the API (the DB also caps it at 16 KB). */
export const MAX_BRIEFING_BYTES = 8 * 1024;

export const BriefingSchema = z.object({
  skill: text(600, 3).describe("What the person knows how to do / the skill behind the product"),
  audience: text(600, 3).describe("Who they want to help"),
  format: z.enum(PRODUCT_FORMATS),
  formatDetails: z.string().trim().max(300).optional(),
  priceCents: z.number().int().min(0).max(10_000_000).optional(),
  currency: z.enum(CURRENCIES),
  language: z.enum(LOCALES),
  extra: z.string().trim().max(1500).optional(),
  answers: z
    .array(z.object({ question: text(300), answer: text(600) }))
    .max(10)
    .optional(),
});
export type Briefing = z.infer<typeof BriefingSchema>;

export function briefingSize(briefing: unknown): number {
  return new TextEncoder().encode(JSON.stringify(briefing)).length;
}

// ---------------------------------------------------------------------------
// Optional catalog reference (Phase 2 feeds it; the pipeline already treats it as data)
// ---------------------------------------------------------------------------

export const CatalogReferenceSchema = z.object({
  name: z.string(),
  format: z.string(),
  niche: z.string(),
  funnel: z.string().nullable(),
  audience: z.string().nullable(),
  pains: z.array(z.string()),
});
export type CatalogReference = z.infer<typeof CatalogReferenceSchema>;

// ---------------------------------------------------------------------------
// Deliverables
// ---------------------------------------------------------------------------

export const ManagerOutputSchema = z.object({
  status: z.enum(["ready", "needs_info", "rejected"]),
  summary: text(600),
  questions: z.array(text(300, 3)).max(3),
  rejectionReason: z.string().max(400).nullable(),
});
export type ManagerOutput = z.infer<typeof ManagerOutputSchema>;

export const AWARENESS_LEVELS = ["unaware", "problem_aware", "solution_aware", "product_aware", "most_aware"] as const;

export const AudienceMapSchema = z.object({
  niche: text(120),
  subNiche: text(160),
  audienceProfile: text(800),
  pains: z.array(text(240)).min(3).max(8),
  desires: z.array(text(240)).min(2).max(8),
  objections: z.array(text(240)).min(2).max(8),
  awarenessLevel: z.enum(AWARENESS_LEVELS),
  vocabulary: z.array(text(80)).max(12),
});
export type AudienceMap = z.infer<typeof AudienceMapSchema>;

export const OfferSkeletonSchema = z.object({
  productName: text(100),
  promise: text(280),
  format: z.enum(PRODUCT_FORMATS),
  formatRationale: text(400),
  suggestedPrice: z.object({
    amountCents: z.number().int().min(0).max(10_000_000),
    currency: z.enum(CURRENCIES),
    rationale: text(400),
  }),
  modules: z
    .array(
      z.object({
        title: text(120),
        description: text(400),
        lessons: z.array(text(160)).min(1).max(12),
      }),
    )
    .min(3)
    .max(12),
  bonuses: z.array(z.object({ title: text(120), description: text(300) })).max(5),
  guarantee: text(300),
  differentiators: z.array(text(200)).min(1).max(6),
});
export type OfferSkeleton = z.infer<typeof OfferSkeletonSchema>;

export const CopySchema = z.object({
  headline: text(160),
  subheadline: text(300),
  salesPage: z.object({
    hook: text(600),
    problem: text(1200),
    solution: text(1200),
    benefits: z.array(text(240)).min(3).max(10),
    forWho: z.array(text(200)).min(2).max(8),
    notForWho: z.array(text(200)).min(1).max(6),
    faq: z.array(z.object({ question: text(200), answer: text(600) })).min(3).max(10),
    guaranteeText: text(600),
    cta: text(60),
  }),
  emails: z.array(z.object({ subject: text(120), body: text(2500) })).min(3).max(5),
  ads: z.array(z.object({ primaryText: text(600), headline: text(80), description: text(120) })).min(2).max(5),
});
export type Copy = z.infer<typeof CopySchema>;

// --- Page (Designer) --------------------------------------------------------

export const ACCENTS = ["amber", "emerald", "sky", "violet", "rose", "slate"] as const;
export const PAGE_STYLES = ["clean", "bold"] as const;

const listItem = z.object({ title: text(120), description: text(400) });

export const PageBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), headline: text(160), subheadline: text(300), ctaLabel: text(60) }),
  z.object({ type: z.literal("problem"), title: text(120), text: text(1500) }),
  z.object({ type: z.literal("solution"), title: text(120), text: text(1500) }),
  z.object({ type: z.literal("benefits"), title: text(120), items: z.array(text(240)).min(1).max(12) }),
  z.object({ type: z.literal("modules"), title: text(120), items: z.array(listItem).min(1).max(12) }),
  z.object({
    type: z.literal("audience"),
    title: text(120),
    forWho: z.array(text(200)).min(1).max(8),
    notForWho: z.array(text(200)).max(6),
  }),
  z.object({ type: z.literal("bonuses"), title: text(120), items: z.array(listItem).min(1).max(5) }),
  z.object({
    type: z.literal("price"),
    title: text(120),
    priceLabel: text(60),
    ctaLabel: text(60),
    note: z.string().trim().max(300),
  }),
  z.object({ type: z.literal("guarantee"), title: text(120), text: text(800) }),
  z.object({
    type: z.literal("faq"),
    title: text(120),
    items: z.array(z.object({ question: text(200), answer: text(600) })).min(1).max(12),
  }),
  z.object({ type: z.literal("cta"), headline: text(160), ctaLabel: text(60) }),
  z.object({ type: z.literal("text"), title: text(120), text: text(2000) }),
]);
export type PageBlock = z.infer<typeof PageBlockSchema>;
export type PageBlockType = PageBlock["type"];

/** Checkout links must be https. Empty string means "not configured yet". */
export const CheckoutUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https:\/\/[^\s<>"']+$/i.test(v), "must be an https:// link");

export const PageDocumentSchema = z.object({
  theme: z.object({ accent: z.enum(ACCENTS), style: z.enum(PAGE_STYLES) }),
  checkoutUrl: CheckoutUrlSchema,
  blocks: z.array(PageBlockSchema).min(1).max(30),
});
export type PageDocument = z.infer<typeof PageDocumentSchema>;

// --- Sentinel ---------------------------------------------------------------

export const ISSUE_CATEGORIES = [
  "income_claim",
  "guaranteed_result",
  "health_claim",
  "prohibited_topic",
  "price_mismatch",
  "language",
  "copied_text",
  "consistency",
  "other",
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const SentinelIssueSchema = z.object({
  agent: z.enum(["researcher", "strategist", "copywriter", "designer"]),
  severity: z.enum(["blocker", "warning"]),
  category: z.enum(ISSUE_CATEGORIES),
  location: z.string().trim().max(200),
  problem: text(400),
  suggestion: z.string().trim().max(400),
});
export type SentinelIssue = z.infer<typeof SentinelIssueSchema>;

export const SentinelReportSchema = z.object({
  approved: z.boolean(),
  summary: text(600),
  issues: z.array(SentinelIssueSchema).max(30),
});
export type SentinelReport = z.infer<typeof SentinelReportSchema>;

/** Everything the pipeline produces, by agent. */
export type Deliverables = {
  manager: ManagerOutput;
  researcher: AudienceMap;
  strategist: OfferSkeleton;
  copywriter: Copy;
  designer: PageDocument;
  sentinel: SentinelReport;
};

export const DELIVERABLE_SCHEMAS = {
  manager: ManagerOutputSchema,
  researcher: AudienceMapSchema,
  strategist: OfferSkeletonSchema,
  copywriter: CopySchema,
  designer: PageDocumentSchema,
  sentinel: SentinelReportSchema,
} as const;
