create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default '',
  business_description text not null default '',
  website_url text,
  contact_email text,
  phone text,
  business_hours text,
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  starting_price text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.business_settings enable row level security;
alter table public.services enable row level security;
alter table public.faqs enable row level security;

revoke all on table public.business_settings from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.faqs from anon, authenticated;
