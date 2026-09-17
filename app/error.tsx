"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center px-5"><div className="max-w-md rounded-3xl border border-white/10 bg-[#111413] p-7 text-center"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300">Something went wrong</p><h1 className="mt-3 text-2xl font-semibold text-white">LeadFlow AI needs a refresh</h1><p className="mt-3 text-sm leading-6 text-zinc-500">The page could not finish loading. Your data was not changed.</p><button className="mt-6 rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-black hover:bg-lime-200" onClick={() => reset()} type="button">Try again</button></div></main>;
}
