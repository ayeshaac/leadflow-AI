alter table public.meetings
  add column if not exists booking_reference text;

create unique index if not exists meetings_booking_reference_unique
on public.meetings (booking_reference)
where booking_reference is not null;

-- Backfill short, readable booking references for existing meeting rows.
update public.meetings
set booking_reference = 'LF-' || upper(substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 7))
where booking_reference is null;

-- Example server-side generation for new meetings:
-- booking_reference = 'LF-' || upper(substr(md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text), 1, 7));
