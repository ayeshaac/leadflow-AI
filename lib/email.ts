import "server-only";

import nodemailer from "nodemailer";

export type MeetingEmailPayload = {
  name: string;
  email: string;
  service: string | null;
  meeting_date: string | null;
  meeting_time: string | null;
  timezone: string | null;
  booking_reference: string | null;
  public_token: string | null;
};

export type EmailSendResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
};

function getEmailConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const secureRaw = process.env.SMTP_SECURE?.trim().toLowerCase();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const baseUrl = process.env.APP_BASE_URL?.trim().replace(/\/$/, "");

  if (!host || !user || !password || !from) {
    return null;
  }

  return {
    host,
    port: Number(portRaw || "587"),
    secure: secureRaw === "true" || secureRaw === "1" || secureRaw === "yes",
    user,
    password,
    from,
    baseUrl: baseUrl || "http://localhost:3000",
  };
}

function formatDate(date: string | null) {
  if (!date) return "—";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function buildStatusUrl(publicToken: string | null, baseUrl: string) {
  if (!publicToken) return `${baseUrl}/booking/find`;
  return `${baseUrl}/booking/status/${publicToken}`;
}

function getStatusLabel(status: "requested" | "confirmed" | "cancelled") {
  if (status === "confirmed") return "Confirmed";
  if (status === "cancelled") return "Cancelled";
  return "Awaiting confirmation";
}

function wrapHtml(title: string, body: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="margin:0; padding:0; background:#0b0d0d; font-family:Arial, Helvetica, sans-serif; color:#e5e7eb;">
        <div style="max-width:640px; margin:0 auto; padding:32px 20px; background:#0b0d0d;">
          <div style="background:#111413; border:1px solid rgba(255,255,255,0.09); border-radius:18px; overflow:hidden;">
            <div style="padding:24px 24px 18px; border-bottom:1px solid rgba(255,255,255,0.09); background:linear-gradient(180deg, rgba(163,230,53,0.12), rgba(17,20,19,0));">
              <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#a3a3a3; margin-bottom:8px;">LeadFlow AI</div>
              <h1 style="margin:0; font-size:28px; line-height:1.2; color:#f5f5f5;">${title}</h1>
            </div>
            <div style="padding:24px; line-height:1.7; font-size:15px; color:#e5e7eb;">
              ${body}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html: string }): Promise<EmailSendResult> {
  const config = getEmailConfig();
  if (!config) {
    if (process.env.NODE_ENV === "development") console.warn("Email is not configured; notification skipped.");
    return { ok: false, skipped: true, error: "Email not configured" };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user && config.password ? { user: config.user, pass: config.password } : undefined,
  });

  try {
    await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Email delivery failed; notification skipped.");
    }
    return { ok: false, error: error instanceof Error ? error.message : "Unknown email error" };
  }
}

export async function sendMeetingRequestEmail(payload: MeetingEmailPayload): Promise<EmailSendResult> {
  const config = getEmailConfig();
  if (!config) {
    if (process.env.NODE_ENV === "development") console.warn("Email is not configured; notification skipped.");
    return { ok: false, skipped: true, error: "Email not configured" };
  }

  const statusUrl = buildStatusUrl(payload.public_token, config.baseUrl);
  const text = [
    `Hi ${payload.name},`,
    "",
    "We received your meeting request.",
    "",
    `Service: ${payload.service || "—"}`,
    `Date: ${formatDate(payload.meeting_date)}`,
    `Time: ${payload.meeting_time || "—"}`,
    `Timezone: ${payload.timezone || "UTC"}`,
    "",
    "Status:",
    "Awaiting confirmation",
    "",
    `Booking Reference: ${payload.booking_reference || "—"}`,
    "",
    `View Booking Status: ${statusUrl}`,
    "",
    "You can also find your booking later using your email and booking reference.",
  ].join("\n");

  const html = wrapHtml(
    "Meeting request received — LeadFlow AI",
    `
      <p>Hi ${payload.name},</p>
      <p>We received your meeting request.</p>
      <ul>
        <li><strong>Service:</strong> ${payload.service || "—"}</li>
        <li><strong>Date:</strong> ${formatDate(payload.meeting_date)}</li>
        <li><strong>Time:</strong> ${payload.meeting_time || "—"}</li>
        <li><strong>Timezone:</strong> ${payload.timezone || "UTC"}</li>
      </ul>
      <p><strong>Status:</strong> Awaiting confirmation</p>
      <p><strong>Booking Reference:</strong> ${payload.booking_reference || "—"}</p>
      <p><a href="${statusUrl}" style="display:inline-block; margin-top:12px; background:#a3e635; color:#111827; text-decoration:none; padding:12px 18px; border-radius:9999px; font-weight:700;">View Booking Status</a></p>
      <p style="margin-top:16px; color:#d4d4d8;">You can also find your booking later using your email and booking reference.</p>
    `
  );

  return sendEmail({ to: payload.email, subject: "Meeting request received — LeadFlow AI", text, html });
}

