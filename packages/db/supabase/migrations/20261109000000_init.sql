-- HoneyMoney — initial schema (Phase 1 / MVP).
--
-- Rules enforced here:
--   * Every table is created with RLS enabled and its policies in this same migration.
--   * AI keys are stored in Supabase Vault. Only the service role can read them back.
--   * Columns that drive trust decisions (status, role, approvals) are not writable by users;
--     only the server (service role) changes them.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('user', 'admin');
create type public.project_status as enum ('draft', 'generating', 'review', 'published');
create type public.agent_name as enum ('manager', 'researcher', 'strategist', 'copywriter', 'designer', 'sentinel');
create type public.agent_run_status as enum ('queued', 'running', 'succeeded', 'failed', 'needs_input', 'changes_requested');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  age_confirmed_at timestamptz,
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'es', 'en')),
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Users may only touch harmless columns. `role` is changed by an admin with the service role.
revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant update (display_name, age_confirmed_at, locale) on public.profiles to authenticated;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Admin check used by policies. SECURITY DEFINER so it can read profiles regardless of the caller's RLS.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- New auth user -> profile. Age confirmation and locale come from the sign-up form metadata.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locale text := coalesce(new.raw_user_meta_data ->> 'locale', 'pt-BR');
begin
  if v_locale not in ('pt-BR', 'es', 'en') then
    v_locale := 'pt-BR';
  end if;

  insert into public.profiles (id, display_name, age_confirmed_at, locale)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'), 80),
    case when (new.raw_user_meta_data ->> 'age_confirmed') = 'true' then now() else null end,
    v_locale
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- ai_keys — the secret lives in Vault; this table only keeps a pointer and the last 4 chars.
-- ---------------------------------------------------------------------------

