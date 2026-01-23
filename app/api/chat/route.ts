import { NextResponse } from "next/server";
import OpenAI from "openai";
import { ragSearch } from "./rag";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = String(body?.message ?? "").trim();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    // RAG: pull the most relevant chunks from your knowledge/*.txt
    const { context, usedSources } = await ragSearch(message);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful, motivating fundraising coach for face-to-face sales teams. " +
            "Use the provided CONTEXT to answer questions about our systems, rebuttals, charity pitches, and training. " +
            "If the answer is not in the context, say you don't have it in the training materials yet and ask what doc to add. " +
            "Be practical, short, and actionable (KISS).",
        },
        {
          role: "user",
          content: `QUESTION:\n${message}\n\nCONTEXT:\n${context}`,
        },
      ],
    });

    return NextResponse.json({
      reply: completion.choices[0].message.content,
      sources: usedSources,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
