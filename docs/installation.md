# Installation

## Local development

Requirements: Node.js 22, pnpm 10, Docker.

1. `pnpm install`
2. `pnpm db:start` — starts Supabase locally (Postgres, Auth, Realtime, Studio at http://127.0.0.1:54323) and applies `packages/db/supabase/migrations`.
3. `cp .env.example apps/web/.env.local` and fill in the anon and service-role keys printed by step 2.
4. `pnpm dev` — starts Next.js on http://localhost:3000 and the Inngest dev server on http://localhost:8288 (it discovers the functions at `/api/inngest`).

Local e-mail confirmation is disabled in `packages/db/supabase/config.toml`; e-mails sent by Auth are visible in Inbucket at http://127.0.0.1:54324.

To test the free model locally, set `INSTANCE_AI_KEY` (e.g. a Gemini key from https://aistudio.google.com/apikey). Otherwise, add your own key in **Settings**.

To make yourself an admin (needed only for Phase 2 catalog features):

```sql
update public.profiles set role = 'admin' where id = '<your auth user id>';
```

## Production (official stack, free tiers)

### 1. Supabase

1. Create a project at https://supabase.com.
2. Apply the migrations: `npx supabase link --project-ref <ref>` then `npx supabase db push` (from `packages/db`).
3. Vault is enabled on every Supabase project; nothing to configure.
4. **Auth → URL configuration**: site URL `https://<your app domain>`, redirect URL `https://<your app domain>/auth/callback`.
5. **Auth → Providers → Google** (optional): add the client ID and secret from Google Cloud; authorized redirect URI is `https://<ref>.supabase.co/auth/v1/callback`.

### 2. Inngest

1. Create an app at https://app.inngest.com.
2. Copy the **Event key** and **Signing key** to `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`.
3. After deploying, sync the app URL `https://<your app domain>/api/inngest` (or install the Inngest Vercel integration).

### 3. Vercel

1. Import the repository. Root directory: `apps/web`. Framework: Next.js. Install command: `pnpm install`.
2. Set the environment variables from `.env.example` (do **not** set `INNGEST_DEV`).
3. Domains: add your app domain and, for published pages, a wildcard domain such as `*.pages.example.com`, then set `NEXT_PUBLIC_PAGES_DOMAIN=pages.example.com`.

Published pages are then served at `https://<slug>.pages.example.com`. Because they live on another host, they never receive the app's session cookies. If you skip the wildcard domain, pages are served at `https://<app>/sites/<slug>`.

## Self-hosting the worker outside Vercel

The queue functions also run as a standalone Node server:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... INNGEST_SIGNING_KEY=... pnpm --filter @honeymoney/worker start
```

Then register `http://<host>:3001/api/inngest` in Inngest instead of the Next.js route.

## Environment variables

See [`.env.example`](../.env.example). Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `INNGEST_SIGNING_KEY`, `INSTANCE_AI_KEY`) must only exist on the server.
