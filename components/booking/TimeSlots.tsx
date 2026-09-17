"use client";

const slots = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];

export default function TimeSlots({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{slots.map((slot) => <button className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition ${value === slot ? "border-lime-300 bg-lime-300 text-black" : "border-white/10 bg-white/3 text-zinc-300 hover:border-lime-300/50 hover:text-white"}`} key={slot} onClick={() => onChange(slot)} type="button">{slot}</button>)}</div>;
}
