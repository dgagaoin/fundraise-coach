// FILE: fundraise-coach/app/api/chat/reload/route.ts
// PURPOSE: Clears the in-memory RAG cache so newly added knowledge/ files are reloaded.
// NOTES: Safe for demo. For production later, we can restrict this to admin users.

import { NextResponse } from "next/server";

export async function POST() {
  (globalThis as any).__fundraiseCoachRagCache = undefined;

  return NextResponse.json({
    ok: true,
    message: "RAG cache cleared. Next /api/chat request will rebuild embeddings.",
  });
}
