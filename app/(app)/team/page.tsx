/*fundraise-coach/app/(app)/team/page.tsx*/
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
      <h1 style={{ fontSize: 22, fontWeight: 1000, margin: 0 }}>Leaders HQ</h1>
      <p style={{ marginTop: 10, color: "#9ca3af", fontWeight: 700 }}>
        Leadership tools, planning, and team infrastructure (placeholders for now).
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
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Planned tools</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1" }}>
          <li>Winelist Manager</li>
          <li>Team Family Tree</li>
          <li>SMART Goal Planner</li>
          <li>8 Week Planner</li>
          <li>Break-Even Calculator</li>
          <li>Code of Development (COD) Checklist</li>
          <li>Road Trip Planner</li>
          <li>Weekly Plan Template</li>
        </ul>
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid rgba(168,85,247,0.20)",
          background: "rgba(168,85,247,0.08)",
          borderRadius: 14,
          padding: 14,
          color: "#ddd6fe",
          fontWeight: 800,
        }}
      >
        Coming soon: winelist scaffolding + coaching workflows + planning tools.
      </div>
    </div>
  );
}
