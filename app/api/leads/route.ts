import { NextResponse } from "next/server";
import { getAiKnowledge } from "../../../lib/business-knowledge";
import { generateLeadIntelligence } from "../../../lib/lead-intelligence";
import { getServerSupabase } from "../../../lib/supabase-server";
import type { ChatHistoryItem } from "../../../types/chat";
import { checkRateLimit, requestKey } from "../../../lib/rate-limit";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedStatuses = ["Hot Lead", "Warm Lead", "Cold Lead"];

export async function POST(request: Request) {
  const rate = checkRateLimit(`leads:${requestKey(request)}`, 5);
  if (!rate.allowed) return NextResponse.json({ error: "Too many lead submissions. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const body = await request.json().catch(() => null) as { lead?: Record<string, unknown>; history?: ChatHistoryItem[] } | null;
  const lead = body?.lead;
  if (!lead || typeof lead.name !== "string" || typeof lead.email !== "string" || !emailPattern.test(lead.email) || typeof lead.service !== "string" || typeof lead.budget !== "string" || typeof lead.timeline !== "string" || typeof lead.score !== "number" || !allowedStatuses.includes(String(lead.status))) return NextResponse.json({ error: "Invalid lead data." }, { status: 400 });

  const { client, error: configError } = getServerSupabase();
  if (!client) return NextResponse.json({ error: configError }, { status: 503 });
  const cleanLead = { id: typeof lead.id === "string" && /^[0-9a-f-]{36}$/i.test(lead.id) ? lead.id : crypto.randomUUID(), name: lead.name.replace(/[<>]/g, "").slice(0, 80), email: lead.email.trim().toLowerCase(), service: lead.service.replace(/[<>]/g, "").slice(0, 160), budget: lead.budget.slice(0, 80), timeline: lead.timeline.slice(0, 80), score: Math.max(0, Math.min(100, Math.round(lead.score))), status: String(lead.status) };
  const { data, error } = await client.from("leads").upsert(cleanLead, { onConflict: "id" }).select("id").single();
  if (error || !data) return NextResponse.json({ error: "Unable to save lead." }, { status: 503 });

  try {
    const knowledge = await getAiKnowledge();
    const intelligence = await generateLeadIntelligence(cleanLead, Array.isArray(body?.history) ? body.history.slice(-8) : [], knowledge);
    const update = await client.from("leads").update({ conversation_summary: intelligence.summary, intent: intelligence.intent, lost_reason: intelligence.lostReason, recommended_action: intelligence.recommendedAction, intelligence_confidence: intelligence.confidence, intelligence_generated_at: new Date().toISOString() }).eq("id", data.id);
    if (update.error && process.env.NODE_ENV === "development") console.warn("Lead saved but intelligence update failed:", update.error.message);
  } catch (intelligenceError) {
    if (process.env.NODE_ENV === "development") console.warn("Lead saved but intelligence generation failed:", intelligenceError);
  }
  return NextResponse.json({ id: data.id });
}
