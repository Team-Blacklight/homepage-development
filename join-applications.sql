-- Team Blacklight join application intake. Run in the Supabase SQL Editor before enabling intake.
create table if not exists public.site_settings (
 key text primary key, value jsonb not null default 'false'::jsonb,
 updated_by uuid references auth.users(id), updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "Public can read join application setting" on public.site_settings;
create policy "Public can read join application setting" on public.site_settings for select to anon,authenticated using(key='join_applications_enabled');
drop policy if exists "Staff can manage join application setting" on public.site_settings;
create policy "Staff can manage join application setting" on public.site_settings for all to authenticated
using(key='join_applications_enabled' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','overseer')))
with check(key='join_applications_enabled' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','overseer')));
insert into public.site_settings(key,value) values('join_applications_enabled','false'::jsonb) on conflict(key) do nothing;

create table if not exists public.join_applications (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 1 and 80),
 email text not null check(char_length(email) between 3 and 254),
 area text not null check(char_length(area) between 1 and 80),
 message text not null check(char_length(message) between 1 and 3000),
 portfolio_url text check(portfolio_url is null or char_length(portfolio_url)<=500),
 status text not null default 'new' check(status in ('new','reviewing','accepted','declined')),
 created_at timestamptz not null default now()
);
alter table public.join_applications enable row level security;
drop policy if exists "Applications accepted only while intake is open" on public.join_applications;
create policy "Applications accepted only while intake is open" on public.join_applications for insert to anon,authenticated
with check(exists(select 1 from public.site_settings s where s.key='join_applications_enabled' and s.value='true'::jsonb));
drop policy if exists "Staff can read applications" on public.join_applications;
create policy "Staff can read applications" on public.join_applications for select to authenticated
using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','overseer')));
