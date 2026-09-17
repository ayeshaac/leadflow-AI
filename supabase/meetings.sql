create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid null references public.leads(id) on delete set null,
  name text not null,
  email text not null,
  service text,
  meeting_date date not null,
  meeting_time text not null,
  timezone text,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.meetings enable row level security;

revoke all on table public.meetings from anon, authenticated;
grant insert on table public.meetings to anon;

drop policy if exists "Allow anonymous meeting inserts" on public.meetings;
create policy "Allow anonymous meeting inserts"
on public.meetings
for insert
to anon
with check (true);
