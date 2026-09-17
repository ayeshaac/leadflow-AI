import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "../../../../../../lib/admin-auth";
import { getAiKnowledge } from "../../../../../../lib/business-knowledge";
import { generateLeadIntelligence } from "../../../../../../lib/lead-intelligence";
import { getServerSupabase } from "../../../../../../lib/supabase-server";
import type { LeadFields } from "../../../../../../types/chat";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const { client, error: configError } = getServerSupabase();
  if (!client) return NextResponse.json({ error: configError }, { status: 503 });
  const { data: lead, error } = await client.from("leads").select("id,name,email,service,budget,timeline,score,status").eq("id", id).maybeSingle();
  if (error || !lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  const knowledge = await getAiKnowledge();
  const fields: LeadFields = { name: lead.name, email: lead.email, service: lead.service, budget: lead.budget, timeline: lead.timeline };
  const intelligence = await generateLeadIntelligence({ ...fields, score: lead.score, status: lead.status }, [], knowledge);
  const update = await client.from("leads").update({ conversation_summary: intelligence.summary, intent: intelligence.intent, lost_reason: intelligence.lostReason, recommended_action: intelligence.recommendedAction, intelligence_confidence: intelligence.confidence, intelligence_generated_at: new Date().toISOString() }).eq("id", id);
  if (update.error) return NextResponse.json({ error: "Unable to save regenerated intelligence. Run supabase/lead-intelligence.sql first." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
