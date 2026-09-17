import "server-only";

import type { ChatHistoryItem, ChatStep, LeadFields } from "../types/chat";
import type { AiKnowledge } from "../types/business";
import { askOllama } from "./ollama";

export const serviceOptions = ["Website Development", "E-commerce Store", "SEO / Marketing", "Branding", "Other"] as const;
export const budgetOptions = ["Under $500", "$500 – $1,000", "$1,000 – $2,500", "$2,500 – $5,000", "$5,000+"] as const;
export const timelineOptions = ["Immediately", "Within 2 weeks", "Within 1 month", "Just researching"] as const;

export const emptyLead: LeadFields = { service: null, budget: null, timeline: null, name: null, email: null };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function matchOption(value: unknown, options: readonly string[]) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[–—-]/g, "-").replace(/\s+/g, " ");
  const match = options.find((option) => option.toLowerCase().replace(/[–—-]/g, "-").replace(/\s+/g, " ") === normalized);
  return match ?? null;
}

function safeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const text = value.replace(/[<>]/g, "").trim().slice(0, maxLength);
  return text || null;
}

export function validEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && emailPattern.test(value.trim());
}

export function validateLead(raw: unknown, current: LeadFields, allowedServices: readonly string[] = serviceOptions): LeadFields {
  const candidate = raw && typeof raw === "object" ? raw as Partial<LeadFields> : {};
  return {
    service: matchOption(candidate.service, allowedServices) ?? current.service,
    budget: matchOption(candidate.budget, budgetOptions) ?? current.budget,
    timeline: matchOption(candidate.timeline, timelineOptions) ?? current.timeline,
    name: safeText(candidate.name, 80) ?? current.name,
    email: validEmail(candidate.email) ? candidate.email.trim().toLowerCase() : current.email,
  };
}

export function isComplete(lead: LeadFields) {
  return Boolean(lead.service && lead.budget && lead.timeline && lead.name && validEmail(lead.email));
}

function nextMissing(lead: LeadFields): ChatStep {
  if (!lead.service) return "service";
  if (!lead.budget) return "budget";
  if (!lead.timeline) return "timeline";
  if (!lead.name) return "name";
  if (!lead.email) return "email";
  return "complete";
}

function promptFor(step: ChatStep) {
  if (step === "service") return "What service are you looking for?";
  if (step === "budget") return "What budget range are you working with?";
  if (step === "timeline") return "When would you like to start?";
  if (step === "name") return "Great! What is your name?";
  if (step === "email") return "What is the best email address to reach you?";
  return "Thanks! Your lead has been qualified.";
}

function applyFallback(message: string, step: ChatStep, current: LeadFields) {
  const next = { ...current };
  if (step === "service") next.service = matchOption(message, serviceOptions);
  if (step === "budget") next.budget = matchOption(message, budgetOptions);
  if (step === "timeline") next.timeline = matchOption(message, timelineOptions);
  if (step === "name") next.name = safeText(message, 80);
  if (step === "email") next.email = validEmail(message) ? message.trim().toLowerCase() : current.email;
  const complete = isComplete(next);
  return { reply: promptFor(nextMissing(next)), lead: next, complete, fallback: true };
}

export async function qualifyLead(message: string, step: ChatStep, current: LeadFields, history: ChatHistoryItem[], knowledge: AiKnowledge) {
  try {
    const result = await askOllama(message, current, history, knowledge);
    const parsed = JSON.parse(result.content) as { reply?: unknown; lead?: unknown; complete?: unknown };
    const lead = validateLead(parsed.lead, current, [...serviceOptions, ...knowledge.services.map((service) => service.name)]);
    const complete = isComplete(lead);
    const reply = safeText(parsed.reply, 320) ?? promptFor(nextMissing(lead));
    return { reply, lead, complete, fallback: false };
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("Local Ollama unavailable; using guided mode.", error instanceof Error ? error.message : error);
    return applyFallback(message, step, current);
  }
}
