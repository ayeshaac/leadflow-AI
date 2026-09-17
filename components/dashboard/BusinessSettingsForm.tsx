"use client";

import { FormEvent, useState } from "react";
import type { BusinessSettings } from "../../types/business";

type Props = { settings: BusinessSettings | null; onSaved: () => void };

type FormValues = { business_name: string; business_description: string; website_url: string; contact_email: string; phone: string; business_hours: string };

export default function BusinessSettingsForm({ settings, onSaved }: Props) {
  const [form, setForm] = useState<FormValues>({ business_name: settings?.business_name ?? "", business_description: settings?.business_description ?? "", website_url: settings?.website_url ?? "", contact_email: settings?.contact_email ?? "", phone: settings?.phone ?? "", business_hours: settings?.business_hours ?? "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update(field: keyof FormValues, value: string) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage("");
    const response = await fetch("/api/dashboard/knowledge", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "settings", data: { id: settings?.id, ...form } }) });
    const body = await response.json().catch(() => null) as { error?: string } | null;
    setMessage(response.ok ? "Business information saved." : body?.error ?? "Unable to save business information.");
    setSaving(false);
    if (response.ok) onSaved();
  }

  return <form className="rounded-2xl border border-white/10 bg-[#111413] p-5" onSubmit={submit}><div className="mb-5"><h2 className="text-sm font-semibold text-white">Business information</h2><p className="mt-1 text-xs text-zinc-600">This is the factual context your local AI can use.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-zinc-400">Business Name<input className="mt-2 w-full rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-300/50" onChange={(event) => update("business_name", event.target.value)} value={form.business_name} /></label><label className="text-xs text-zinc-400">Website URL<input className="mt-2 w-full rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-300/50" onChange={(event) => update("website_url", event.target.value)} value={form.website_url} /></label><label className="text-xs text-zinc-400">Contact Email<input className="mt-2 w-full rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-300/50" onChange={(event) => update("contact_email", event.target.value)} type="email" value={form.contact_email} /></label><label className="text-xs text-zinc-400">Phone<input className="mt-2 w-full rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-300/50" onChange={(event) => update("phone", event.target.value)} value={form.phone} /></label><label className="text-xs text-zinc-400 sm:col-span-2">Business Hours<input className="mt-2 w-full rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-300/50" onChange={(event) => update("business_hours", event.target.value)} placeholder="Mon-Fri, 9 AM-5 PM" value={form.business_hours} /></label><label className="text-xs text-zinc-400 sm:col-span-2">Business Description<textarea className="mt-2 min-h-24 w-full resize-y rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-300/50" onChange={(event) => update("business_description", event.target.value)} value={form.business_description} /></label></div><div className="mt-5 flex items-center justify-between gap-3"><p className="text-xs text-lime-300">{message}</p><button className="rounded-full bg-lime-300 px-4 py-2.5 text-xs font-semibold text-black hover:bg-lime-200 disabled:opacity-50" disabled={saving} type="submit">{saving ? "Saving..." : "Save information"}</button></div></form>;
}
