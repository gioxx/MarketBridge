import { NextResponse } from "next/server";

import { clearAllListings } from "@/lib/db";
import { clearAllImages } from "@/lib/uploads";

export const runtime = "nodejs";

const DANGER_PURGE_ENV = "MARKETBRIDGE_ENABLE_PURGE_ALL";

const isPurgeEnabled = (): boolean => {
  return typeof process.env[DANGER_PURGE_ENV] !== "undefined";
};

export async function GET() {
  return NextResponse.json({
    enabled: isPurgeEnabled(),
    envVar: DANGER_PURGE_ENV,
  });
}

export async function DELETE() {
  if (!isPurgeEnabled()) {
    return NextResponse.json({ error: "Purge disabled." }, { status: 403 });
  }

  try {
    clearAllListings();
    clearAllImages();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Purge failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
