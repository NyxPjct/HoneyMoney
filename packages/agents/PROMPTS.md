# Prompt changelog

Each agent's prompt lives in `src/agents/<agent>/prompt.vN.ts` and exports a `VERSION`. The version is stored on every `agent_runs` row, so results can always be traced to the exact prompt.

Bump the version (semver) whenever the prompt **or** the output schema changes:

- **patch**: wording fixes that should not change outputs meaningfully;
- **minor**: new guidance or optional fields;
- **major**: schema changes that break older deliverables.

| Agent | Version | Change |
| --- | --- | --- |
| manager | 1.0.0 | Initial prompt; deterministic refusal of prohibited topics before calling the model |
| researcher | 1.0.0 | Initial prompt |
| strategist | 1.0.0 | Initial prompt |
| copywriter | 1.0.0 | Initial prompt |
| designer | 1.0.0 | Initial prompt; checkout link always forced to empty |
| sentinel | 1.0.0 | Initial prompt; merged with deterministic claim, price and copied-text checks |
| researcher | 2.0.0 | Research playbook (pain layers, triggers, failed attempts, awareness); new required `triggers` and `failedAttempts` |
| strategist | 2.0.0 | Offer playbook (big idea, honest promise, quick-win module order, bonuses, price ranges); new `bigIdea` and `transformation` |
| copywriter | 2.0.0 | Copywriting playbook (headline formulas, PAS, fascination bullets, CTAs and microcopy, e-mail and ad structure, honesty filters); new page fields (eyebrow, highlights, how it works, before/after, author story, closing headline) |
| designer | 2.0.0 | Conversion design playbook (section order, styles, accents, fonts); new blocks `highlight`, `comparison`, `steps`, `author`; hero, price and guarantee details filled from earlier deliverables |
| sentinel | 2.0.0 | Quality rubric (non-blocking `quality` warnings with rewrites); negated phrases are not claims |

The playbooks live in `src/knowledge/` and are part of the versioned prompts: changing one changes behaviour, so bump the version of every prompt that includes it. Every system prompt also carries a concrete example of the expected JSON (generated from the schema), which keeps small free models from breaking the format.
