-- Wesley · Bereiche, Ziele, Sport-Tracking, Flouz (geteilte Ausgaben)

-- ---------- Bereiche erweitern ----------
create type public.area_kind as enum ('tasks', 'sport', 'money');

alter table public.areas
  add column slug text,
  add column kind public.area_kind not null default 'tasks',
  add column sort_mode text not null default 'priority' check (sort_mode in ('priority', 'module'));
alter table public.areas add constraint areas_user_slug_key unique (user_id, slug);

alter table public.tasks
  add column module text not null default '' check (char_length(module) <= 60);

alter table public.profiles add column email text not null default '';

-- ---------- Ziele ----------
create table public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  area_id     uuid not null,
  title       text not null check (char_length(title) between 1 and 160),
  notes       text not null default '' check (char_length(notes) <= 4000),
  target_date date,
  progress    int not null default 0 check (progress between 0 and 100),
  status      text not null default 'active' check (status in ('active', 'achieved', 'dropped')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  foreign key (area_id, user_id) references public.areas (id, user_id) on delete cascade
);
create index goals_user_idx on public.goals (user_id, area_id);
create trigger goals_touch before update on public.goals
  for each row execute function public.touch_updated_at();

-- ---------- Sport ----------
create table public.exercises (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);

create table public.workouts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  day        date not null,
  note       text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index workouts_user_idx on public.workouts (user_id, day desc);

create table public.workout_sets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  workout_id  uuid not null,
  exercise_id uuid not null,
  position    int not null default 0,   -- Reihenfolge der Übung im Training
  set_no      int not null check (set_no between 1 and 50),
  reps        int not null check (reps between 0 and 1000),
  weight_kg   numeric(6, 2) check (weight_kg is null or weight_kg between 0 and 1000),
  foreign key (workout_id, user_id) references public.workouts (id, user_id) on delete cascade,
  foreign key (exercise_id, user_id) references public.exercises (id, user_id) on delete cascade
);
create index workout_sets_exercise_idx on public.workout_sets (user_id, exercise_id);

-- ---------- Standard-Bereiche und Übungen pro Person ----------
create or replace function public.seed_user_defaults(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.areas (user_id, slug, name, kind, sort_mode, sort) values
    (p_user, 'harbejt',  'Harbejt',  'tasks', 'priority', 1),
    (p_user, 'skola',    'Škola',    'tasks', 'module',   2),
    (p_user, 'familie',  'Familie',  'tasks', 'priority', 3),
    (p_user, 'freundin', 'Freundin', 'tasks', 'priority', 4),
    (p_user, 'sport',    'Sport',    'sport', 'priority', 5),
    (p_user, 'flouz',    'Flouz',    'money', 'priority', 6)
  on conflict do nothing;

  insert into public.exercises (user_id, name)
  select p_user, n from unnest(array[
    'Bankdrücken', 'Schrägbankdrücken', 'Kniebeugen', 'Kreuzheben', 'Rumänisches Kreuzheben',
    'Schulterdrücken', 'Seitheben', 'Klimmzüge', 'Latzug', 'Langhantelrudern', 'Kabelrudern',
    'Bizepscurls', 'Trizepsdrücken am Kabel', 'Dips', 'Beinpresse', 'Ausfallschritte',
    'Beinstrecker', 'Beinbeuger', 'Wadenheben', 'Hip Thrust', 'Liegestütze', 'Plank (Sekunden)'
  ]) as n
  on conflict do nothing;
end $$;
revoke execute on function public.seed_user_defaults(uuid) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
          lower(coalesce(new.email, '')));
  perform public.seed_user_defaults(new.id);
  return new;
end $$;

-- Bestehende Konten nachziehen
update public.profiles p set email = lower(u.email) from auth.users u where u.id = p.id;
select public.seed_user_defaults(id) from public.profiles;

-- ---------- Flouz ----------
create table public.expense_groups (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 1 and 60),
  default_currency text not null default 'CHF' check (default_currency ~ '^[A-Z]{3}$'),
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now()
);

