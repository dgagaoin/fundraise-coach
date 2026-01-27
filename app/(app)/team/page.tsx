/*fundraise-coach/app/(app)/team/page.tsx*/
type ToolCardProps = {
  title: string;
  description: string;
  bullets: string[];
  badge?: string;
};

function ToolCard({ title, description, bullets, badge }: ToolCardProps) {
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
      </div>
    </div>
  );
}

export default function TeamPage() {
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
          title="Team Family Tree"
          description="Simple org chart + mentorship map to visualize who is leading who, and where support is needed."
          bullets={[
            "Owner → Admins → Leaders → FRs",
            "Road trip assignments & coverage",
            "Retention signals (who’s fading / surging)",
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
          title="Break-Even Calculator"
          description="Quick math for campaign economics + staffing. Helps leaders understand what “good” looks like."
          bullets={[
            "Targets by day/week",
            "Team size vs required production",
            "Scenario planning (slow week / road trip)",
          ]}
        />

        <ToolCard
          title="COD Checklist"
          description="Code of Development checklist for consistent training + leadership standards."
          bullets={[
            "Daily/weekly behaviors checklist",
            "Leader expectations & coaching habits",
            "Progress snapshots over time",
          ]}
        />

        <ToolCard
          title="Road Trip Planner"
          description="Plan travel teams, assign leadership coverage, and keep performance standards consistent across cities."
          bullets={[
            "Who’s going + roles",
            "Target sites + schedule skeleton",
            "Pre-trip training & post-trip debrief",
          ]}
        />

        <ToolCard
          title="Weekly Plan Template"
          description="The weekly leadership plan: goals, risks, coaching focus, and action items."
          bullets={[
            "Team focus + 1–2 skill priorities",
            "Who needs help & what drill they need",
            "Midweek check + weekend review",
          ]}
        />
      </div>

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
