import { cookies } from "next/headers";
import AdminLogin from "../../components/dashboard/AdminLogin";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { adminCookieName, isValidAdminSession } from "../../lib/admin-auth";
import { getDashboardPayload } from "../../lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(adminCookieName)?.value;
  if (!isValidAdminSession(session)) return <AdminLogin />;

  const { data, error } = await getDashboardPayload();
  if (error || !data) return <main className="flex min-h-screen items-center justify-center px-5"><div className="max-w-md rounded-3xl border border-red-300/20 bg-[#111413] p-7 text-center"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300">Dashboard unavailable</p><h1 className="mt-3 text-2xl font-semibold text-white">Could not load your leads</h1><p className="mt-3 text-sm leading-6 text-zinc-500">{error ?? "No dashboard data is available right now."}</p><a className="mt-6 inline-flex rounded-full border border-white/15 px-4 py-2.5 text-xs font-medium text-zinc-300 hover:border-lime-300/50 hover:text-white" href="/dashboard">Try again</a></div></main>;

  return <DashboardShell initialData={data} />;
}
