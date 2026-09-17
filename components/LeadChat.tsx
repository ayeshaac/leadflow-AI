"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, RotateCcw, Send, X } from "lucide-react";
import { saveLead } from "../lib/leads";
import ChatMessage, { ChatMessageData } from "./ChatMessage";
import LeadResult, { LeadDetails, SaveStatus } from "./LeadResult";
import QuickReplies from "./QuickReplies";
import type { ChatHistoryItem, ChatResponse, ChatStep, LeadFields } from "../types/chat";

const serviceOptions = ["Website Development", "E-commerce Store", "SEO / Marketing", "Branding", "Other"];
const budgetOptions = ["Under $500", "$500 – $1,000", "$1,000 – $2,500", "$2,500 – $5,000", "$5,000+"];
const timelineOptions = ["Immediately", "Within 2 weeks", "Within 1 month", "Just researching"];
const budgetPoints: Record<string, number> = { "Under $500": 5, "$500 – $1,000": 15, "$1,000 – $2,500": 25, "$2,500 – $5,000": 35, "$5,000+": 40 };
const timelinePoints: Record<string, number> = { Immediately: 30, "Within 2 weeks": 25, "Within 1 month": 15, "Just researching": 5 };
const emptyLead: LeadFields = { service: null, budget: null, timeline: null, name: null, email: null };

type LeadChatProps = { open: boolean; onClose: () => void };

function nextStep(lead: LeadFields): ChatStep {
  if (!lead.service) return "service";
  if (!lead.budget) return "budget";
  if (!lead.timeline) return "timeline";
  if (!lead.name) return "name";
  if (!lead.email) return "email";
  return "complete";
}

function guidedFallback(message: string, step: ChatStep, current: LeadFields): ChatResponse {
  const next = { ...current };
  const value = message.trim();
  if (step === "service" && serviceOptions.includes(value)) next.service = value;
  if (step === "budget" && budgetOptions.includes(value)) next.budget = value;
  if (step === "timeline" && timelineOptions.includes(value)) next.timeline = value;
  if (step === "name") next.name = value.replace(/[<>]/g, "").slice(0, 80) || null;
  if (step === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) next.email = value.toLowerCase();
  const complete = Boolean(next.service && next.budget && next.timeline && next.name && next.email);
  const following = nextStep(next);
  const reply = following === "budget" ? "What budget range are you working with?" : following === "timeline" ? "When would you like to start?" : following === "name" ? "Great! What is your name?" : following === "email" ? "What is the best email address to reach you?" : complete ? "Thanks! Your lead has been qualified." : "What service are you looking for?";
  return { reply, lead: next, complete, fallback: true };
}

