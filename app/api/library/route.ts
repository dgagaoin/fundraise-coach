import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getKnowledgeRoot() {
  return path.join(process.cwd(), "knowledge");
}

function listTxtFilesRecursive(dir: string, baseRel = ""): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];

  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    const rel = path.join(baseRel, ent.name).replaceAll("\\", "/");

    if (ent.isDirectory()) {
      out.push(...listTxtFilesRecursive(full, rel));
    } else if (
      ent.isFile() &&
      (ent.name.toLowerCase().endsWith(".txt") || ent.name.toLowerCase().endsWith(".pdf"))
    ) {
      out.push(rel);
    }
  }

  return out;
}

export async function GET() {
  try {
    const root = getKnowledgeRoot();
    const files = listTxtFilesRecursive(root);

    // Sort for stable UI
    files.sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ files });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load library list" },
      { status: 500 }
    );
  }
}
