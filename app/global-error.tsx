"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body className="min-h-screen bg-[#090a0a] text-white"><main className="flex min-h-screen items-center justify-center px-5"><div className="max-w-md rounded-3xl border border-white/10 bg-[#111413] p-7 text-center"><h1 className="text-2xl font-semibold">LeadFlow AI is temporarily unavailable</h1><p className="mt-3 text-sm text-zinc-500">Please try loading the app again.</p><button className="mt-6 rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-black" onClick={() => reset()} type="button">Reload</button></div></main></body></html>;
}
