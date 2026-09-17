import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, requestKey } from "../../../../lib/rate-limit";
import { findMeetingByReferenceAndEmail } from "../../../../lib/public-meeting-lookup";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const referencePattern = /^LF-[A-HJ-NP-Z2-9]{7}$/i;

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(`booking-find:${requestKey(request)}`, 10);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many lookup attempts. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  }

  const body = await request.json().catch(() => null) as { email?: string; booking_reference?: string } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const bookingReference = typeof body?.booking_reference === "string" ? body.booking_reference.trim().toUpperCase() : "";

  if (!emailPattern.test(email) || !referencePattern.test(bookingReference)) {
    return NextResponse.json({ error: "We could not find a booking with those details." }, { status: 400 });
  }

  const { meeting, error } = await findMeetingByReferenceAndEmail(email, bookingReference);
  if (error) {
    return NextResponse.json({ error }, { status: 503 });
  }

  if (!meeting || !meeting.public_token) {
    return NextResponse.json({ error: "We could not find a booking with those details." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, redirect_url: `/booking/status/${meeting.public_token}` });
}
