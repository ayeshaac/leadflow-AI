"use client";

import { Search, SlidersHorizontal } from "lucide-react";

export type DashboardFilterValues = { status: string; service: string; search: string };

type Props = { values: DashboardFilterValues; services: string[]; onChange: (values: DashboardFilterValues) => void };

export default function DashboardFilters({ values, services, onChange }: Props) {
  return <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111413] p-3 sm:flex-row"><div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2"><Search className="h-4 w-4 text-zinc-600" /><input className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" onChange={(event) => onChange({ ...values, search: event.target.value })} placeholder="Search name or email..." type="search" value={values.search} /></div><div className="flex items-center gap-2"><SlidersHorizontal className="hidden h-4 w-4 text-zinc-600 sm:block" /><select aria-label="Filter by status" className="rounded-xl border border-white/10 bg-[#191d1b] px-3 py-2 text-xs text-zinc-300 outline-none focus:border-lime-300/50" onChange={(event) => onChange({ ...values, status: event.target.value })} value={values.status}><option value="all">All statuses</option><option value="Hot Lead">Hot</option><option value="Warm Lead">Warm</option><option value="Cold Lead">Cold</option></select><select aria-label="Filter by service" className="max-w-42.5 rounded-xl border border-white/10 bg-[#191d1b] px-3 py-2 text-xs text-zinc-300 outline-none focus:border-lime-300/50" onChange={(event) => onChange({ ...values, service: event.target.value })} value={values.service}><option value="all">All services</option>{services.map((service) => <option key={service} value={service}>{service}</option>)}</select></div></div>;
}
