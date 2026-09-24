import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness probe for Vercel / uptime monitors. Deliberately reveals nothing about config. */
export function GET() {
  return NextResponse.json({ ok: true, service: "lodgely", time: new Date().toISOString() });
}
