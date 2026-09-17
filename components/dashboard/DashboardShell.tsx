"use client";

import { LogOut, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { DashboardPayload } from "../../types/lead";
import type { MeetingStatus } from "../../types/meeting";
import DashboardFilters, { DashboardFilterValues } from "./DashboardFilters";
import DashboardStats from "./DashboardStats";
import KnowledgePanel from "./KnowledgePanel";
import LeadsTable from "./LeadsTable";
import MeetingsTable from "./MeetingsTable";

type Props = { initialData: DashboardPayload };

type DashboardView = "leads" | "meetings" | "knowledge";

export default function DashboardShell({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<DashboardFilterValues>({ status: "all", service: "all", search: "" });
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState("");
  const [view, setView] = useState<DashboardView>("leads");

  const filteredLeads = useMemo(() => data.leads.filter((lead) => {
    const statusMatches = filters.status === "all" || lead.status === filters.status;
    const serviceMatches = filters.service === "all" || lead.service === filters.service;
    const query = filters.search.toLowerCase().trim();
    const searchMatches = !query || lead.name.toLowerCase().includes(query) || lead.email.toLowerCase().includes(query);
    return statusMatches && serviceMatches && searchMatches;
  }), [data.leads, filters]);

  function refresh() {
    startRefresh(async () => {
      setError("");
      const response = await fetch("/api/dashboard/leads", { cache: "no-store" });
      if (!response.ok) { setError(response.status === 401 ? "Your dashboard session expired. Refresh the page to sign in again." : "Unable to refresh dashboard data right now."); return; }
      setData(await response.json() as DashboardPayload);
    });
  }

  async function updateMeetingStatus(id: string, status: MeetingStatus) {
    const response = await fetch("/api/dashboard/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (!response.ok) { setError("Unable to update that meeting right now."); return; }
    refresh();
  }

  async function logout() { await fetch("/api/dashboard/auth", { method: "DELETE" }); window.location.reload(); }

  return <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10"><div className="mx-auto max-w-7xl"><header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between"><div><Link className="text-sm font-bold tracking-tight text-white" href="/">LeadFlow <span className="text-lime-300">AI</span></Link><p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-lime-300">Private dashboard</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">Lead overview</h1><p className="mt-2 text-sm text-zinc-500">Review and prioritize the conversations your agent captured.</p></div><div className="flex gap-2"><button className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-lime-300/40 hover:text-white disabled:opacity-50" disabled={refreshing} onClick={refresh} type="button"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "Refreshing..." : "Refresh"}</button><button className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs font-medium text-zinc-500 transition hover:border-white/30 hover:text-white" onClick={logout} type="button"><LogOut className="h-3.5 w-3.5" />Log out</button></div></header><div className="space-y-5 py-6">{view !== "knowledge" && <DashboardStats metrics={data.metrics} />}<div className="flex gap-1 overflow-x-auto border-b border-white/10"><button className={`border-b-2 px-4 py-3 text-xs font-semibold ${view === "leads" ? "border-lime-300 text-lime-300" : "border-transparent text-zinc-600 hover:text-zinc-300"}`} onClick={() => setView("leads")} type="button">Leads</button><button className={`border-b-2 px-4 py-3 text-xs font-semibold ${view === "meetings" ? "border-lime-300 text-lime-300" : "border-transparent text-zinc-600 hover:text-zinc-300"}`} onClick={() => setView("meetings")} type="button">Meetings <span className="ml-1 text-zinc-600">{data.meetingMetrics.total}</span></button><button className={`border-b-2 px-4 py-3 text-xs font-semibold ${view === "knowledge" ? "border-lime-300 text-lime-300" : "border-transparent text-zinc-600 hover:text-zinc-300"}`} onClick={() => setView("knowledge")} type="button">Knowledge</button></div>{error && <div className="rounded-xl border border-red-300/20 bg-red-300/6 px-4 py-3 text-xs text-red-200">{error}</div>}{view === "leads" && <><DashboardFilters services={data.services} values={filters} onChange={setFilters} /><LeadsTable leads={filteredLeads} /></>}{view === "meetings" && <><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Total Meetings", data.meetingMetrics.total], ["Requested", data.meetingMetrics.requested], ["Confirmed", data.meetingMetrics.confirmed], ["Cancelled", data.meetingMetrics.cancelled]].map(([label, value]) => <div className="rounded-2xl border border-white/10 bg-[#111413] p-4" key={String(label)}><p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{value}</p></div>)}</div><MeetingsTable meetings={data.meetings} onStatusChange={updateMeetingStatus} /></>}{view === "knowledge" && <KnowledgePanel />}</div></div></main>;
}
