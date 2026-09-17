import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "../../../../lib/admin-auth";
import { createOrUpdateFaq, createOrUpdateService, deleteFaq, deleteService, getBusinessKnowledge, saveBusinessSettings } from "../../../../lib/business-knowledge";

export async function GET(request: NextRequest) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await getBusinessKnowledge();
  if (result.error) return NextResponse.json({ error: result.error }, { status: 503 });
  return NextResponse.json(result.data);
}

export async function PUT(request: NextRequest) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { kind?: string; data?: Record<string, unknown> } | null;
  if (!body?.kind || !body.data) return NextResponse.json({ error: "Invalid knowledge update." }, { status: 400 });

  const result = body.kind === "settings" ? await saveBusinessSettings(body.data) : body.kind === "service" ? await createOrUpdateService(body.data) : body.kind === "faq" ? await createOrUpdateFaq(body.data) : { error: "Unknown knowledge type." };
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { kind?: string; id?: string } | null;
  if (!body?.id || (body.kind !== "service" && body.kind !== "faq")) return NextResponse.json({ error: "Invalid knowledge deletion." }, { status: 400 });
  const result = body.kind === "service" ? await deleteService(body.id) : await deleteFaq(body.id);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
