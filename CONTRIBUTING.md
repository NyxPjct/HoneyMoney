# Contributing to HoneyMoney

Thank you for helping! HoneyMoney is free software for beginners who want to sell their own digital products. Every contribution should keep it **free, honest and safe**.

## Ground rules

- **Never** add trading, binary options, betting, broker integrations, income estimates, in-app currency or paid plans. Pull requests that do will be closed.
- **Every table** is created with RLS enabled and its policies in the same migration. Add tests in `packages/db/tests/rls.test.ts`.
- **AI keys** never reach the browser and never appear in logs, errors or Inngest step outputs.
- **Agents**: prompts are versioned in `packages/agents/src/agents/<agent>/prompt.vN.ts`. Any change to a prompt or schema bumps the agent's `VERSION` and is noted in [`packages/agents/PROMPTS.md`](packages/agents/PROMPTS.md). Outputs are validated by Zod.
- **Phases**: the roadmap is gated. Phase 2/3 features need a maintainer-approved issue first.
- TypeScript `strict` everywhere. No `any` unless there is no alternative (and then explain why).

## Getting started

Follow the quick start in the [README](README.md). Useful commands:

```bash
pnpm lint
```

```bash
pnpm typecheck
```

```bash
pnpm test
```

Database tests need a PostgreSQL 16 superuser connection in `DATABASE_URL` (CI uses a `postgres:16` service container).

## Pull requests

1. Open or comment on an issue first for anything bigger than a small fix.
2. Keep PRs focused; include tests for behavior changes.
3. CI (lint, types, tests) must be green.
4. Describe what changed and how you tested it. Screenshots help for UI changes.

## Good first issues

Look for the `good first issue` label. Ideas that are always welcome:

- Translations of the app interface (the MVP UI is in Brazilian Portuguese).
- More deterministic safety rules for the Sentinel (with tests in `packages/agents/tests/safety.test.ts`).
- Accessibility improvements in the office and the page editor.
- New page blocks (schema in `packages/agents/src/schemas.ts`, renderer in `packages/ui/src/page`).

By contributing you agree that your contributions are licensed under the AGPL-3.0.
