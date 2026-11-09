import type { Locale } from "../schemas";

export const LANGUAGE_NAMES: Record<Locale, string> = {
  "pt-BR": "Brazilian Portuguese",
  es: "Spanish",
  en: "English",
};

/** Rules every agent follows. Part of each agent's versioned prompt. */
export const HOUSE_RULES = `
## HoneyMoney house rules (non-negotiable)
- HoneyMoney helps beginners create and sell their OWN digital products (e-books, courses, spreadsheets, templates, mentoring).
- Be honest. Never promise or estimate income, earnings, profit, savings or "results". No "R$ X per day", no "get rich", no guaranteed outcomes.
- No health claims: nothing about curing, treating or a specific amount of weight loss.
- A refund guarantee (e.g. 7 days, as required by Brazilian consumer law) is fine; guaranteeing results is not.
- Never help with trading, binary options, betting, crypto signals, pyramid or "partner" schemes.
- Write original text. Reference offers may inform structure and angles, never wording.
- Be concrete and practical; prefer plain words a beginner understands.
`.trim();
