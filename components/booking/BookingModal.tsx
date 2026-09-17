"use client";

import { FormEvent, useState } from "react";
import { CalendarDays, CheckCircle2, X } from "lucide-react";
import { createMeetingRequest } from "../../lib/meetings";
import type { LeadDetails } from "../LeadResult";
import TimeSlots from "./TimeSlots";

type BookingModalProps = { lead: LeadDetails; open: boolean; onClose: () => void };
type BookingState = "idle" | "saving" | "success" | "error";

function todayString() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

export default function BookingModal({ lead, open, onClose }: BookingModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [state, setState] = useState<BookingState>("idle");
  const [error, setError] = useState("");
  const [statusUrl, setStatusUrl] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [copied, setCopied] = useState(false);
  const minimumDate = todayString();

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!date || !time || state === "saving") return;
    setState("saving");
    setError("");
    setCopied(false);

    const result = await createMeetingRequest({
      lead_id: lead.id ?? null,
      name: lead.name,
      email: lead.email,
      service: lead.service,
      meeting_date: date,
      meeting_time: time,
      timezone,
    });

    if (result.error) {
      setState("error");
      setError("Your meeting request could not be submitted right now. Please try again.");
      return;
    }

    setStatusUrl(result.statusUrl ?? "/booking/status");
    setBookingReference(result.bookingReference ?? "");
    setState("success");
  }

  async function copyStatusLink() {
    if (!statusUrl) return;
    const fullUrl = `${window.location.origin}${statusUrl}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Book a meeting">
      <div className="w-full max-w-lg overflow-hidden border border-white/10 bg-[#0d0f0e] shadow-2xl shadow-black/50 sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#111413] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-300 text-black"><CalendarDays className="h-4 w-4" /></span>
            <div>
              <h2 className="text-sm font-semibold text-white">Book a meeting</h2>
              <p className="text-[11px] text-zinc-500">Choose a time for your first conversation</p>
            </div>
          </div>
          <button aria-label="Close booking" className="rounded-full p-2 text-zinc-500 hover:bg-white/10 hover:text-white" onClick={onClose} type="button"><X className="h-5 w-5" /></button>
        </div>

        {state === "success" ? (
          <div className="px-5 py-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-lime-300" />
            <h3 className="mt-4 text-xl font-semibold text-white">Meeting request submitted successfully.</h3>
            <p className="mt-3 text-sm text-zinc-500">Track your meeting status</p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-[#111413] p-4 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Booking Reference</p>
              <p className="mt-2 text-lg font-semibold text-white">{bookingReference || "—"}</p>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Status link</p>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0d0f0e] p-2">
                <span className="flex-1 truncate text-xs text-zinc-300">{statusUrl ? `${window.location.origin}${statusUrl}` : "Loading..."}</span>
                <button className="rounded-full border border-white/10 px-2.5 py-1.5 text-[10px] font-medium text-zinc-200 hover:border-lime-300/40 hover:text-white" onClick={copyStatusLink} type="button">
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <a className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-black hover:bg-lime-200" href={statusUrl || "#"}>
                View Booking Status
              </a>
            </div>

            <button className="mt-7 rounded-full border border-white/10 px-4 py-2.5 text-sm text-zinc-200 hover:border-white/20 hover:text-white" onClick={onClose} type="button">
              Done
            </button>
          </div>
        ) : (
          <form className="space-y-5 p-5" onSubmit={submit}>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/3 p-3">
                <p className="text-zinc-600">Name</p>
                <p className="mt-1 truncate text-zinc-200">{lead.name}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/3 p-3">
                <p className="text-zinc-600">Email</p>
                <p className="mt-1 truncate text-zinc-200">{lead.email}</p>
              </div>
              <div className="col-span-2 rounded-xl border border-white/10 bg-white/3 p-3">
                <p className="text-zinc-600">Service</p>
                <p className="mt-1 text-zinc-200">{lead.service}</p>
              </div>
            </div>

            <div className="relative">
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500" htmlFor="meeting-date">Preferred date</label>
              <input className="h-12 w-full rounded-xl border border-white/10 bg-[#111413] px-3 text-sm text-white outline-none transition focus:border-lime-300/40" id="meeting-date" min={minimumDate} onChange={(event) => setDate(event.target.value)} type="date" value={date} />
            </div>

            <div className="space-y-2">
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500" htmlFor="meeting-time">Preferred time</label>
              <TimeSlots value={time} onChange={setTime} />
            </div>

            {error ? <div className="rounded-xl border border-red-300/30 bg-red-500/5 px-3 py-2 text-sm text-red-200">{error}</div> : null}

            <div className="flex items-center justify-between pt-2">
              <button className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-zinc-200 hover:border-white/20 hover:text-white" onClick={onClose} type="button">Cancel</button>
              <button className="rounded-full bg-lime-300 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-lime-300/70" disabled={state === "saving" || !date || !time} type="submit">{state === "saving" ? "Submitting..." : "Request meeting"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
