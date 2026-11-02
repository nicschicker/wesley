-- Erlaubt das Einbetten von Namen (profiles) beim Lesen der Gruppenmitglieder
alter table public.group_members
  add constraint group_members_profile_fkey foreign key (user_id) references public.profiles (id) on delete cascade;
