import { NextResponse } from "next/server";
import { getAiKnowledge } from "../../../lib/business-knowledge";
import { qualifyLead } from "../../../lib/ai-lead";
import type { ChatRequest } from "../../../types/chat";
import { checkRateLimit, requestKey } from "../../../lib/rate-limit";

export async function POST(request: Request) {
  const rate = checkRateLimit(`chat:${requestKey(request)}`, 30);
  if (!rate.allowed) return NextResponse.json({ error: "Too many chat requests. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const body = await request.json().catch(() => null) as Partial<ChatRequest> | null;
  if (!body || typeof body.message !== "string" || !body.message.trim() || !body.lead || !body.step) {
    return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
  }

  const history = Array.isArray(body.history) ? body.history.filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string").slice(-8) : [];
  const knowledge = await getAiKnowledge();
  const result = await qualifyLead(body.message.trim().slice(0, 500), body.step, body.lead, history, knowledge);
  return NextResponse.json(result);
}