create table public.ai_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('google', 'openai', 'anthropic')),
  secret_id uuid not null,
  last4 text not null check (char_length(last4) = 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index ai_keys_user_id_idx on public.ai_keys (user_id);

alter table public.ai_keys enable row level security;

create policy "ai_keys: read own" on public.ai_keys
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "ai_keys: delete own" on public.ai_keys
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- No insert/update policies: keys are written only through upsert_ai_key() by the server.
-- The Vault pointer is not even readable by the owner.
revoke all on public.ai_keys from anon;
revoke all on public.ai_keys from authenticated;
grant select (id, user_id, provider, last4, created_at, updated_at) on public.ai_keys to authenticated;
grant delete on public.ai_keys to authenticated;

create trigger ai_keys_updated_at before update on public.ai_keys
  for each row execute function public.set_updated_at();

-- Deleting a key row (directly or by account deletion cascade) also deletes the Vault secret.
create function public.delete_ai_key_secret()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from vault.secrets where id = old.secret_id;
  return old;
end;
$$;

revoke all on function public.delete_ai_key_secret() from public, anon, authenticated;

create trigger ai_keys_delete_secret
  after delete on public.ai_keys
  for each row execute function public.delete_ai_key_secret();

-- Store or replace a user's key. Service role only.
create function public.upsert_ai_key(p_user_id uuid, p_provider text, p_key text)
returns table (id uuid, provider text, last4 text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_old_secret uuid;
  v_new_secret uuid;
  v_id uuid;
  v_last4 text;
begin
  if p_key is null or char_length(p_key) < 10 or char_length(p_key) > 512 then
    raise exception 'invalid key length' using errcode = '22023';
  end if;
  if p_provider not in ('google', 'openai', 'anthropic') then
    raise exception 'invalid provider' using errcode = '22023';
  end if;

  select k.secret_id into v_old_secret
  from public.ai_keys k
  where k.user_id = p_user_id and k.provider = p_provider;

  v_new_secret := vault.create_secret(p_key, null, 'honeymoney ai key');
  v_last4 := right(p_key, 4);

  insert into public.ai_keys as k (user_id, provider, secret_id, last4)
  values (p_user_id, p_provider, v_new_secret, v_last4)
  on conflict on constraint ai_keys_user_id_provider_key
  do update set secret_id = excluded.secret_id, last4 = excluded.last4
  returning k.id into v_id;

  if v_old_secret is not null then
    delete from vault.secrets where vault.secrets.id = v_old_secret;
  end if;

  return query select v_id, p_provider, v_last4;
end;
$$;

revoke all on function public.upsert_ai_key(uuid, text, text) from public, anon, authenticated;
grant execute on function public.upsert_ai_key(uuid, text, text) to service_role;

-- Read a decrypted key. Service role only (used by the worker right before calling the provider).
create function public.get_ai_key(p_user_id uuid, p_provider text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select s.decrypted_secret
  from public.ai_keys k
  join vault.decrypted_secrets s on s.id = k.secret_id
  where k.user_id = p_user_id and k.provider = p_provider;
$$;

revoke all on function public.get_ai_key(uuid, text) from public, anon, authenticated;
grant execute on function public.get_ai_key(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- catalog_offers / catalog_sources — curated reference offers.
-- The admin panel and catalog UI are Phase 2; the tables exist now because
-- projects can reference an offer (optional) and RLS must be in place from day one.
-- ---------------------------------------------------------------------------

create table public.catalog_offers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  format text not null check (char_length(format) <= 60),
  niche text not null check (char_length(niche) <= 120),
  language text not null check (language in ('pt-BR', 'es', 'en')),
  price_cents integer check (price_cents is null or price_cents >= 0),
  currency text check (currency is null or currency in ('BRL', 'USD', 'EUR')),
  price_observed_at date,
  active_ads integer check (active_ads is null or active_ads >= 0),
  active_ads_counted_at date,
  funnel text check (funnel is null or char_length(funnel) <= 2000),
  audience text check (audience is null or char_length(audience) <= 2000),
  pains text[] not null default '{}',
  page_url text check (page_url is null or page_url ~ '^https://'),
  is_published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Every number needs a collection date (source URLs live in catalog_sources).
  constraint catalog_price_dated check (price_cents is null or price_observed_at is not null),
  constraint catalog_ads_dated check (active_ads is null or active_ads_counted_at is not null)
);

alter table public.catalog_offers enable row level security;

create policy "catalog_offers: public read published" on public.catalog_offers
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy "catalog_offers: admin insert" on public.catalog_offers
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "catalog_offers: admin update" on public.catalog_offers
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "catalog_offers: admin delete" on public.catalog_offers
  for delete to authenticated
  using ((select public.is_admin()));

revoke insert, update, delete on public.catalog_offers from anon;

create trigger catalog_offers_updated_at before update on public.catalog_offers
  for each row execute function public.set_updated_at();

create table public.catalog_sources (
  id uuid primary key default gen_random_uuid(),
  catalog_offer_id uuid not null references public.catalog_offers (id) on delete cascade,
  field text not null check (char_length(field) <= 60),
  value text not null check (char_length(value) <= 500),
  source_url text not null check (source_url ~ '^https://'),
  collected_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index catalog_sources_offer_idx on public.catalog_sources (catalog_offer_id);

alter table public.catalog_sources enable row level security;

create policy "catalog_sources: public read published" on public.catalog_sources
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.catalog_offers o
      where o.id = catalog_offer_id and (o.is_published or (select public.is_admin()))
    )
  );

create policy "catalog_sources: admin insert" on public.catalog_sources
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "catalog_sources: admin update" on public.catalog_sources
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "catalog_sources: admin delete" on public.catalog_sources
  for delete to authenticated
  using ((select public.is_admin()));

revoke insert, update, delete on public.catalog_sources from anon;

create trigger catalog_sources_updated_at before update on public.catalog_sources
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  status public.project_status not null default 'draft',
  briefing jsonb not null default '{}'::jsonb check (pg_column_size(briefing) <= 16384),
  catalog_offer_id uuid references public.catalog_offers (id) on delete set null,
  ai_provider text not null default 'instance' check (ai_provider in ('instance', 'google', 'openai', 'anthropic')),
  review_each_step boolean not null default false,
  awaiting_agent public.agent_name,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects (user_id, updated_at desc);

alter table public.projects enable row level security;

create policy "projects: read own" on public.projects
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "projects: insert own" on public.projects
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "projects: update own" on public.projects
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "projects: delete own" on public.projects
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Users edit content; the server owns status and pipeline bookkeeping.
revoke all on public.projects from anon;
revoke insert, update on public.projects from authenticated;
grant insert (user_id, name, briefing, catalog_offer_id, ai_provider, review_each_step) on public.projects to authenticated;
grant update (name, briefing, catalog_offer_id, ai_provider, review_each_step) on public.projects to authenticated;

create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- agent_runs — one row per agent execution. Drives the animated office via Realtime.
-- ---------------------------------------------------------------------------

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  agent public.agent_name not null,
  status public.agent_run_status not null default 'queued',
  round integer not null default 1 check (round between 1 and 20),
  prompt_version text not null,
  input jsonb,
  output jsonb,
  edited_output jsonb check (edited_output is null or pg_column_size(edited_output) <= 65536),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  key_source text check (key_source is null or key_source in ('user', 'instance')),
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agent_runs_project_idx on public.agent_runs (project_id, created_at desc);
create index agent_runs_user_created_idx on public.agent_runs (user_id, created_at desc);

alter table public.agent_runs enable row level security;

create policy "agent_runs: read own" on public.agent_runs
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "agent_runs: edit own output" on public.agent_runs
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.agent_runs from anon;
revoke insert, update, delete on public.agent_runs from authenticated;
grant update (edited_output) on public.agent_runs to authenticated;

create trigger agent_runs_updated_at before update on public.agent_runs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- offer_versions — immutable history of each generated offer.
-- ---------------------------------------------------------------------------

create table public.offer_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  version integer not null check (version >= 1),
  promise text not null,
  structure jsonb not null,
  copy jsonb not null,
  sentinel_report jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, version)
);

