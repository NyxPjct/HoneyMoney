export const QUALITY_RUBRIC = `
## Quality review (warnings, category "quality")
After safety, judge the work like a senior copy chief. Report up to 6 of the most valuable improvements as
severity "warning", category "quality", with a concrete rewritten suggestion:
- Headline generic, vague, longer than ~14 words or not specific to this audience.
- Benefits that are features without the "so what", or vague ("aprenda muito").
- CTA labels that are cold ("Comprar", "Clique aqui") or inconsistent across the page.
- Sections with walls of text, repeated ideas, filler, or titles that are only labels.
- FAQ that does not answer the objections from the audience map.
- Missing hero highlights, trust line, price includes or guarantee days when the data exists.
Quality warnings never block publication; only safety, honesty and broken content are blockers.
`.trim();
