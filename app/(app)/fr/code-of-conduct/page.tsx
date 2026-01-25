/*fundraise-coach/app/(app)/fr/code-of-conduct/page.tsx*/
"use client";

import Link from "next/link";

export default function CodeOfConductPage() {
  return (
    <div
      style={{
        background: "#050505",
        border: "1px solid #1f2937",
        borderRadius: 16,
        padding: 18,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 1000, margin: 0 }}>Code of Conduct</h1>
          <p style={{ marginTop: 10, color: "#9ca3af", fontWeight: 700 }}>
            Professional standards for how we show up, speak, and represent the mission.
          </p>
        </div>

        <Link
          href="/fr"
          style={{
            alignSelf: "flex-start",
            textDecoration: "none",
            padding: "10px 12px",
            borderRadius: 12,
            fontWeight: 900,
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(148,163,184,0.06)",
            color: "#e5e7eb",
          }}
        >
          ← Back to FR Hub
        </Link>
      </div>

      <div
        style={{
          marginTop: 14,
          border: "1px solid rgba(34,197,94,0.22)",
          background: "rgba(34,197,94,0.08)",
          borderRadius: 14,
          padding: 14,
          color: "#bbf7d0",
          fontWeight: 800,
        }}
      >
        Placeholder: upload Code of Conduct documents and reference links here.
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid rgba(148,163,184,0.18)",
          background: "rgba(148,163,184,0.06)",
          borderRadius: 14,
          padding: 14,
          color: "#cbd5e1",
        }}
      >
        Suggested content (future):
        <ul style={{ marginTop: 8, paddingLeft: 18 }}>
          <li>Professionalism and integrity</li>
          <li>Respectful communication</li>
          <li>Site rules and public conduct</li>
          <li>Safety and escalation guidelines</li>
          <li>Representing the charity accurately</li>
        </ul>
      </div>
    </div>
  );
}
