// fundraise-coach/app/api/knowledge/file/route.ts
import { NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const ALLOWED_EXT = new Set([".pdf"]);

function isSafeRelPath(p: string) {
  if (!p) return false;
  if (p.includes("\0")) return false;

  const normalized = p.replace(/\\/g, "/");
  if (normalized.startsWith("/")) return false;
  if (normalized.includes("..")) return false;

  return true;
}

function resolveKnowledgePath(rel: string) {
  const safeRel = rel.replace(/\\/g, "/");
  const abs = path.join(KNOWLEDGE_DIR, safeRel);

  const absNormalized = path.normalize(abs);
  const knowledgeNormalized = path.normalize(KNOWLEDGE_DIR);

  if (
    !absNormalized.startsWith(knowledgeNormalized + path.sep) &&
    absNormalized !== knowledgeNormalized
  ) {
    throw new Error("Path escapes knowledge directory");
  }

  return absNormalized;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const relPath = url.searchParams.get("path") ?? "";

    if (!isSafeRelPath(relPath)) {
      return new Response("Invalid path", { status: 400 });
    }

    const ext = path.extname(relPath).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return new Response("Unsupported file type", { status: 400 });
    }

    const abs = resolveKnowledgePath(relPath);
    const data = await fs.readFile(abs);

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${path.basename(relPath)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return new Response(`Failed to load PDF: ${String(err?.message ?? err)}`, { status: 500 });
  }
}
