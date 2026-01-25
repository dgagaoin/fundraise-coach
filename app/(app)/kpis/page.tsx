/*fundraise-coach/app/(app)/kpis/page.tsx*/
"use client";

import { useMemo, useState } from "react";

type CoachRole = "rep" | "leader" | "owner";

export default function KPIsPage() {
  const [repName, setRepName] = useState<string>("");

  const [approaches, setApproaches] = useState<string>("N/A");
  const [contacts, setContacts] = useState<string>("");
  const [presentations, setPresentations] = useState<string>("");
  const [closes, setCloses] = useState<string>("");
  const [signups, setSignups] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // New: rep reflection fields
  const [wins3, setWins3] = useState<string>("");
  const [improve3, setImprove3] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string>("");
  const [sources, setSources] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  const templateNotes = useMemo(() => {
    return "Site:\nCampaign:\nWhat happened:\n";
  }, []);

  const templateWins = useMemo(() => {
    return "1)\n2)\n3)\n";
  }, []);

  const templateImprove = useMemo(() => {
    return "1)\n2)\n3)\n";
  }, []);

  function insertTemplates() {
    if (!notes.trim()) setNotes(templateNotes);
    if (!wins3.trim()) setWins3(templateWins);
    if (!improve3.trim()) setImprove3(templateImprove);
    setReply("");
    setSources([]);
    setError("");
  }

  function parseNum(value: string): number | null {
    const v = String(value ?? "").trim();
    if (!v) return null;
    if (v.toLowerCase() === "n/a" || v.toLowerCase() === "na") return null;
    const n = Number(v.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(n)) return null;
    return Math.floor(n);
  }

  async function analyzeKPIs() {
    if (loading) return;

    const role: CoachRole = "leader"; // KPI review is mainly for leaders/owners
    const name = repName.trim();
    if (!name) {
      setError("Field Rep Name is required (leaders/owners will review these).");
      return;
    }

    const a = parseNum(approaches);
    const c = parseNum(contacts);
    const p = parseNum(presentations);
    const cl = parseNum(closes);
    const s = parseNum(signups);

    if (c === null || p === null || cl === null || s === null) {
      setError(
        "Please enter valid numbers for Contacts, Presentations, Closes, and Sign Ups. Approaches can be N/A."
      );
      return;
    }

    setLoading(true);
    setReply("");
    setSources([]);
    setError("");

    const prompt =
      "KPIs\n" +
      "Field Rep: " + name + "\n" +
      "Approaches: " + (a === null ? "N/A" : String(a)) + "\n" +
      "Contacts: " + String(c) + "\n" +
      "Presentations: " + String(p) + "\n" +
      "Closes: " + String(cl) + "\n" +
      "Signups: " + String(s) + "\n" +
      "Notes:\n" + (notes?.trim() ? notes.trim() : "(none)") + "\n\n" +
      "Rep Reflection (required for new hires):\n" +
      "3 Things I did well:\n" + (wins3?.trim() ? wins3.trim() : "(not provided)") + "\n\n" +
      "3 Things I will improve:\n" + (improve3?.trim() ? improve3.trim() : "(not provided)");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          message: prompt,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Request failed.");
        return;
      }

      setReply(data?.reply ?? "(No reply)");
      setSources(Array.isArray(data?.sources) ? data.sources : []);
    } catch {
      setError("Error contacting AI. Check server logs.");
    } finally {
      setLoading(false);
    }
  }

  function boxStyle() {
    return {
      width: "100%",
      padding: 12,
      borderRadius: 12,
      border: "1px solid rgba(148,163,184,0.18)",
      background: "#0b0b0b",
      color: "#e5e7eb",
      outline: "none",
      fontWeight: 800,
      fontSize: 14,
    } as const;
  }

  return (
    <div
      style={{
        background: "#050505",
        border: "1px solid #1f2937",
        borderRadius: 16,
        padding: 18,
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 1000, margin: 0 }}>KPI Ingestor</h1>
      <p style={{ marginTop: 10, color: "#9ca3af", fontWeight: 700 }}>
        Leaders/owners review KPIs. Keep it confidence-building: 3 wins, 3 improves, then 1–2 focus items.
      </p>

      <div
        style={{
          marginTop: 14,
          border: "1px solid rgba(59,130,246,0.22)",
          background: "rgba(59,130,246,0.08)",
          borderRadius: 14,
          padding: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontWeight: 1000, marginBottom: 4, color: "#93c5fd" }}>
              KPI Coach (Leader Review)
            </div>
            <div style={{ color: "#bfdbfe", fontSize: 13, fontWeight: 700 }}>
              Order: Approaches (optional) → Contacts → Presentations → Closes → Sign Ups
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={insertTemplates}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                fontWeight: 900,
                border: "1px solid rgba(148,163,184,0.20)",
                background: "rgba(148,163,184,0.06)",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
              title="Insert templates for Notes + 3 Wins + 3 Improves."
            >
              Insert Templates
            </button>

            <button
              onClick={analyzeKPIs}
              disabled={loading}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                fontWeight: 1000,
                border: "1px solid rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.12)",
                color: "#86efac",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              title="Send KPIs to the coach for feedback."
            >
              {loading ? "Analyzing…" : "Analyze KPIs"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#cbd5e1", marginBottom: 6 }}>
            Field Rep Name (required)
          </div>
          <input
            value={repName}
            onChange={(e) => setRepName(e.target.value)}
            placeholder="e.g., Callum"
            style={boxStyle()}
          />
        </div>

        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#cbd5e1", marginBottom: 6 }}>
              Approaches (or N/A)
            </div>
            <input
              value={approaches}
              onChange={(e) => setApproaches(e.target.value)}
              placeholder="N/A"
              style={boxStyle()}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#cbd5e1", marginBottom: 6 }}>
              Contacts
            </div>
            <input
              value={contacts}
              onChange={(e) => setContacts(e.target.value)}
              placeholder="e.g., 30"
              style={boxStyle()}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#cbd5e1", marginBottom: 6 }}>
              Presentations (Short Stories)
            </div>
            <input
              value={presentations}
              onChange={(e) => setPresentations(e.target.value)}
              placeholder="e.g., 24"
              style={boxStyle()}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#cbd5e1", marginBottom: 6 }}>
              Closes
            </div>
            <input
              value={closes}
              onChange={(e) => setCloses(e.target.value)}
              placeholder="e.g., 12"
              style={boxStyle()}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#cbd5e1", marginBottom: 6 }}>
              Sign Ups
            </div>
            <input
              value={signups}
              onChange={(e) => setSignups(e.target.value)}
              placeholder="e.g., 2"
              style={boxStyle()}
            />
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#cbd5e1", marginBottom: 6 }}>
            Notes (optional)
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Site / campaign / what happened…"
            style={{
              width: "100%",
              minHeight: 90,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "#0b0b0b",
              color: "#e5e7eb",
              outline: "none",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 13,
              lineHeight: 1.35,
              resize: "vertical",
            }}
          />
        </div>

        {/* New hire reflection section */}
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#bbf7d0", marginBottom: 6 }}>
              3 Things I did well (new hire requirement)
            </div>
            <textarea
              value={wins3}
              onChange={(e) => setWins3(e.target.value)}
              placeholder={"1)\n2)\n3)"}
              style={{
                width: "100%",
                minHeight: 110,
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(34,197,94,0.22)",
                background: "rgba(34,197,94,0.06)",
                color: "#e5e7eb",
                outline: "none",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 13,
                lineHeight: 1.35,
                resize: "vertical",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#fde68a", marginBottom: 6 }}>
              3 Things I will improve (new hire requirement)
            </div>
            <textarea
              value={improve3}
              onChange={(e) => setImprove3(e.target.value)}
              placeholder={"1)\n2)\n3)"}
              style={{
                width: "100%",
                minHeight: 110,
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(251,191,36,0.22)",
                background: "rgba(251,191,36,0.06)",
                color: "#e5e7eb",
                outline: "none",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 13,
                lineHeight: 1.35,
                resize: "vertical",
              }}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 12,
              border: "1px solid rgba(248,113,113,0.25)",
              background: "rgba(248,113,113,0.08)",
              color: "#fecaca",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {error}
          </div>
        )}

        {reply && (
          <div
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(34,197,94,0.22)",
              background: "rgba(34,197,94,0.08)",
              color: "#e5e7eb",
            }}
          >
            <div style={{ fontWeight: 1000, marginBottom: 8, color: "#bbf7d0" }}>
              Coach Feedback
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>{reply}</div>

            {sources.length > 0 && (
              <div
                style={{
                  marginTop: 12,
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
                  {sources.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Roadmap */}
      <div
        style={{
          marginTop: 14,
          border: "1px solid rgba(148,163,184,0.18)",
          background: "rgba(148,163,184,0.06)",
          borderRadius: 14,
          padding: 14,
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Roadmap</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1" }}>
          <li>Database of KPIs for analytics (team + site + campaign performance)</li>
          <li>Auto-loading into winelists (daily → weekly stat trackers for teams)</li>
          <li>Later: upload photo of winelist → OCR/vision → structured KPIs</li>
        </ul>
      </div>
    </div>
  );
}
