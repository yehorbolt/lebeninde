-- ============================================================================
-- Leben in Deutschland (Alle 16 Bundesländer) – Supabase Datenbank-Schema
-- Führe dieses Skript im Supabase SQL Editor (https://supabase.com/dashboard) aus.
-- ============================================================================

create table if not exists public.user_sync_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_state text not null default 'bw',
  theme text not null default 'dark',
  api_key text not null default '',
  ai_model text not null default 'gemini-2.5-flash',
  settings_updated_at bigint not null default 0,
  progress jsonb not null default '{}'::jsonb,
  ai_cache jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Strikte Row-Level Security (RLS): Jeder Nutzer sieht und ändert NUR seine eigenen Daten
alter table public.user_sync_data enable row level security;

drop policy if exists "Nutzer koennen eigene Daten lesen" on public.user_sync_data;
create policy "Nutzer koennen eigene Daten lesen"
  on public.user_sync_data
  for select
  using (auth.uid() = user_id);

drop policy if exists "Nutzer koennen eigene Daten anlegen" on public.user_sync_data;
create policy "Nutzer koennen eigene Daten anlegen"
  on public.user_sync_data
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Nutzer koennen eigene Daten aktualisieren" on public.user_sync_data;
create policy "Nutzer koennen eigene Daten aktualisieren"
  on public.user_sync_data
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Nutzer koennen eigene Daten loeschen" on public.user_sync_data;
create policy "Nutzer koennen eigene Daten loeschen"
  on public.user_sync_data
  for delete
  using (auth.uid() = user_id);

-- Echtzeit-Synchronisierung (Realtime) zwischen PC und Smartphone aktivieren
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_sync_data'
  ) then
    alter publication supabase_realtime add table public.user_sync_data;
  end if;
end $$;
