"use client";

import { useMemo, useState } from "react";

type FlowKey =
  | "leadersMeeting"
  | "crewMeetings"
  | "techTraining"
  | "salesImpact"
  | "announcements"
  | "morningClose";

type FlowItem = {
  key: FlowKey;
  time: string;
  title: string;
  duration: string;
  purpose: string;
  focusAreas: string[];
  sources: string[];
  quote: string;
  coreComponents?: string[];
};

const DEFAULT_RAN_BY: Record<FlowKey, string> = {
  leadersMeeting: "",
  crewMeetings: "",
  techTraining: "",
  salesImpact: "",
  announcements: "",
  morningClose: "",
};

const DEFAULT_NOTES: Record<FlowKey, string> = {
  leadersMeeting: "",
  crewMeetings: "",
  techTraining: "",
  salesImpact: "",
  announcements: "",
  morningClose: "",
};

const DEFAULT_DONE: Record<FlowKey, boolean> = {
  leadersMeeting: false,
  crewMeetings: false,
  techTraining: false,
  salesImpact: false,
  announcements: false,
  morningClose: false,
};

function Card({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "blue" | "green" | "purple";
}) {
  const toneStyles =
    tone === "blue"
      ? {
          border: "1px solid rgba(56,189,248,0.25)",
          background: "rgba(56,189,248,0.08)",
        }
      : tone === "green"
      ? {
          border: "1px solid rgba(34,197,94,0.25)",
          background: "rgba(34,197,94,0.08)",
        }
      : tone === "purple"
      ? {
          border: "1px solid rgba(168,85,247,0.25)",
          background: "rgba(168,85,247,0.08)",
        }
      : {
          border: "1px solid rgba(148,163,184,0.18)",
          background: "rgba(148,163,184,0.06)",
        };

  return (
    <div
      style={{
        borderRadius: 14,
        padding: 14,
        ...toneStyles,
      }}
    >
      {children}
    </div>
  );
}

