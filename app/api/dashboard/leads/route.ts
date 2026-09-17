import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "../../../../lib/admin-auth";
import { getDashboardPayload } from "../../../../lib/dashboard-data";
import { sendMeetingCancellationEmail, sendMeetingConfirmationEmail } from "../../../../lib/email";
import { meetingStatuses, type MeetingStatus } from "../../../../types/meeting";
import { getServerSupabase } from "../../../../lib/supabase-server";

export async function GET(request: NextRequest) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getDashboardPayload();
  if (error) return NextResponse.json({ error }, { status: 503 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: string; status?: MeetingStatus } | null;
  if (!body?.id || !body.status || !meetingStatuses.includes(body.status)) return NextResponse.json({ error: "Invalid meeting update." }, { status: 400 });

  const { client, error: configError } = getServerSupabase();
  if (!client) return NextResponse.json({ error: configError }, { status: 503 });

  const { data: meeting, error: fetchError } = await client
    .from("meetings")
    .select("id,name,email,service,meeting_date,meeting_time,timezone,status,public_token,booking_reference")
    .eq("id", body.id)
    .maybeSingle();

  if (fetchError || !meeting) {
    return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  }

  const { error } = await client.from("meetings").update({ status: body.status }).eq("id", body.id);
  if (error) return NextResponse.json({ error: "Unable to update the meeting status." }, { status: 503 });

  if (body.status === "confirmed") {
    const emailResult = await sendMeetingConfirmationEmail({
      name: meeting.name,
      email: meeting.email,
      service: meeting.service,
      meeting_date: meeting.meeting_date,
      meeting_time: meeting.meeting_time,
      timezone: meeting.timezone,
      booking_reference: meeting.booking_reference,
      public_token: meeting.public_token,
    });
    if (!emailResult.ok && process.env.NODE_ENV === "development") {
      console.warn("Meeting confirmation succeeded; email notification skipped.");
    }
  }

  if (body.status === "cancelled") {
    const emailResult = await sendMeetingCancellationEmail({
      name: meeting.name,
      email: meeting.email,
      service: meeting.service,
      meeting_date: meeting.meeting_date,
      meeting_time: meeting.meeting_time,
      timezone: meeting.timezone,
      booking_reference: meeting.booking_reference,
      public_token: meeting.public_token,
    });
    if (!emailResult.ok && process.env.NODE_ENV === "development") {
      console.warn("Meeting cancellation succeeded; email notification skipped.");
    }
  }

  return NextResponse.json({ ok: true });
}
