/*fundraise-coach/app/(app)/sites/page.tsx*/
export default function SitesPage() {
  return (
    <div
      style={{
        background: "#050505",
        border: "1px solid #1f2937",
        borderRadius: 16,
        padding: 18,
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 1000, margin: 0 }}>Sites</h1>
      <p style={{ marginTop: 10, color: "#9ca3af", fontWeight: 700 }}>
        Field site database + analytics concept (performance, demographic, speed, history).
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
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Planned features</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1" }}>
          <li>Site profiles (location, type, restrictions, best times)</li>
          <li>Performance history by team + by campaign</li>
          <li>Demographic notes + pitch adjustments</li>
          <li>Speed metrics (contacts/hour, quality conversations)</li>
        </ul>
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid rgba(34,197,94,0.20)",
          background: "rgba(34,197,94,0.08)",
          borderRadius: 14,
          padding: 14,
          color: "#bbf7d0",
          fontWeight: 800,
        }}
      >
        Coming soon: site list + “recommended sites” based on KPI trends.
      </div>
    </div>
  );
}
