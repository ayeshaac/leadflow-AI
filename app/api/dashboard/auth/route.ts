import { NextRequest, NextResponse } from "next/server";
import { clearAdminCookie, createAdminSession, isValidAdminKey, setAdminCookie } from "../../../../lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!process.env.ADMIN_DASHBOARD_KEY) {
    return NextResponse.json({ error: "ADMIN_DASHBOARD_KEY is missing from the server environment." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { key?: string } | null;
  if (!body?.key || !isValidAdminKey(body.key)) {
    return NextResponse.json({ error: "The admin key is invalid." }, { status: 401 });
  }

  const session = createAdminSession();
  if (!session) return NextResponse.json({ error: "Admin sessions are not configured." }, { status: 503 });

  const response = NextResponse.json({ ok: true });
  setAdminCookie(response, session);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearAdminCookie(response);
  return response;
}
