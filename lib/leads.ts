export type LeadInsert = {
  name: string;
  email: string;
  service: string;
  budget: string;
  timeline: string;
  score: number;
  status: string;
};

export async function saveLead(lead: LeadInsert, history: { role: "user" | "assistant"; content: string }[] = []): Promise<{ error: Error | null }> {
  const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead, history }) });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    return { error: new Error(body?.error ?? "Unable to save lead.") };
  }
  return { error: null };
}
