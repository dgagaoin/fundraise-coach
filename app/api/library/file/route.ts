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

  // Only allow .txt files
  if (!clean.toLowerCase().endsWith(".txt")) return null;
  return clean;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const fileParam = url.searchParams.get("path") ?? "";
    const rel = sanitizeRelPath(fileParam);

    if (!rel) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const root = getKnowledgeRoot();
    const full = path.join(root, rel);

    // Ensure the resolved path is inside /knowledge
    const resolved = path.resolve(full);
    const resolvedRoot = path.resolve(root);
    if (!resolved.startsWith(resolvedRoot)) {
      return NextResponse.json({ error: "Blocked path" }, { status: 400 });
    }

    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const content = fs.readFileSync(resolved, "utf8");

    return NextResponse.json({
      path: rel,
      content,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to read file" },
      { status: 500 }
    );
  }
}
