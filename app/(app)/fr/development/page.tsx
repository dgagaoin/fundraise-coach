/*fundraise-coach/app/(app)/fr/development/page.tsx*/
"use client";

import Link from "next/link";

export default function DevelopmentPage() {
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
          <h1 style={{ fontSize: 22, fontWeight: 1000, margin: 0 }}>
            Code of Development and Roadmap
          </h1>
          <p style={{ marginTop: 10, color: "#9ca3af", fontWeight: 700 }}>
            Your growth path: what to practice, what “good” looks like, and how to level up without overwhelm.
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
          border: "1px solid rgba(168,85,247,0.22)",
          background: "rgba(168,85,247,0.08)",
          borderRadius: 14,
          padding: 14,
          color: "#ddd6fe",
          fontWeight: 800,
        }}
      >
        Placeholder: upload the Code of Development (COD) checklist and the Field Rep development roadmap here.
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
        Suggested future content:
        <ul style={{ marginTop: 8, paddingLeft: 18 }}>
          <li>New hire week 1–2 skill focus</li>
          <li>Stop power (ISH) development ladder</li>
          <li>Short story memorization + delivery drills</li>
          <li>Close confidence reps + rehash reps</li>
          <li>Rebuttals + AIC mastery timeline</li>
        </ul>
      </div>
    </div>
  );
}
