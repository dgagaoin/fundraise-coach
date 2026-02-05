/*fundraise-coach/app/(app)/fr/page.tsx*/
"use client";

import Link from "next/link";
import { useState } from "react";


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

function CardButton({
  title,
  desc,
  onClick,
}: {
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        borderRadius: 16,
        border: "1px solid rgba(148,163,184,0.18)",
        background: "rgba(148,163,184,0.06)",
        padding: 16,
        color: "#e5e7eb",
        cursor: "pointer",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 1000, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#9ca3af", fontWeight: 700, fontSize: 13 }}>{desc}</div>
      <div style={{ marginTop: 10, color: "#93c5fd", fontWeight: 900, fontSize: 13 }}>
        Open PDF →
      </div>
    </button>
  );
}


export default function FRHubPage() {
  const [pdfPath, setPdfPath] = useState<string>("");

  function openPdf(path: string) {
    setPdfPath(path);
  }

  function closePdf() {
    setPdfPath("");
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

        <CardButton
          title="Code of Development (PDF) — First Week"
          desc="Open the official COD First Week checklist PDF (new person onboarding)."
          onClick={() => openPdf("pdfs/cod-first-week.pdf")}
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
        maxWidth: 980,
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

    </div>
  );
}
