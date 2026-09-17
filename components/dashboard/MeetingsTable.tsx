"use client";

import { CalendarClock, Check, X } from "lucide-react";
import { useState } from "react";
import type { MeetingRow, MeetingStatus } from "../../types/meeting";

export default function MeetingsTable({ meetings, onStatusChange }: { meetings: MeetingRow[]; onStatusChange: (id: string, status: MeetingStatus) => Promise<void> }) {
  const [updating, setUpdating] = useState("");
  async function update(id: string, status: MeetingStatus) {
    setUpdating(id);
    await onStatusChange(id, status);
    setUpdating("");
  }

  if (!meetings.length) return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#111413] px-6 text-center"><CalendarClock className="h-7 w-7 text-zinc-600" /><h3 className="mt-4 text-sm font-semibold text-white">No meeting requests yet</h3><p className="mt-2 text-xs text-zinc-600">Meeting requests submitted by qualified leads will appear here.</p></div>;

  return <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111413]"><div className="border-b border-white/10 px-4 py-4 sm:px-5"><h2 className="text-sm font-semibold text-white">Meeting requests</h2><p className="mt-1 text-xs text-zinc-600">{meetings.length} {meetings.length === 1 ? "request" : "requests"}, newest first</p></div><div className="overflow-x-auto"><table className="w-full min-w-225 text-left text-xs"><thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.12em] text-zinc-600"><tr>{["Name", "Email", "Service", "Date", "Time", "Timezone", "Status", "Created at", "Actions"].map((heading) => <th className="px-4 py-3 font-medium sm:px-5" key={heading}>{heading}</th>)}</tr></thead><tbody>{meetings.map((meeting) => <tr className="border-b border-white/6 text-zinc-400 last:border-0" key={meeting.id}><td className="px-4 py-4 font-medium text-white sm:px-5">{meeting.name}</td><td className="px-4 py-4 sm:px-5">{meeting.email}</td><td className="px-4 py-4 sm:px-5">{meeting.service || "-"}</td><td className="whitespace-nowrap px-4 py-4 sm:px-5">{meeting.meeting_date}</td><td className="whitespace-nowrap px-4 py-4 sm:px-5">{meeting.meeting_time}</td><td className="px-4 py-4 sm:px-5">{meeting.timezone || "-"}</td><td className="px-4 py-4 sm:px-5"><span className={`rounded-full px-2 py-1 text-[10px] ${meeting.status === "confirmed" ? "bg-lime-300/10 text-lime-300" : meeting.status === "cancelled" ? "bg-red-300/10 text-red-200" : "bg-yellow-300/10 text-yellow-200"}`}>{meeting.status}</span></td><td className="whitespace-nowrap px-4 py-4 sm:px-5">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(meeting.created_at))}</td><td className="px-4 py-4 sm:px-5"><div className="flex gap-1">{meeting.status !== "confirmed" && <button aria-label="Confirm meeting" className="rounded-lg border border-lime-300/20 p-2 text-lime-300 hover:bg-lime-300/10 disabled:opacity-50" disabled={updating === meeting.id} onClick={() => void update(meeting.id, "confirmed")} type="button"><Check className="h-3.5 w-3.5" /></button>}{meeting.status !== "cancelled" && <button aria-label="Cancel meeting" className="rounded-lg border border-red-300/20 p-2 text-red-300 hover:bg-red-300/10 disabled:opacity-50" disabled={updating === meeting.id} onClick={() => void update(meeting.id, "cancelled")} type="button"><X className="h-3.5 w-3.5" /></button>}</div></td></tr>)}</tbody></table></div></div>;
}
