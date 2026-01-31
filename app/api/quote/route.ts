import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

function getKnowledgeRoot() {
  return path.join(process.cwd(), "knowledge");
}

function listTxtFiles(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((ent) => ent.isFile() && ent.name.toLowerCase().endsWith(".txt"))
    .map((ent) => ent.name);
}

function readText(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

function stripMd(s: string) {
  return s
    .replace(/\*\*/g, "") // **bold**
    .replace(/^#+\s*/gm, "") // headings
    .trim();
}

function extractQuoteAndAttribution(raw: string, fallbackTitle: string) {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim());

  // 1) Attribution: look for a line containing "Attribution:"
  let attribution = "";
  for (const l of lines) {
    if (/attribution\s*:/i.test(l)) {
      // take everything after "Attribution:"
      attribution = stripMd(l.replace(/.*attribution\s*:\s*/i, "")).trim();
      break;
    }
  }

  // 2) Quote: prefer the first heading line that contains a quote, else first non-empty line
  let quote = "";
  const headingCandidate = lines.find((l) => l.startsWith("#") && l.includes("“"));
  if (headingCandidate) {
    quote = stripMd(headingCandidate);
  } else {
    // find first “content” line that is not metadata
    const firstContent = lines.find((l) => {
      if (!l) return false;
      if (/^(attribution|original context|notes|meaning|suggested tags)\s*:/i.test(stripMd(l))) return false;
      if (l.startsWith("---")) return false;
      if (l.startsWith("#")) return true;
      // allow quote lines that start with a quote mark
      if (l.startsWith("“") || l.startsWith('"')) return true;
      return true;
    });
    quote = stripMd(firstContent ?? "");
  }

  // Final cleanup: remove leading/trailing quote marks for consistent wrapping in UI
  quote = quote.replace(/^["“]+/, "").replace(/["”]+$/, "").trim();

  // Fallbacks
  if (!attribution) attribution = fallbackTitle || "Anonymous";
  if (!quote) quote = "(quote missing)";

  return { quote, attribution };
}


/**
 * Expected quote file format (flexible):
 * - If the file contains multiple lines, we return full content trimmed.
 * - Attribution can be handled later; for now we return the filename as fallback metadata.
 */
export async function GET() {
  try {
    const root = getKnowledgeRoot();

    // ✅ Assumption: quotes live here
    const quotesDir = path.join(root, "quotes");

    const files = listTxtFiles(quotesDir);

    if (!files.length) {
      return NextResponse.json(
        {
          error:
            "No quote files found. Create knowledge/quotes/*.txt to enable rotating quotes.",
        },
        { status: 404 }
      );
    }

    // Random pick per page load (Option A)
    const idx = crypto.randomInt(0, files.length);
    const filename = files[idx];

    const fullPath = path.join(quotesDir, filename);
    const content = readText(fullPath).trim();

    // Basic metadata
    const title = filename.replace(/\.txt$/i, "");

    // Extract just what we want for the chat UI
    const extracted = extractQuoteAndAttribution(content, title);

    return NextResponse.json({
    quote: extracted.quote,
    attribution: extracted.attribution,
    meta: {
        title,
        sourcePath: `quotes/${filename}`,
    },
    });
    
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load quote" },
      { status: 500 }
    );
  }
}
