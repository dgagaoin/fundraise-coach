/*fundraise-coach/app/(app)/fr/systems/page.tsx*/
"use client";

import Link from "next/link";

function SectionCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(148,163,184,0.18)",
        background: "rgba(148,163,184,0.06)",
        padding: 14,
      }}
    >
      <div style={{ fontWeight: 1000, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#9ca3af", fontWeight: 700, fontSize: 13 }}>{desc}</div>
      <div style={{ marginTop: 10, color: "#93c5fd", fontWeight: 900, fontSize: 12 }}>
        Coming soon: docs + drills →
      </div>
    </div>
  );
}

export default function SystemsPage() {
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
            Systems and Charity Pitch Library
          </h1>
          <p style={{ marginTop: 10, color: "#9ca3af", fontWeight: 700 }}>
            This is the exact teaching order for Field Reps. Leaders and owners use this to align coaching.
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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {/* IMPORTANT: order must match exactly */}
        <SectionCard
          title="1) Charity Short Stories"
          desc="Problem + solution short stories (per charity). This is the core manufactured conversation backbone."
        />
        <SectionCard
          title="2) Intros & ISH"
          desc="How we stop people (ISH), how we open, and how we create clean first-contact energy."
        />
        <SectionCard
          title="3) Presentation and Rapport Building"
          desc="Holding the table: welcoming presence, confidence, retention, pacing, and smooth transitions into story."
        />
        <SectionCard
          title="4) Closing with Confidence"
          desc="How we ask cleanly, confidently, and consistently. Close language is standardized."
        />
        <SectionCard
          title="5) iPad and Rehash"
          desc="Mechanics: iPad flow + rehash to reinforce impulse and confirm the decision."
        />
        <SectionCard
          title="6) Full 5 Step Review"
          desc="End-to-end review of the complete manufactured conversation system."
        />
        <SectionCard
          title="7) Rebuttal System"
          desc="Post-close objection handling with approved rebuttals and USPs (no inventing)."
        />
        <SectionCard
          title="8) AIC — Answer Impulse Close"
          desc="Mid-pitch interruption handling before the close. Direct answers + bridge back to the close."
        />
      </div>
    </div>
  );
}
