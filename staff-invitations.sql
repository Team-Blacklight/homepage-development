-- Team Blacklight staff invitations. Run in Supabase SQL Editor before enabling staff invitations.
alter table public.profiles
  add column if not exists account_type text not null default 'customer'
  check (account_type in ('customer','staff'));

create table if not exists public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.staff_invites enable row level security;
-- No browser-facing policies: only the service-role Edge Functions may access invitation records.

create or replace function public.redeem_staff_invite(
  p_token_hash text,
  p_user_id uuid,
  p_email text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_id uuid;
begin
  update public.staff_invites
     set redeemed_at = now()
   where token_hash = p_token_hash
     and lower(email) = lower(p_email)
     and redeemed_at is null
     and expires_at > now()
  returning id into invite_id;

  if invite_id is null then
    return false;
  end if;

  update public.profiles
     set account_type = 'staff'
   where id = p_user_id;

  if not found then
    raise exception 'Profile not found for invited account';
  end if;

  return true;
end;
$$;

revoke all on function public.redeem_staff_invite(text,uuid,text) from public, anon, authenticated;
grant execute on function public.redeem_staff_invite(text,uuid,text) to service_role;
