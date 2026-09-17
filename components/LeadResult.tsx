"use client";

import { CalendarDays, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import BookingModal from "./booking/BookingModal";

export type LeadDetails = {
  id?: string;
  name: string;
  email: string;
  service: string;
  budget: string;
  timeline: string;
  score: number;
  status: string;
};

export type SaveStatus = "idle" | "saving" | "success" | "error";

export default function LeadResult({ lead, saveStatus, onRetry, onReset }: { lead: LeadDetails; saveStatus: SaveStatus; onRetry: () => void; onReset: () => void }) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const statusIcon = lead.status === "Hot Lead" ? "🔥" : lead.status === "Warm Lead" ? "🟡" : "❄️";

  return (
    <div className="rounded-2xl border border-lime-300/25 bg-lime-300/[0.07] p-4">
      <div className="mb-4 flex items-center gap-2 text-lime-300">
        <CheckCircle2 className="h-4 w-4" />
        <p className="text-sm font-semibold">Lead Qualified</p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-xs">
        <dt className="text-zinc-500">Name</dt><dd className="text-right text-zinc-200">{lead.name}</dd>
        <dt className="text-zinc-500">Service</dt><dd className="text-right text-zinc-200">{lead.service}</dd>
        <dt className="text-zinc-500">Budget</dt><dd className="text-right text-zinc-200">{lead.budget}</dd>
        <dt className="text-zinc-500">Timeline</dt><dd className="text-right text-zinc-200">{lead.timeline}</dd>
      </dl>
      <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-4">
        <div><p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Lead score</p><p className="text-2xl font-bold text-white">{lead.score}<span className="text-xs font-normal text-zinc-500">/100</span></p></div>
        <p className="text-sm font-semibold text-lime-300">{statusIcon} {lead.status}</p>
      </div>
      <p className="mt-4 text-xs leading-5 text-zinc-400">Thanks {lead.name}! Your information has been captured. Our team can now follow up with you.</p>
      {saveStatus === "saving" && <p className="mt-3 text-xs text-zinc-400">Saving your information...</p>}
      {saveStatus === "success" && <p className="mt-3 text-xs text-lime-300">Your information has been saved successfully.</p>}
      {saveStatus === "error" && <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-300/20 bg-red-300/6 px-3 py-2"><p className="text-xs text-red-200">Your information could not be saved right now. Please try again.</p><button className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-medium text-white transition hover:border-lime-300/50 hover:text-lime-300" onClick={onRetry} type="button">Try Again</button></div>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-lime-200" onClick={() => setBookingOpen(true)} type="button"><CalendarDays className="h-3.5 w-3.5" />Book a Meeting</button>
        <button className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-white/30 hover:text-white" onClick={onReset} type="button">Reset Conversation</button>
      </div>
      <BookingModal key={bookingOpen ? "open" : "closed"} lead={lead} open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
}
