import "server-only";

import { getPublicMeetingByToken } from "../../../../lib/public-meeting-status";

const statusMeta = {
  requested: {
    label: "Requested",
    message: "⏳ Awaiting confirmation",
    badgeClass: "bg-amber-500/15 text-amber-200 border border-amber-400/20",
  },
  confirmed: {
    label: "Confirmed",
    message: "✅ Meeting Confirmed",
    badgeClass: "bg-lime-400/15 text-lime-200 border border-lime-400/20",
  },
  cancelled: {
    label: "Cancelled",
    message: "❌ Meeting Cancelled",
    badgeClass: "bg-red-500/15 text-red-200 border border-red-400/20",
  },
} as const;

function formatDate(date: string | null) {
  if (!date) return "—";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function BookingStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { meeting, error } = await getPublicMeetingByToken(token);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090a0a] px-5 py-16 text-center">
        <div className="w-full max-w-xl rounded-3xl border border-red-400/20 bg-[#111413] p-7 shadow-2xl shadow-black/35">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300">Booking unavailable</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Unable to load this booking.</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Please try again in a moment.</p>
        </div>
      </main>
    );
  }

  if (!meeting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090a0a] px-5 py-16 text-center">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#111413] p-7 shadow-2xl shadow-black/35">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Customer booking</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Booking not found.</h1>
        </div>
      </main>
    );
  }

  const meta = statusMeta[meeting.status] ?? statusMeta.requested;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090a0a] px-4 py-12 sm:px-6">
      <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0d0f0e] p-6 shadow-2xl shadow-black/35 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">LeadFlow AI</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Meeting status</h1>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${meta.badgeClass}`}>{meta.message}</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111413]">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Status</p>
            <p className="mt-2 text-lg font-medium text-white">{meta.label}</p>
          </div>

          <dl className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#0d0f0e] p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Name</dt>
              <dd className="mt-2 text-sm text-white">{meeting.name}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0d0f0e] p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Service</dt>
              <dd className="mt-2 text-sm text-white">{meeting.service || "—"}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0d0f0e] p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Meeting date</dt>
              <dd className="mt-2 text-sm text-white">{formatDate(meeting.meeting_date)}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0d0f0e] p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Meeting time</dt>
              <dd className="mt-2 text-sm text-white">{meeting.meeting_time}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0d0f0e] p-4 sm:col-span-2">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Timezone</dt>
              <dd className="mt-2 text-sm text-white">{meeting.timezone || "UTC"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  );
}
