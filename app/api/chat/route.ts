/*fundraise-coach/app/api/chat/route.ts*/
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { ragSearch } from "./rag";

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




export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message = String(body?.message ?? "").trim();
    const messages = Array.isArray(body?.messages) ? (body.messages as ClientMsg[]) : [];
    const role = normalizeRole(body?.role);

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const charity = detectCharity(message);

    // KPI mode (must be checked early)
    const kpiMode = isKPIRequest(message);

    // AIC must be detected BEFORE pitchMode, because the word "pitch" appears in AIC questions.
    const aicMode = !kpiMode && isAICRequest(message);
    const aicExplainMode = aicMode && isAICExplainRequest(message);
    const aicScriptMode = aicMode && !aicExplainMode;

    // If AIC is active, we do NOT want pitchMode to trigger.
    const pitchMode = !kpiMode && !aicMode && isPitchRequest(message);
    const longPitchMode = pitchMode && isLongPitchRequest(message);

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
    const { context, usedSources } = await ragSearch(baseQuery + rebuttalHint + aicHint + kpiHint);
    // -----------------------------------------------

    const systemBase =
      "You are a helpful, motivating fundraising coach for face-to-face sales teams. " +
      "Use the provided CONTEXT to answer questions about our systems, rebuttals, charity pitches, and training. " +
      "If the answer is not in the context, say you don't have it in the training materials yet and ask what doc to add. " +
      "Be practical, short, and actionable (KISS). " +
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
      "- Do NOT say phrases like 'count on your support', 'commit for a year', or similar.\n" +
      "- If the standard close is not found in CONTEXT, say exactly which file is missing.\n\n" +
      "REBUTTAL USPs:\n" +
      "- Bullet only.\n" +
      "- These MUST be the charity-specific USPs from the training materials.\n" +
      "- Do NOT invent USPs.\n" +
      "- If the charity-specific USPs are not found in CONTEXT, say: 'Missing charity-specific USPs in training materials' and name the file to add.\n\n" +
      "If a charity is named, you MUST use the charity's short story lines from the CONTEXT and NOT paraphrase them. " +
      "If the charity short story is missing from context, say exactly which file to add.";

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

    const kpiSpec = kpiCoachingSpec();

    const systemContent = kpiMode
      ? `${systemWithRole}\n\n${kpiSpec}`
      : aicExplainMode
      ? `${systemWithRole}\n\n${aicExplainSpec}`
      : aicScriptMode
      ? `${systemWithRole}\n\n${aicScriptSpec}`
      : pitchMode
      ? `${systemWithRole}\n\n${longPitchMode ? pitchSpecLong : pitchSpecShort}`
      : systemWithRole;

    const recentTranscript = messages.length ? toTranscript(messages) : "";

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
      temperature: 0.25,
    });

    const rawReply = completion.choices[0].message.content ?? "";
    const reply = normalizeReply(rawReply);

    return NextResponse.json({
      reply,
      sources: usedSources,
      meta: {
        role,
        kpiMode,
        pitchMode,
        longPitchMode,
        aicMode,
        charityDetected: charity,
        historyIncluded: messages.length > 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
