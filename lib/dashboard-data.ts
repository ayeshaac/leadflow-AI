import "server-only";

import type { DashboardMetrics, DashboardPayload, LeadRow } from "../types/lead";
import type { MeetingMetrics, MeetingRow } from "../types/meeting";
import { getServerSupabase } from "./supabase-server";

export async function getDashboardPayload(): Promise<{ data: DashboardPayload | null; error: string | null }> {
  const { client, error: configError } = getServerSupabase();
  if (!client) return { data: null, error: configError };

  const [{ data, error }, { data: meetingData, error: meetingError }] = await Promise.all([
    client.from("leads").select("id,name,email,service,budget,timeline,score,status,created_at,conversation_summary,intent,lost_reason,recommended_action,intelligence_confidence,intelligence_generated_at").order("created_at", { ascending: false }),
    client.from("meetings").select("id,lead_id,name,email,service,meeting_date,meeting_time,timezone,status,created_at").order("created_at", { ascending: false }),
  ]);
  let leadData = data;
  if (error) {
    const fallback = await client.from("leads").select("id,name,email,service,budget,timeline,score,status,created_at").order("created_at", { ascending: false });
    if (fallback.error) return { data: null, error: "Unable to load leads from Supabase. Check the server configuration and table permissions." };
    leadData = (fallback.data ?? []).map((lead) => ({ ...lead, conversation_summary: null, intent: "Unknown", lost_reason: null, recommended_action: null, intelligence_confidence: null, intelligence_generated_at: null }));
  }
  if (meetingError) return { data: null, error: "Unable to load meetings from Supabase. Run supabase/meetings.sql and check the server configuration." };

  const leads = (leadData ?? []) as LeadRow[];
  const todayKey = new Date().toISOString().slice(0, 10);
  const totalScore = leads.reduce((sum, lead) => sum + lead.score, 0);
  const metrics: DashboardMetrics = {
    total: leads.length,
    hot: leads.filter((lead) => lead.status === "Hot Lead").length,
    warm: leads.filter((lead) => lead.status === "Warm Lead").length,
    cold: leads.filter((lead) => lead.status === "Cold Lead").length,
    averageScore: leads.length ? Math.round(totalScore / leads.length) : 0,
    today: leads.filter((lead) => lead.created_at.slice(0, 10) === todayKey).length,
    highIntent: leads.filter((lead) => lead.intent === "High").length,
    mediumIntent: leads.filter((lead) => lead.intent === "Medium").length,
    lowIntent: leads.filter((lead) => lead.intent === "Low").length,
    averageIntelligenceConfidence: Math.round(leads.filter((lead) => lead.intelligence_confidence != null).reduce((sum, lead) => sum + (lead.intelligence_confidence ?? 0), 0) / Math.max(1, leads.filter((lead) => lead.intelligence_confidence != null).length)),
  };
  const services = [...new Set(leads.map((lead) => lead.service))].sort((a, b) => a.localeCompare(b));
  const meetings = (meetingData ?? []) as MeetingRow[];
  const meetingMetrics: MeetingMetrics = {
    total: meetings.length,
    requested: meetings.filter((meeting) => meeting.status === "requested").length,
    confirmed: meetings.filter((meeting) => meeting.status === "confirmed").length,
    cancelled: meetings.filter((meeting) => meeting.status === "cancelled").length,
  };

  return { data: { leads, metrics, services, meetings, meetingMetrics }, error: null };
}
