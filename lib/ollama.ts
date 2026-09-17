import "server-only";

import type { ChatHistoryItem, LeadFields } from "../types/chat";
import type { AiKnowledge } from "../types/business";
import { getServerEnv } from "./env";

const defaultBaseUrl = "http://localhost:11434";
const defaultModel = "qwen2.5:3b";
const requestTimeoutMs = 8_000;

export type OllamaResult = { content: string };

export async function askOllama(message: string, lead: LeadFields, history: ChatHistoryItem[], knowledge: AiKnowledge): Promise<OllamaResult> {
  const env = getServerEnv();
  const baseUrl = (env.ollamaBaseUrl || defaultBaseUrl).replace(/\/$/, "");
  const model = env.ollamaModel || defaultModel;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  const system = `You are LeadFlow AI, a concise professional sales assistant. Continue qualification naturally while collecting service, budget, timeline, name, and email. The business knowledge below is the only source of truth for business-specific facts. Answer pricing, services, policies, hours, and FAQs only from it. If information is missing, say you do not currently have that information; never invent services, prices, discounts, policies, or human confirmations. Keep replies under 35 words.

Business knowledge:
${JSON.stringify(knowledge)}

Allowed budget values: Under $500, $500 – $1,000, $1,000 – $2,500, $2,500 – $5,000, $5,000+. Allowed timeline values: Immediately, Within 2 weeks, Within 1 month, Just researching. Return ONLY valid JSON with exactly this shape: {"reply":"short reply","lead":{"service":null,"budget":null,"timeline":null,"name":null,"email":null},"complete":false}. Preserve already-known fields and set only fields supported by the visitor's latest message. Use null for unknown fields. Email must be a valid email address. complete is true only when every field is valid and non-null.`;

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        messages: [
          { role: "system", content: system },
          ...history.slice(-8).map((item) => ({ role: item.role, content: item.content })),
          { role: "user", content: `Current structured lead: ${JSON.stringify(lead)}\nVisitor message: ${message}` },
        ],
        options: { temperature: 0.2 },
      }),
    });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const body = await response.json() as { message?: { content?: string } };
    if (!body.message?.content) throw new Error("Ollama returned no message");
    return { content: body.message.content };
  } finally {
    clearTimeout(timeout);
  }
}
