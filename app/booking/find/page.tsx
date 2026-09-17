"use client";

import { FormEvent, useState } from "react";
import { Search, ArrowRight } from "lucide-react";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const referencePattern = /^LF-[A-HJ-NP-Z2-9]{7}$/i;

export default function FindBookingPage() {
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedReference = reference.trim().toUpperCase();

    if (!emailPattern.test(normalizedEmail) || !referencePattern.test(normalizedReference)) {
      setError("We could not find a booking with those details.");
      return;
    }

    setSubmitting(true);
    setError("");

    const response = await fetch("/api/booking/find", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, booking_reference: normalizedReference }),
    });

    if (!response.ok) {
      setSubmitting(false);
      setError("We could not find a booking with those details.");
      return;
    }

    const body = await response.json().catch(() => null) as { redirect_url?: string; redirectUrl?: string } | null;
    const redirectUrl = body?.redirect_url ?? body?.redirectUrl ?? "/booking/status";
    window.location.href = redirectUrl;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090a0a] px-4 py-12 sm:px-6">
      <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0d0f0e] p-6 shadow-2xl shadow-black/35 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-300 text-black">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">LeadFlow AI</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Find your booking</h1>
          </div>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500" htmlFor="booking-email">Email</label>
            <input
              id="booking-email"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#111413] px-3 text-sm text-white outline-none transition focus:border-lime-300/40"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500" htmlFor="booking-reference">Booking reference</label>
            <input
              id="booking-reference"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#111413] px-3 text-sm uppercase tracking-[0.14em] text-white outline-none transition focus:border-lime-300/40"
              type="text"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="LF-8X2K9P"
              autoComplete="off"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-300/30 bg-red-500/5 px-3 py-2.5 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-lime-300/70"
            disabled={submitting}
          >
            {submitting ? "Checking..." : "Find booking"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </main>
  );
}
