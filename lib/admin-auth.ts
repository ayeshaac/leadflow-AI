import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "./env";

export const adminCookieName = "leadflow_admin_session";
const sessionLifetimeSeconds = 60 * 60 * 8;

function getAdminKey() {
  return getServerEnv().adminDashboardKey;
}

function signSession(payload: string, key: string) {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function createAdminSession() {
  const key = getAdminKey();
  if (!key) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds;
  const payload = `${expiresAt}.${randomBytes(24).toString("base64url")}`;
  return `${payload}.${signSession(payload, key)}`;
}

export function isValidAdminKey(candidate: string) {
  const key = getAdminKey();
  if (!key || !candidate) return false;

  const expected = Buffer.from(key);
  const received = Buffer.from(candidate);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function isValidAdminSession(value: string | undefined) {
  const key = getAdminKey();
  if (!key || !value) return false;

  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const [expiresAt, nonce, signature] = parts;
  const payload = `${expiresAt}.${nonce}`;
  const expectedSignature = Buffer.from(signSession(payload, key));
  const receivedSignature = Buffer.from(signature);
  if (expectedSignature.length !== receivedSignature.length || !timingSafeEqual(expectedSignature, receivedSignature)) return false;

  return Number.isFinite(Number(expiresAt)) && Number(expiresAt) > Math.floor(Date.now() / 1000);
}

export function setAdminCookie(response: NextResponse, session: string) {
  response.cookies.set(adminCookieName, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionLifetimeSeconds,
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set(adminCookieName, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

export function hasAdminSession(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(adminCookieName)?.value);
}
