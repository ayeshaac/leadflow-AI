import type { MeetingInsert } from "../types/meeting";

export async function createMeetingRequest(meeting: MeetingInsert): Promise<{ error: Error | null; statusUrl: string | null; bookingReference: string | null }> {
  const response = await fetch("/api/meetings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(meeting) });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    return { error: new Error(body?.error ?? "Unable to submit meeting request."), statusUrl: null, bookingReference: null };
  }
  const body = await response.json().catch(() => null) as { status_url?: string; statusUrl?: string; token?: string; booking_reference?: string | null } | null;
  const statusUrl = body?.status_url ?? body?.statusUrl ?? (body?.token ? `/booking/status/${body.token}` : null);
  return { error: null, statusUrl, bookingReference: body?.booking_reference ?? null };
}
