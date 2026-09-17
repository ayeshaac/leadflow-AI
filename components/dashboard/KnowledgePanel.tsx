"use client";

import { useEffect, useState } from "react";
import type { BusinessKnowledge } from "../../types/business";
import BusinessSettingsForm from "./BusinessSettingsForm";
import FaqManager from "./FaqManager";
import ServicesManager from "./ServicesManager";

export default function KnowledgePanel() {
  const [knowledge, setKnowledge] = useState<BusinessKnowledge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    const response = await fetch("/api/dashboard/knowledge", { cache: "no-store" });
    const body = await response.json().catch(() => null) as BusinessKnowledge & { error?: string } | null;
    if (!response.ok || !body || body.error) { setError(body?.error ?? "Unable to load business knowledge."); setLoading(false); return; }
    setKnowledge(body); setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/knowledge", { cache: "no-store" }).then(async (response) => {
      const body = await response.json().catch(() => null) as BusinessKnowledge & { error?: string } | null;
      if (cancelled) return;
      if (!response.ok || !body || body.error) { setError(body?.error ?? "Unable to load business knowledge."); setLoading(false); return; }
      setKnowledge(body); setLoading(false);
    }).catch(() => { if (!cancelled) { setError("Unable to load business knowledge."); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="rounded-2xl border border-white/10 bg-[#111413] p-8 text-sm text-zinc-500">Loading business knowledge...</div>;
  if (error || !knowledge) return <div className="rounded-2xl border border-red-300/20 bg-[#111413] p-6"><p className="text-sm text-red-200">{error || "Business knowledge is unavailable."}</p><button className="mt-4 rounded-full border border-white/15 px-4 py-2 text-xs text-zinc-300 hover:border-lime-300/50 hover:text-white" onClick={() => void load()} type="button">Try Again</button></div>;

  return <div className="space-y-4"><BusinessSettingsForm key={knowledge.settings?.id ?? "new"} settings={knowledge.settings} onSaved={() => void load()} /><ServicesManager services={knowledge.services} onChanged={() => void load()} /><FaqManager faqs={knowledge.faqs} onChanged={() => void load()} /></div>;
}
