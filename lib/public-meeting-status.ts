import "server-only";

import type { MeetingRow } from "../types/meeting";
import { getServerSupabase } from "./supabase-server";

export async function getPublicMeetingByToken(token: string): Promise<{ meeting: MeetingRow | null; error: string | null }> {
  const normalizedToken = typeof token === "string" ? token.trim() : "";
  if (!normalizedToken) {
    return { meeting: null, error: null };
  }

  const { client, error: configError } = getServerSupabase();
  if (!client) {
    return { meeting: null, error: configError };
  }

  const { data, error } = await client
    .from("meetings")
    .select("id,name,email,service,meeting_date,meeting_time,timezone,status,public_token,created_at")
    .eq("public_token", normalizedToken)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") {
      return { meeting: null, error: null };
    }
    return { meeting: null, error: "Unable to load this booking right now." };
  }

  return { meeting: (data as MeetingRow | null) ?? null, error: null };
}
