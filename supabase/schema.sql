create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  service text not null,
  budget text not null,
  timeline text not null,
  score integer not null check (score between 0 and 100),
  status text not null check (status in ('Hot Lead', 'Warm Lead', 'Cold Lead')),
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

revoke all on table public.leads from anon, authenticated;
grant insert on table public.leads to anon;

drop policy if exists "Allow anonymous lead inserts" on public.leads;
create policy "Allow anonymous lead inserts"
on public.leads
for insert
to anon
with check (true);
