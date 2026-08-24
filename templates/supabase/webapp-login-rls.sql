-- WebApp Login UI: optional profile table and Row Level Security template.
-- Run this only after reviewing it for your project. Back up production data first.
-- This protects the profile table below; add equivalent owner_id policies to every app table.

create or replace function public.webapp_login_canonical_email(input_email text)
returns text
language plpgsql
immutable
as $$
declare
  local_part text;
  domain_part text;
begin
  local_part := lower(split_part(input_email, '@', 1));
  domain_part := lower(split_part(input_email, '@', 2));

  if domain_part in ('gmail.com', 'googlemail.com') then
    local_part := split_part(replace(local_part, '.', ''), '+', 1);
    domain_part := 'gmail.com';
  end if;

  return local_part || '@' || domain_part;
end;
$$;

create table if not exists public.webapp_login_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  canonical_email text not null unique,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.webapp_login_profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.webapp_login_profiles;
create policy "Users can read their own profile"
on public.webapp_login_profiles for select
using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.webapp_login_profiles;
create policy "Users can update their own profile"
on public.webapp_login_profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.webapp_login_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.webapp_login_profiles (id, email, canonical_email, full_name)
  values (
    new.id,
    lower(new.email),
    public.webapp_login_canonical_email(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists webapp_login_on_auth_user_created on auth.users;
create trigger webapp_login_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.webapp_login_handle_new_user();

-- Example for every application-owned table:
-- alter table public.documents enable row level security;
-- create policy "Users manage their own documents" on public.documents
--   for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
