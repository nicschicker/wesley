-- PL/pgSQL wertet in CASE beide Zweige aus; daher IF/ELSE statt CASE.
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

-- Trigger-Funktion nicht über die API aufrufbar machen
revoke execute on function public.enforce_group_membership() from public, anon, authenticated;
