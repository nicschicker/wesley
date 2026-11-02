-- Wesley · Grundschema
-- Prinzip: Jede Tabelle mit Personendaten hat user_id und Row Level Security
-- nach dem Muster user_id = auth.uid(). Tabellen nur für den Server
-- (Einladungen, Geheimnisse, Zähler) haben RLS ohne Policies: für Browser unsichtbar.

-- ---------- Typen ----------
create type public.task_status    as enum ('open', 'in_progress', 'waiting', 'done');
create type public.task_kind      as enum ('one_off', 'recurring');
create type public.task_priority  as enum ('low', 'medium', 'high');
create type public.anniversary_type as enum ('birthday', 'anniversary', 'monthly', 'custom');
create type public.calendar_provider as enum ('graph', 'ics');
create type public.restaurant_source as enum ('google', 'osm');
create type public.restaurant_status as enum ('want', 'visited');

-- ---------- Hilfsfunktion: updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- Profile ----------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  timezone     text not null default 'Europe/Zurich',
  is_admin     boolean not null default false,
  settings     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Profil automatisch beim Anlegen eines Kontos erzeugen
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Einladungen (nur Server) ----------
create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  code_hash    text not null unique,
  note         text not null default '',
  grants_admin boolean not null default false,
  created_by   uuid references auth.users (id) on delete set null,
  expires_at   timestamptz not null default (now() + interval '14 days'),
  used_by      uuid references auth.users (id) on delete set null,
  used_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- Einladung atomar reservieren: gibt die Zeile nur zurück, wenn sie gültig und unbenutzt ist
create or replace function public.consume_invitation(p_code_hash text)
returns table (id uuid, grants_admin boolean)
language sql security definer set search_path = '' as $$
  update public.invitations i
     set used_at = now()
   where i.code_hash = p_code_hash
     and i.used_at is null
     and i.expires_at > now()
  returning i.id, i.grants_admin;
$$;

-- ---------- Passkeys ----------
create table public.passkeys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  credential_id text not null unique,
  public_key    text not null,
  counter       bigint not null default 0,
  transports    text[] not null default '{}',
  device_name   text not null default '',
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);

-- ---------- Bereiche ----------
create table public.areas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  color      text not null default 'neutral',
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);

-- ---------- Tasks ----------
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  area_id      uuid,
  title        text not null check (char_length(title) between 1 and 200),
  notes        text not null default '' check (char_length(notes) <= 4000),
  kind         public.task_kind not null default 'one_off',
  status       public.task_status not null default 'open',
  priority     public.task_priority not null default 'medium',
  due_date     date,
  -- Wiederholung als JSON, z. B. {"freq":"daily"} oder {"freq":"weekly","weekdays":[1,3]}
  recurrence   jsonb,
  completed_at timestamptz,
  archived     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Bereich muss derselben Person gehören
  foreign key (area_id, user_id) references public.areas (id, user_id) on delete set null (area_id),
  check ((kind = 'recurring') = (recurrence is not null))
);
create index tasks_user_idx on public.tasks (user_id, archived, status);
create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();

create table public.task_completions (
  task_id  uuid not null references public.tasks (id) on delete cascade,
  user_id  uuid not null references auth.users (id) on delete cascade,
  day      date not null,
  created_at timestamptz not null default now(),
  primary key (task_id, day)
);
create index task_completions_user_idx on public.task_completions (user_id, day);

-- ---------- Jahrestage ----------
create table public.anniversaries (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  title              text not null check (char_length(title) between 1 and 120),
  type               public.anniversary_type not null,
  start_date         date not null,
  year_known         boolean not null default true,
  remind_days_before int not null default 3 check (remind_days_before between 0 and 60),
  notes              text not null default '',
  created_at         timestamptz not null default now()
);
create index anniversaries_user_idx on public.anniversaries (user_id);

-- ---------- Kalender ----------
create table public.calendar_connections (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  provider       public.calendar_provider not null,
  label          text not null default '',
  color          text not null default 'blue',
  status         text not null default 'ok',
  last_synced_at timestamptz,
  created_at     timestamptz not null default now()
);
-- Verschlüsselte Zugangsdaten getrennt, nur für den Server lesbar
create table public.calendar_secrets (
  connection_id uuid primary key references public.calendar_connections (id) on delete cascade,
  ciphertext    text not null,
  updated_at    timestamptz not null default now()
);

-- ---------- News ----------
create table public.news_sources (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  feed_url   text not null check (feed_url ~ '^https://'),
  label      text not null default '',
  enabled    boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, feed_url)
);

-- ---------- Restaurants ----------
create table public.restaurants (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  source      public.restaurant_source not null,
  external_id text not null,          -- Google Place-ID oder OSM-ID, keine Google-Inhalte
  maps_url    text not null default '',
  name        text not null default '', -- nur eigene Bezeichnung bzw. OSM-Name
  status      public.restaurant_status not null default 'want',
  own_rating  int check (own_rating between 1 and 5),
  notes       text not null default '',
  created_at  timestamptz not null default now(),
  unique (user_id, source, external_id)
);

-- ---------- Kontingent-Zähler (nur Server) ----------
create table public.usage_counters (
  provider text not null,
  day      date not null,
  count    int not null default 0,
  primary key (provider, day)
);

-- Erhöht den Zähler nur, wenn das Limit noch nicht erreicht ist. true = Abfrage erlaubt.
create or replace function public.try_consume_quota(p_provider text, p_limit int, p_amount int default 1)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_day date := (now() at time zone 'Europe/Zurich')::date;
  v_new int;
begin
  insert into public.usage_counters (provider, day, count)
  values (p_provider, v_day, 0)
  on conflict (provider, day) do nothing;

  update public.usage_counters
     set count = count + p_amount
   where provider = p_provider and day = v_day and count + p_amount <= p_limit
  returning count into v_new;

  return v_new is not null;
end $$;

-- ---------- Row Level Security ----------
alter table public.profiles             enable row level security;
alter table public.invitations          enable row level security;
alter table public.passkeys             enable row level security;
alter table public.areas                enable row level security;
alter table public.tasks                enable row level security;
alter table public.task_completions     enable row level security;
alter table public.anniversaries        enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.calendar_secrets     enable row level security;
alter table public.news_sources         enable row level security;
alter table public.restaurants          enable row level security;
alter table public.usage_counters       enable row level security;

-- Profile: eigene Zeile lesen und ändern, aber is_admin nicht selbst setzen
create policy "profiles: eigene lesen" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: eigene ändern" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (display_name, timezone, settings) on public.profiles to authenticated;

-- Passkeys: lesen und löschen; Anlegen nur über den Server (nach WebAuthn-Prüfung)
create policy "passkeys: eigene lesen" on public.passkeys
  for select to authenticated using (user_id = (select auth.uid()));
create policy "passkeys: eigene löschen" on public.passkeys
  for delete to authenticated using (user_id = (select auth.uid()));

-- Standard-Policy für alle persönlichen Tabellen
do $$
declare t text;
begin
  foreach t in array array['areas','tasks','task_completions','anniversaries',
                           'calendar_connections','news_sources','restaurants']
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))',
      t || ': nur eigene', t);
  end loop;
end $$;

-- Anonyme Besucher haben gar keinen Tabellenzugriff
revoke all on all tables in schema public from anon;

-- Server-Funktionen nur für den Service-Role-Schlüssel
revoke execute on function public.consume_invitation(text) from public, anon, authenticated;
revoke execute on function public.try_consume_quota(text, int, int) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
