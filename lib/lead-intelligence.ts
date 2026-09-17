import "server-only";

import type { LeadFields, ChatHistoryItem } from "../types/chat";
import type { AiKnowledge } from "../types/business";
import { intelligenceIntents, type IntelligenceResult } from "../types/lead-intelligence";

const defaultBaseUrl = "http://localhost:11434";
const defaultModel = "qwen2.5:3b";

function text(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[<>]/g, "").trim().slice(0, max);
}

function intentFor(lead: LeadFields & { score?: number; status?: string }) {
  if (!lead.service || !lead.budget || !lead.timeline || !lead.name || !lead.email) return "Unknown" as const;
  if (lead.status === "Hot Lead" || (lead.score ?? 0) >= 70) return "High" as const;
  if (lead.status === "Warm Lead" || (lead.score ?? 0) >= 40) return "Medium" as const;
  return "Low" as const;
}

export function fallbackIntelligence(lead: LeadFields & { score: number; status: string }): IntelligenceResult {
  const intent = intentFor(lead);
  const timeline = lead.timeline ?? "unknown";
  const lowReason = intent === "Low" ? (lead.timeline === "Just researching" ? "Just researching" : lead.budget === "Under $500" ? "Budget below typical project range" : "No strong buying timeline") : null;
  return {
    summary: `${lead.name ?? "This visitor"} is interested in ${lead.service ?? "an unspecified service"} with a ${lead.budget ?? "unspecified"} budget and a ${timeline.toLowerCase()} timeline.`,
    intent,
    lostReason: lowReason,
    recommendedAction: intent === "High" ? "Contact within 24 hours and offer a discovery call." : intent === "Medium" ? "Follow up and clarify requirements." : intent === "Low" ? "Add to nurture list." : "Clarify project scope.",
    confidence: intent === "Unknown" ? 35 : intent === "High" ? 92 : intent === "Medium" ? 76 : 62,
  };
}

function validate(raw: unknown, fallback: IntelligenceResult): IntelligenceResult {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const rawIntent = typeof value.intent === "string" ? value.intent : "Unknown";
  const intent = intelligenceIntents.includes(rawIntent as (typeof intelligenceIntents)[number]) ? rawIntent as IntelligenceResult["intent"] : fallback.intent;
  const numericConfidence = typeof value.confidence === "number" ? value.confidence : Number(value.confidence);
  return {
    summary: text(value.summary, 500) || fallback.summary,
    intent,
    lostReason: value.lostReason == null ? null : text(value.lostReason, 180) || null,
    recommendedAction: text(value.recommendedAction, 180) || fallback.recommendedAction,
    confidence: Math.max(0, Math.min(100, Number.isFinite(numericConfidence) ? Math.round(numericConfidence) : fallback.confidence)),
  };
}

export async function generateLeadIntelligence(lead: LeadFields & { score: number; status: string }, history: ChatHistoryItem[], knowledge: AiKnowledge): Promise<IntelligenceResult> {
  const fallback = fallbackIntelligence(lead);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const baseUrl = (process.env.OLLAMA_BASE_URL || defaultBaseUrl).replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ model: process.env.OLLAMA_MODEL || defaultModel, stream: false, format: "json", messages: [{ role: "system", content: `Analyze this completed lead for a sales team. Use only the structured lead, recent conversation, and business knowledge. Do not make negative assumptions. Return ONLY JSON: {"summary":"...","intent":"High|Medium|Low|Unknown","lostReason":null,"recommendedAction":"...","confidence":0}. Keep summary and action concise. A lostReason is only for Low or clearly incomplete leads; otherwise null. Business knowledge: ${JSON.stringify(knowledge)}` }, ...history.slice(-8).map((item) => ({ role: item.role, content: item.content })), { role: "user", content: JSON.stringify({ lead }) }], options: { temperature: 0.1 } }) });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const body = await response.json() as { message?: { content?: string } };
    return validate(JSON.parse(body.message?.content || "{}"), fallback);
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("Lead intelligence fallback used.", error instanceof Error ? error.message : error);
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}
