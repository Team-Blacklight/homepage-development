-- Team Blacklight: enable authorized staff to update application review status.
-- Run this once in the Supabase SQL Editor after join-applications.sql.
drop policy if exists "Staff can review applications" on public.join_applications;
create policy "Staff can review applications" on public.join_applications for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'overseer')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'overseer')));
