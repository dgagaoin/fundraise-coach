"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

export default function ChatPage() {
  const [email, setEmail] = useState<string>("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply ?? "(No reply)",
        sources: data.sources ?? [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error contacting AI. Check server logs.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Fundraise Coach (Demo)</h1>
        <button onClick={signOut} style={{ padding: 10, borderRadius: 10 }}>
          Sign out
        </button>
      </div>

      <p style={{ marginTop: 8, color: "#555" }}>
        Logged in as: <b>{email || "(not logged in)"}</b>
      </p>

      {/* Chat messages */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 12,
          minHeight: 300,
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#777" }}>
            Ask a coaching question, pitch explanation, rebuttal, or system overview.
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontWeight: 700,
                marginBottom: 4,
                color: m.role === "user" ? "#333" : "#0a5",
              }}
            >
              {m.role === "user" ? "You" : "Coach"}
            </div>

            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>

            {m.role === "assistant" && m.sources && m.sources.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  padding: 8,
                  background: "#f7f7f7",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              >
                <b>Sources used:</b>
                <ul style={{ marginTop: 4, paddingLeft: 18 }}>
                  {m.sources.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask Fundraise Coach…"
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: "0 16px",
            borderRadius: 10,
            fontWeight: 700,
          }}
        >
          {loading ? "Thinking…" : "Send"}
        </button>
      </div>
    </main>
  );
}
