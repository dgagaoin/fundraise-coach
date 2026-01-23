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

  // Score all chunks, take top 4
  const scored = cache.chunks
    .map((c) => ({ c, score: cosineSimilarity(qEmbed, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const usedSources = scored.map((s) => s.c.source);

  const context = scored
    .map((s, idx) => `SOURCE ${idx + 1}: ${s.c.source}\n${s.c.text}`)
    .join("\n\n---\n\n");

  return { context, usedSources };
}
