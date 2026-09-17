alter table public.meetings
  add column if not exists public_token text;

create unique index if not exists meetings_public_token_unique
on public.meetings (public_token)
where public_token is not null;

-- Safe admin-only update to backfill public lookup tokens for existing meetings.
-- This updates only records that do not yet have a token and never overwrites existing values.
update public.meetings
set public_token = lower(substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 32))
where public_token is null;

-- Optional: preview the records that still need a token before you run the update.
-- select id, name, email, public_token from public.meetings where public_token is null order by created_at desc;

-- Optional: ensure the token is available for future meeting submissions.
-- This is intended for server-side generation when creating a new meeting request:
-- public_token = lower(substr(md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text), 1, 32));
