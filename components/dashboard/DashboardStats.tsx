import { CalendarDays, Flame, Snowflake, Target, UsersRound, Sparkles } from "lucide-react";
import type { DashboardMetrics } from "../../types/lead";

const cards = [
  { key: "total", label: "Total Leads", icon: UsersRound },
  { key: "hot", label: "Hot Leads", icon: Flame },
  { key: "warm", label: "Warm Leads", icon: Target },
  { key: "cold", label: "Cold Leads", icon: Snowflake },
  { key: "averageScore", label: "Average Score", icon: Target },
  { key: "today", label: "Leads Today", icon: CalendarDays },
  { key: "highIntent", label: "High Intent", icon: Sparkles },
  { key: "mediumIntent", label: "Medium Intent", icon: Target },
  { key: "lowIntent", label: "Low Intent", icon: Snowflake },
  { key: "averageIntelligenceConfidence", label: "Avg Confidence", icon: Sparkles },
] as const;

export default function DashboardStats({ metrics }: { metrics: DashboardMetrics }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{cards.map(({ key, label, icon: Icon }) => <div className="rounded-2xl border border-white/10 bg-[#111413] p-4" key={key}><Icon className="h-4 w-4 text-lime-300" /><p className="mt-5 text-[10px] uppercase tracking-[0.12em] text-zinc-600">{label}</p><p className="mt-1 text-2xl font-semibold text-white">{metrics[key]}{key === "averageIntelligenceConfidence" && <span className="text-xs font-normal text-zinc-600">/100</span>}</p></div>)}</div>;
}
