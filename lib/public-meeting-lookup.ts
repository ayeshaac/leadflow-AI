import "server-only";

import type { MeetingRow } from "../types/meeting";
import { getServerSupabase } from "./supabase-server";

const bookingReferencePattern = /^LF-[A-HJ-NP-Z2-9]{7}$/i;

export function normalizeBookingReference(value: unknown) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toUpperCase();
  return normalized.startsWith("LF-") ? normalized : `LF-${normalized.replace(/^LF-?/i, "")}`;
}

export async function findMeetingByReferenceAndEmail(email: string, bookingReference: string): Promise<{ meeting: MeetingRow | null; error: string | null }> {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedReference = normalizeBookingReference(bookingReference);

  if (!normalizedEmail || !bookingReferencePattern.test(normalizedReference)) {
    return { meeting: null, error: null };
  }

  const { client, error: configError } = getServerSupabase();
  if (!client) {
    return { meeting: null, error: configError };
  }

  const { data, error } = await client
    .from("meetings")
    .select("id,name,email,service,meeting_date,meeting_time,timezone,status,public_token,booking_reference,created_at")
    .eq("email", normalizedEmail)
    .eq("booking_reference", normalizedReference)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") {
      return { meeting: null, error: null };
    }
    return { meeting: null, error: "Unable to look up this booking right now." };
  }

  return { meeting: (data as MeetingRow | null) ?? null, error: null };
}
