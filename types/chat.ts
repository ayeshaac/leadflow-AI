export type ChatStep = "service" | "budget" | "timeline" | "name" | "email" | "complete";

export type LeadFields = {
  service: string | null;
  budget: string | null;
  timeline: string | null;
  name: string | null;
  email: string | null;
};

export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export type ChatRequest = {
  message: string;
  step: ChatStep;
  lead: LeadFields;
  history: ChatHistoryItem[];
};

export type ChatResponse = {
  reply: string;
  lead: LeadFields;
  complete: boolean;
  fallback: boolean;
};
