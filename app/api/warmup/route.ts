// fundraise-coach/app/api/warmup/route.ts
import { NextResponse } from "next/server";
import { warmupRag } from "../chat/rag";

export async function GET() {
  try {
    await warmupRag();
    return NextResponse.json({ ok: true, ready: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "warmup failed" },
      { status: 500 }
    );
  }
}