export default function LeadChat({ open, onClose }: LeadChatProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [step, setStep] = useState<ChatStep>("service");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [answers, setAnswers] = useState<LeadFields>(emptyLead);
  const [fallbackMode, setFallbackMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  const addMessage = (role: ChatMessageData["role"], text: string) => {
    setMessages((current) => [...current, { id: nextId.current++, role, text }]);
  };

  const reset = () => {
    nextId.current = 1;
    setMessages([{ id: nextId.current++, role: "assistant", text: "Hi! 👋 I’m the LeadFlow AI assistant. What service are you looking for?" }]);
    setStep("service");
    setInput("");
    setTyping(false);
    setLead(null);
    setSaveStatus("idle");
    setAnswers(emptyLead);
    setFallbackMode(false);
  };

  useEffect(() => {
    if (open && messages.length === 0) reset();
  }, [open, messages.length]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [messages, typing, lead, saveStatus]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && open) onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const persistLead = async (qualifiedLead: LeadDetails, history: ChatHistoryItem[] = []) => {
    setSaveStatus("saving");
    const { error } = await saveLead(qualifiedLead, history);
    if (error) {
      console.error("Unable to save lead to Supabase:", error);
      setSaveStatus("error");
      return;
    }
    setSaveStatus("success");
  };

  const completeLead = (fields: LeadFields) => {
    if (!fields.service || !fields.budget || !fields.timeline || !fields.name || !fields.email) return;
    const score = budgetPoints[fields.budget] + timelinePoints[fields.timeline] + 30;
    const status = score >= 70 ? "Hot Lead" : score >= 40 ? "Warm Lead" : "Cold Lead";
    const qualifiedLead = { id: crypto.randomUUID(), service: fields.service, budget: fields.budget, timeline: fields.timeline, name: fields.name, email: fields.email, score, status };
    setLead(qualifiedLead);
    void persistLead(qualifiedLead, messages.slice(-8).map((message) => ({ role: message.role, content: message.text })));
  };

  const sendMessage = async (value: string) => {
    if (!value || typing || step === "complete") return;
    const userMessage = value.trim();
    addMessage("user", userMessage);
    setInput("");
    setTyping(true);
    const history: ChatHistoryItem[] = [...messages.slice(-8).map((message) => ({ role: message.role, content: message.text })), { role: "user", content: userMessage }];
    let result: ChatResponse;
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: userMessage, step, lead: answers, history }) });
      if (!response.ok) throw new Error("Chat route unavailable");
      result = await response.json() as ChatResponse;
    } catch {
      result = guidedFallback(userMessage, step, answers);
    }
    setTyping(false);
    setFallbackMode(result.fallback);
    setAnswers(result.lead);
    setStep(nextStep(result.lead));
    addMessage("assistant", result.reply);
    if (result.complete) completeLead(result.lead);
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (input.trim()) void sendMessage(input.trim());
  };

  if (!open) return null;
  const inputPrompt = step === "name" ? "Type your name..." : step === "email" ? "you@company.com" : "Ask or type your answer...";
  const showInput = step !== "complete";

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Lead qualification chat"><div className="flex h-[min(720px,100dvh)] w-full max-w-lg flex-col overflow-hidden border border-white/10 bg-[#0d0f0e] shadow-2xl shadow-black/50 sm:h-[min(720px,calc(100dvh-40px))] sm:rounded-3xl"><div className="flex items-center justify-between border-b border-white/10 bg-[#111413] px-4 py-4 sm:px-5"><div className="flex items-center gap-3"><div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-lime-300 text-xs font-black text-black">LF<span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#111413] bg-lime-400" /></div><div><p className="text-sm font-semibold text-white">LeadFlow Agent</p><p className="text-[11px] text-lime-300">{fallbackMode ? "Guided mode" : "Local AI ready"}</p></div></div><div className="flex items-center gap-1"><button aria-label="Reset conversation" className="rounded-full p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white" onClick={reset} type="button"><RotateCcw className="h-4 w-4" /></button><button aria-label="Close chat" className="rounded-full p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white" onClick={onClose} type="button"><X className="h-5 w-5" /></button></div></div><div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5" ref={scrollRef}><div className="space-y-3">{fallbackMode && <p className="text-center text-[10px] text-zinc-600">Local AI unavailable — using guided mode</p>}{messages.map((message) => <ChatMessage key={message.id} message={message} />)}{typing && <div className="flex items-start gap-2 animate-[chat-in_0.3s_ease-out]"><span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-lime-300 text-[8px] font-black text-black">LF</span><div className="flex gap-1 rounded-2xl rounded-tl-sm border border-white/10 bg-[#191d1b] px-4 py-3"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:100ms]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:200ms]" /></div></div>}{!typing && !lead && step === "service" && <QuickReplies options={serviceOptions} onSelect={(option) => void sendMessage(option)} />}{!typing && !lead && step === "budget" && <QuickReplies options={budgetOptions} onSelect={(option) => void sendMessage(option)} />}{!typing && !lead && step === "timeline" && <QuickReplies options={timelineOptions} onSelect={(option) => void sendMessage(option)} />}{lead && <LeadResult lead={lead} saveStatus={saveStatus} onRetry={() => void persistLead(lead)} onReset={reset} />}</div></div>{showInput && !lead && <form className="border-t border-white/10 bg-[#111413] p-3 sm:p-4" onSubmit={submit}><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2 focus-within:border-lime-300/50"><input autoFocus={step === "name"} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" onChange={(event) => setInput(event.target.value)} placeholder={inputPrompt} type={step === "email" ? "email" : "text"} value={input} /><button aria-label="Send message" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime-300 text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-40" disabled={!input.trim() || typing} type="submit"><Send className="h-4 w-4" /></button></div><p className="mt-2 flex items-center justify-between px-1 text-[10px] text-zinc-600"><span>Press Enter to send</span><span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> Secure frontend demo</span></p></form>}</div></div>;
}
