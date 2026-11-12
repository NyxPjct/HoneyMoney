# Deploying the official instance

Free tiers only: Supabase (database, auth, Vault), Vercel (web app) and Inngest (agent queue). About 15 minutes.

## 1. Supabase

1. Create a project (São Paulo / `sa-east-1` is closest to Brazilian users).
2. Apply `packages/db/supabase/migrations/*.sql` (`npx supabase link --project-ref <ref>` then `npx supabase db push` from `packages/db`, or paste the SQL in the SQL editor).
3. **Authentication → URL Configuration**: Site URL `https://<your app domain>`; add `https://<your app domain>/auth/callback` to Redirect URLs.
4. **Project Settings → API Keys**: note the project URL, the publishable key and the secret (service role) key.
5. *(Needs a custom SMTP provider or a paid plan; Supabase blocks template edits on the free tier's built-in sender.)* **Authentication → Emails → Templates**: point the links to `/auth/confirm` so they also sign the user in when the e-mail is opened in another browser or device. With the default templates, opening the link elsewhere still confirms the account and the app shows "e-mail confirmado, agora é só entrar".
   - Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/app`
   - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
   - Change e-mail: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/app/settings`
6. Optional, before launch: **Authentication → Emails → SMTP** with your own provider. The built-in sender only allows a few e-mails per hour.

## 2. Vercel

1. https://vercel.com/new → import the GitHub repository.
2. **Root Directory**: `apps/web` (framework Next.js is detected; `apps/web/vercel.json` sets the install command).
3. Environment variables:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key (`sb_publishable_…`) |
   | `SUPABASE_SERVICE_ROLE_KEY` | secret key — server only, never shared |
   | `NEXT_PUBLIC_APP_URL` | `https://<your app domain>` |
   | `INSTANCE_AI_KEY` *(optional)* | Gemini key for the free model (https://aistudio.google.com/apikey) |
   | `INSTANCE_DAILY_RUN_LIMIT` *(optional)* | free-model agent runs per user per day (default 40) |

4. Deploy.

## 3. Inngest

1. In Vercel: **Integrations → Browse Marketplace → Inngest → Add**, and connect the project. This sets `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` and syncs `https://<your app domain>/api/inngest` on every deploy.
2. Redeploy once so the app picks up the keys.

## 4. Check

- Sign up at `https://<your app domain>/signup`, confirm the e-mail, add an AI key in Settings and create an offer: the office should animate as the agents run (Inngest dashboard → Runs shows each step).

## 5. Apps that open the official server

Set the repository variable **Settings → Secrets and variables → Actions → Variables → `HONEYMONEY_SERVER_URL`** = `https://<your app domain>`. The next release bakes it into the desktop apps (no setup screen) and the Android app (also locks in-app navigation to that host). Users can still change the server from the app menu / Settings.
