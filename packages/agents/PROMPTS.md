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
