/*fundraise-coach/app/api/pdf/route.ts*/

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getKnowledgeRoot() {
  return path.join(process.cwd(), "knowledge");
}

function sanitizePdfPath(p: string) {
  const clean = String(p || "")
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\.\./g, "")
    .trim();

  if (!clean.toLowerCase().endsWith(".pdf")) return null;
  return clean;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const fileParam = url.searchParams.get("path") ?? "";
    const rel = sanitizePdfPath(fileParam);

    if (!rel) {
      return new NextResponse("Invalid PDF path", { status: 400 });
    }

    const root = getKnowledgeRoot();
    const full = path.join(root, rel);

    const resolved = path.resolve(full);
    const resolvedRoot = path.resolve(root);

    if (!resolved.startsWith(resolvedRoot)) {
      return new NextResponse("Blocked path", { status: 400 });
    }

    if (!fs.existsSync(resolved)) {
      return new NextResponse("PDF not found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(resolved);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    return new NextResponse("Failed to load PDF", { status: 500 });
  }
}
