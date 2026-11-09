# Agents

| Agent | File | Input | Output schema |
| --- | --- | --- | --- |
| Manager (Gerente) | `packages/agents/src/agents/manager` | briefing | `ManagerOutputSchema`: ready / needs_info (≤ 3 questions) / rejected |
| Researcher (Pesquisadora) | `…/researcher` | briefing, optional catalog reference | `AudienceMapSchema` |
| Strategist (Estrategista) | `…/strategist` | briefing, audience map | `OfferSkeletonSchema` |
| Copywriter | `…/copywriter` | briefing, audience map, offer | `CopySchema` |
| Designer | `…/designer` | briefing, offer, copy | `PageDocumentSchema` |
| Sentinel (Sentinela) | `…/sentinel` | everything above | `SentinelReportSchema` |

## How a run works

1. The system prompt = agent prompt + house rules + the untrusted-data rule + the JSON Schema generated from the Zod schema.
2. All user and upstream content is wrapped in `<data name="…">…</data>`; closing tags inside the data are escaped.
3. The response is parsed (markdown fences tolerated) and validated with Zod. Invalid output gets **up to 2 new attempts**, with the validation problems sent back to the model.
4. Each attempt's tokens are summed and stored on the `agent_runs` row with the prompt version.

## Sentinel

The Sentinel combines a model review with **deterministic rules** (`src/safety.ts`) that run on every text field of the offer, copy and page:

- income promises ("fature R$ 10 mil por mês", "earn $5,000", "renda garantida"…),
- guaranteed results (refund guarantees are fine),
- health claims (cure, specific weight loss, replacing medical treatment),
- prohibited topics (trading, binary options, betting, pyramid/"partner" schemes),
- price incoherent with the format,
- 8-word overlaps with reference texts (copied third-party copy).

`approved` is recomputed from the merged issues: any blocker means not approved, whatever the model said. Blockers go back to the responsible agent (and the agents downstream of it) for up to 2 revision rounds; after that the project goes to review and the user decides.

Publishing re-runs the deterministic rules on the page and requires the Sentinel's approval of the exact draft being published.

## Review-each-step mode

When the project has "review each step" on, the pipeline waits (`step.waitForEvent`, up to 7 days) after each agent. The user can edit the deliverable and approve; the next agent receives the edited version. Without it, users can still edit any deliverable afterwards and use **Redo from here**.
