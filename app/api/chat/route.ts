/*fundraise-coach/app/api/chat/route.ts*/
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { ragSearch, readKnowledgeDoc } from "./rag";
import fs from "fs";
import path from "path";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ClientMsg = {
  role: "user" | "assistant";
  content: string;
};

type CoachRole = "rep" | "leader" | "owner";

function normalizeRole(value: any): CoachRole {
  const v = String(value ?? "").toLowerCase().trim();
  if (v === "leader") return "leader";
  if (v === "owner") return "owner";
  return "rep";
}

function normalizeReply(text: string) {
  if (!text) return text;

  let out = text;
  out = out.replace(/\*\*(.+?)\*\*/g, "$1");
  out = out.replace(/__(.+?)__/g, "$1");
  out = out.replace(/`([^`]+)`/g, "$1");

  out = out.replace(/```[\s\S]*?```/g, (block) => {
    return block.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "");
  });

  out = out.replace(/[ \t]+\n/g, "\n").trim();
  return out;
}

function extractStandardCloseFromContext(text: string) {
  if (!text) return null;

  const lines = text
    .replace(/^\uFEFF/, "") // strip UTF-8 BOM if present
    .split("\n")
    .map((l) => l.replace(/\r/g, "").replace(/^\uFEFF/, "").trim());
  
  const lowerLines = lines.map((l) => l.toLowerCase());

  // Accept multiple real-world headers (your docs may not literally say "STANDARD CLOSE")
  const startMarkers = ["close:", "close", "standard close", "standard close:"];


  const stopMarkers = [
    "rebuttal usps",
    "rebuttal usp",
    "usps",
    "unique selling",
    "core rebuttals",
    "common rebuttals",
    "problem:",
    "solution:",
    "short story",
    "sources:",
  ];

  // Find the first line that looks like a close header
  let startIdx = -1;

  for (let i = 0; i < lowerLines.length; i++) {
    const l = lowerLines[i];
    // Exact-ish match: line starts with marker or equals marker
    if (
      startMarkers.some((m) => l === m || l.startsWith(m)) ||
      startMarkers.some((m) => l.replace(/[:\-–—]+$/g, "").trim() === m)
    ) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) return null;

  // Collect subsequent lines until stop marker or blank gap
  const collected: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const l = lines[i];
    const ll = lowerLines[i];

    if (!l) {
      // If we already collected something, a blank line ends the section
      if (collected.length) break;
      // If we haven't collected yet, skip leading blanks
      continue;
    }

    // Stop if next section begins
    if (stopMarkers.some((m) => ll.startsWith(m) || ll.includes(m))) break;

    // Skip pure “title-ish” lines
    if (
      /^charity\s+short\s+stories/i.test(l) ||
      /^charity\s+short\s+story/i.test(l) ||
      /^short\s+stories/i.test(l)
    ) {
      continue;
    }

    collected.push(l);

    // Don't let this run forever; closes are short
    if (collected.length >= 10) break;
  }

  const out = collected.join("\n").trim();
  return out.length ? out : null;
}

function extractSpokenCloseFromStandardCloseDoc(text: string) {
  if (!text) return null;

  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r/g, "");
  const lines = cleaned.split("\n").map((l) => l.trim());

  // Find the "STANDARD CLOSE" section start
  const startIdx = lines.findIndex((l) => l.toLowerCase() === "standard close");
  if (startIdx === -1) return null;

  // Stop at the next divider line (----) or end of file
  const out: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const l = lines[i];

    if (!l) {
      // keep at most one blank line
      if (out.length && out[out.length - 1] !== "") out.push("");
      continue;
    }

    // Stop at a divider or the next major header section
    if (l.startsWith("---")) break;
    const ll = l.toLowerCase();
    if (ll.startsWith("core close structure") || ll.startsWith("simple day") || ll.startsWith("key rules")) break;

    out.push(l);
  }

  const block = out.join("\n").trim();
  return block.length ? block : null;
}

function extractCoreCloseStructureBlock(text: string) {
  if (!text) return null;

  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r/g, "");
  const lines = cleaned.split("\n").map((l) => l.replace(/\r/g, ""));

  // Find the exact section header
  const startIdx = lines.findIndex((l) => {
  const t = l.trim().toLowerCase();
  return t.includes("core close structure") && t.includes("what to say");
  });

  if (startIdx === -1) return null;

  const out: string[] = [];

  for (let i = startIdx + 1; i < lines.length; i++) {
    const l = lines[i];

    // Stop ONLY when we hit a divider line
    const t = l.trim();

  if (t.startsWith("---")) break;

  if (!t) {
    if (out.length && out[out.length - 1] !== "") out.push("");
    continue;
  }

  // Keep the ORIGINAL line (not trimmed) so we don't lose unicode/spacing weirdness
  out.push(l);
  }

  const block = out.join("\n").replace(/[ \t]+\n/g, "\n").trim();
  return block.length ? block : null;
}



function appendOneFinalCloseQuestion(fullCloseBlock: string) {
  const raw = String(fullCloseBlock || "").trim();
  if (!raw) return raw;

  // Your required teaching close line (verbatim)
  const optionLine =
    '"Im sure I can count on your support!" or "Can we count on your support?"';

  // Remove any existing quoted-options line so we can re-add it cleanly at the end
  const withoutOldOption = raw
    .split("\n")
    .filter((l) => !/^".+"\s+or\s+".+"$/i.test(l.trim()))
    .join("\n")
    .trim();

  // Always end with the teaching option line
  return `${withoutOldOption}\n\n${optionLine}`;
}



function pickOneCloseLine(closeText: string) {
  const raw = String(closeText || "").trim();
  if (!raw) return raw;

  // Split by newlines and also handle " or " in the same line
  const parts = raw
    .split("\n")
    .flatMap((l) => l.split(/\s+or\s+/i))
    .map((s) => s.trim())
    .filter(Boolean);

  if (!parts.length) return raw;

  // Prefer the question form
  const question = parts.find((p) => p.includes("?"));
  if (question) return question;

  // Otherwise choose the shortest/cleanest option
  parts.sort((a, b) => a.length - b.length);
  return parts[0];
}

function parseCoreUspsByCharity(coreUspDoc: string) {
  const text = String(coreUspDoc || "").replace(/^\uFEFF/, "").replace(/\r/g, "");
  const lines = text.split("\n");

  const sections: Record<string, string[]> = {
    "ChildFund International (CFI)": [],
    "CARE": [],
    "Save the Children (STC)": [],
    "IFAW (International Fund for Animal Welfare)": [],
    "The Nature Conservancy (TNC)": [],
  };

  let current: keyof typeof sections | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) continue;
    if (line.startsWith("---")) break; // stop at divider
    if (line.toLowerCase().startsWith("important rule")) break;

    // Detect section headers
    if (/^childfund/i.test(line) || /\(cfi\)/i.test(line)) {
      current = "ChildFund International (CFI)";
      continue;
    }
    if (/^care\b/i.test(line)) {
      current = "CARE";
      continue;
    }
    if (/^save the children/i.test(line) || /\(stc\)/i.test(line)) {
      current = "Save the Children (STC)";
      continue;
    }
    if (/^ifaw/i.test(line)) {
      current = "IFAW (International Fund for Animal Welfare)";
      continue;
    }
    if (/^the nature conservancy/i.test(line) || /\(tnc\)/i.test(line)) {
      current = "The Nature Conservancy (TNC)";
      continue;
    }

    if (!current) continue;

    // Capture bullets (handles -"..." and normal - bullets)
    if (line.startsWith("-") || line.startsWith('-"') || line.startsWith("–") || line.startsWith("•")) {
      sections[current].push(line.replace(/^[-–•]\s?/, "").trim());
      continue;
    }

    // Continuation lines (indented wrap) append to last bullet
    if (sections[current].length) {
      sections[current][sections[current].length - 1] += " " + line;
    }
  }

  return sections;
}

function formatUspsByCharity(sections: Record<string, string[]>) {
  const order = [
    "ChildFund International (CFI)",
    "Save the Children (STC)",
    "CARE",
    "IFAW (International Fund for Animal Welfare)",
    "The Nature Conservancy (TNC)",
  ];

  const out: string[] = [];
  for (const key of order) {
    out.push(`${key}:`);
    const bullets = sections[key] || [];
    if (!bullets.length) {
      out.push("- Missing charity-specific USPs in training materials.");
    } else {
      for (const b of bullets) out.push(`- ${b}`);
    }
    out.push(""); // blank line between charities
  }

  return out.join("\n").trim();
}

function extractRebuttalSection(coreDoc: string, key: string) {
  const text = String(coreDoc || "").replace(/^\uFEFF/, "").replace(/\r/g, "");
  const lines = text.split("\n");

  // section headers in your doc look like:
  // "Online Rebuttal ("Can I just do this online?")"
  // We'll match by prefix.
  const targetPrefix = key.toLowerCase();

  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim().toLowerCase();
    if (l.startsWith(targetPrefix.toLowerCase())) {
      start = i;
      break;
    }
  }
  if (start === -1) return null;

  const out: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const raw = lines[i].replace(/\r/g, "");
    const t = raw.trim();

    // stop at next divider line
    if (i !== start && t.startsWith("---")) break;

    out.push(raw);
  }

  const block = out.join("\n").trim();
  return block.length ? block : null;
}


function enforcePitchClose(replyText: string, pinnedClose: string) {
  const text = String(replyText ?? "");
  const closeBlock = `CLOSE:\n${String(pinnedClose ?? "").trim()}\n`;

  const labels = ["PROBLEM:", "SOLUTION:", "CLOSE:", "REBUTTAL USPs:"];

  const lower = text.toLowerCase();

  function findLabelIndex(label: string) {
    const l = label.toLowerCase();
    // Prefer newline-boundary match, fallback to start-of-string match
    const idxNewline = lower.indexOf("\n" + l);
    if (idxNewline !== -1) return idxNewline + 1; // points to label start
    if (lower.startsWith(l)) return 0;
    return -1;
  }

  // Collect found labels + positions
  const found = labels
    .map((lab) => ({ lab, idx: findLabelIndex(lab) }))
    .filter((x) => x.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  const idxClose = findLabelIndex("CLOSE:");
  const idxSolution = findLabelIndex("SOLUTION:");

  // Helper: find end index of a section = next label start or end of text
  function sectionEnd(startIdx: number) {
    const next = found.find((x) => x.idx > startIdx);
    return next ? next.idx : text.length;
  }

  // Case 1: CLOSE exists → replace its contents, preserve everything else
  if (idxClose >= 0) {
    const end = sectionEnd(idxClose);
    const before = text.slice(0, idxClose);
    const after = text.slice(end);
    // Ensure spacing between CLOSE and next section
    const spacer = after.startsWith("\n") ? "\n" : "\n\n";
    return `${before}${closeBlock}${spacer}${after.trimStart()}`;
  }

  // Case 2: No CLOSE → insert it after SOLUTION section if possible
  if (idxSolution >= 0) {
    const end = sectionEnd(idxSolution);
    const before = text.slice(0, end).trimEnd();
    const after = text.slice(end).trimStart();
    const spacerAfter = after.length ? "\n\n" : "";
    return `${before}\n\n${closeBlock}${spacerAfter}${after}`;
  }

  // Case 3: Fallback → append CLOSE at end
  return `${text.trimEnd()}\n\n${closeBlock}`;
}



function toTranscript(msgs: ClientMsg[]) {
  return msgs
    .slice(-10)
    .map((m) => `${m.role === "user" ? "USER" : "COACH"}: ${String(m.content ?? "")}`)
    .join("\n");
}

function isPitchRequest(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("pitch") ||
    m.includes("pitch card") ||
    m.includes("elevator pitch") ||
    m.includes("script") ||
    m.includes("door pitch")
  );
}

/* --- USP ALL-CHARITIES MODE DETECTION --- */
function isAllCharitiesUSPRequest(message: string) {
  const m = message.toLowerCase();
  // high precision: user is explicitly asking for ALL charities USPs
  return (
    (m.includes("usp") || m.includes("unique selling")) &&
    (m.includes("all charities") || m.includes("every charity") || m.includes("each charity") || m.includes("all campaigns"))
  );
}

function isAllCharitiesRebuttalUSPRequest(message: string) {
  const m = message.toLowerCase();
  // explicit "rebuttal usps for all charities"
  return (
    (m.includes("rebuttal") && (m.includes("usp") || m.includes("unique selling"))) &&
    (m.includes("all charities") || m.includes("every charity") || m.includes("each charity") || m.includes("all campaigns"))
  );
}

function isCoreUspListRequest(message: string) {
  const m = message.toLowerCase();

  // user intent to list core/rebuttal usps
  const wantsUsps =
    m.includes("usp") ||
    m.includes("usps") ||
    m.includes("unique selling");

  const wantsCore =
    m.includes("core") ||
    m.includes("all") ||
    m.includes("rebuttal");

  // if they specify a charity, do NOT trigger this (let normal logic run)
  const mentionsSpecificCharity =
    m.includes("cfi") ||
    m.includes("childfund") ||
    m.includes("save the children") ||
    m.includes("stc") ||
    m.includes("care") ||
    m.includes("ifaw") ||
    m.includes("nature conservancy") ||
    m.includes("tnc");

  return wantsUsps && wantsCore && !mentionsSpecificCharity;
}

function detectRebuttalKey(message: string) {
  const m = message.toLowerCase();

  // map user intent to canonical section titles in the Core Rebuttals doc
  if (m.includes("one time") || m.includes("one-time") || m.includes("cash rebuttal")) return "One Time Rebuttal";
  if (m.includes("online rebuttal") || (m.includes("online") && m.includes("rebuttal"))) return "Online Rebuttal";
  if (m.includes("security rebuttal") || m.includes("security") || m.includes("details") || m.includes("information")) return "Security Rebuttal";
  if (m.includes("do enough") || m.includes("donate to other") || (m.includes("other charities") && m.includes("donate"))) return "Do Enough Rebuttal";
  if (m.includes("research rebuttal") || (m.includes("research") && m.includes("rebuttal"))) return "Research Rebuttal";
  if (m.includes("spouse rebuttal") || m.includes("talk to my spouse") || m.includes("my spouse")) return "Spouse Rebuttal";
  if (m.includes("corporate match") || m.includes("matching") || m.includes("employer matches")) return "Corporate Match Rebuttal";

  return null;
}


function isLongPitchRequest(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("long") ||
    m.includes("longer") ||
    m.includes("detailed") ||
    m.includes("expanded") ||
    m.includes("full") ||
    m.includes("high demo") ||
    m.includes("high-dem") ||
    m.includes("more formal") ||
    m.includes("more persuasive") ||
    m.includes("story") ||
    m.includes("long form") ||
    m.includes("long-form")
  );
}

function isShortAnswerRequest(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("tl;dr") ||
    m.includes("tldr") ||
    m.includes("short version") ||
    m.includes("quick version") ||
    m.includes("one-liner") ||
    (m.includes("summary") && (m.includes("short") || m.includes("quick")))
  );
}


/**
 * AIC detection: questions/objections that happen BEFORE the close.
 * We intentionally keep this high-precision so it doesn't steal "rebuttal" questions.
 */
function isAICRequest(message: string) {
  const m = message.toLowerCase();

  // If user explicitly says rebuttal, we do NOT treat it as AIC.
  if (m.includes("rebuttal")) return false;

  return (
    m.includes("aic") ||
    m.includes("answer impulse close") ||
    m.includes("before the close") ||
    m.includes("mid pitch") ||
    m.includes("middle of the pitch") ||
    m.includes("during the pitch") ||
    m.includes("they interrupted") ||
    m.includes("interrupted me") ||
    m.includes("interrupt") ||
    m.includes("before i close") ||
    m.includes("how do i answer") ||
    m.includes("what do i say when they ask") ||
    m.includes("they asked how much") ||
    m.includes("they asked what are you asking for") ||
    m.includes("they asked what is it") ||
    m.includes("they asked how does it work") ||
    m.includes("they asked is this online") ||
    m.includes("they asked what am i filling out") ||
    m.includes("they asked why are you here") ||
    m.includes("they asked what's going on") ||
    m.includes("short on time")
  );
}

function isAICExplainRequest(message: string) {
  const m = message.toLowerCase();

  // If they ask for an example/script, we do NOT treat it as "explain"
  if (
    m.includes("example") ||
    m.includes("script") ||
    m.includes("what do i say") ||
    m.includes("mid pitch") ||
    m.includes("during the pitch") ||
    m.includes("they asked") ||
    m.includes("interrupt")
  ) {
    return false;
  }

  return (
    m.includes("what is aic") ||
    m.includes("explain aic") ||
    m.includes("define aic") ||
    m.includes("what does aic mean") ||
    m.includes("how does aic work") ||
    (m.includes("aic") && m.includes("explain")) ||
    (m.includes("aic") && m.includes("meaning"))
  );
}

type CharityKey = "CFI" | "STC" | "CARE" | "IFAW" | "TNC" | null;

function detectCharity(message: string): CharityKey {
  const m = message.toLowerCase();
  if (m.includes("childfund") || m.includes("cfi")) return "CFI";
  if (m.includes("save the children") || m.includes("stc")) return "STC";
  if (m.includes("care")) return "CARE";
  if (m.includes("ifaw")) return "IFAW";
  if (m.includes("nature conservancy") || m.includes("tnc")) return "TNC";
  return null;
}

function charityLabel(key: CharityKey) {
  switch (key) {
    case "CFI":
      return "ChildFund International (CFI)";
    case "STC":
      return "Save the Children (STC)";
    case "CARE":
      return "CARE";
    case "IFAW":
      return "International Fund for Animal Welfare (IFAW)";
    case "TNC":
      return "The Nature Conservancy (TNC)";
    default:
      return "";
  }
}

function roleStyleSpec(role: CoachRole) {
  if (role === "owner") {
    return (
      "ROLE MODE: OWNER\n" +
      "- Frame answers as operations + KPI + scalability + training system design.\n" +
      "- Include practical metrics when relevant (conversion rate, contacts/hour, quality conversations, close rate, weekly revenue, retention).\n" +
      "- Focus on process, coaching loops, incentives, onboarding, and field execution.\n" +
      "- Keep it concise; no fluff.\n"
    );
  }
  if (role === "leader") {
    return (
      "ROLE MODE: LEADER\n" +
      "- Frame answers as coaching: how to teach this, drill it, and correct mistakes.\n" +
      "- Provide: what to listen for, what to say, and how to train reps (1–3 drill ideas).\n" +
      "- Keep it field-usable and direct.\n"
    );
  }
  return (
    "ROLE MODE: REP\n" +
    "- Default to short, practical 'what to say' lines.\n" +
    "- If asked for scripts, give concise word-for-word lines.\n"
  );
}

/**
 * KPI mode detection:
 * - KPI form sends messages starting with "KPIs"
 * - In chat, user can type "KPIs" to trigger analysis
 */
function isKPIRequest(message: string) {
  const m = message.trim().toLowerCase();
  if (m.startsWith("kpis")) return true;
  if (m.includes("\ncontacts:") && (m.includes("\npresentations:") || m.includes("\nshort stories:"))) return true;
  return false;
}

/**
 * COACH MODE detection (high precision):
 * Triggered when leaders/owners ask how to coach, teach, explain, drill, or correct reps.
 * This should NOT steal pitch/AIC/KPI/USP modes (we gate it later).
 */
function isCoachRequest(message: string) {
  const m = message.toLowerCase();

  // Strong coaching intent verbs / phrases
  const intent =
    m.includes("how do i coach") ||
    m.includes("how do i train") ||
    m.includes("how do i teach") ||
    m.includes("how do i explain") ||
    m.includes("how should i explain") ||
    m.includes("help me coach") ||
    m.includes("help me train") ||
    m.includes("help me teach") ||
    m.includes("help my team") ||
    m.includes("help my rep") ||
    m.includes("coach my") ||
    m.includes("train my") ||
    m.includes("teach my") ||
    m.includes("drill") ||
    m.includes("roleplay") ||
    m.includes("role play") ||
    m.includes("correction") ||
    m.includes("correct them") ||
    m.includes("what do i listen for") ||
    m.includes("what should i look for") ||
    m.includes("what should i say to my rep");

  // Reduce false positives: if they explicitly want a pitch/script for donors, it's not coach mode.
  const donorScript =
    m.includes("door pitch") ||
    m.includes("elevator pitch") ||
    (m.includes("pitch") && !m.includes("explain")) ||
    (m.includes("script") &&
      !m.includes("script i say to my rep") &&
      !m.includes("example"));


  if (donorScript) return false;

  return intent;
}


/**
 * KPI coaching spec: deterministic rules + output format.
 * IMPORTANT: This spec must NOT conflict with pitch/AIC rules.
 */
/*fundraise-coach/app/api/chat/route.ts*/
/*fundraise-coach/app/api/chat/route.ts*/
function kpiCoachingSpec() {
  return (
    "KPI COACHING MODE (Retention-First).\n" +
    "You are analyzing a field rep's KPIs for face-to-face fundraising.\n" +
    "This output should feel like the bottom of our KPI sheet: confidence-building, logical, and focused.\n\n" +

    "KPI ORDER (always interpret in this order):\n" +
    "1) Approaches (optional)\n" +
    "2) Contacts\n" +
    "3) Presentations / Short Stories\n" +
    "4) Closes\n" +
    "5) Signups\n\n" +

    "DAILY BENCHMARK RATIO (targets):\n" +
    "30 Contacts → 24 Presentations → 12 Closes → 1–4+ Signups\n\n" +

    "SIGNUP PERFORMANCE TIERS (use these exact meanings):\n" +
    "- 0 signups: tough day; acknowledge it honestly and shift to solutions.\n" +
    "- 1 signup: solid.\n" +
    "- 2 signups: solid day.\n" +
    "- 3 signups: good day.\n" +
    "- 4+ signups: great day.\n" +
    "- 6+ signups: absolutely amazing.\n" +
    "- 10+ signups: legendary.\n\n" +

    "TONE RULES:\n" +
    "- If signups are 2+ your tone must be upbeat and congratulatory.\n" +
    "- If signups are 0: do NOT sugar coat. Acknowledge it’s a tough day, then calmly diagnose and give solutions.\n" +
    "- Never shame the rep or attach identity to the numbers.\n\n" +

    "COACHING INTERPRETATION RULES (must follow):\n" +
    "1) LOW CONTACTS (goal ~25–30/day): ISH/volume/visibility problem (not enough at-bats).\n" +
    "   - Work on intros/ISH quality, volume, excitement, and loud body language to be seen.\n" +
    "   - This is where 'law of averages' coaching belongs.\n\n" +

    "2) HIGH CONTACTS but LOW PRESENTATIONS: NOT an ISH problem.\n" +
    "   - ISH already worked because people stopped.\n" +
    "   - This points to retention at the table: welcoming presence, confidence, not awkward/anxious,\n" +
    "     better rapport, punctual engagement when someone stops, smoother transition into short story.\n\n" +

    "3) PRESENTATIONS are decent/high but LOW CLOSES:\n" +
    "   - Short story isn’t building enough impulse OR rapport timing is off OR weak bridge into the close.\n\n" +

    "4) VERY HIGH CLOSES relative to signups can be a red flag:\n" +
    "   - Closing the wrong people, not prequalifying, rushing, not listening, rapid firing.\n" +
    "   - Coaching: slow down, prequalify, listen for buying signals, disqualify earlier.\n\n" +

    "5) NEAR-TARGET ratios but LOW SIGNUPS:\n" +
    "   - Pitch doctoring needed: AIC/rebuttals/confidence/senior coaching.\n\n" +

    "ZERO SIGNUP DAY STANDARD:\n" +
    "- Acknowledge it: 'Zero is a tough day — no one likes that.'\n" +
    "- Diagnose using KPI ratios (volume vs retention vs impulse vs prequalifying).\n" +
    "- IMPORTANT DECISION RULE:\n" +
    "  - If Contacts are LOW (<25): focus can be volume/ISH/law of averages.\n" +
    "  - If Contacts are GOOD (>=25): do NOT recommend 'more contacts' as a primary focus.\n" +
    "    This is a conversion problem → recommend pitch doctoring / senior leader coaching and conversion drills (AIC, rebuttals, close transition, prequalifying).\n" +
    "- Give 1–2 drills for tomorrow.\n\n"+
    "LIMITED FOCUS RULE (retention-first):\n" +
    "- Do NOT give a long list of fixes.\n" +
    "- Provide only 1–2 focus items total.\n" +
    "- Too many corrections kills confidence.\n\n" +

    "INPUTS YOU MAY RECEIVE:\n" +
    "- Notes\n" +
    "- '3 Things I did well'\n" +
    "- '3 Things I will improve'\n\n" +

    "OUTPUT FORMAT (use EXACTLY these sections, plain text, no markdown):\n" +
    "RESULT SUMMARY:\n" +
    "- 1–3 lines. Include the signup tier label (tough/solid/good/great/amazing/legendary).\n\n" +

    "REP SELF-REFLECTION (3 Wins + 3 Improves):\n" +
    "- Acknowledge and validate the rep’s wins.\n" +
    "- Acknowledge what the rep believes they need to work on.\n" +
    "- Offer guidance on WHERE to improve (not priority): senior leader coaching, library docs, product knowledge, or specific systems.\n" +
    "- Do NOT let these self-identified improvements determine focus items.\n" +
    "- If the rep did not provide wins/improves, ask them to fill them out next time.\n\n" +

    "LEADER REMINDER (What KPIs mean + targets):\n" +
    "- 3–6 bullets max.\n" +
    "- Include the benchmark ratio and why it protects attitude (law of averages / sports stats).\n\n" +

    "TOP 1–2 FOCUS ITEMS:\n" +
    "- Choose focus items ONLY from KPI math and ratios.\n" +
    "- If Signups = 0 AND Contacts >= 25, at least one focus item MUST be pitch doctor / senior leader coaching (conversion work).\n" +
    "- Focus items should address the true bottleneck: volume, retention, impulse, prequalifying, or closing.\n" +
    "- DO NOT base focus items on the rep’s self-identified improvements.\n" +

    "END-OF-DAY REFLECTION (Tonight):\n" +
    "- 1–2 lines only.\n" +
    "- Reflection/practice/review only (no performance directives).\n\n" +

    "WHAT TO WORK ON TOMORROW:\n" +
    "- 1–2 concrete actions only.\n" +
    "- Must be field-execution actions tied to KPI math/ratios.\n\n" +

    "IMPORTANT:\n" +
    "- If signups are 2+ you MUST start with a congrats tone.\n" +
    "- If signups are 0 you MUST acknowledge a tough day without sugarcoating.\n" +
    "- The 'Tonight' section is reflection only (no 'go get more contacts today' language).\n" +
    "- The 'Tomorrow' section is the only place performance actions belong.\n" +
    "- Keep it short, practical, and confidence-building.\n"
  );
}

type RebuttalFileKey =
  | "Online Rebuttal.txt"
  | "Security Rebuttal.txt"
  | "Research Rebuttal.txt"
  | "Spouse Rebuttal.txt"
  | "Corporate Match.txt"
  | "One Time Cash Rebuttal.txt"
  | "Do Enough or Donate to Other Charities.txt"
  | null;

function detectRebuttalFile(message: string): RebuttalFileKey {
  const m = message.toLowerCase();

  // Require rebuttal intent so keywords alone don't misfire
  const hasRebuttalIntent = m.includes("rebuttal") || m.includes("objection");
  if (!hasRebuttalIntent) return null;

  if (m.includes("online")) return "Online Rebuttal.txt";
  if (m.includes("security") || m.includes("details") || m.includes("information"))
    return "Security Rebuttal.txt";
  if (m.includes("research")) return "Research Rebuttal.txt";
  if (m.includes("spouse") || m.includes("wife") || m.includes("husband"))
    return "Spouse Rebuttal.txt";
  if (m.includes("corporate") || m.includes("match"))
    return "Corporate Match.txt";
  if (m.includes("one time") || m.includes("one-time") || m.includes("cash"))
    return "One Time Cash Rebuttal.txt";
  if (
    m.includes("do enough") ||
    m.includes("donate to other") ||
    m.includes("other charities")
  ) {
    return "Do Enough or Donate to Other Charities.txt";
  }

  return null;
}

function isRebuttalRequest(message: string) {
  const m = message.toLowerCase();
  return m.includes("rebuttal") || m.includes("objection");
}

function getCoreUspsForCharity(coreUspDoc: string, charity: string): string[] {
  const lines = coreUspDoc
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const results: string[] = [];
  let capture = false;

  for (const line of lines) {
    // Header match (e.g. "CARE:", "IFAW:", etc.)
    if (line.toLowerCase().startsWith(charity.toLowerCase() + ":")) {
      capture = true;
      continue;
    }

    // Stop when we hit another section header
    if (capture && line.endsWith(":")) break;

    if (capture) {
      results.push(line.replace(/^[-•]/, "").trim());
    }
  }

  return results;
}

function isMorningMeetingRequest(message: string) {
  const m = message.toLowerCase();
  return m.includes("morning meeting") || m.includes("crew meeting");
}

function isLeadersMeetingRequest(message: string) {
  const m = message.toLowerCase();
  return m.includes("leaders meeting") || m.includes("leadership meeting");
}

function isSalesImpactRequest(message: string) {
  const m = message.toLowerCase();
  return m.includes("sales impact");
}

function listTxtFilesUnderKnowledge(relDir: string) {
  const root = path.join(process.cwd(), "knowledge");
  const dir = path.join(root, relDir);

  if (!fs.existsSync(dir)) return [];

  const out: string[] = [];
  const walk = (abs: string, baseRel: string) => {
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(abs, ent.name);
      const rel = path.join(baseRel, ent.name).replaceAll("\\", "/");
      if (ent.isDirectory()) walk(full, rel);
      else if (ent.isFile() && ent.name.toLowerCase().endsWith(".txt")) out.push(rel);
    }
  };

  walk(dir, relDir);
  return out;
}

function pickOne<T>(arr: T[]) {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectPdfDocRequest(message: string, recentTranscript: string) {
  const m = (message || "").toLowerCase();
  const t = (recentTranscript || "").toLowerCase();
  const all = `${m}\n${t}`;

  const wantsPdf =
    all.includes("pdf") ||
    all.includes("open") ||
    all.includes("show me") ||
    all.includes("pull up") ||
    all.includes("document") ||
    all.includes("file");

  const wantsCod =
    all.includes("code of development") ||
    /\bcod\b/.test(all);

  if (!wantsPdf || !wantsCod) return null;

  // Specific variants
  const wantsLeaderCod =
    all.includes("becoming a leader") ||
    all.includes("leader cod") ||
    (all.includes("leader") && all.includes("code of development"));

  const wantsFirstWeek =
    all.includes("first week") ||
    all.includes("week 1") ||
    all.includes("fr first week");

  // Default behavior:
  // - If they asked leader COD or "becoming a leader" => COD-3
  // - Otherwise COD-2
  if (wantsLeaderCod) return "pdfs/cod-becoming-a-leader.pdf";
  if (wantsFirstWeek) return "pdfs/cod-first-week.pdf";
  return "pdfs/cod-first-week.pdf";
}

function pdfExists(relPath: string) {
  try {
    const full = path.join(process.cwd(), "knowledge", relPath);
    return fs.existsSync(full);
  } catch {
    return false;
  }
}


export async function POST(req: Request) {
  const __t0 = Date.now();
  const __mark = (label: string) => {
    const ms = Date.now() - __t0;
    console.log(`[CHAT PERF] ${label} @ ${ms}ms`);
  };

  __mark("POST start");

  try {
    const body = await req.json();
        __mark("parsed req.json");

    const message = String(body?.message ?? "").trim();
    const messages = Array.isArray(body?.messages) ? (body.messages as ClientMsg[]) : [];
    const role = normalizeRole(body?.role);

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const recentTranscript = messages.length ? toTranscript(messages) : "";

    // --- PDF LINK MODE (Deterministic) ---
    // If user asks for Code of Development PDF, return the Open token directly.
    // This bypasses the model so it never says "I can't open it".
    const codPdf = detectPdfDocRequest(message, recentTranscript);

    if (codPdf) {
      if (!pdfExists(codPdf)) {
        return NextResponse.json({
          reply:
            "I found a Code of Development PDF request, but the PDF file was not found in knowledge/" +
            codPdf +
            ". Please confirm the filename in knowledge/pdfs.",
          sources: [],
          meta: { role, mode: "PDF LINK (Deterministic)", requested: codPdf, found: false },
        });
      }

      return NextResponse.json({
        reply:
          "Sure — open it here:\n" +
          `[Open: ${codPdf}]`,
        sources: [codPdf],
        meta: { role, mode: "PDF LINK (Deterministic)", requested: codPdf, found: true },
      });
    }


    const charity = detectCharity(message);

    // USP aggregate modes (must run before other modes)
    const uspAllMode = isAllCharitiesUSPRequest(message);
    const rebuttalUspAllMode = isAllCharitiesRebuttalUSPRequest(message);

    // KPI mode (must be checked early)
    const kpiMode = isKPIRequest(message);

    // Coach Mode (structured coaching help for leaders/owners)
    const coachMode =
      (role === "leader" || role === "owner") &&
      !uspAllMode &&
      !rebuttalUspAllMode &&
      !kpiMode &&
      isCoachRequest(message);


    // AIC must be detected BEFORE pitchMode, because the word "pitch" appears in AIC questions.
    const aicMode = !kpiMode && !uspAllMode && !rebuttalUspAllMode && isAICRequest(message);
    const aicExplainMode = aicMode && isAICExplainRequest(message);
    const aicScriptMode = aicMode && !aicExplainMode;

    // If AIC is active, we do NOT want pitchMode to trigger.
    const pitchMode = !kpiMode && !uspAllMode && !rebuttalUspAllMode && !aicMode && isPitchRequest(message);
    const longPitchMode = pitchMode && isLongPitchRequest(message);

        // ---- Deterministic Meeting Modes (quick v1) ----

    // 1) Morning Meeting = pull a random story from knowledge/motivation_stories
    if (isMorningMeetingRequest(message)) {
      const files = listTxtFilesUnderKnowledge("motivation_stories");
      const picked = pickOne(files);

      if (!picked) {
        return NextResponse.json({
          reply: "No motivation stories found in knowledge/motivation_stories.",
          sources: [],
          meta: { role, mode: "MORNING MEETING (Deterministic)" },
        });
      }

      const story = await readKnowledgeDoc(picked);

      return NextResponse.json({
        reply:
          "MORNING MEETING STORY:\n" +
          (story?.trim() || "(Story file was empty)") +
          "\n\nFOLLOW-UP QUESTION (ask the crew):\n" +
          "What does this mean for how we show up today — with our energy, our consistency, and our standards?",
        sources: [picked],
        meta: { role, mode: "MORNING MEETING (Deterministic)", picked },
      });
    }

    // 2) Leaders Meeting = pull coaching docs (sample a few) and let model build an agenda
    if (isLeadersMeetingRequest(message)) {
      const files = listTxtFilesUnderKnowledge("coaching");
      const sample = files.slice(0, 6); // quick v1: first 6 files

      const chunks: string[] = [];
      for (const f of sample) {
        const txt = await readKnowledgeDoc(f);
        if (txt?.trim()) chunks.push(`SOURCE: ${f}\n${txt.trim()}`);
      }

      return NextResponse.json({
        reply:
          "LEADERS MEETING MODE (v1):\n" +
          "Ask a specific leadership topic (ex: coaching low presentations, accountability, confidence, recruiting, retention), or say: 'Build me a leaders meeting agenda.'\n\n" +
          "Loaded coaching sources:\n" +
          sample.map((s) => `- ${s}`).join("\n"),
        sources: sample,
        meta: { role, mode: "LEADERS MEETING (Deterministic)", loaded: sample.length },
      });
    }

    // 3) Sales Impact = treat as sales systems (systems docs) and let model craft a 5–10 min teaching
    if (isSalesImpactRequest(message)) {
      const files = listTxtFilesUnderKnowledge("systems");
      const sample = files.slice(0, 8); // quick v1: first 8 files

      return NextResponse.json({
        reply:
          "SALES IMPACT MODE (v1):\n" +
          "Tell me which system to teach (ex: ISH/Intro, Short Story, AIC, Rebuttals, Close, KPI framework), or say: 'Give me a full sales impact for today.'\n\n" +
          "Loaded systems sources:\n" +
          sample.map((s) => `- ${s}`).join("\n"),
        sources: sample,
        meta: { role, mode: "SALES IMPACT (Deterministic)", loaded: sample.length },
      });
    }


    // Deterministic: list Core/Rebuttal USPs (all, complete) without model summarization
    const coreUspListMode = isCoreUspListRequest(message);

      if (coreUspListMode) {
      const coreDoc = await readKnowledgeDoc("rebuttals/Core USPs.txt");
      if (!coreDoc) {
        return NextResponse.json({
          reply: "Core USPs doc is missing from training materials: rebuttals/Core USPs.txt",
          sources: [],
          meta: { role, coreUspListMode: true },
        });
      }

      const sections = parseCoreUspsByCharity(coreDoc);
      const reply = formatUspsByCharity(sections);

      return NextResponse.json({
        reply,
        sources: ["rebuttals/Core USPs.txt"],
        meta: { role, coreUspListMode: true },
      });
    }


    // Deterministic: load rebuttal file verbatim (prevents mixing & wrong rebuttals)
    const rebuttalFile = detectRebuttalFile(message);
    console.log("[REBUTTAL FILE MODE]", { rebuttalFile, message });


    if (rebuttalFile && isRebuttalRequest(message)) {
      const rebuttalDoc = await readKnowledgeDoc(`rebuttals/${rebuttalFile}`);
      if (!rebuttalDoc) {
        return NextResponse.json({
          reply: `Rebuttal file missing from training materials: rebuttals/${rebuttalFile}`,
          sources: [],
          meta: { role, mode: "REBUTTAL FILE (Deterministic)", rebuttalFile },
        });
      }

      // Optional: if user specifies a charity, append the USPs to plug into Re-Impulse
      const charityForUsps = detectCharity(message);

      let reply = rebuttalDoc.trim();

      if (charityForUsps) {
        const coreUspDoc = await readKnowledgeDoc("rebuttals/Core USPs.txt");
        const usps = coreUspDoc ? getCoreUspsForCharity(coreUspDoc, charityForUsps) : [];

        reply +=
          "\n\nUSPs to plug into Re-Impulse (use these exactly; do not invent):\n" +
          (usps.length ? usps.map((u) => `- ${u}`).join("\n") : "- Missing charity-specific USPs in training materials.");
      }

      return NextResponse.json({
        reply,
        sources: [`rebuttals/${rebuttalFile}`].concat(charityForUsps ? ["rebuttals/Core USPs.txt"] : []),
        meta: { role, mode: "REBUTTAL FILE (Deterministic)", rebuttalFile, charityDetected: charityForUsps },
      });
    }
  


    // --------- RAG QUERY (ONE SINGLE CALL) ----------
    // Default: use the user's message, plus charity hints if present.
    const baseQuery = charity
      ? `${message}\n\nCharity: ${charityLabel(charity)}\n(short story problem solution standard close)\n(CORE USPs / Unique Selling Points / rebuttal USPs for this charity)`
      : message;

    const needsRebuttalHelp =
      message.toLowerCase().includes("rebuttal") ||
      message.toLowerCase().includes("usp") ||
      message.toLowerCase().includes("unique selling") ||
      message.toLowerCase().includes("do enough") ||
      message.toLowerCase().includes("donate to other charities");

    // If AIC is requested, force retrieval toward the AIC doc.
    const aicHint = aicMode
      ? "\n\nAnswer Impulse Close (AIC) Core Objection Handling System. Direct questions deserve direct answers. Problem, Solution, Dollar Amount, Method. AIC happens before the close."
      : "";

    const rebuttalHint = needsRebuttalHelp
      ? "\n\nLook in CORE REBUTTALS and CORE USPs / Unique Selling Points. Use charity-specific USPs. Do not invent."
      : "";

    // KPI hint: we don't need deep RAG; keep it small, but allow "KPI framework" docs later.
    const kpiHint = kpiMode
      ? "\n\nKPI coaching analysis. Use KPI Framework. Benchmark ratio 30-24-12-1 to 4+. KPIs as sports stats; law of averages; coaching bottleneck rules."
      : "";

    // Important: We keep ONE ragSearch call. We just add hints.
    const ragTopK = (uspAllMode || rebuttalUspAllMode) ? 22 : 14;
    __mark("before ragSearch");
    const { context, usedSources, hardCategory, verbatim } = await ragSearch(
      baseQuery + rebuttalHint + aicHint + kpiHint,
      { topK: ragTopK, role }
    );

    __mark("after ragSearch");

    // --- VERBATIM DOC MODE (Deterministic) ---
    // If rag.ts flags this as "verbatim", we return the underlying doc text directly.
    // No model call. No paraphrasing. No hallucinations.
    if (verbatim) {
      // We expect usedSources to be the tablet signup doc (hard-gated in rag.ts).
      const paths = Array.from(new Set(usedSources)).filter(Boolean);

      if (!paths.length) {
        return NextResponse.json({
          reply:
            "Tablet Signup Process doc was not retrieved. If the file exists, check that its name contains 'tablet' and 'signup' and lives under knowledge/core/.",
          sources: [],
          meta: { role, mode: "VERBATIM DOC (Deterministic)", hardCategory, found: false },
        });
      }

      const parts: string[] = [];
      for (const p of paths) {
        const txt = await readKnowledgeDoc(p);
        if (txt?.trim()) parts.push(txt.trim());
      }

      if (!parts.length) {
        return NextResponse.json({
          reply:
            "Tablet Signup Process doc was retrieved but appears empty/unreadable. Check the .txt file in knowledge/core/.",
          sources: paths,
          meta: { role, mode: "VERBATIM DOC (Deterministic)", hardCategory, found: false },
        });
      }

      return NextResponse.json({
        reply: parts.join("\n\n"),
        sources: paths,
        meta: { role, mode: "VERBATIM DOC (Deterministic)", hardCategory, found: true },
      });
      }


    // If we are generating a pitch, we MUST pin the Standard Close from context (verbatim).
        // If we are generating a pitch, we MUST pin the Standard Close from the *actual* Standard Close doc (verbatim).
    let pinnedStandardClose: string | null = null;

    if (pitchMode) {
            // Canonical Standard Close lives in core/standard-close.txt
      const closeDoc = await readKnowledgeDoc("core/standard-close.txt");

      // Extract close lines from that canonical doc
      const extracted = closeDoc ? extractCoreCloseStructureBlock(closeDoc) : null;
      console.log("[PINNED CLOSE extracted]\n" + extracted);
      pinnedStandardClose = extracted ? appendOneFinalCloseQuestion(extracted) : null;
      console.log("[PINNED CLOSE final]\n" + pinnedStandardClose);


      if (!pinnedStandardClose) {
        return NextResponse.json({
          reply:
           "Missing STANDARD CLOSE. Please add the canonical close doc at: knowledge/core/standard-close.txt " +
           "and include a clear header like 'CLOSE:' followed by the exact close lines.",
          sources: usedSources,
          meta: {
            role,
            hardCategory,
            coachMode,
            kpiMode,
            pitchMode,
            longPitchMode,
            aicMode,
            charityDetected: charity,
            uspAllMode,
            rebuttalUspAllMode,
            historyIncluded: messages.length > 0,
            // debug:
            closeSourceTried: "core/standard-close.txt",
            closeDocLoaded: Boolean(closeDoc),
          },
        });
      }

    }

    // -----------------------------------------------

    const systemBase =
      "You are a helpful, motivating fundraising coach for face-to-face sales teams. " +
      "Use the provided CONTEXT to answer questions about our systems, rebuttals, charity pitches, and training. " +
      "If the answer is not in the context, say you don't have it in the training materials yet and ask what doc to add. " +
      "DEFAULT ANSWER DEPTH:\n" +
      "- By default, give a comprehensive breakdown of what is in CONTEXT.\n" +
      "- Do NOT give a short summary unless the user explicitly asks for: 'short', 'tl;dr', 'summary', 'quick version', or 'one-liner'.\n" +
      "- If the question is about a specific topic (ex: recruiting tips), extract and list ALL relevant points you can find in CONTEXT.\n" +
      "- Prefer bullet points and grouped sections when the source has multiple ideas.\n" +
      "- If multiple sources contain relevant items, merge them, but do not invent.\n" +
      "- If something is only partially in CONTEXT, answer what you have and say what’s missing.\n\n" +
      "IMPORTANT: Do not use markdown formatting (no **bold**, no backticks, no headings). Use plain text only. " +
      "IMPORTANT REBUTTAL RULE: If a rebuttal exists in Core Rebuttals training materials, you MUST provide it even if it is not charity-specific. " +
      "Do not say a rebuttal is missing if it exists in Core Rebuttals. Only ask to add a document if it truly does not appear in training. " +
      "\n\n" +
      "IMPORTANT — REBUTTAL USP RULE:\n" +
      "- When answering a rebuttal, if a USP is referenced, implied, or used, it MUST be pulled explicitly from the charity-specific USP text present in CONTEXT.\n" +
      "- NEVER infer, summarize, generalize, or substitute a USP.\n" +
      "- Core USPs may ONLY be used if no charity-specific USP exists in the retrieved CONTEXT.\n" +
      "- If no relevant USP is present in the retrieved CONTEXT, say exactly: 'This USP is not listed in the training materials.'\n" +
      "\n\n" +
      "IMPORTANT — AIC RULE:\n" +
      "- Answer Impulse Close (AIC) is NOT a rebuttal.\n" +
      "- Use AIC ONLY when the question/objection happens BEFORE the close or interrupts the pitch.\n" +
      "- Direct questions deserve direct answers. Never deflect.\n" +
      "- In AIC, cover the needed items in this order when applicable: Problem → Solution → Dollar Amount → Method.\n" +
      "- After answering the interruption, guide the flow back toward the close.\n" +
      "- Do NOT use rebuttal language during AIC responses.\n";

    const systemWithRole = systemBase + "\n" + roleStyleSpec(role) + "\n";

    const pitchSpecShort =
      "The user is asking for a pitch. Follow OUR FIELD FORMAT EXACTLY.\n" +
      "DO NOT include an OPENER.\n" +
      "DO NOT include an ASK/TRANSITION section.\n" +
      "DO NOT include COMMON REBUTTALS.\n\n" +
      "Output MUST be exactly these sections in this order, using plain text labels:\n" +
      "PROBLEM:\n" +
      "- (short story problem lines from training materials; keep it tight)\n\n" +
      "SOLUTION:\n" +
      "- (short story solution lines from training materials)\n" +
      "- Include the embedded transition question: 'Sounds amazing, right?' (or the charity’s equivalent)\n\n" +
      "CLOSE:\n" +
      "- Use ONLY the STANDARD CLOSE language exactly as written in training materials.\n" +
      "- Do NOT paraphrase the close.\n" +
      "- Do NOT say phrases like 'commit for a year', or similar.\n" +
      "- If the standard close is not found in CONTEXT, say exactly which file is missing.\n\n" +
      "REBUTTAL USPs:\n" +
      "- Bullet only.\n" +
      "- These MUST be the charity-specific USPs from the training materials.\n" +
      "- Do NOT invent USPs.\n" +
      "- If the charity-specific USPs are not found in CONTEXT, say: 'Missing charity-specific USPs in training materials' and name the file to add.\n\n" +
      "If a charity is named, you MUST use the charity's short story lines from the CONTEXT and NOT paraphrase them. " +
      "If the charity short story is missing from context, say exactly which file to add.";
    
    const uspAllCharitiesSpec =
    "The user is asking for USPs for ALL charities.\n" +
    "You MUST output a charity-by-charity list using ONLY what appears in CONTEXT.\n" +
    "Do NOT invent, infer, generalize, or combine USPs.\n\n" +
    "OUTPUT FORMAT (plain text, no markdown):\n" +
    "CFI (ChildFund International):\n" +
    "- (bullets)\n" +
    "STC (Save the Children):\n" +
    "- (bullets)\n" +
    "CARE:\n" +
    "- (bullets)\n" +
    "IFAW:\n" +
    "- (bullets)\n" +
    "TNC (The Nature Conservancy):\n" +
    "- (bullets)\n\n" +
    "RULES:\n" +
    "- Prefer charity-specific USPs if present in CONTEXT.\n" +
    "- If charity-specific USPs for a charity are NOT present in CONTEXT, you may fall back to CORE USPs ONLY if they are explicitly labeled as applicable.\n" +
    "- If neither charity-specific nor applicable CORE USPs are present for that charity, say exactly: 'Missing charity-specific USPs in training materials.'\n";

    const rebuttalUspAllCharitiesSpec =
    "The user is asking for rebuttal USPs for ALL charities.\n" +
    "You MUST output a charity-by-charity list using ONLY what appears in CONTEXT.\n" +
    "Do NOT invent.\n\n" +
    "OUTPUT FORMAT (plain text, no markdown):\n" +
    "CFI:\n- (bullets)\n" +
    "STC:\n- (bullets)\n" +
    "CARE:\n- (bullets)\n" +
    "IFAW:\n- (bullets)\n" +
    "TNC:\n- (bullets)\n\n" +
    "RULES:\n" +
    "- Use charity-specific rebuttal USPs if present.\n" +
    "- If missing for a charity, say exactly: 'Missing charity-specific USPs in training materials.'\n";
  

    const pitchSpecLong =
      "The user wants a longer version, but still follow OUR FIELD FORMAT EXACTLY.\n" +
      "Same rules: NO OPENER, NO ASK/TRANSITION section, NO COMMON REBUTTALS.\n" +
      "You may add 1–2 extra clarifying bullets in PROBLEM and SOLUTION, but keep it field-usable and not academic.\n" +
      "Still use ONLY the STANDARD CLOSE language exactly as written in training materials. Do NOT paraphrase.\n" +
      "REBUTTAL USPs must be charity-specific from training materials. Do NOT invent.";

    const aicExplainSpec =
      "Explain AIC (Answer Impulse Close) briefly and clearly.\n" +
      "Keep it short and practical. No long lecture.\n\n" +
      "Definition:\n" +
      "- AIC is used when someone asks a question or raises an objection BEFORE you reach the close (mid-pitch).\n" +
      "- Rebuttals are objections AFTER the close.\n\n" +
      "AIC checklist:\n" +
      "- Problem\n" +
      "- Solution\n" +
      "- Dollar Amount\n" +
      "- Method (online + ongoing)\n\n" +
      "Rule:\n" +
      "- Direct questions deserve direct answers. Never deflect.";

    const aicScriptSpec =
      "The user is asking for an AIC example/script.\n" +
      "DO NOT explain AIC as a concept.\n" +
      "DO NOT invent any charity facts.\n\n" +
      "OUTPUT ONLY THIS (plain text, no extra sections):\n" +
      "SCRIPT (what to say, word-for-word):\n" +
      "- 4–8 short lines total\n" +
      "- Must cover: Direct Answer → Bridge → Problem → Solution → Dollar Amount → Method → Close\n" +
      "- The bridge line must contain exactly: 'The reason we’re doing this is because…'\n" +
      "- Dollar amount must be exactly: '$1 a day for as long as you can.'\n" +
      "- Method must be exactly: 'It’s a quick 2-minute online charity form, and it’s ongoing.'\n" +
      "- Close must be quoted from the STANDARD CLOSE lines in CONTEXT. Do NOT paraphrase.\n";
        
    const coachSpec =
      "COACH MODE (Structured).\n" +
      "You are coaching a leader/owner on how to teach or correct a field rep.\n" +
      "Use the provided CONTEXT only. Be practical, direct, and field-usable.\n" +
      "Do not use markdown. Plain text only.\n\n" +
      "OUTPUT FORMAT (use EXACTLY these sections, in this exact order):\n" +
      "COACHING GOAL:\n" +
      "- 1–2 lines: what we are improving or fixing.\n\n" +
      "HOW TO EXPLAIN IT (Say it like this):\n" +
      "- Give word-for-word leader language (4–8 short lines).\n\n" +
      "WHY THIS MATTERS:\n" +
      "- 2–4 short bullets: cause → effect (no hype).\n\n" +
      "WHAT TO LISTEN FOR:\n" +
      "- 3–6 bullets: signals the rep understands vs is confused.\n\n" +
      "COMMON MISTAKE:\n" +
      "- 1–3 bullets: the usual misinterpretation.\n\n" +
      "CORRECTIVE DRILL:\n" +
      "- 1–2 drills only.\n" +
      "- Each drill must be concrete: setup + reps + success criteria.\n\n" +
      "OPTIONAL DONOR SCRIPT EXAMPLE (ONLY if helpful):\n" +
      "- This section is OPTIONAL.\n" +
      "- Include ONLY if the leader explicitly asks for an example of what a rep might say.\n" +
      "- Label it clearly as: 'Donor Script Example (for training only)'.\n" +
      "- Keep it short (3–6 lines).\n" +
      "- This is NOT a pitch request; it is a teaching example.\n\n" +
      "RULES:\n" +
      "- Coaching explanations always come first.\n" +
      "- Donor-facing language is allowed ONLY as a labeled example for teaching.\n" +
      "- Never confuse coaching explanation with donor pitch delivery.\n" +
      "- If the answer is not in CONTEXT, say: 'This is not in the training materials yet.' and name what doc to add.\n" +
      "- Keep it short. Do not ramble.\n";


    const kpiSpec = kpiCoachingSpec();

    const systemContent = uspAllMode
      ? `${systemWithRole}\n\n${uspAllCharitiesSpec}`
      : rebuttalUspAllMode
      ? `${systemWithRole}\n\n${rebuttalUspAllCharitiesSpec}`
      : kpiMode
      ? `${systemWithRole}\n\n${kpiSpec}`
      : coachMode
      ? `${systemWithRole}\n\n${coachSpec}`
      : aicExplainMode
      ? `${systemWithRole}\n\n${aicExplainSpec}`
      : aicScriptMode
      ? `${systemWithRole}\n\n${aicScriptSpec}`
      : pitchMode
      ? `${systemWithRole}\n\n${
          (longPitchMode ? pitchSpecLong : pitchSpecShort) +
          "\n\nSPOKEN CLOSE TO USE EXACTLY (copy verbatim, do not paraphrase):\n" +
          pinnedStandardClose
        }`
      : systemWithRole;

    __mark("before openai.chat.completions.create");  
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemContent },
        {
          role: "user",
          content:
            `RECENT CONVERSATION (for resolving follow-ups like "it"):\n` +
            `${recentTranscript || "(none)"}\n\n` +
            `QUESTION:\n${message}\n\n` +
            `CONTEXT (training materials):\n${context}`,
        },
      ],
            temperature: pitchMode ? 0.1 : 0.25,
    });
    __mark("after openai.chat.completions.create");

    const rawReply = completion.choices[0].message.content ?? "";

    let replyText = normalizeReply(rawReply);

    // Hard-enforce Standard Close for pitch mode (guaranteed verbatim compliance)
    if (pitchMode && pinnedStandardClose) {
      replyText = enforcePitchClose(replyText, pinnedStandardClose);
    }

    __mark("POST end (success)");
    return NextResponse.json({
      reply: replyText,
      sources: pitchMode ? Array.from(new Set([...usedSources, "core/standard-close.txt"])) : usedSources,
      meta: {
        role,
        coachMode,
        kpiMode,
        pitchMode,
        longPitchMode,
        aicMode,
        charityDetected: charity,
        uspAllMode,
        rebuttalUspAllMode,
        historyIncluded: messages.length > 0,
      },
    });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
