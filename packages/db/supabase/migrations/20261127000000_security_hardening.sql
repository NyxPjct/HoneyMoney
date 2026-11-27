-- HoneyMoney — security hardening (2026-11-27).
--
--   * Usage ledger: generation limits are counted on rows the user cannot delete. Before this,
--     the limits counted agent_runs, which disappear when a project is deleted, so deleting
--     projects reset the free-model daily limit.
--   * consume_agent_run(): the worker reserves each model call atomically (per-user lock), so
--     parallel requests cannot all pass the check at once.
--   * is_admin() moves to a schema that the Data API does not expose.
--   * Per-user cap on projects (rows can be inserted directly through the Data API).

-- ---------------------------------------------------------------------------
-- Private schema: helpers used by policies, never callable through /rest/v1/rpc.
-- ---------------------------------------------------------------------------

create schema if not exists private;
revoke all on schema private from public;
-- Policies run as the caller, so the API roles need USAGE to evaluate them. The schema is not in
-- the Data API's exposed schemas, so nothing in it is reachable over HTTP.
grant usage on schema private to anon, authenticated, service_role;

create function private.is_admin()
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

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated, service_role;

drop policy "catalog_offers: public read published" on public.catalog_offers;
drop policy "catalog_offers: admin insert" on public.catalog_offers;
drop policy "catalog_offers: admin update" on public.catalog_offers;
drop policy "catalog_offers: admin delete" on public.catalog_offers;
drop policy "catalog_sources: public read published" on public.catalog_sources;
drop policy "catalog_sources: admin insert" on public.catalog_sources;
drop policy "catalog_sources: admin update" on public.catalog_sources;
drop policy "catalog_sources: admin delete" on public.catalog_sources;

create policy "catalog_offers: public read published" on public.catalog_offers
  for select to anon, authenticated
  using (is_published or (select private.is_admin()));

create policy "catalog_offers: admin insert" on public.catalog_offers
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "catalog_offers: admin update" on public.catalog_offers
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "catalog_offers: admin delete" on public.catalog_offers
  for delete to authenticated
  using ((select private.is_admin()));

create policy "catalog_sources: public read published" on public.catalog_sources
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.catalog_offers o
      where o.id = catalog_offer_id and (o.is_published or (select private.is_admin()))
    )
  );

create policy "catalog_sources: admin insert" on public.catalog_sources
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "catalog_sources: admin update" on public.catalog_sources
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "catalog_sources: admin delete" on public.catalog_sources
  for delete to authenticated
  using ((select private.is_admin()));

drop function public.is_admin();

-- ---------------------------------------------------------------------------
-- usage_events — one row per model call. Only the server writes; users can read their own.
-- Tied to the profile (not the project), so deleting projects does not erase usage.
-- ---------------------------------------------------------------------------

create table public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  key_source text not null check (key_source in ('user', 'instance')),
  created_at timestamptz not null default now()
);

create index usage_events_user_created_idx on public.usage_events (user_id, created_at desc);

alter table public.usage_events enable row level security;

create policy "usage_events: read own" on public.usage_events
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.usage_events from anon, authenticated;
grant select on public.usage_events to authenticated;

-- Keep the limits working across this migration: usage from the last day counts.
insert into public.usage_events (user_id, key_source, created_at)
select r.user_id, coalesce(r.key_source, 'user'), r.created_at
from public.agent_runs r
where r.created_at > now() - interval '1 day';

-- Reserve one model call for a user, or return false when a limit is reached.
-- A per-user advisory lock makes check-and-insert atomic. Service role only (the worker).
create function public.consume_agent_run(
  p_user_id uuid,
  p_key_source text,
  p_hourly_limit integer,
  p_instance_daily_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hour integer;
  v_day integer;
begin
  if p_key_source not in ('user', 'instance') then
    raise exception 'invalid key source' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('usage:' || p_user_id::text, 0));

  select count(*) into v_hour
  from public.usage_events u
  where u.user_id = p_user_id and u.created_at > now() - interval '1 hour';
  if v_hour >= p_hourly_limit then
    return false;
  end if;

  if p_key_source = 'instance' then
    select count(*) into v_day
    from public.usage_events u
    where u.user_id = p_user_id and u.key_source = 'instance' and u.created_at > now() - interval '1 day';
    if v_day >= p_instance_daily_limit then
      return false;
    end if;
  end if;

  insert into public.usage_events (user_id, key_source) values (p_user_id, p_key_source);
  -- Old rows are not needed for any limit.
  delete from public.usage_events u where u.user_id = p_user_id and u.created_at < now() - interval '30 days';
  return true;
end;
$$;

revoke all on function public.consume_agent_run(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_agent_run(uuid, text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Per-user cap on projects.
-- ---------------------------------------------------------------------------

create function public.enforce_project_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('projects:' || new.user_id::text, 0));
  if (select count(*) from public.projects p where p.user_id = new.user_id) >= 200 then
    raise exception 'project limit reached' using errcode = 'P0001', hint = 'Delete old projects to create new ones.';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_project_quota() from public, anon, authenticated;

create trigger projects_quota
  before insert on public.projects
  for each row execute function public.enforce_project_quota();
