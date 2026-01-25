/*fundraise-coach/app/(app)/library/page.tsx*/
export default function LibraryPage() {
  return (
    <div
      style={{
        background: "#050505",
        border: "1px solid #1f2937",
        borderRadius: 16,
        padding: 18,
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 1000, margin: 0 }}>Library</h1>
      <p style={{ marginTop: 10, color: "#9ca3af", fontWeight: 700 }}>
        Shows what Fundraise Coach is trained on now, and what we’ll upload next.
      </p>

      <div
        style={{
          marginTop: 14,
          border: "1px solid rgba(148,163,184,0.18)",
          background: "rgba(148,163,184,0.06)",
          borderRadius: 14,
          padding: 14,
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Current training sources (demo)</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1" }}>
          <li>Core pitch formats + standard close rules</li>
          <li>Charity short stories (per charity)</li>
          <li>Core rebuttals + charity-specific USPs</li>
          <li>AIC (Answer Impulse Close) system</li>
        </ul>
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid rgba(56,189,248,0.20)",
          background: "rgba(56,189,248,0.08)",
          borderRadius: 14,
          padding: 14,
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 8, color: "#7dd3fc" }}>Next planned uploads</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#bae6fd" }}>
          <li>Owner playbooks (KPIs, onboarding, coaching loops)</li>
          <li>Campaign-specific pitch cards and updates</li>
          <li>Site rules, scripts, and compliance notes</li>
          <li>Team training curriculum + drills</li>
        </ul>
      </div>
    </div>
  );
}
