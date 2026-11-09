## What changed

## Why

## How I tested it

## Checklist

- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass
- [ ] New tables have RLS and policies in the same migration, with tests
- [ ] Prompt or schema changes bump the agent version and update `packages/agents/PROMPTS.md`
- [ ] No AI keys or secrets in logs, errors or step outputs
- [ ] Nothing from the "never" list (trading, bets, income estimates, paid plans, in-app currency)
