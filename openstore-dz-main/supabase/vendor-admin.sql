-- Run this in the Supabase SQL editor. New auth users are created as inactive
-- vendors; only the designated administrator can activate or deactivate them.

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  store_name text not null default 'My Store',
  is_active boolean not null default false,
  subscription_end date
);

alter table public.vendors enable row level security;

drop policy if exists "Vendors read their own row" on public.vendors;
create policy "Vendors read their own row"
  on public.vendors for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.vendors from public, anon, authenticated;
grant select on public.vendors to authenticated;

create or replace function public.create_vendor_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.vendors (user_id, store_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'store_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'My Store'
    )
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.create_vendor_for_new_user() from public, anon, authenticated;

drop trigger if exists create_vendor_after_signup on auth.users;
create trigger create_vendor_after_signup
  after insert on auth.users
  for each row execute function public.create_vendor_for_new_user();

-- These functions expose auth.users emails and vendor updates only to the
-- explicitly designated administrator; the browser never accesses auth.users.

create or replace function public.admin_list_vendors()
returns table (
  id uuid,
  user_id uuid,
  store_name text,
  is_active boolean,
  subscription_end date,
  email text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
     or (auth.jwt() ->> 'email') is distinct from 'chnakhtensloven@gmail.com' then
    raise exception using errcode = '42501', message = 'Not authorized';
  end if;

  return query
    select v.id, v.user_id, v.store_name, v.is_active, v.subscription_end, u.email::text
    from public.vendors as v
    join auth.users as u on u.id = v.user_id
    order by v.store_name;
end;
$$;

create or replace function public.admin_activate_vendor(p_vendor_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  if auth.uid() is null
     or (auth.jwt() ->> 'email') is distinct from 'chnakhtensloven@gmail.com' then
    raise exception using errcode = '42501', message = 'Not authorized';
  end if;

  update public.vendors
  set is_active = true,
      subscription_end = (current_date + interval '1 month')::date
  where public.vendors.id = p_vendor_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception using errcode = 'P0002', message = 'Vendor not found';
  end if;
end;
$$;

create or replace function public.admin_deactivate_vendor(p_vendor_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  if auth.uid() is null
     or (auth.jwt() ->> 'email') is distinct from 'chnakhtensloven@gmail.com' then
    raise exception using errcode = '42501', message = 'Not authorized';
  end if;

  update public.vendors
  set is_active = false
  where public.vendors.id = p_vendor_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception using errcode = 'P0002', message = 'Vendor not found';
  end if;
end;
$$;

revoke all on function public.admin_list_vendors() from public, anon, authenticated;
revoke all on function public.admin_activate_vendor(uuid) from public, anon, authenticated;
revoke all on function public.admin_deactivate_vendor(uuid) from public, anon, authenticated;

grant execute on function public.admin_list_vendors() to authenticated;
grant execute on function public.admin_activate_vendor(uuid) to authenticated;
grant execute on function public.admin_deactivate_vendor(uuid) to authenticated;
