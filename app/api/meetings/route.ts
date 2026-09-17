import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { sendMeetingRequestEmail } from "../../../lib/email";
import { getServerSupabase } from "../../../lib/supabase-server";
import { checkRateLimit, requestKey } from "../../../lib/rate-limit";

const slots = new Set(["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (datePattern.test(trimmed)) return trimmed;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

function generatePublicToken() {
  return randomBytes(16).toString("hex");
}

function generateBookingReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const body = Array.from({ length: 7 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `LF-${body}`;
}

export async function POST(request: Request) {
  const rate = checkRateLimit(`meetings:${requestKey(request)}`, 5);
  if (!rate.allowed) return NextResponse.json({ error: "Too many booking attempts. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.replace(/[<>]/g, "").trim().slice(0, 80) : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const service = typeof body?.service === "string" ? body.service.replace(/[<>]/g, "").trim().slice(0, 160) : "";
  const date = normalizeDate(body?.meeting_date);
  const time = typeof body?.meeting_time === "string" ? body.meeting_time : "";
  const leadId = typeof body?.lead_id === "string" && uuidPattern.test(body.lead_id) ? body.lead_id : null;
  const timezone = typeof body?.timezone === "string" ? body.timezone.replace(/[^A-Za-z0-9_+\-/]/g, "").slice(0, 80) : "UTC";
  const today = new Date();
  const todayKey = new Date(today.getTime() - today.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  if (!name || !emailPattern.test(email) || !service || !datePattern.test(date) || date < todayKey || !slots.has(time) || !timezone) return NextResponse.json({ error: "Please choose a valid future date, time, and contact details." }, { status: 400 });

  const { client, error: configError } = getServerSupabase();
  if (!client) return NextResponse.json({ error: configError }, { status: 503 });

  let resolvedLeadId: string | null = null;
  if (leadId) {
    const { data: existingLead, error: leadError } = await client.from("leads").select("id").eq("id", leadId).maybeSingle();
    if (leadError) {
      if (process.env.NODE_ENV === "development") console.error("Meeting lead validation failed:", { code: leadError.code, message: leadError.message });
      return NextResponse.json({ error: "Unable to validate the lead reference." }, { status: 503 });
    }
    if (existingLead) resolvedLeadId = leadId;
  }

  const publicToken = generatePublicToken();
  const bookingReference = generateBookingReference();
  const statusUrl = `/booking/status/${publicToken}`;
  const { error } = await client.from("meetings").insert({
    lead_id: resolvedLeadId,
    name,
    email,
    service,
    meeting_date: date,
    meeting_time: time,
    timezone,
    status: "requested",
    public_token: publicToken,
    booking_reference: bookingReference,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("Meeting insert failed:", { code: error.code, message: error.message, details: error.details, hint: error.hint });
    return NextResponse.json({ error: "Unable to submit the meeting request right now." }, { status: 503 });
  }

  const emailResult = await sendMeetingRequestEmail({
    name,
    email,
    service,
    meeting_date: date,
    meeting_time: time,
    timezone,
    booking_reference: bookingReference,
    public_token: publicToken,
  });

  if (!emailResult.ok && process.env.NODE_ENV === "development") {
    console.warn("Meeting creation succeeded; email notification skipped.");
  }

  return NextResponse.json({ ok: true, token: publicToken, status_url: statusUrl, statusUrl, booking_reference: bookingReference });
}
