/*fundraise-coach/app/(app)/fr/page.tsx*/
"use client";

import Link from "next/link";

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        textDecoration: "none",
        borderRadius: 16,
        border: "1px solid rgba(148,163,184,0.18)",
        background: "rgba(148,163,184,0.06)",
        padding: 16,
        color: "#e5e7eb",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 1000, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ color: "#9ca3af", fontWeight: 700, fontSize: 13 }}>
        {desc}
      </div>
      <div style={{ marginTop: 10, color: "#93c5fd", fontWeight: 900, fontSize: 13 }}>
        Open →
      </div>
    </Link>
  );
}

export default function FRHubPage() {
  return (
    <div
      style={{
        background: "#050505",
        border: "1px solid #1f2937",
        borderRadius: 16,
        padding: 18,
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 1000, margin: 0 }}>FR Hub</h1>
      <p style={{ marginTop: 10, color: "#9ca3af", fontWeight: 700 }}>
        Field Rep home base: expectations, systems, product knowledge, and development.
      </p>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {/* Order must match: code of conduct → systems → charity knowledge → COD+roadmap */}
        <Card
          title="Code of Conduct"
          desc="Professional expectations, standards, and how we represent the mission."
          href="/fr/code-of-conduct"
        />
        <Card
          title="Systems and Charity Pitch Library"
          desc="The exact teaching order we use in the field: short story → ISH → rapport → close → iPad → review → rebuttals → AIC."
          href="/fr/systems"
        />
        <Card
          title="Charity Product Knowledge"
          desc="Approved facts, talking points, and confidence-building info per charity."
          href="/fr/charity-knowledge"
        />
        <Card
          title="Code of Development and Roadmap"
          desc="Your growth path: what to practice, how to improve, and what ‘good’ looks like over time."
          href="/fr/development"
        />
      </div>

      <div
        style={{
          marginTop: 14,
          border: "1px solid rgba(56,189,248,0.20)",
          background: "rgba(56,189,248,0.08)",
          borderRadius: 14,
          padding: 14,
          color: "#bae6fd",
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        Coming soon: linked documents + drills + practice prompts inside each section.
      </div>
    </div>
  );
}
