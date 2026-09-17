import type { MeetingMetrics, MeetingRow } from "./meeting";
import type { LeadIntelligence } from "./lead-intelligence";

export const leadStatuses = ["Hot Lead", "Warm Lead", "Cold Lead"] as const;

export type LeadStatus = (typeof leadStatuses)[number];

export type LeadRow = LeadIntelligence & {
  id: string;
  name: string;
  email: string;
  service: string;
  budget: string;
  timeline: string;
  score: number;
  status: LeadStatus;
  created_at: string;
};

export type DashboardMetrics = {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  averageScore: number;
  today: number;
  highIntent: number;
  mediumIntent: number;
  lowIntent: number;
  averageIntelligenceConfidence: number;
};

export type DashboardPayload = {
  leads: LeadRow[];
  metrics: DashboardMetrics;
  services: string[];
  meetings: MeetingRow[];
  meetingMetrics: MeetingMetrics;
};
