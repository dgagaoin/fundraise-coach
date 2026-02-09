/*fundraise-coach/app/(app)/team/page.tsx*/
"use client";
import { useState } from "react";
import Link from "next/link";


type ToolCardProps = {
  title: string;
  description: string;
  bullets: string[];
  badge?: string;
  href?: string; // NEW: optional route
};


function ToolCard({ title, description, bullets, badge, href }: ToolCardProps) {
  return (
    <div
      style={{
        border: "1px solid rgba(148,163,184,0.18)",
        background: "rgba(148,163,184,0.06)",
        borderRadius: 14,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 180,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 1000, fontSize: 15 }}>{title}</div>

        {badge ? (
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: "#93c5fd",
              border: "1px solid rgba(59,130,246,0.35)",
              background: "rgba(59,130,246,0.10)",
              padding: "6px 10px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {badge}
          </div>
        ) : null}
      </div>

      <div style={{ color: "#9ca3af", fontWeight: 800, lineHeight: 1.35 }}>{description}</div>

      <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1", fontWeight: 700, lineHeight: 1.35 }}>
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
        {href ? (
            <Link
              href={href}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000,
                border: "1px solid rgba(56,189,248,0.35)",
                background: "rgba(56,189,248,0.10)",
                color: "#7dd3fc",
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-block",
              }}
              title={`Open ${title}`}
            >
              Open →
            </Link>
          ) : (
          <button
            type="button"
            disabled
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              fontWeight: 1000,
              border: "1px solid rgba(148,163,184,0.22)",
              background: "rgba(148,163,184,0.06)",
              color: "rgba(229,231,235,0.65)",
              cursor: "not-allowed",
            }}
            title="Placeholder (not wired yet)"
          >
            Open →
          </button>
        )}
      </div>
    </div>
  );
}

export default function TeamPage() {
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
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 1000, margin: 0 }}>Leaders HQ</h1>
          <p style={{ marginTop: 10, color: "#9ca3af", fontWeight: 700 }}>
            Leadership tools, planning, and team infrastructure (placeholders for now).
          </p>
        </div>

        <div
          style={{
            border: "1px solid rgba(34,197,94,0.25)",
            background: "rgba(34,197,94,0.08)",
            borderRadius: 14,
            padding: "10px 12px",
            color: "#bbf7d0",
            fontWeight: 900,
            maxWidth: 360,
          }}
        >
          Primary goal: make it easier for leaders to coach daily, plan weekly, and build a consistent team culture.
        </div>
      </div>

      {/* Grid */}
      <div
      style={{
        marginTop: 16,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 12,
      }}
>
      <ToolCard
          title="Weekly Plan Template"
          description="The weekly leadership plan: goals, risks, coaching focus, and action items."
          bullets={[
            "Team focus + 1–2 skill priorities",
            "Who needs help & what drill they need",
            "Midweek check + weekend review",
          ]}
          href="/team/weekly-plan"
        />

        <ToolCard
          title="Team Family Tree"
          description="Simple org chart + mentorship map to visualize who is leading who, and where support is needed."
          bullets={[
            "Owner → Admins → Leaders → FRs",
            "Road trip assignments & coverage",
            "Retention signals (who’s fading / surging)",
          ]}
          href="/team/family-tree"
        />

        <ToolCard
          title="Winelist Manager"
          badge="Highest leverage"
          description="Track daily sales by rep + auto-rollups. Built for coaching rhythm, momentum, and accountability."
          bullets={[
            "Daily / weekly view (by person + totals)",
            "Campaign-aware donation + owner profit logic",
            "Coach notes & “next drill” suggestions (later)",
          ]}
        />

        <ToolCard
          title="SMART Goal Planner"
          description="Goal setting that translates into daily behaviors (inputs) and weekly outcomes (outputs)."
          bullets={[
            "Set weekly sales goal + daily minimum",
            "Behavior goals (contacts/hour, quality convos)",
            "Auto “What to focus on this week” prompt",
          ]}
        />

        <ToolCard
          title="8 Week Planner"
          description="A simple cycle planner for skill progression, promotions, and performance ramping."
          bullets={[
            "Week-by-week skill emphasis",
            "Promotion readiness checkpoints",
            "Coaching cadence & review points",
          ]}
        />

        <ToolCard
          title="Break Even Calculator"
          description="Quick math for campaign economics + staffing. Helps leaders understand what “good” looks like."
          bullets={[
            "Targets by day/week",
            "Team size vs required production",
            "Scenario planning (slow week / road trip)",
          ]}
        />

        {/* COD Checklists (PDF) */}
        <div
          style={{
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(148,163,184,0.06)",
            borderRadius: 14,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minHeight: 180,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 1000, fontSize: 15 }}>COD Checklists (PDF)</div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: "#93c5fd",
                border: "1px solid rgba(59,130,246,0.35)",
                background: "rgba(59,130,246,0.10)",
                padding: "6px 10px",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              Leadership
            </div>
          </div>

          <div style={{ color: "#9ca3af", fontWeight: 800, lineHeight: 1.35 }}>
            Code of Development checklists for leadership standards (Becoming a Leader).
          </div>

          <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1", fontWeight: 700, lineHeight: 1.35 }}>
            <li>Daily/weekly behaviors checklist</li>
            <li>Leader expectations & coaching habits</li>
            <li>Progress snapshots over time</li>
          </ul>

          <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => openPdf("pdfs/cod-becoming-a-leader.pdf")}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000,
                border: "1px solid rgba(56,189,248,0.35)",
                background: "rgba(56,189,248,0.10)",
                color: "#7dd3fc",
                cursor: "pointer",
              }}
              title="Open Becoming a Leader COD PDF"
            >
              Open PDF →
            </button>
          </div>
        </div>

        <ToolCard
          title="Road Trip Planner"
          description="Plan travel teams, assign leadership coverage, and keep performance standards consistent across cities."
          bullets={[
            "Who’s going + roles",
            "Target sites + schedule skeleton",
            "Pre-trip training & post-trip debrief",
          ]}
        />
      </div>

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

      <div
        style={{
          marginTop: 14,
          border: "1px solid rgba(168,85,247,0.20)",
          background: "rgba(168,85,247,0.08)",
          borderRadius: 14,
          padding: 14,
          color: "#ddd6fe",
          fontWeight: 850,
        }}
      >
        Coming soon: winelist scaffolding + coaching workflows + planning tools.
        <div style={{ marginTop: 6, color: "#c4b5fd", fontWeight: 800 }}>
          (Next build after placeholders: Winelist Manager → SMART Goals → Weekly Plan Template)
        </div>
      </div>
    </div>
  );
}
