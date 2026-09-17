alter table public.leads
  add column if not exists conversation_summary text,
  add column if not exists intent text,
  add column if not exists lost_reason text,
  add column if not exists recommended_action text,
  add column if not exists intelligence_confidence integer,
  add column if not exists intelligence_generated_at timestamptz;

alter table public.leads
  drop constraint if exists leads_intent_check;

alter table public.leads
  add constraint leads_intent_check
  check (intent is null or intent in ('High', 'Medium', 'Low', 'Unknown'));

alter table public.leads
  drop constraint if exists leads_intelligence_confidence_check;

alter table public.leads
  add constraint leads_intelligence_confidence_check
  check (intelligence_confidence is null or intelligence_confidence between 0 and 100);
