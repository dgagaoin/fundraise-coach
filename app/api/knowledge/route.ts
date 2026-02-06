// fundraise-coach/app/api/knowledge/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getKnowledgeRoot() {
  return path.join(process.cwd(), "knowledge");
}

function sanitizeRelPath(p: string) {
  const clean = String(p || "")
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\.\./g, "")
    .trim();

  if (!clean) return null;

  const lower = clean.toLowerCase();
  const isTxt = lower.endsWith(".txt");
  const isPdf = lower.endsWith(".pdf");

  if (!isTxt && !isPdf) return null;

  return clean;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const p = url.searchParams.get("path") ?? "";
    const rel = sanitizeRelPath(p);

    if (!rel) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const root = getKnowledgeRoot();
    const full = path.join(root, rel);

    const resolved = path.resolve(full);
    const resolvedRoot = path.resolve(root);

    if (!resolved.startsWith(resolvedRoot)) {
      return NextResponse.json({ error: "Blocked path" }, { status: 400 });
    }

    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const lower = rel.toLowerCase();

    // TXT -> return the text
    if (lower.endsWith(".txt")) {
      const text = fs.readFileSync(resolved, "utf8");
      return NextResponse.json({
        kind: "txt",
        path: rel,
        filename: path.basename(rel),
        text,
      });
    }

    // PDF -> return a URL that your iframe can load (via /api/pdf)
    if (lower.endsWith(".pdf")) {
      return NextResponse.json({
        kind: "pdf",
        path: rel,
        filename: path.basename(rel),
        fileUrl: `/api/pdf?path=${encodeURIComponent(rel)}`,
      });
    }

    return NextResponse.json({ error: "Unsupported type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed" },
      { status: 500 }
    );
  }
}
