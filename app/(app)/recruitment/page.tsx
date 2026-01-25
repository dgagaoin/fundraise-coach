export default function RecruitmentPage() {
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
        Recruitment
      </h1>

      <p style={{ marginTop: 10, color: "#9ca3af", fontWeight: 700 }}>
        Hiring pipeline, onboarding systems, and team growth tracking.
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
        <div style={{ fontWeight: 900, marginBottom: 8 }}>
          Planned features
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1" }}>
          <li>Candidate pipeline</li>
          <li>Interview notes & scoring</li>
          <li>New-hire onboarding checklist</li>
          <li>First-week & first-month benchmarks</li>
          <li>Early attrition indicators</li>
        </ul>
      </div>

      <div
        style={{
          marginTop: 14,
          border: "1px solid rgba(34,197,94,0.25)",
          background: "rgba(34,197,94,0.08)",
          borderRadius: 14,
          padding: 14,
          color: "#bbf7d0",
          fontWeight: 800,
        }}
      >
        Shared between Admins and Owners.
      </div>
    </div>
  );
}
