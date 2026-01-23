"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ChatPage() {
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Coach Chat (MVP)</h1>
        <button onClick={signOut} style={{ padding: 10, borderRadius: 10 }}>
          Sign out
        </button>
      </div>

      <p style={{ marginTop: 8, color: "#555" }}>
        Logged in as: <b>{email || "(not logged in)"}</b>
      </p>

      <div style={{ marginTop: 18, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <p>
          Next step: we’ll add the actual coaching chat + knowledge base (GEM PDF, etc.).
        </p>
        <p style={{ marginTop: 8 }}>
          For now, this page proves login + routing works.
        </p>
      </div>
    </main>
  );
}
