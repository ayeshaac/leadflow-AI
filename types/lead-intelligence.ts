export const intelligenceIntents = ["High", "Medium", "Low", "Unknown"] as const;
export type IntelligenceIntent = (typeof intelligenceIntents)[number];

export type LeadIntelligence = {
  conversation_summary: string | null;
  intent: IntelligenceIntent;
  lost_reason: string | null;
  recommended_action: string | null;
  intelligence_confidence: number | null;
  intelligence_generated_at: string | null;
};

export type IntelligenceResult = {
  summary: string;
  intent: IntelligenceIntent;
  lostReason: string | null;
  recommendedAction: string;
  confidence: number;
};
