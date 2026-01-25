/*fundraise-coach/app/apir/chat/route.ts*/


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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message = String(body?.message ?? "").trim();
    const messages = Array.isArray(body?.messages) ? (body.messages as ClientMsg[]) : [];

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const charity = detectCharity(message);

    // AIC must be detected BEFORE pitchMode, because the word "pitch" appears in AIC questions.
    const aicMode = isAICRequest(message);
    const aicExplainMode = aicMode && isAICExplainRequest(message);
    const aicScriptMode = aicMode && !aicExplainMode;

    // If AIC is active, we do NOT want pitchMode to trigger.
    const pitchMode = !aicMode && isPitchRequest(message);
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

    // Important: We keep ONE ragSearch call. We just add hints.
    const { context, usedSources } = await ragSearch(baseQuery + rebuttalHint + aicHint);
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
      "- These MUST be the charity-specific USPs from the training materials (look for 'CORE USPs' / 'Unique Selling Points').\n" +
      "- Do NOT invent USPs.\n" +
      "- Do NOT use the NEW framework lines (Nobody/Everybody/Why) as USPs.\n" +
      "- If the charity-specific USPs are not found in CONTEXT, say: 'Missing charity-specific USPs in training materials' and name the file to add.\n\n" +
      "If a charity is named, you MUST use the charity's short story lines from the CONTEXT and NOT paraphrase them. " +
      "If the charity short story is missing from context, say exactly which file to add.";

    const pitchSpecLong =
      "The user wants a longer version, but still follow OUR FIELD FORMAT EXACTLY.\n" +
      "Same rules: NO OPENER, NO ASK/TRANSITION section, NO COMMON REBUTTALS.\n" +
      "You may add 1–2 extra clarifying bullets in PROBLEM and SOLUTION, but keep it field-usable and not academic.\n" +
      "Still use ONLY the STANDARD CLOSE language exactly as written in training materials. Do NOT paraphrase.\n" +
      "REBUTTAL USPs must be charity-specific from training materials. Do NOT invent.";

    // AIC output format (short, structured, and practical)
  const aicExplainSpec =
      "Explain AIC (Answer Impulse Close) briefly and clearly.\n" +
      "Keep it short and practical. No long lecture.\n\n" +
      "Definition:\n" +
      "- AIC is used when someone asks a question or raises an objection BEFORE you reach the close (mid-pitch).\n" +
      "- Rebuttals are objections AFTER the close.\n\n" +
      "AIC checklist (what you must cover, in any order depending on their question):\n" +
      "- Problem\n" +
      "- Solution\n" +
      "- Dollar Amount\n" +
      "- Method (online + ongoing)\n\n" +
      "Rule:\n" +
      "- Direct questions deserve direct answers. Never deflect.\n\n" +
      "One-line example:\n" +
      "- If they ask 'How much is it?' answer the dollar amount, then bridge into the reason/problem and finish the rest."; 

  const aicScriptSpec =
      "The user is asking for an AIC example/script.\n" +
      "DO NOT explain AIC as a concept.\n" +
      "DO NOT invent any charity facts.\n" +
      "If charity is not clearly specified, use the ChildFund/Save the Children short story as the default example.\n\n" +
      "OUTPUT ONLY THIS (plain text, no extra sections):\n" +
      "SCRIPT (what to say, word-for-word):\n" +
      "- 4–8 short lines total\n" +
      "- Must cover: Direct Answer → Bridge → Problem → Solution → Dollar Amount → Method → Close\n" +
      "- The bridge line must contain exactly: 'The reason we’re doing this is because…'\n" +
      "- Dollar amount must be exactly: '$1 a day for as long as you can.'\n" +
      "- Method must be exactly: 'It’s a quick 2-minute online charity form, and it’s ongoing.'\n" +
      "- Close must be quoted from the STANDARD CLOSE lines in CONTEXT. Do NOT paraphrase.\n" +
      "- Do NOT say: 'Can we count on your support?' (never use that phrase).\n\n" +
      "DEFAULT EXAMPLE CONTENT (if charity is unknown):\n" +
      "- Problem: Over 15,000 children die every day because they lack basic needs.\n" +
      "- Solution: We provide food, water, medicine, and most importantly education to break the cycle of poverty.\n";

      
  const systemContent = aicExplainMode
      ? `${systemBase}\n\n${aicExplainSpec}`
      : aicScriptMode
      ? `${systemBase}\n\n${aicScriptSpec}`
      : pitchMode
      ? `${systemBase}\n\n${longPitchMode ? pitchSpecLong : pitchSpecShort}`
      : systemBase;

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
      temperature: 0.35,
    });

    const rawReply = completion.choices[0].message.content ?? "";
    const reply = normalizeReply(rawReply);

    return NextResponse.json({
      reply,
      sources: usedSources,
      meta: {
        pitchMode,
        longPitchMode,
        aicMode,
        charityDetected: charity,
        historyIncluded: messages.length > 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
