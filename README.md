# LeadFlow AI

LeadFlow AI is a zero-extra-cost lead-generation MVP. It qualifies website visitors, scores prospects, saves leads to Supabase, requests meetings, and gives admins a protected dashboard with business knowledge and local AI insights.

## Features

- Dark SaaS landing page
- Guided lead qualification chat with local Ollama enhancement
- Lead scoring and lead intelligence
- Supabase lead storage
- Appointment booking requests
- Protected admin dashboard with signed HTTP-only session cookies
- Leads, meetings, and business knowledge tabs
- Service and FAQ management
- Lead detail panels and protected insight regeneration
- Anonymous INSERT-only policies for public lead and meeting forms

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase free tier
- Local Ollama model
- Lucide React icons

## Local setup

1. Install Node.js 20 or newer.
2. Install Ollama on Windows from https://ollama.com/download/windows.
3. Copy `.env.example` to `.env.local`.
4. Add fresh Supabase and admin values. Never commit `.env.local`.
5. Run the SQL files in the order below.
6. Pull and run the Ollama model.
7. Start the app.

```powershell
npm install
npm run dev
```

Open http://localhost:3000. The protected dashboard is at http://localhost:3000/dashboard.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_DASHBOARD_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=
APP_BASE_URL=http://localhost:3000
OLLAMA_MODEL=qwen2.5:3b
OLLAMA_BASE_URL=http://localhost:11434
```

`NEXT_PUBLIC_*` values are the public Supabase URL and anon key. `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_DASHBOARD_KEY`, and SMTP values are server-only and must never be exposed to browser code.

## Supabase SQL order

Run these files in Supabase SQL Editor in this order:

1. `supabase/schema.sql`
2. `supabase/meetings.sql`
3. `supabase/business-knowledge.sql`
4. `supabase/lead-intelligence.sql`

The policies intentionally keep public access limited to INSERT for leads and meetings. Admin reads and writes use the server-only service-role client after signed admin-session verification.

## Ollama

Install Ollama, then run:

```powershell
ollama pull qwen2.5:3b
ollama serve
ollama list
```

The browser calls `/api/chat`; Ollama is called only from the server. If Ollama is stopped, the chat uses guided qualification mode and lead intelligence uses deterministic fallback logic.

## Dashboard access

Set `ADMIN_DASHBOARD_KEY` locally, start the app, and open `/dashboard`. The raw key is submitted only to the server. The browser receives an opaque signed HTTP-only SameSite cookie, not the raw key.

## SMTP configuration for local Gmail testing

Use a Gmail account with a 16-character app password, not the usual account password.

1. In Google Account settings, enable 2-Step Verification.
2. Create an app password for "Mail".
3. Set these values in `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASSWORD=your-16-character-app-password
EMAIL_FROM=your-gmail-address@gmail.com
APP_BASE_URL=http://localhost:3000
```

Do not add these variables to a client component or to any `NEXT_PUBLIC_*` key. Keep them strictly server-side.

## Meeting email testing

- Submit a booking request through the customer flow. The booking will still save successfully even if SMTP is not configured.
- If SMTP is configured, the customer should receive the request email with the booking reference and secure status link.
- Confirm a meeting in the admin dashboard and verify the customer receives the confirmation email.
- Cancel a meeting in the admin dashboard and verify the cancellation email is sent.
- If email delivery fails, the meeting request or status update still succeeds. The app logs a safe development-only message and does not expose SMTP technical details to the end user.

## Testing

- Complete a hot lead: use a strong budget and `Immediately` timeline.
- Complete a cold lead: use `Under $500` and `Just researching`.
- Book a future meeting and inspect it under the Meetings tab.
- Add services and FAQs under Knowledge, then ask the chat about them.
- Stop Ollama and verify guided fallback remains usable.
- Open a lead detail panel and use `Regenerate Insight`.
- Run `npm run lint` and `npm run build`.

## Demo seed guidance

Do not seed fake production data automatically. For a local demo, manually create:

- 1 hot lead, 1 warm lead, and 1 cold lead through the chat
- 1 future meeting request through the booking flow
- 2 active services and 2 active FAQs from the Knowledge tab

## Security notes

- Never put service-role or admin keys in `NEXT_PUBLIC_*` variables.
- Never commit `.env.local`.
- Rotate any credential that has been exposed or shared.
- Rate limiting is an in-memory MVP guard. It resets when the process restarts and is not sufficient for a multi-instance production deployment.
- No authentication provider, payments, integrations, hosted AI API, or deployment infrastructure is included yet.

## Current limitations

This is a local/client-demo MVP. It has one admin key, one business knowledge set, in-memory rate limiting, no real calendar availability, and no email or CRM follow-up automation. The SMTP flow uses standard Node.js email delivery and is intended for local testing or a trusted private mail relay; it is not a hosted transactional email service.
