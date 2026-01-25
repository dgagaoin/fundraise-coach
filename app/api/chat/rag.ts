/*fundraise-coach/app/api/chat/rag.ts */


import fs from "fs";
import path from "path";
import OpenAI from "openai";

type Chunk = {
  source: string;
  text: string;
  embedding: number[];
};

type RagCache = {
  chunks: Chunk[];
};

declare global {
  // eslint-disable-next-line no-var
  var __fundraiseCoachRagCache: RagCache | undefined;
}

function getKnowledgeRoot() {
  return path.join(process.cwd(), "knowledge");
}

function getAllTxtFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const files: string[] = [];
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) files.push(...getAllTxtFiles(full));
    else if (ent.isFile() && ent.name.toLowerCase().endsWith(".txt")) files.push(full);
  }
  return files;
}

function chunkText(text: string, chunkSize = 1200, overlap = 150): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    if (end === text.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embedText(client: OpenAI, text: string): Promise<number[]> {
  const resp = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return resp.data[0].embedding as number[];
}

/**
 * Very small stopword list to keep keyword scoring relevant.
 * (We just want to catch phrases like "online rebuttal", "security rebuttal", etc.)
 */
const STOPWORDS = new Set([
  "the","a","an","and","or","to","of","in","on","for","with","is","are","am","i","you",
  "we","they","it","this","that","me","my","your","our","can","could","would","should",
  "tell","give","explain","what","how","when","why"
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function keywordScore(query: string, chunkText: string, chunkSource: string): number {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return 0;

  const hay = (chunkSource + "\n" + chunkText).toLowerCase();

  // Token hits
  let hits = 0;
  for (const tok of qTokens) {
    if (hay.includes(tok)) hits++;
  }

  // Phrase boost for common “section lookup” queries (like "online rebuttal")
  const qLower = query.toLowerCase().trim();
  let phraseBoost = 0;
  if (qLower.length >= 6 && qLower.length <= 60) {
    if (hay.includes(qLower)) phraseBoost = 3; // strong boost if exact phrase appears
    // Also handle "online rebuttal" even if user includes "the"
    const normalizedPhrase = qLower.replace(/\bthe\b/g, "").replace(/\s+/g, " ").trim();
    if (normalizedPhrase && normalizedPhrase.length >= 6 && hay.includes(normalizedPhrase)) {
      phraseBoost = Math.max(phraseBoost, 2);
    }
  }

  return hits + phraseBoost;
}

export async function buildRagCache(): Promise<RagCache> {
  if (global.__fundraiseCoachRagCache) return global.__fundraiseCoachRagCache;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const client = new OpenAI({ apiKey });

  const knowledgeRoot = getKnowledgeRoot();
  const txtFiles = getAllTxtFiles(knowledgeRoot);

  const chunks: Chunk[] = [];

  for (const filePath of txtFiles) {
    const raw = fs.readFileSync(filePath, "utf8");
    const sourceName = path.relative(knowledgeRoot, filePath).replaceAll("\\", "/");
    const pieceList = chunkText(raw, 1200, 150);

    for (const piece of pieceList) {
      const embedding = await embedText(client, piece);
      chunks.push({ source: sourceName, text: piece, embedding });
    }
  }

  global.__fundraiseCoachRagCache = { chunks };
  return global.__fundraiseCoachRagCache;
}

export async function ragSearch(query: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const client = new OpenAI({ apiKey });

  const cache = await buildRagCache();
  if (cache.chunks.length === 0) {
    return { context: "", usedSources: [] as string[] };
  }

  const qEmbed = await embedText(client, query);

  // Score all chunks with hybrid scoring:
  // - cosine similarity for semantics
  // - keyword/phrase scoring for “section lookup” reliability
  const scored = cache.chunks
    .map((c) => {
      const cos = cosineSimilarity(qEmbed, c.embedding);
      const key = keywordScore(query, c.text, c.source);

      // Small weight for keyword score (keeps semantic relevance while improving recall)
      const combined = cos + Math.min(0.35, key * 0.06);

      return { c, score: combined, cos, key };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6); // was 4

  // De-dupe sources
  const usedSources = Array.from(new Set(scored.map((s) => s.c.source)));

  const context = scored
    .map((s, idx) => `SOURCE ${idx + 1}: ${s.c.source}\n${s.c.text}`)
    .join("\n\n---\n\n");

  return { context, usedSources };
}
