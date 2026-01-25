/*fundraise-coach/app/(app)/fr/charity-knowledge/page.tsx*/
"use client";

import Link from "next/link";

export default function CharityKnowledgePage() {
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
          <h1 style={{ fontSize: 22, fontWeight: 1000, margin: 0 }}>Charity Product Knowledge</h1>
          <p style={{ marginTop: 10, color: "#9ca3af", fontWeight: 700 }}>
            Approved facts, mission points, and confidence-building info per charity.
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
          border: "1px solid rgba(251,191,36,0.20)",
          background: "rgba(251,191,36,0.08)",
          borderRadius: 14,
          padding: 14,
          color: "#fde68a",
          fontWeight: 800,
        }}
      >
        Placeholder: add charity-by-charity product knowledge pages and links here.
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
        Suggested future structure:
        <ul style={{ marginTop: 8, paddingLeft: 18 }}>
          <li>CFI — key facts + FAQs</li>
          <li>STC — key facts + FAQs</li>
          <li>CARE — key facts + FAQs</li>
          <li>IFAW — key facts + FAQs</li>
          <li>TNC — key facts + FAQs</li>
        </ul>
      </div>
    </div>
  );
}