export default function OwnerPage() {
  const flow: FlowItem[] = useMemo(
    () => [
      {
        key: "leadersMeeting",
        time: "8:00 AM",
        title: "Leaders Meeting",
        duration: "~30 minutes",
        purpose: "Set the tone, reinforce standards, and develop leaders.",
        focusAreas: [
          "Leadership principles",
          "Accountability & ownership",
          "Standards & expectations",
          "People development",
        ],
        sources: ["Leadership RAG", "Leaders Meetings Library"],
        quote: "This meeting sharpens the leaders before they lead others.",
      },
      {
        key: "crewMeetings",
        time: "8:30 AM",
        title: "Crew Meetings (5-Minute Huddles)",
        duration: "3–5 minutes per crew",
        purpose: "Motivate, align, and emotionally connect each team.",
        focusAreas: ["Energy", "Belief", "Purpose", "Short, punchy motivation"],
        sources: ["Motivational Stories RAG", "2-min / 5-min / 10-min formats"],
        quote: "This is where belief is transferred person-to-person.",
      },
      {
        key: "techTraining",
        time: "8:35–9:15 AM",
        title: "Technical Sales Training",
        duration: "30–45 minutes",
        purpose: "Build skill, confidence, and consistency through repetition and drills.",
        focusAreas: ["Repetition", "Skill development", "Feedback"],
        coreComponents: [
          "The pitch",
          "5 steps",
          "Rebuttals",
          "AIC",
          "Practice drills",
          "Systems, Process, Product Knowledge",
        ],
        sources: ["Sales Techniques Library", "Systems Knowledge RAG"],
        quote: "Confidence comes from competence.",
      },
      {
        key: "salesImpact",
        time: "9:15–9:30 AM",
        title: "Sales Impact (Whole Office)",
        duration: "~10 minutes",
        purpose: "Elevate sales thinking with one concept, one insight, one takeaway.",
        focusAreas: ["One sales concept", "One insight", "One takeaway"],
        sources: ["Sales Concepts Library"],
        quote: "Short, sharp, and actionable.",
      },
      {
        key: "announcements",
        time: "After Impact",
        title: "Announcements & Customer Service Updates",
        duration: "~3–5 minutes",
        purpose: "Maintain awareness and accountability without overloading the morning.",
        focusAreas: [
          "Seasonal updates",
          "Customer service feedback",
          "Wins to repeat",
          "Mistakes to avoid",
        ],
        sources: ["Ops notes", "CS feedback"],
        quote: "Operational clarity without overloading the morning.",
      },
      {
        key: "morningClose",
        time: "Final Send-Off",
        title: "Morning Close (Motivational Send-Off)",
        duration: "2–10 minutes",
        purpose: "Inspire action and set emotional momentum for the day.",
        focusAreas: ["Belief", "Energy", "Gratitude", "Purpose"],
        sources: ["Motivational Library"],
        quote: "People don’t remember instructions — they remember how they felt walking out the door.",
      },
    ],
    []
  );

  const [ranBy, setRanBy] = useState<Record<FlowKey, string>>(DEFAULT_RAN_BY);
  const [notes, setNotes] = useState<Record<FlowKey, string>>(DEFAULT_NOTES);
  const [done, setDone] = useState<Record<FlowKey, boolean>>(DEFAULT_DONE);

  function resetPlanner() {
    setRanBy(DEFAULT_RAN_BY);
    setNotes(DEFAULT_NOTES);
    setDone(DEFAULT_DONE);
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
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 1000, margin: 0 }}>Owner Dashboard</h1>
          <p style={{ marginTop: 10, color: "#9ca3af", fontWeight: 700 }}>
            High-level visibility, office health, and strategic control.
          </p>
        </div>

        <button
          type="button"
          onClick={resetPlanner}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            fontWeight: 950,
            border: "1px solid rgba(148,163,184,0.22)",
            background: "rgba(148,163,184,0.06)",
            color: "#e5e7eb",
            cursor: "pointer",
            height: 42,
          }}
          title="Clears the planner fields (local only)"
        >
          Reset Planner
        </button>
      </div>

      {/* Roadmap (keep) */}
      <div
        style={{
          marginTop: 16,
          border: "1px solid rgba(34,197,94,0.25)",
          background: "rgba(34,197,94,0.08)",
          borderRadius: 14,
          padding: 16,
          color: "#bbf7d0",
          fontWeight: 800,
        }}
      >
        Owner Roadmap (Planned)
      </div>

      <ul
        style={{
          marginTop: 14,
          paddingLeft: 18,
          color: "#cbd5e1",
          fontWeight: 700,
        }}
      >
        <li>Office Winelist (daily / weekly / campaign view)</li>
        <li>Office Team Layout & role structure</li>
        <li>Team Analytics (conversion, retention, coaching impact)</li>
        <li>Performance trends across Sites</li>
        <li>Leadership health indicators</li>
        <li>Hiring velocity & retention tracking</li>
      </ul>

      <div
        style={{
          marginTop: 16,
          border: "1px solid rgba(168,85,247,0.25)",
          background: "rgba(168,85,247,0.08)",
          borderRadius: 14,
          padding: 14,
          color: "#ddd6fe",
          fontWeight: 800,
        }}
      >
        This page will answer one question:
        <br />
        “Is my office healthy — and where should I intervene?”
      </div>

      {/* NEW: Morning Flow Template */}
      <div style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 1000, margin: 0 }}>
          Daily Morning Office Flow — Leadership & Training Checklist
        </h2>
        <p style={{ marginTop: 8, color: "#9ca3af", fontWeight: 700 }}>
          Use this template daily to deliver the morning experience consistently and at a high standard.
        </p>

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          {flow.map((item) => (
            <Card key={item.key} tone={item.key === "leadersMeeting" ? "purple" : item.key === "salesImpact" ? "blue" : "neutral"}>
          {/* Header row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
      >
        <div>
          <div style={{ fontWeight: 1000, fontSize: 15 }}>{item.time} — {item.title}</div>
          <div style={{ marginTop: 4, color: "#94a3b8", fontWeight: 800, fontSize: 12 }}>
            Duration: {item.duration}
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={done[item.key]}
            onChange={(e) => setDone((p) => ({ ...p, [item.key]: e.target.checked }))}
          />
          <span style={{ fontWeight: 900, color: "#e5e7eb", fontSize: 12 }}>Completed</span>
        </label>
      </div>

      {/* Purpose */}
      <div style={{ marginTop: 8, color: "#e5e7eb", fontWeight: 800, lineHeight: 1.35 }}>
        <span style={{ color: "#cbd5e1" }}>Purpose:</span> {item.purpose}
      </div>

     {/* Focus Areas + Core Components (compact chips) */}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 950, color: "#cbd5e1" }}>Focus:</span>
          {item.focusAreas.map((x) => (
            <span
              key={x}
              style={{
                fontSize: 12,
                fontWeight: 850,
                color: "#e5e7eb",
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(148,163,184,0.06)",
                padding: "6px 8px",
                borderRadius: 999,
                lineHeight: 1,
              }}
            >
              {x}
            </span>
          ))}
        </div>

        {item.coreComponents && (
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 950, color: "#cbd5e1" }}>Core:</span>
            {item.coreComponents.map((x) => (
              <span
                key={x}
                style={{
                  fontSize: 12,
                  fontWeight: 850,
                  color: "#e5e7eb",
                  border: "1px solid rgba(56,189,248,0.20)",
                  background: "rgba(56,189,248,0.08)",
                  padding: "6px 8px",
                  borderRadius: 999,
                  lineHeight: 1,
                }}
              >
                {x}
              </span>
            ))}
          </div>
        )}
      </div>


      {/* Sources */}
      <div style={{ marginTop: 10, color: "#93c5fd", fontWeight: 850, fontSize: 11 }}>
        AI pulls from: {item.sources.join(" • ")}
      </div>

      {/* Notes block */}
      <div
        style={{
          marginTop: 10,
          border: "1px solid rgba(148,163,184,0.18)",
          background: "rgba(0,0,0,0.35)",
          borderRadius: 12,
          padding: 10,
          color: "#e5e7eb",
        }}
      >
        <div style={{ fontWeight: 950, marginBottom: 8 }}>Owner Notes</div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: "#cbd5e1" }}>Ran by:</div>
          <input
            value={ranBy[item.key]}
            onChange={(e) => setRanBy((p) => ({ ...p, [item.key]: e.target.value }))}
            placeholder="(name)"
            style={{
              flex: 1,
              minWidth: 200,
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.22)",
              background: "#0b0b0b",
              color: "#e5e7eb",
              fontWeight: 800,
              outline: "none",
            }}
          />
        </div>

        <textarea
          value={notes[item.key]}
          onChange={(e) => setNotes((p) => ({ ...p, [item.key]: e.target.value }))}
          placeholder="Write notes here… (agenda, key points, reminders, follow-ups)"
          style={{
            width: "100%",
            minHeight: 150,
            resize: "vertical",
            padding: 10,
            borderRadius: 10,
            border: "1px solid rgba(148,163,184,0.22)",
            background: "#0b0b0b",
            color: "#e5e7eb",
            outline: "none",
            fontWeight: 650,
            whiteSpace: "pre-wrap",
          }}
        />
      </div>

      {/* Quote */}
      <div style={{ marginTop: 10, color: "#a78bfa", fontWeight: 850, fontSize: 12 }}>
        “{item.quote}”
      </div>
    </Card>
  ))}
</div>


        <Card tone="green">
          <div style={{ fontWeight: 1000, marginBottom: 8, color: "#bbf7d0" }}>
            How owners use this checklist
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#e5e7eb", fontWeight: 750 }}>
            <li>Use daily to ensure nothing is skipped</li>
            <li>Rotate leaders / top reps / visiting owners through delivery roles</li>
            <li>Diagnose weak days by identifying missing sections</li>
            <li>Train new leaders using this exact flow</li>
          </ul>

          <div style={{ marginTop: 10, color: "#bbf7d0", fontWeight: 900 }}>
            Consistency in the morning creates consistency in results.
          </div>
        </Card>
      </div>
    </div>
  );
}
