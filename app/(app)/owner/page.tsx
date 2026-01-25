export default function OwnerPage() {
  return (
    <div
      style={{
        background: "#050505",
        border: "1px solid #1f2937",
        borderRadius: 16,
        padding: 20,
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 1000, margin: 0 }}>
        Owner Dashboard
      </h1>

      <p style={{ marginTop: 10, color: "#9ca3af", fontWeight: 700 }}>
        High-level visibility, office health, and strategic control.
      </p>

      {/* Roadmap */}
      <div
        style={{
          marginTop: 16,
          border: "1px solid rgba(34,197,94,0.25)",
          background: "rgba(34,197,94,0.08)",
          borderRadius: 14,
          padding: 16,
          color: "#bbf7d0",
          fontWeight: 800,
        }}
      >
        Owner Roadmap (Planned)
      </div>

      <ul
        style={{
          marginTop: 14,
          paddingLeft: 18,
          color: "#cbd5e1",
          fontWeight: 700,
        }}
      >
        <li>Office Winelist (daily / weekly / campaign view)</li>
        <li>Office Team Layout & role structure</li>
        <li>Team Analytics (conversion, retention, coaching impact)</li>
        <li>Performance trends across Sites</li>
        <li>Leadership health indicators</li>
        <li>Hiring velocity & retention tracking</li>
      </ul>

      <div
        style={{
          marginTop: 16,
          border: "1px solid rgba(168,85,247,0.25)",
          background: "rgba(168,85,247,0.08)",
          borderRadius: 14,
          padding: 14,
          color: "#ddd6fe",
          fontWeight: 800,
        }}
      >
        This page will answer one question:
        <br />
        “Is my office healthy — and where should I intervene?”
      </div>
    </div>
  );
}
