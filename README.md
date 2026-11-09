<div align="center">

# 🍯 HoneyMoney

**Free, open-source platform where AI agents help anyone create a digital product offer from scratch.**

Product, sales page and copy, built by a team of AI agents you can watch working in an animated office.
Bring your own AI key. No subscriptions, no in-app currency, no income promises.

**English** · [Português (Brasil)](README.pt-BR.md) · [Español](README.es.md)

[![CI](https://github.com/NyxPjct/HoneyMoney/actions/workflows/ci.yml/badge.svg)](https://github.com/NyxPjct/HoneyMoney/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-amber.svg)](LICENSE)

![HoneyMoney landing page](docs/images/landing.png)

</div>

## What it does

HoneyMoney is for beginners who want to sell a digital product of their own (e-book, course, spreadsheet, template, mentoring) without paying for an expensive subscription to get started.

1. **Write a short briefing**: what you know, who you want to help, the format and the price you have in mind.
2. **The agents work in sequence**, each at its own desk:

   | Agent | Role | Delivers |
   | --- | --- | --- |
   | Manager (Gerente) | Coordinates the queue and asks you when information is missing | Project status |
   | Researcher (Pesquisadora) | Maps the niche, pains and objections of the audience | Audience map |
   | Strategist (Estrategista) | Defines promise, format, suggested price and product structure | Offer skeleton |
   | Copywriter | Writes headline, sales page, e-mails and ads | Full copy |
   | Designer | Assembles the sales page in blocks | Sales page |
   | Sentinel (Sentinela) | Reviews everything: income or health claims, guaranteed results, price coherence, language, copied text | Approval or list of fixes |

3. **The Sentinel reviews.** If something is wrong, the work goes back only to the agent responsible for it, with the list of fixes.
4. **You edit and publish.** Edit any deliverable, paste your checkout link and publish the page on its own subdomain.

![The agent office](docs/images/office.png)

Every character's animation (waiting, working, handing off, asking for changes, done) mirrors the real state of that agent's run in the database, streamed with Supabase Realtime.

## Principles

- **Actually free.** No paid plans and no in-app currency. AI costs stay with whoever runs it: users connect their own key (Gemini, OpenAI or Claude) or use a free model offered by the instance, with a daily limit.
- **Honest.** No income promises or estimates, ever. The Sentinel blocks them with deterministic rules *and* a model review, and nothing is published without its approval.
- **Create value, don't gamble.** Trading, binary options, betting and "partner" schemes are out of scope and refused by the agents.
- **Open.** AGPL-3.0, easy to self-host, documented for contributors.

## Quick start

Requirements: Node.js 22, pnpm 10, Docker (for the local Supabase stack).

```bash
git clone https://github.com/NyxPjct/HoneyMoney.git && cd HoneyMoney
```

```bash
pnpm install
```

```bash
pnpm db:start
```

```bash
cp .env.example apps/web/.env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` with the values printed by `pnpm db:start`, then:

```bash
pnpm dev
```

Open http://localhost:3000, create an account, add your AI key in **Settings** and create your first offer. `pnpm dev` starts the Next.js app and the Inngest dev server (http://localhost:8288) that runs the agents.

See [docs/installation.md](docs/installation.md) for production deployment (Vercel + Supabase + Inngest), Google login and the pages subdomain.

## Architecture

```mermaid
flowchart LR
    NAV[Browser] --> NEXT[Next.js on Vercel<br/>pages, tRPC API, auth]
    NEXT --> PUB[Published pages<br/>separate subdomain]
    NEXT -- queues generation --> FILA[Inngest<br/>agent queue]
    FILA --> IA[AI providers<br/>Gemini, OpenAI, Claude]
    NEXT -- reads/writes --> SUPA
    FILA -- writes results --> SUPA
    subgraph SUPA[Supabase]
        AUTH[Auth]
        PG[Postgres + RLS]
        VAULT[Vault<br/>encrypted AI keys]
    end
```

| Layer | Technology |
| --- | --- |
| App and API | Next.js (App Router), TypeScript (strict), tRPC |
| UI | Tailwind CSS, shadcn-style components, Lucide |
| Office | 2D SVG sprites animated with CSS (light on phones) |
| Database, auth | Supabase: Postgres with RLS on every table, Auth, Vault |
| Queue | Inngest (each agent is a durable step with retries) |
| AI | Vercel AI SDK, multiple providers |
| Analytics | PostHog, only after consent |

More in [docs/architecture.md](docs/architecture.md) and [docs/agents.md](docs/agents.md).

## Repository layout

```
apps/web          Next.js: app, landing page and published pages
apps/worker       agent queue functions (Inngest)
packages/agents   versioned prompts, Zod schemas, safety rules and the pipeline
packages/db       Supabase migrations, types and RLS tests
packages/ui       shared components, office sprites and the sales page renderer
docs/             installation, architecture, agents
```

## Security

- AI keys are stored in **Supabase Vault**, decrypted only by the server and the worker, never sent to the browser and never logged. The UI shows only the last 4 characters.
- **Row Level Security on every table**, with policies in the same migration, and columns that drive trust decisions (status, role, approvals, publishing) writable only by the server.
- Content from users, other agents and the catalog enters prompts as **delimited data**, never as instructions.
- Published pages are rendered from validated JSON blocks (no user HTML), with a strict nonce-based CSP, on a subdomain that never receives the app's cookies.
- Rate limits per user, briefing size limits, HSTS, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy`.
- LGPD: data export and account deletion by the user, analytics only with consent.

Found a vulnerability? Please follow [SECURITY.md](SECURITY.md).

## Development

```bash
pnpm lint
```

```bash
pnpm typecheck
```

```bash
pnpm test
```

The database tests (`packages/db`) run every migration against a plain PostgreSQL 16 with a small Supabase shim and check the RLS policies. Point `DATABASE_URL` at a superuser connection (default `postgres://postgres:postgres@127.0.0.1:5432/postgres`).

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| **1 · MVP** | Account and AI key; offer from scratch; 6 agents and Sentinel; published page; 2D office | ✅ this release |
| 2 · Catalog | Curated reference catalog with verified sources; admin panel; ad creatives; e-book and PDF | planned |
| 3 · Community | "Brain" graph; community showcase; custom domains; quiz and lead capture; 3D office | planned |

## Contributing

Contributions are welcome! Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Look for issues labeled `good first issue`.

## License

[AGPL-3.0](LICENSE). Anyone can use and modify HoneyMoney, but whoever offers a modified version as a service must publish its source code. This keeps the project from being closed and sold as a paid SaaS.
