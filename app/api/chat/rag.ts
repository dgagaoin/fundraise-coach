// fundraise-coach/app/api/chat/rag.ts
import fs from "fs";
import path from "path";

type CoachRole = "rep" | "leader" | "owner";

type RagOptions = {
  // retrieval size
  topK?: number;
  maxCharsPerChunk?: number;
  maxContextChars?: number;

  // role-aware retrieval biasing
  role?: CoachRole;

  // optional explicit folder priority override
  folderPriority?: string[];

  // output hygiene (prevents source bloat)
  maxSources?: number;         // max distinct files in final context
  maxChunksPerSource?: number; // max chunks pulled per file
};



type Chunk = {
  source: string;   // relative path under knowledge/
  text: string;
};

type RagState = {
  builtAt: number;
  chunks: Chunk[];
  // simple token -> chunkIndexes
  inverted: Map<string, number[]>;
};

declare global {
  // eslint-disable-next-line no-var
  var __fc_rag_state: RagState | undefined;
}

const KNOWLEDGE_ROOT = path.join(process.cwd(), "knowledge");

// ---------- Helpers ----------
function safeReadTextFile(absPath: string) {
  try {
    return fs.readFileSync(absPath, "utf8");
  } catch {
    return null;
  }
}

function listAllTxtFilesUnderKnowledge(): string[] {
  if (!fs.existsSync(KNOWLEDGE_ROOT)) return [];

  const out: string[] = [];

  const walk = (absDir: string) => {
    const entries = fs.readdirSync(absDir, { withFileTypes: true })
      // ✅ deterministic directory iteration
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const ent of entries) {
      const abs = path.join(absDir, ent.name);
      if (ent.isDirectory()) {
        walk(abs);
      } else if (ent.isFile()) {
        const lower = ent.name.toLowerCase();
        if (lower.endsWith(".txt")) {
          const rel = path.relative(KNOWLEDGE_ROOT, abs).replaceAll("\\", "/");
          out.push(rel);
        }
      }
    }
  };

  walk(KNOWLEDGE_ROOT);

  // ✅ deterministic file list
  out.sort((a, b) => a.localeCompare(b));
  return out;
}