alter table public.offer_versions enable row level security;

create policy "offer_versions: read own" on public.offer_versions
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.offer_versions from anon;
revoke insert, update, delete on public.offer_versions from authenticated;

create trigger offer_versions_updated_at before update on public.offer_versions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- pages — sales page in blocks. `blocks` is the editable draft; `published_blocks`
-- is the snapshot that visitors see, written only by the server after Sentinel approval.
-- ---------------------------------------------------------------------------

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$'),
  blocks jsonb not null default '[]'::jsonb check (pg_column_size(blocks) <= 131072),
  approved_at timestamptz,
  sentinel_report jsonb,
  published_blocks jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pages enable row level security;

create policy "pages: read own" on public.pages
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "pages: edit own draft" on public.pages
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.pages from anon;
revoke insert, update, delete on public.pages from authenticated;
grant update (blocks) on public.pages to authenticated;

create trigger pages_updated_at before update on public.pages
  for each row execute function public.set_updated_at();

-- Any change to the draft invalidates the Sentinel approval, unless the same
-- statement sets a new approval (the server does that after a review).
create function public.pages_reset_approval()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.blocks is distinct from old.blocks and new.approved_at is not distinct from old.approved_at then
    new.approved_at := null;
  end if;
  return new;
end;
$$;

create trigger pages_reset_approval before update on public.pages
  for each row execute function public.pages_reset_approval();

-- Public read of a published page: returns only what a visitor needs. The snapshot stays
-- online while the owner regenerates or edits the draft; unpublishing clears published_at.
create function public.get_published_page(p_slug text)
returns table (slug text, title text, blocks jsonb, published_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select pg.slug, pr.name, pg.published_blocks, pg.published_at
  from public.pages pg
  join public.projects pr on pr.id = pg.project_id
  where pg.slug = p_slug
    and pg.published_at is not null
    and pg.published_blocks is not null;
$$;

revoke all on function public.get_published_page(text) from public;
grant execute on function public.get_published_page(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Realtime: the office listens to agent_runs and projects (RLS still applies).
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.agent_runs, public.projects;
  end if;
end;
$$;
