import "server-only";

import type { AiKnowledge, BusinessKnowledge, BusinessSettings, Faq, Service } from "../types/business";
import { getServerSupabase } from "./supabase-server";

const settingsFields = "id,business_name,business_description,website_url,contact_email,phone,business_hours,updated_at";
const serviceFields = "id,name,description,starting_price,active,created_at";
const faqFields = "id,question,answer,active,created_at";

function text(value: unknown, max = 2000) {
  return typeof value === "string" ? value.replace(/[<>]/g, "").trim().slice(0, max) : "";
}

function nullableText(value: unknown, max = 500) {
  const clean = text(value, max);
  return clean || null;
}

export async function getBusinessKnowledge(): Promise<{ data: BusinessKnowledge | null; error: string | null }> {
  const { client, error: configError } = getServerSupabase();
  if (!client) return { data: null, error: configError };
  const [{ data: settings, error: settingsError }, { data: services, error: servicesError }, { data: faqs, error: faqsError }] = await Promise.all([
    client.from("business_settings").select(settingsFields).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    client.from("services").select(serviceFields).order("created_at", { ascending: false }),
    client.from("faqs").select(faqFields).order("created_at", { ascending: false }),
  ]);
  if (settingsError || servicesError || faqsError) return { data: null, error: "Unable to load business knowledge from Supabase. Run supabase/business-knowledge.sql and check the server configuration." };
  return { data: { settings: settings as BusinessSettings | null, services: (services ?? []) as Service[], faqs: (faqs ?? []) as Faq[] }, error: null };
}

export async function getAiKnowledge(): Promise<AiKnowledge> {
  try {
    const result = await getBusinessKnowledge();
    if (!result.data) return { settings: null, services: [], faqs: [] };
    return {
      settings: result.data.settings,
      services: result.data.services.filter((service) => service.active).map(({ name, description, starting_price }) => ({ name, description, starting_price })),
      faqs: result.data.faqs.filter((faq) => faq.active).map(({ question, answer }) => ({ question, answer })),
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("Business knowledge unavailable; continuing without it.", error);
    return { settings: null, services: [], faqs: [] };
  }
}

export async function saveBusinessSettings(input: Partial<BusinessSettings>) {
  const { client, error: configError } = getServerSupabase();
  if (!client) return { error: configError };
  const values = { business_name: text(input.business_name), business_description: text(input.business_description), website_url: nullableText(input.website_url), contact_email: nullableText(input.contact_email), phone: nullableText(input.phone), business_hours: nullableText(input.business_hours), updated_at: new Date().toISOString() };
  const query = input.id ? client.from("business_settings").update(values).eq("id", input.id) : client.from("business_settings").insert(values);
  const { error } = await query;
  return { error: error ? "Unable to save business settings." : null };
}

export async function createOrUpdateService(input: Partial<Service>) {
  const { client, error: configError } = getServerSupabase();
  if (!client) return { error: configError };
  const values = { name: text(input.name, 160), description: text(input.description), starting_price: nullableText(input.starting_price), active: input.active !== false };
  if (!values.name) return { error: "Service name is required." };
  const query = input.id ? client.from("services").update(values).eq("id", input.id) : client.from("services").insert(values);
  const { error } = await query;
  return { error: error ? "Unable to save service." : null };
}

export async function deleteService(id: string) {
  return deleteKnowledgeRow("services", id, "Unable to delete service.");
}

export async function createOrUpdateFaq(input: Partial<Faq>) {
  const { client, error: configError } = getServerSupabase();
  if (!client) return { error: configError };
  const values = { question: text(input.question, 500), answer: text(input.answer), active: input.active !== false };
  if (!values.question || !values.answer) return { error: "FAQ question and answer are required." };
  const query = input.id ? client.from("faqs").update(values).eq("id", input.id) : client.from("faqs").insert(values);
  const { error } = await query;
  return { error: error ? "Unable to save FAQ." : null };
}

export async function deleteFaq(id: string) {
  return deleteKnowledgeRow("faqs", id, "Unable to delete FAQ.");
}

async function deleteKnowledgeRow(table: "services" | "faqs", id: string, message: string) {
  const { client, error: configError } = getServerSupabase();
  if (!client) return { error: configError };
  const { error } = await client.from(table).delete().eq("id", id);
  return { error: error ? message : null };
}