function normalizeText(s: string) {
  return (s || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .trim();
}

function tokenize(s: string) {
  const original = String(s || "");

  // Fix common name patterns like "OmarK" -> "Omar K"
  const deCamel = original.replace(/([a-z])([A-Z])/g, "$1 $2");

  const text = deCamel.toLowerCase();

  // keep alphanumerics, split others
  const raw = text.split(/[^a-z0-9]+/g).filter(Boolean);

  // tiny stopword set (keep it minimal)
  // NOTE: include "i" so allowing 1-char tokens doesn't add junk
  const stop = new Set([
  // articles / connectors
  "the","a","an","and","or","to","of","in","on","for","is","are","was","were","be","been","with","that","this","it","as","at","by","from",

  // common chat filler (these are killing your overlap score)
  "can","could","would","should","you","your","me","my","we","us","our","please","give","tell","explain","show",

  // misc
  "i"
]);


  return raw.filter((t) => {
  if (stop.has(t)) return false;
  if (t.length >= 2) return true;

  // allow 1-char letters (initials) AND 1-char digits (e.g., "5" in "5 steps")
    return /^[a-z0-9]$/.test(t);
  });

}


function chunkText(text: string, maxChars: number) {
  const t = normalizeText(text);
  if (!t) return [];
  if (t.length <= maxChars) return [t];

  // chunk by paragraphs first
  const paras = t.split(/\n\s*\n/g);
  const chunks: string[] = [];
  let cur = "";

  const flush = () => {
    const c = cur.trim();
    if (c) chunks.push(c);
    cur = "";
  };

  for (const p of paras) {
    const para = p.trim();
    if (!para) continue;

    if ((cur + "\n\n" + para).length <= maxChars) {
      cur = cur ? cur + "\n\n" + para : para;
    } else {
      flush();
      if (para.length <= maxChars) {
        cur = para;
      } else {
        // hard split very long para
        for (let i = 0; i < para.length; i += maxChars) {
          chunks.push(para.slice(i, i + maxChars));
        }
      }
    }
  }
  flush();
  return chunks;
}

function expandQueryTokens(tokens: string[]) {
  const out = new Set(tokens);

  for (const t of tokens) {
    // recruiting word family
    if (t.startsWith("recruit")) {
      out.add("recruit");
      out.add("recruiting");
      out.add("recruitment");
      out.add("recruits");
      out.add("recruiter");
      out.add("interview");
      out.add("interviews");
      out.add("hiring");
      out.add("hire");
    }

    // common synonym family
    if (t === "tips" || t === "advice") {
      out.add("tips");
      out.add("advice");
      out.add("principles");
      out.add("framework");
    }
  }

  return Array.from(out);
}


function buildRagOnce(): RagState {
  const started = Date.now();

  const files = listAllTxtFilesUnderKnowledge();

  const chunks: Chunk[] = [];
  for (const rel of files) {
    const abs = path.join(KNOWLEDGE_ROOT, rel);
    const raw = safeReadTextFile(abs);
    if (!raw) continue;

    // Skip crazy tiny files
    const cleaned = normalizeText(raw);
    if (!cleaned || cleaned.length < 10) continue;

    const parts = chunkText(cleaned, 1400);
    for (const part of parts) {
      chunks.push({ source: rel, text: part });
    }
  }

  // Build inverted index: token -> list of chunk indexes
  const inverted = new Map<string, number[]>();
  for (let i = 0; i < chunks.length; i++) {
    const toks = new Set(tokenize(chunks[i].text));
    for (const tok of toks) {
      const arr = inverted.get(tok);
      if (arr) arr.push(i);
      else inverted.set(tok, [i]);
    }
  }

  console.log(
    `[RAG] built in ${Date.now() - started}ms | files=${files.length} | chunks=${chunks.length}`
  );

  return { builtAt: Date.now(), chunks, inverted };
}

function getRagState(): RagState {
  if (globalThis.__fc_rag_state) return globalThis.__fc_rag_state;
  globalThis.__fc_rag_state = buildRagOnce();
  return globalThis.__fc_rag_state;
}

// ---------- Public API (used by route.ts) ----------
export async function readKnowledgeDoc(relPath: string) {
  try {
    const abs = path.join(KNOWLEDGE_ROOT, relPath);
    const txt = safeReadTextFile(abs);
    return txt ? normalizeText(txt) : null;
  } catch {
    return null;
  }
}

function filenameBoostScore(query: string, source: string) {
  const q = (query || "").toLowerCase();
  const s = (source || "").toLowerCase();

  // Strong exact boosts
    const strongPairs: Array<[RegExp, RegExp, number]> = [
    // 5 Steps / Manufactured Conversation should be a HARD single-doc winner
    [
      /(\b5\s*steps\b|\bmanufactured conversation\b)/i,
      /(\b5\s*steps\b|\b5steps\b|\bmanufactured\s*conversation\b)/i,
      3.5,
    ],

    // Recruiting / Interview docs
    [
      /(\brecruit(ing|ment)\b|\binterviews?\b|\bhiring\b|\bindeed\b|\badmin calls?\b)/i,
      /(\brecruit\b|\brecruit(ing|ment)\b|\binterview\b|\bhiring\b|\bindeed\b|\badmin calls?\b)/i,
      2.0,
    ],

    // Omar + recruiting should strongly favor owners/recruitment-ish docs (prevents drifting into core)
    [
      /(\bomar\b|\bomark\b|\bomar k\b).*(\brecruit|\bhire|\binterview|\bhiring|\bindeed|\badmin calls?\b)/i,
      /(\bomar\b|\bomark\b|\bomar k\b|\brecruit|\brecruitment|\brecruiting|\binterview|\bhiring|\bindeed|\badmin\b)/i,
      3.2,
    ],

    // Charity pitch hard boosts (so the charity doc beats generic core text)
    [
      /(\bcare\b).*(\bpitch\b|\bshort story\b|\bstory\b|\bscript\b)/i,
      /(\bcare\b|\bcare pitch\b|\bcare short story\b|\bcare story\b)/i,
      3.2,
    ],
    [
      /(\btnc\b|\bnature conservancy\b).*(\bpitch\b|\bshort story\b|\bstory\b|\bscript\b)/i,
      /(\btnc\b|\bnature conservancy\b|\bconservancy\b)/i,
      3.2,
    ],
    [
      /(\bifaw\b).*(\bpitch\b|\bshort story\b|\bstory\b|\bscript\b)/i,
      /(\bifaw\b|\banimal welfare\b)/i,
      3.2,
    ],
    [
      /(\bchildfund\b|\bcfi\b).*(\bpitch\b|\bshort story\b|\bstory\b|\bscript\b)/i,
      /(\bchildfund\b|\bcfi\b)/i,
      3.2,
    ],
    [
      /(\bsave the children\b|\bstc\b).*(\bpitch\b|\bshort story\b|\bstory\b|\bscript\b)/i,
      /(\bsave the children\b|\bstc\b)/i,
      3.2,
    ],
    [
      /(\baspca\b).*(\bpitch\b|\bshort story\b|\bstory\b|\bscript\b)/i,
      /(\baspca\b)/i,
      3.2,
    ],
  ];


  let boost = 0;

  for (const [qRe, sRe, val] of strongPairs) {
    if (qRe.test(q) && sRe.test(s)) boost += val;
  }

  // General token overlap boost (lightweight)
  const tokens = q.split(/[^a-z0-9]+/).filter(Boolean);
  let hits = 0;
  for (const t of tokens) {
    if (t.length >= 4 && s.includes(t)) hits++;
  }
  boost += Math.min(1.0, hits * 0.2);

  return boost;
}

function normalizeSourcePath(source: string) {
  return String(source || "").replaceAll("\\", "/");
}

function defaultFolderPriorityForRole(role?: CoachRole): string[] {
  // NOTE: trailing "/" required for prefix matches
  if (role === "owner") {
    // owners: core -> systems -> rebuttals -> charities -> product_training -> pdfs -> owners -> motivation_stories -> quotes
    return [
      "core/",
      "systems/",
      "rebuttals/",
      "charities/",
      "product_training/",
      "pdfs/",
      "owners/",
      "motivation_stories/",
      "quotes/",
    ];
  }

  // FRs + Leaders: core -> systems -> rebuttals -> charities -> product_training -> pdfs -> motivation_stories -> quotes
  return [
    "core/",
    "systems/",
    "rebuttals/",
    "charities/",
    "product_training/",
    "pdfs/",
    "motivation_stories/",
    "quotes/",
  ];
}


/**
 * Returns a positive boost for higher-priority folders.
 * Stronger at the top of the list, decays as it goes down.
 */
function folderBoostScore(source: string, role?: CoachRole, folderPriority?: string[]) {
  const src = normalizeSourcePath(source).toLowerCase();

  const priRaw = (folderPriority && folderPriority.length)
    ? folderPriority
    : defaultFolderPriorityForRole(role);

  const pri = priRaw.map((p) => normalizeSourcePath(p).toLowerCase());

  const idx = pri.findIndex((p) => src.startsWith(p));
  if (idx === -1) return 0;

  // Example: idx=0 => 1.6, idx=1 => 1.4 ... then bottoms out
  const max = 1.6;
  const decay = 0.2;
  const boost = Math.max(0.2, max - idx * decay);

  return boost;
}

function folderBandIndex(source: string, folderPriority: string[]) {
  const src = normalizeSourcePath(source).toLowerCase();
  const pri = folderPriority.map((p) => normalizeSourcePath(p).toLowerCase());
  const idx = pri.findIndex((p) => src.startsWith(p));
  return idx === -1 ? 999 : idx; // unknown folders go last
}

function stripRagHints(raw: string) {
  let q = String(raw || "");

  // If route.ts appends “hint blocks”, they should NOT affect hardCategory/pinning/intent.
  // We strip common patterns safely (only at the end / in clearly-marked blocks).

  // 1) Strip trailing "meta: { ... }" blocks
  q = q.replace(/\n{2,}meta:\s*\{[\s\S]*$/i, "");

  // 2) Strip trailing "HINT:" style blocks
  q = q.replace(/\n{2,}(?:rebuttal_hint|aic_hint|kpi_hint|hint|mode_hint)\s*:\s*[\s\S]*$/i, "");

  // 3) Strip trailing bracketed hint sections like:
  //    [REBUTTAL_HINT] ... or [AIC] ... or [KPI] ...
  q = q.replace(/\n{2,}\[(?:rebuttal|aic|kpi|hint|meta)[^\]]*\][\s\S]*$/i, "");

  // 4) Strip trailing “---” separated appended sections
  q = q.replace(/\n{2,}-{3,}[\s\S]*$/i, "");

  return q.trim();
}



function detectPinnedSources(query: string) {
  const q = (query || "").toLowerCase();

  const pins: string[] = [];

  // --- 5 steps intent (hard pin) ---
  if (/\b5\s*steps\b/.test(q) || q.includes("manufactured conversation")) {
    pins.push("5 steps", "5steps", "manufactured conversation");
  }

  // --- Charity pitch intent (hard pin) ---
  // If someone asks for a pitch / short story / script, we want the charity doc to dominate.
  const wantsPitch =
    q.includes("pitch") ||
    q.includes("short story") ||
    q.includes("story") ||
    q.includes("script") ||
    q.includes("care pitch") ||
    q.includes("tnc pitch") ||
    q.includes("ifaw pitch") ||
    q.includes("cfi pitch") ||
    q.includes("stc pitch");

  // Charity name/entity pins (add more as you expand)
  if (wantsPitch) {
    // CARE
    if (q.includes("care")) pins.push("care");

    // The Nature Conservancy
    if (q.includes("tnc") || q.includes("nature conservancy") || q.includes("nature conservancy's")) {
      pins.push("tnc", "nature conservancy", "conservancy");
    }

    // IFAW
    if (q.includes("ifaw") || q.includes("animal welfare") || q.includes("international fund for animal welfare")) {
      pins.push("ifaw", "animal welfare");
    }

    // ChildFund
    if (q.includes("childfund") || q.includes("cfi")) pins.push("childfund", "cfi");

    // Save the Children
    if (q.includes("save the children") || q.includes("stc")) pins.push("save the children", "stc");

    // ASPCA
    if (q.includes("aspca")) pins.push("aspca");
  }

  return pins;
}


function ownerOnlyIntent(query: string) {
  const q = (query || "").toLowerCase();

  // “Owner-only” buckets (expand over time)
  const isRecruiting =
    q.includes("recruit") ||
    q.includes("hiring") ||
    q.includes("interview") ||
    q.includes("indeed") ||
    q.includes("admin calls");

  const isOwnersMeeting =
    q.includes("owners meeting") ||
    q.includes("owner meeting") ||
    q.includes("last owners meeting") ||
    q.includes("topics at the last owners meeting") ||
    q.includes("recap of the owners meeting") ||
    q.includes("new leaders meeting");

  const mentionsOmar = q.includes("omar") || q.includes("omark") || q.includes("omar k");

  return {
    isRecruiting,
    isOwnersMeeting,
    mentionsOmar,
    shouldPrioritizeOwnersFolder: (isRecruiting || isOwnersMeeting) && (mentionsOmar || isRecruiting || isOwnersMeeting),
  };
}

type HardCategory =
  | "pitches"
  | "rebuttals_plus_charity"
  | "charity_usps"
  | "systems"
  | "pdfs"
  | "product_knowledge"
  | "charity_information"
  | "core"
  | null;

function detectHardCategory(query: string): HardCategory {
  const q = (query || "").toLowerCase();

  const mentionsCharity =
    q.includes("care") ||
    q.includes("tnc") || q.includes("nature conservancy") || q.includes("conservancy") ||
    q.includes("ifaw") || q.includes("animal welfare") ||
    q.includes("childfund") || q.includes("cfi") ||
    q.includes("save the children") || q.includes("stc") ||
    q.includes("aspca");

  const wantsPitch =
    q.includes("pitch") || q.includes("short story") || q.includes("script") || q.includes("the pitch");

  const wantsRebuttal =
    q.includes("rebuttal") || q.includes("objection") || q.includes("pushback") || q.includes("handle") || q.includes("comeback");

  const wantsUSP =
    q.includes("usp") || q.includes("usps") || q.includes("unique selling") || q.includes("key points") || q.includes("why us") || q.includes("talking points");

  const wantsSystem =
    q.includes("system") || q.includes("process") || q.includes("protocol") || q.includes("tablet") || q.includes("sign up") || q.includes("signup") || q.includes("flow");

  const wantsPDF =
    q.includes("pdf") || q.includes(".pdf") || q.includes("from the pdf");

  const wantsProductKnowledge =
    q.includes("product") || q.includes("training") || q.includes("facts") || q.includes("program details");

  const wantsCharityInfo =
    q.includes("about") || q.includes("what is") || q.includes("what does") || q.includes("mission") || q.includes("impact") || q.includes("does the charity");

  const wantsCore =
    q.includes("5 steps") || q.includes("manufactured conversation") || q.includes("core");

  // Hard-gates (order matters)
  if (wantsPitch && mentionsCharity) return "pitches";
  if (wantsRebuttal && mentionsCharity) return "rebuttals_plus_charity";
  if (wantsUSP && mentionsCharity) return "charity_usps";

  if (wantsSystem) return "systems";
  if (wantsPDF) return "pdfs";
  if (wantsProductKnowledge) return "product_knowledge";

  // If they’re asking general “about the charity” (without pitch),
  // keep it in charity_information
  if (mentionsCharity && wantsCharityInfo) return "charity_information";

  if (wantsCore) return "core";

  return null;
}

function hardAllowedPrefixes(cat: HardCategory): string[] | null {
  switch (cat) {
    case "pitches":
    // Pitch needs: charity short story (charities/) + charity USPs (often stored in rebuttals/)
    return ["charities/", "rebuttals/"];
    case "rebuttals_plus_charity":
      return ["rebuttals/", "charities/"]; // only these two
    case "charity_usps":
      return ["charities/"];
    case "systems":
      return ["systems/"];
    case "pdfs":
      return ["pdfs/"];
    case "product_knowledge":
      return ["product_training/"];
    case "charity_information":
      return ["charities/"];
    case "core":
      return ["core/"];
    default:
      return null;
  }
}

function detectCharityKey(query: string) {
  const q = (query || "").toLowerCase();

  if (q.includes("care")) return "care";

  if (q.includes("tnc") || q.includes("nature conservancy") || q.includes("conservancy")) return "tnc";

  if (q.includes("ifaw") || q.includes("animal welfare") || q.includes("international fund for animal welfare")) return "ifaw";

  // ChildFund / CFI
  if (q.includes("childfund") || q.includes("cfi")) return "childfund";

  // Save the Children / STC
  if (q.includes("save the children") || q.includes("stc")) return "stc";

  if (q.includes("aspca")) return "aspca";

  return null;
}

function listDistinctSources(state: RagState) {
  return Array.from(new Set(state.chunks.map((c) => c.source))).sort((a, b) => a.localeCompare(b));
}

function chunkIndexesForSource(state: RagState, source: string) {
  const out: number[] = [];
  for (let i = 0; i < state.chunks.length; i++) {
    if (state.chunks[i].source === source) out.push(i);
  }
  return out; // already increasing by i
}

function pickCharitySource(sources: string[], charityKey: string) {
  const k = charityKey.toLowerCase();

  // Prefer exact charity folder match
  const inCharities = sources.filter((s) => s.toLowerCase().startsWith("charities/"));

  // Heuristic: filename contains the charity key
  // (works for "Child Fund International..." if it contains "child" or "childfund" etc.)
  // We'll try a few expansions for known keys.
  const keyVariants =
    k === "childfund" ? ["childfund", "child", "cfi"] :
    k === "stc" ? ["save", "children", "stc"] :
    k === "tnc" ? ["tnc", "nature", "conservancy"] :
    k === "ifaw" ? ["ifaw", "animal", "welfare"] :
    [k];

  const hit = inCharities.find((s) => keyVariants.some((v) => s.toLowerCase().includes(v)));
  return hit ?? null;
}

function pickRebuttalSource(sources: string[], charityKey: string) {
  const k = charityKey.toLowerCase();
  const inRebuttals = sources.filter((s) => s.toLowerCase().startsWith("rebuttals/"));

  const keyVariants =
    k === "childfund" ? ["childfund", "child", "cfi"] :
    k === "stc" ? ["save", "children", "stc"] :
    k === "tnc" ? ["tnc", "nature", "conservancy"] :
    k === "ifaw" ? ["ifaw", "animal", "welfare"] :
    [k];

  // Prefer charity-specific rebuttal file if present
  const specific = inRebuttals.find((s) => keyVariants.some((v) => s.toLowerCase().includes(v)));
  if (specific) return specific;

  // Otherwise fall back to anything that looks like a USP file
  const uspFallback = inRebuttals.find((s) => s.toLowerCase().includes("usp"));
  if (uspFallback) return uspFallback;

  // Last fallback: any rebuttals doc
  return inRebuttals[0] ?? null;
}

function pickStandardCloseSource(sources: string[]) {
  // Prefer exact known path
  const exact = sources.find((s) => s.toLowerCase() === "core/standard-close.txt");
  if (exact) return exact;

  // fallback: anything in core containing "standard" and "close"
  const inCore = sources.filter((s) => s.toLowerCase().startsWith("core/"));
  return inCore.find((s) => {
    const lower = s.toLowerCase();
    return lower.includes("standard") && lower.includes("close");
  }) ?? null;
}


export async function ragSearch(query: string, opts: RagOptions = {}) {
  const state = getRagState();

  const topK = Math.max(1, Math.min(50, opts.topK ?? 6));
  const maxCharsPerChunk = Math.max(400, Math.min(4000, opts.maxCharsPerChunk ?? 1400));
  const maxContextChars = Math.max(2000, Math.min(50000, opts.maxContextChars ?? 22000));

  const cleanQuery = stripRagHints(query);

  const qTokens = tokenize(query); // keep full query for retrieval overlap
  const expandedTokens = expandQueryTokens(qTokens);

  // IMPORTANT: use cleanQuery for intent + gating (so hint text can’t misclassify)
  const hardCat = detectHardCategory(cleanQuery);

  console.log("[RAG] query:", query.slice(0, 180));
  console.log("[RAG] cleanQuery:", cleanQuery.slice(0, 180));
  console.log("[RAG] qTokens:", qTokens);


  if (!qTokens.length) {
  return { context: "", usedSources: [] as string[], hardCategory: hardCat };
}

  // -------- FORCE PITCH BUNDLE (prevents hallucinated Problem/Solution) --------
  // If this is a charity pitch request, we ALWAYS assemble context from:
  // charities/ (Problem+Solution) + core/standard-close.txt (Close) + rebuttals/ (USPs)
  if (hardCat === "pitches") {
    const sources = listDistinctSources(state);
    const charityKey = detectCharityKey(query);

    // If we can't detect a charity, fall back to normal RAG.
    if (charityKey) {
      const charitySource = pickCharitySource(sources, charityKey);
      const closeSource = pickStandardCloseSource(sources);
      const rebuttalSource = pickRebuttalSource(sources, charityKey);

      // If the charity doc itself is missing, fail-closed (no hallucinations).
      if (!charitySource) {
        return { context: "", usedSources: [] as string[], hardCategory: hardCat };
      }

      const usedSources: string[] = [];
      const chosen: Chunk[] = [];

      // 1) Charity doc (more chunks)
      usedSources.push(charitySource);
      const charityIdxs = chunkIndexesForSource(state, charitySource).slice(0, 10);
      for (const i of charityIdxs) chosen.push(state.chunks[i]);

      // 2) Standard close (a few chunks)
      if (closeSource) {
        usedSources.push(closeSource);
        const closeIdxs = chunkIndexesForSource(state, closeSource).slice(0, 6);
        for (const i of closeIdxs) chosen.push(state.chunks[i]);
      }

      // 3) Rebuttal USPs (a few chunks)
      if (rebuttalSource) {
        usedSources.push(rebuttalSource);
        const rebuttalIdxs = chunkIndexesForSource(state, rebuttalSource).slice(0, 10);
        for (const i of rebuttalIdxs) chosen.push(state.chunks[i]);
      }

      // Build context string, clamp size (reuse existing logic)
      let context = "";
      for (const c of chosen) {
        const chunk = c.text.length > maxCharsPerChunk ? c.text.slice(0, maxCharsPerChunk) : c.text;
        const block = `SOURCE: ${c.source}\n${chunk}\n`;
        if ((context + "\n\n" + block).length > maxContextChars) break;
        context += (context ? "\n\n" : "") + block;
      }

      return { context, usedSources, hardCategory: hardCat };
    }
  }


  // Candidate chunks from inverted index
  const candidateSet = new Set<number>();
    for (const tok of expandedTokens) {
    const hits = state.inverted.get(tok);
    if (hits) for (const idx of hits) candidateSet.add(idx);
  }

  let candidates = Array.from(candidateSet);


  // --- Pinned source intent (exact doc wins when query strongly implies it) ---
  const pinHints = detectPinnedSources(cleanQuery);

  if (pinHints.length) {
    for (let i = 0; i < state.chunks.length; i++) {
      const src = state.chunks[i].source.toLowerCase();
      if (pinHints.some((h) => src.includes(h))) {
        candidateSet.add(i);
      }
    }
    candidates = Array.from(candidateSet);
  }


  // ---------- FALLBACK (when token index misses, e.g. "OmarK" vs "Omar K") ----------
  if (!candidates.length) {
    const qJoined = qTokens.join(""); // "omar"+"k" => "omark" (if k exists later)
    const qJoinedNoSpaces = (query || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

    // Do a cheap scan across all chunks (still fast at your current dataset size)
    const scoredAll = state.chunks.map((c, idx) => {
      const hay = c.text.toLowerCase();

      let score = 0;

      // token substring hits
      for (const t of qTokens) {
        if (t && hay.includes(t)) score += 2;
      }

      // joined-form hits (handles no-space names)
      if (qJoined && hay.includes(qJoined)) score += 5;
      if (qJoinedNoSpaces && hay.replace(/[^a-z0-9]+/g, "").includes(qJoinedNoSpaces)) score += 5;

      return { idx, score };
    });

    scoredAll.sort((a, b) => (b.score - a.score) || (a.idx - b.idx));

    // keep only meaningful hits
    const best = scoredAll.filter((x) => x.score > 0).slice(0, topK);

    if (!best.length) {
      return { context: "", usedSources: [] as string[], hardCategory: hardCat };
    }

    candidates = best.map((b) => b.idx);
  }

  // ✅ Anchor requirement for tablet/signup questions (prevents "generic systems" hallucinations)
  if (hardCat === "systems") {
  const q = (query || "").toLowerCase();
  const wantsTablet = q.includes("tablet");
  const wantsSignup = q.includes("sign up") || q.includes("signup") || q.includes("sign-up");

  if (wantsTablet || wantsSignup) {
  candidates = candidates.filter((idx) => {
  const hay = (state.chunks[idx]?.text || "").toLowerCase();
  if (wantsTablet && !hay.includes("tablet")) return false;
  if (wantsSignup && !(hay.includes("sign up") || hay.includes("signup") || hay.includes("sign-up"))) return false;
  return true;
  });

  // Fail-closed: if we don't have the real doc yet, return no context.
  if (!candidates.length) {
    return { context: "", usedSources: [] as string[], hardCategory: hardCat };
  }

    }
  }

  // ✅ HARD GATING: for certain query types, only allow specific folders
  const allowed = hardAllowedPrefixes(hardCat);

  if (allowed && allowed.length) {
    const allowedLower = allowed.map((p) => p.toLowerCase());

    // IMPORTANT: gate the FINAL candidates (after pinning + fallback)
    candidates = candidates.filter((idx) => {
      const src = state.chunks[idx]?.source?.toLowerCase() ?? "";
      return allowedLower.some((p) => src.startsWith(p));
    });

    // Fail-closed: if this was a hard category but nothing matched, return no context.
    if (!candidates.length) {
       return { context: "", usedSources: [] as string[], hardCategory: hardCat };
    }
  }


  // Score by: token overlap + filename/path boost + folder priority boost
  const qSet = new Set(expandedTokens);

  let folderPriority =
  opts.folderPriority?.length
    ? opts.folderPriority
    : defaultFolderPriorityForRole(opts.role);

  const intent = ownerOnlyIntent(cleanQuery);

  // For owners only: if question is clearly owner-only (recruiting / owners meeting),
  // temporarily move "owners/" earlier (but NOT ahead of core/systems/rebuttals/charities)
  if ((opts.role ?? "rep") === "owner" && intent.shouldPrioritizeOwnersFolder) {
    folderPriority = [
      "core/",
      "systems/",
      "rebuttals/",
      "charities/",
      "owners/",
      "product_training/",
      "pdfs/",
      "motivation_stories/",
      "quotes/",
    ];
  }


  const scored = candidates.map((idx) => {
  const chunk = state.chunks[idx];
  const text = chunk.text;

  const toks = tokenize(text);

  // overlap score (your current behavior)
  let overlap = 0;
  for (const t of toks) if (qSet.has(t)) overlap++;

  // filename/path boost (your existing function)
  const fileBoost = filenameBoostScore(cleanQuery, chunk.source);

  // NEW: role-aware folder boost
  const folderBoost = folderBoostScore(chunk.source, opts.role, folderPriority);

  // Weighted total:
  // - overlap dominates
  // - fileBoost helps “obvious” doc picks
  // - folderBoost nudges results toward your desired hierarchy
  const score = overlap + fileBoost + folderBoost;

  return { idx, score, overlap, fileBoost, folderBoost, source: chunk.source };
});


scored.sort((a, b) =>
  (b.score - a.score) ||
  a.source.localeCompare(b.source) ||
  (a.idx - b.idx)
);



  console.log(
  "[RAG] candidates=",
  scored.length,
  " top=",
  scored.slice(0, Math.min(10, scored.length)).map((s) => ({
    score: s.score,
    overlap: s.overlap,
    fileBoost: s.fileBoost,
    folderBoost: s.folderBoost,
    source: s.source,
  }))
);


  // ---- Selection policy (prevents bloat + enables "full doc" pulls) ----
  const maxSources = Math.max(1, Math.min(12, opts.maxSources ?? 6));
  const maxChunksPerSource = Math.max(1, Math.min(20, opts.maxChunksPerSource ?? 3));


  // Add a strict folder-order “band” so priority beats raw overlap.
  // (Lower band index = earlier in your preferred structure.)
  const scoredWithBand = scored.map((s) => ({
    ...s,
    band: folderBandIndex(s.source, folderPriority),
  }));

  // Sort: folder band first, then total score
  scoredWithBand.sort((a, b) =>
  (a.band - b.band) ||
  (b.score - a.score) ||
  a.source.localeCompare(b.source) ||
  (a.idx - b.idx)
  );

  // ✅ ADD THIS RIGHT HERE (lookup map, avoids .find() nondeterminism + cost)
  const scoreByIdx = new Map<number, { score: number; band: number; source: string; fileBoost: number }>();
  for (const s of scoredWithBand) {
    if (!scoreByIdx.has(s.idx)) {
      scoreByIdx.set(s.idx, { score: s.score, band: s.band, source: s.source, fileBoost: s.fileBoost });
    }
  }

  // Group best chunks per source (so we can pick sources intentionally)
  const bestBySource = new Map<
    string,
    { source: string; bestScore: number; bestBand: number; chunks: number[]; bestFileBoost: number }
  >();


  for (const s of scoredWithBand) {
    const entry = bestBySource.get(s.source);
    if (!entry) {
      bestBySource.set(s.source, {
        source: s.source,
        bestScore: s.score,
        bestBand: s.band,
        chunks: [s.idx],
        bestFileBoost: s.fileBoost,
      });
    } else {
      entry.bestScore = Math.max(entry.bestScore, s.score);
      entry.bestBand = Math.min(entry.bestBand, s.band);
      entry.bestFileBoost = Math.max(entry.bestFileBoost, s.fileBoost);
      entry.chunks.push(s.idx);
    }
  }

  // Rank sources by: folder band first, then best score
  const rankedSources = Array.from(bestBySource.values()).sort((a, b) =>
  (a.bestBand - b.bestBand) ||
  (b.bestScore - a.bestScore) ||
  a.source.localeCompare(b.source)
  );


  // If the top source is VERY strongly indicated (filename boost), pull MORE from it and only it.
  // Threshold matters a lot: too low causes inconsistency (owners vs leaders).
  const topSource = rankedSources[0];

  // Stronger threshold to avoid false single-doc mode.
  // (Your 5-steps / manufactured conversation boost is 3.5, so it still triggers correctly.)
  const pinHintsForMode = detectPinnedSources(query);
  const singleDocMode =
    (!!topSource && topSource.bestFileBoost >= 3.0) ||
    pinHintsForMode.length > 0;


  const finalMaxSources = singleDocMode ? 1 : maxSources;
  const finalMaxChunksPerSource = singleDocMode ? 16 : maxChunksPerSource;

  // Build chosen chunks: pick top sources, then pull chunks from each source
  const chosen: Chunk[] = [];
  const usedSources: string[] = [];

    for (const src of rankedSources.slice(0, finalMaxSources)) {
    usedSources.push(src.source);

    // Sort that source's chunks by their score (best first)
      const chunkScores = src.chunks
      .map((idx) => {
        const sc = scoreByIdx.get(idx);
        return { idx, score: sc?.score ?? 0 };
      })
      .sort((a, b) => (b.score - a.score) || (a.idx - b.idx));

    // Take top chunks...
    const top = chunkScores.slice(0, finalMaxChunksPerSource);

    // ...then ALSO include neighbor chunks (idx-1, idx+1) from the same source,
    // because "short story" often lands in the next chunk.
    const want = new Set<number>();
    for (const t of top) {
      want.add(t.idx);
      want.add(t.idx - 1);
      want.add(t.idx + 1);
    }

    // Filter to same source only
    const sameSource = (i: number) => state.chunks[i]?.source === src.source;

    const expanded = Array.from(want)
      .filter((i) => i >= 0 && i < state.chunks.length)
      .filter((i) => sameSource(i))
      .map((idx) => {
        const sc = scoreByIdx.get(idx);
        return { idx, score: sc?.score ?? 0 };
      })
      // keep best first so context packing is sane (deterministic tie-break)
      .sort((a, b) => (b.score - a.score) || (a.idx - b.idx))
      // don’t exceed the cap
      .slice(0, finalMaxChunksPerSource);


    for (const t of expanded) {
      const c = state.chunks[t.idx];
      if (!c) continue;
      chosen.push(c);
    }
  }

  // Build context string, clamp size


  let context = "";
  for (const c of chosen) {
    const chunk = c.text.length > maxCharsPerChunk ? c.text.slice(0, maxCharsPerChunk) : c.text;
    const block = `SOURCE: ${c.source}\n${chunk}\n`;
    if ((context + "\n\n" + block).length > maxContextChars) break;
    context += (context ? "\n\n" : "") + block;
  }

  return { context, usedSources, hardCategory: hardCat };
}

// Optional warmup hook so /api/warmup can force indexing
export async function warmupRag() {
  getRagState();
  return true;
}
