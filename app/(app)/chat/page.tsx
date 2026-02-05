// FILE: fundraise-coach/app/chat/page.tsx
// PURPOSE: Protected chat UI for Fundraise Coach demo.
// NOTES:
// - Calls /api/chat for responses (RAG + sources)
// - Includes "Rebuild Knowledge" button that calls /api/chat/reload (clears in-memory RAG cache)
// - Includes "Start New Chat" button that clears the current chat session in the UI

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

type CoachRole = "rep" | "leader" | "owner";

export default function ChatPage() {
  const [email, setEmail] = useState<string>("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);


  // Warmup / initialize UX (prevents the “first question too fast” issue)
  const [systemReady, setSystemReady] = useState(false);
  const [warmupMsg, setWarmupMsg] = useState("Please wait while the system initializes…");

  const [reloading, setReloading] = useState(false);
  const [reloadStatus, setReloadStatus] = useState<string>("");

  const [role, setRole] = useState<CoachRole>("rep");
  // PDF viewer (for in-chat PDF links)
  const [pdfPath, setPdfPath] = useState<string>("");
  const [rotatingQuote, setRotatingQuote] = useState<string>("");
  const [rotatingAttribution, setRotatingAttribution] = useState<string>("");


  const rolePlaceholderMap: Record<CoachRole, string> = {
  rep:
    "Ask me about any of our systems, the pitches for any of the charities we represent, how to rebuttal or AIC potential donors, or for motivational stories.",
  leader:
    "Ask me how to explain any of our systems to new field reps, for the USPs to any or all charities, or for stories or quotes you could use for a crew meeting. You can also ask anything a field rep would ask.",
  owner:
    "Ask me for ideas for a sales impact, a leaders meeting, or a morning meeting, or how to explain any of our systems to leaders or field reps. You can also ask anything a field rep or leader would ask.",
};


  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });

    // Restore role from localStorage (if present)
    try {
      const saved = window.localStorage.getItem("fundraise_coach_role");
      if (saved === "rep" || saved === "leader" || saved === "owner") {
        setRole(saved);
      }
    } catch {
      // ignore
    }
    // Load rotating quote (Option A: one random quote per page load)
    fetch("/api/quote")
      .then((res) => res.json())
      .then((data) => {
        if (data?.quote) {
          setRotatingQuote(String(data.quote));
          setRotatingAttribution(String(data.attribution || "Anonymous"));
        }
      })
      .catch(() => {
        // silent fail — quote should never break chat
      });
  }, []);

  // Warm up server/RAG so the first user question doesn’t race initialization
  useEffect(() => {
    let alive = true;

    async function warm() {
      try {
        setSystemReady(false);
        setWarmupMsg("Please wait while the system initializes…");

        const res = await fetch("/api/warmup", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!alive) return;

        // Our /api/warmup returns { ok: true } on success
        if (res.ok && data?.ok === true) {
          setSystemReady(true);
          setWarmupMsg("Go ahead and type your question.");
        } else {
          // Don’t hard-block the UI forever if warmup errors
          setSystemReady(true);
          setWarmupMsg("Go ahead and type your question.");
        }
      } catch {
        if (!alive) return;
        setSystemReady(true);
        setWarmupMsg("Go ahead and type your question.");
      }
    }

    warm();
    return () => {
      alive = false;
    };
  }, []);


  function onRoleChange(next: CoachRole) {
    setRole(next);
    try {
      window.localStorage.setItem("fundraise_coach_role", next);
    } catch {
      // ignore
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function startNewChat() {
    // Clear UI session only (does not affect auth or RAG cache)
    setMessages([]);
    setInput("");
    setLoading(false);
    // Also clear any status banner so the UI feels fresh
    setReloadStatus("");
  }

  function openPdf(path: string) {
  setPdfPath(path);
  }

  function closePdf() {
    setPdfPath("");
  }


  async function rebuildKnowledge() {
    if (reloading) return;
    setReloading(true);
    setReloadStatus("");

    try {
      const res = await fetch("/api/chat/reload", { method: "POST" });
      const data = await res.json();
      setReloadStatus(data?.message ?? "Knowledge reloaded.");
      setTimeout(() => setReloadStatus(""), 4000);
    } catch {
      setReloadStatus("Failed to reload knowledge. Check server logs.");
      setTimeout(() => setReloadStatus(""), 6000);
    } finally {
      setReloading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    const nextHistory = [...messages, userMessage].slice(-10);

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role, // ✅ Role toggle sent to the API
          message: userMessage.content,
          // Send recent history so follow-ups like "how do I say it?" have context.
          // Keep it short to avoid token bloat.
          messages: nextHistory,
        }),
      });

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply ?? "(No reply)",
        sources: data.sources ?? [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
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

  function renderAssistantContent(content: string) {
  const parts = content.split(/\[Open:\s*(.+?)\]/g);

  return parts.map((part, i) => {
    // Odd indexes = captured file path
    if (i % 2 === 1) {
      const p = String(part || "").trim();
      return (
        <button
          key={`pdf-${i}-${p}`}
          type="button"
          onClick={() => openPdf(p)}
          style={{
            marginLeft: 6,
            marginRight: 6,
            padding: "6px 10px",
            borderRadius: 10,
            border: "1px solid rgba(56,189,248,0.45)",
            background: "rgba(56,189,248,0.10)",
            color: "#7dd3fc",
            fontWeight: 900,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
          title={`Open ${p}`}
        >
          <span aria-hidden>📄</span>
          Open PDF
        </button>
      );
    }

      // Normal text segments
      return <span key={`txt-${i}`}>{part}</span>;
    });
  }


  return (
    <main
      style={{
        maxWidth: 860,
        margin: "40px auto",
        fontFamily: "sans-serif",
        padding: 16,
        color: "#e5e7eb",
      }}
    >
      <div
        style={{
          background: "#050505",
          border: "1px solid #1f2937",
          borderRadius: 16,
          padding: 18,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 260 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
              Fundraise Coach (Demo)
            </h1>
            <p style={{ marginTop: 6, marginBottom: 0, color: "#9ca3af" }}>
              Logged in as:{" "}
              <b style={{ color: "#e5e7eb" }}>{email || "(not logged in)"}</b>
            </p>
          </div>

          {/* Controls */}
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {/* Role Toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.20)",
                background: "rgba(148,163,184,0.06)",
              }}
              title="Changes the coaching style: Rep = what to say, Leader = how to coach, Owner = ops/KPI framing."
            >
              <span style={{ fontSize: 12, fontWeight: 900, color: "#cbd5e1" }}>
                Role
              </span>
              <select
                value={role}
                onChange={(e) => onRoleChange(e.target.value as CoachRole)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.25)",
                  background: "#0b0b0b",
                  color: "#e5e7eb",
                  fontWeight: 800,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="rep">Rep</option>
                <option value="leader">Leader</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <button
              onClick={startNewChat}
              title="Clears the current chat messages on screen."
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                fontWeight: 900,
                border: "1px solid rgba(34,197,94,0.35)", // green border
                background: "rgba(34,197,94,0.10)", // green tint
                color: "#86efac",
                cursor: "pointer",
              }}
            >
              Start New Chat
            </button>

            <button
              onClick={rebuildKnowledge}
              disabled={reloading}
              title="Clears the in-memory RAG cache; next chat message rebuilds embeddings."
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                fontWeight: 800,
                border: "1px solid rgba(56,189,248,0.35)",
                background: "rgba(56,189,248,0.10)",
                color: "#7dd3fc",
                cursor: reloading ? "not-allowed" : "pointer",
              }}
            >
              {reloading ? "Rebuilding…" : "Rebuild Knowledge"}
            </button>

            <button
              onClick={signOut}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                fontWeight: 800,
                border: "1px solid rgba(168,85,247,0.35)",
                background: "rgba(168,85,247,0.10)",
                color: "#c084fc",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Reload status */}
        {reloadStatus && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 12,
              border: "1px solid rgba(251,191,36,0.25)",
              background: "rgba(251,191,36,0.10)",
              color: "#fbbf24",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {reloadStatus}
          </div>
        )}

        {/* Chat messages */}
        <div
          style={{
            marginTop: 16,
            padding: 16,
            border: "1px solid #1f2937",
            borderRadius: 14,
            minHeight: 340,
            background: "#0b0b0b",
          }}
        >
          {messages.length === 0 && (
                        <div>
                          {/* TOP: Prompt (stays at the top) */}
                          <p
                            style={{
                              color: "#9ca3af",
                              marginTop: 0,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {rolePlaceholderMap[role]}
                          </p>

                          {/* Spacer pushes quote down */}
                          <div style={{ height: 120 }} />

                          {/* LOWER: Quote (rotates on page load) */}
                            {rotatingQuote && (
                              <div
                                style={{
                                  paddingTop: 14,
                                  borderTop: "1px solid rgba(148,163,184,0.18)",
                                }}
                              >
                                <div style={{ color: "#cbd5e1", fontWeight: 800, whiteSpace: "pre-wrap" }}>
                                  {rotatingQuote}
                                </div>

                                <div
                                  style={{
                                    marginTop: 8,
                                    color: "#94a3b8",
                                    fontWeight: 700,
                                    fontSize: 13,
                                  }}
                                >
                                  — {rotatingAttribution}
                                </div>
                                <div
                                  style={{
                                    marginTop: 6,
                                    color: "#64748b",
                                    fontWeight: 700,
                                    fontSize: 12,
                                  }}
                                >
                                  (Future add-on: quote of the day/week + categories by culture/source.)
                                </div>
                              </div>
                            )}
                        </div>
                      )}

          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontWeight: 900,
                  marginBottom: 6,
                  color: m.role === "user" ? "#93c5fd" : "#a78bfa",
                }}
              >
                {m.role === "user" ? "You" : "Coach"}
              </div>

              <div style={{ whiteSpace: "pre-wrap", color: "#e5e7eb" }}>
                {renderAssistantContent(m.content)}
              </div>

              {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid rgba(56,189,248,0.25)",
                    background: "rgba(56,189,248,0.08)",
                    color: "#bae6fd",
                    fontSize: 12,
                  }}
                >
                  <b style={{ color: "#7dd3fc" }}>Sources used:</b>
                  <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                    {m.sources.map((s, idx) => (
                      <li key={idx} style={{ color: "#bae6fd" }}>
                        {s}
                      </li>
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
            disabled={!systemReady || loading}
            placeholder={warmupMsg}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "1px solid #1f2937",
              background: "#0b0b0b",
              color: "#e5e7eb",
              outline: "none",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!systemReady || loading || !input.trim()}
            style={{
              padding: "0 16px",
              borderRadius: 10,
              fontWeight: 900,
              border: "1px solid rgba(59,130,246,0.35)",
              background: "rgba(59,130,246,0.12)",
              color: "#93c5fd",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Thinking…" : "Send"}
          </button>
        </div>
      </div>

      {/* PDF Modal */}
{pdfPath && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    }}
    onClick={closePdf}
  >
    <div
      style={{
        width: "100%",
        maxWidth: 900,
        height: "85vh",
        background: "#0b0b0b",
        borderRadius: 16,
        border: "1px solid rgba(56,189,248,0.35)",
        overflow: "hidden",
        position: "relative",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={closePdf}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 2,
          padding: "10px 12px",
          borderRadius: 12,
          fontWeight: 900,
          border: "1px solid rgba(148,163,184,0.22)",
          background: "rgba(148,163,184,0.06)",
          color: "#e5e7eb",
          cursor: "pointer",
          lineHeight: 1,
        }}
        aria-label="Close PDF"
        title="Close"
      >
        ✕
      </button>

            <iframe
              src={`/api/pdf?path=${encodeURIComponent(pdfPath)}`}
              title={pdfPath}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
                background: "#0b0b0b",
              }}
            />
          </div>
        </div>
      )}
      
    </main>
  );
}
