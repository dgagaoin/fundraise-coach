"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");

  async function sendMagicLink() {
    setStatus("Sending link...");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/chat`,
      },
    });

    if (error) {
      setStatus(`Error: ${error.message}`);
      return;
    }
    setStatus("Check your email for the login link.");
  }

  return (
    <main style={{ maxWidth: 420, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Fundraise Coach</h1>
      <p style={{ marginTop: 8 }}>Login with your email (magic link).</p>

      <label style={{ display: "block", marginTop: 16 }}>Email</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        style={{
          width: "100%",
          padding: 10,
          marginTop: 6,
          border: "1px solid #ccc",
          borderRadius: 8,
        }}
      />

      <button
        onClick={sendMagicLink}
        style={{
          marginTop: 12,
          padding: 10,
          width: "100%",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Send login link
      </button>

      {status ? <p style={{ marginTop: 12 }}>{status}</p> : null}
    </main>
  );
}
