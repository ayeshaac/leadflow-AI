"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";

export default function AdminLogin() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/dashboard/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      setError(body?.error ?? "Unable to verify the dashboard key.");
      setLoading(false);
      return;
    }
    window.location.reload();
  }

  return <main className="flex min-h-screen items-center justify-center px-5 py-12"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111413] p-6 shadow-2xl shadow-black/20 sm:p-8"><div className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300 text-sm font-black text-black">LF</div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-lime-300">Private workspace</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">LeadFlow dashboard</h1><p className="mt-3 text-sm leading-6 text-zinc-500">Enter the temporary admin key to view your captured leads.</p><form className="mt-7" onSubmit={submit}><label className="text-xs font-medium text-zinc-300" htmlFor="admin-key">Admin key</label><div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2 focus-within:border-lime-300/50"><LockKeyhole className="h-4 w-4 text-zinc-600" /><input autoComplete="off" className="min-w-0 flex-1 bg-transparent py-1 text-sm text-white outline-none placeholder:text-zinc-600" id="admin-key" onChange={(event) => setKey(event.target.value)} placeholder="Enter your dashboard key" type="password" value={key} /></div>{error && <p className="mt-3 text-xs text-red-300">{error}</p>}<button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50" disabled={!key || loading} type="submit">{loading ? "Checking..." : "Open dashboard"}<ArrowRight className="h-4 w-4" /></button></form></div></main>;
}
