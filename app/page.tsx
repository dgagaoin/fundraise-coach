// FILE: fundraise-coach/app/page.tsx
// PURPOSE: Root homepage redirect for production demo.
// Behavior:
// - Redirects "/" → "/chat"
// - "/chat" handles auth protection and sends unauthenticated users to "/login"

"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Keep the demo link clean and intentional
    window.location.replace("/chat");
  }, []);

  return (
    <main style={{ maxWidth: 760, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Fundraise Coach</h1>
      <p style={{ marginTop: 10, color: "#555" }}>Redirecting…</p>
    </main>
  );
}