create table public.group_members (
  group_id  uuid not null references public.expense_groups (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  added_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);

create table public.expenses (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.expense_groups (id) on delete cascade,
  description text not null check (char_length(description) between 1 and 120),
  amount      numeric(12, 2) not null check (amount > 0),
  currency    text not null check (currency ~ '^[A-Z]{3}$'),
  day         date not null,
  paid_by     uuid not null references auth.users (id) on delete cascade,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (id, group_id)
);
create index expenses_group_idx on public.expenses (group_id, day desc);

create table public.expense_splits (
  expense_id uuid not null,
  group_id   uuid not null,
  user_id    uuid not null references auth.users (id) on delete cascade,
  share      numeric(12, 2) not null check (share >= 0),
  settled    boolean not null default false,
  settled_at timestamptz,
  primary key (expense_id, user_id),
  foreign key (expense_id, group_id) references public.expenses (id, group_id) on delete cascade
);
create index expense_splits_group_idx on public.expense_splits (group_id);

-- Ist die eingeloggte Person Mitglied der Gruppe? (security definer verhindert RLS-Rekursion)
create or replace function public.is_group_member(p_group uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group and user_id = (select auth.uid())
  );
$$;
revoke execute on function public.is_group_member(uuid) from public, anon;
grant execute on function public.is_group_member(uuid) to authenticated;

-- Zahler und Anteile müssen Gruppenmitglieder sein
create or replace function public.enforce_group_membership()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  if tg_table_name = 'expenses' then
    v_user := new.paid_by;
  else
    v_user := new.user_id;
  end if;
  if not exists (select 1 from public.group_members where group_id = new.group_id and user_id = v_user) then
    raise exception 'Person ist kein Mitglied dieser Gruppe';
  end if;
  return new;
end $$;
create trigger expenses_member_check before insert or update on public.expenses
  for each row execute function public.enforce_group_membership();
create trigger expense_splits_member_check before insert or update on public.expense_splits
  for each row execute function public.enforce_group_membership();

-- ---------- Row Level Security ----------
alter table public.goals          enable row level security;
alter table public.exercises      enable row level security;
alter table public.workouts       enable row level security;
alter table public.workout_sets   enable row level security;
alter table public.expense_groups enable row level security;
alter table public.group_members  enable row level security;
alter table public.expenses       enable row level security;
alter table public.expense_splits enable row level security;

do $$
declare t text;
begin
  foreach t in array array['goals', 'exercises', 'workouts', 'workout_sets'] loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))',
      t || ': nur eigene', t);
  end loop;
end $$;

create policy "groups: Mitglieder lesen" on public.expense_groups
  for select to authenticated using (public.is_group_member(id) or created_by = (select auth.uid()));
create policy "groups: anlegen" on public.expense_groups
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "groups: Mitglieder ändern" on public.expense_groups
  for update to authenticated using (public.is_group_member(id)) with check (public.is_group_member(id));
create policy "groups: Mitglieder löschen" on public.expense_groups
  for delete to authenticated using (public.is_group_member(id));

create policy "members: Mitglieder lesen" on public.group_members
  for select to authenticated using (public.is_group_member(group_id));
create policy "members: hinzufügen" on public.group_members
  for insert to authenticated with check (
    public.is_group_member(group_id)
    or (user_id = (select auth.uid())
        and exists (select 1 from public.expense_groups g
                    where g.id = group_id and g.created_by = (select auth.uid())))
  );
create policy "members: entfernen" on public.group_members
  for delete to authenticated using (public.is_group_member(group_id));

create policy "expenses: Mitglieder" on public.expenses
  for all to authenticated using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));
create policy "splits: Mitglieder" on public.expense_splits
  for all to authenticated using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));

-- Namen von Personen in gemeinsamen Gruppen lesen
create policy "profiles: Gruppenmitglieder lesen" on public.profiles
  for select to authenticated using (
    exists (select 1 from public.group_members a
            join public.group_members b on a.group_id = b.group_id
            where a.user_id = (select auth.uid()) and b.user_id = profiles.id)
  );

revoke all on all tables in schema public from anon;