export async function sendMeetingConfirmationEmail(payload: MeetingEmailPayload): Promise<EmailSendResult> {
  const config = getEmailConfig();
  if (!config) {
    if (process.env.NODE_ENV === "development") console.warn("Email is not configured; notification skipped.");
    return { ok: false, skipped: true, error: "Email not configured" };
  }

  const statusUrl = buildStatusUrl(payload.public_token, config.baseUrl);
  const text = [
    `Hi ${payload.name},`,
    "",
    "Your meeting has been confirmed.",
    "",
    `Service: ${payload.service || "—"}`,
    `Date: ${formatDate(payload.meeting_date)}`,
    `Time: ${payload.meeting_time || "—"}`,
    `Timezone: ${payload.timezone || "UTC"}`,
    "",
    `Booking Reference: ${payload.booking_reference || "—"}`,
    "",
    "Status:",
    "Confirmed",
    "",
    `View Meeting Details: ${statusUrl}`,
  ].join("\n");

  const html = wrapHtml(
    "Your meeting is confirmed — LeadFlow AI",
    `
      <p>Hi ${payload.name},</p>
      <p>Your meeting has been confirmed.</p>
      <ul>
        <li><strong>Service:</strong> ${payload.service || "—"}</li>
        <li><strong>Date:</strong> ${formatDate(payload.meeting_date)}</li>
        <li><strong>Time:</strong> ${payload.meeting_time || "—"}</li>
        <li><strong>Timezone:</strong> ${payload.timezone || "UTC"}</li>
      </ul>
      <p><strong>Booking Reference:</strong> ${payload.booking_reference || "—"}</p>
      <p><strong>Status:</strong> ${getStatusLabel("confirmed")}</p>
      <p><a href="${statusUrl}" style="display:inline-block; margin-top:12px; background:#a3e635; color:#111827; text-decoration:none; padding:12px 18px; border-radius:9999px; font-weight:700;">View Meeting Details</a></p>
    `
  );

  return sendEmail({ to: payload.email, subject: "Your meeting is confirmed — LeadFlow AI", text, html });
}

export async function sendMeetingCancellationEmail(payload: MeetingEmailPayload): Promise<EmailSendResult> {
  const config = getEmailConfig();
  if (!config) {
    if (process.env.NODE_ENV === "development") console.warn("Email is not configured; notification skipped.");
    return { ok: false, skipped: true, error: "Email not configured" };
  }

  const statusUrl = buildStatusUrl(payload.public_token, config.baseUrl);
  const text = [
    `Hi ${payload.name},`,
    "",
    "Your meeting has been cancelled.",
    "",
    `Service: ${payload.service || "—"}`,
    `Date: ${formatDate(payload.meeting_date)}`,
    `Time: ${payload.meeting_time || "—"}`,
    `Booking Reference: ${payload.booking_reference || "—"}`,
    "",
    `View Booking Status: ${statusUrl}`,
  ].join("\n");

  const html = wrapHtml(
    "Meeting update — LeadFlow AI",
    `
      <p>Hi ${payload.name},</p>
      <p>Your meeting has been cancelled.</p>
      <ul>
        <li><strong>Service:</strong> ${payload.service || "—"}</li>
        <li><strong>Date:</strong> ${formatDate(payload.meeting_date)}</li>
        <li><strong>Time:</strong> ${payload.meeting_time || "—"}</li>
        <li><strong>Booking Reference:</strong> ${payload.booking_reference || "—"}</li>
      </ul>
      <p><a href="${statusUrl}" style="display:inline-block; margin-top:12px; background:#a3e635; color:#111827; text-decoration:none; padding:12px 18px; border-radius:9999px; font-weight:700;">View Booking Status</a></p>
    `
  );

  return sendEmail({ to: payload.email, subject: "Meeting update — LeadFlow AI", text, html });
}
