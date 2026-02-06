/*fundraise-coach/app/(app)/fr/systems/page.tsx*/
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type SourceKind = "text" | "pdf" | "unknown";

type DocLink = {
  label: string; // what user sees
  path: string;  // relative to /knowledge, e.g. "core/standard-close.txt"
};

type LibraryItem = {
  id: string;
  title: string;
  description: string;
  docs: DocLink[];
};

export default function SystemsAndCharityPitchLibraryPage() {
  // ---------- SOURCE MODAL STATE (same logic as /chat) ----------
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceKind, setSourceKind] = useState<SourceKind>("unknown");
  const [sourceText, setSourceText] = useState("");
  const [sourceFileUrl, setSourceFileUrl] = useState("");
  const [sourceRelPath, setSourceRelPath] = useState("");

  function humanizeSourceLabel(relPath: string) {
    const p = String(relPath || "").replaceAll("\\", "/");
    const parts = p.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : p || "(unknown)";
  }

  function closeSource() {
    setSourceOpen(false);
    setSourceLoading(false);
    setSourceError("");
    setSourceTitle("");
    setSourceKind("unknown");
    setSourceText("");
    setSourceFileUrl("");
    setSourceRelPath("");
  }

  async function openSource(relPath: string) {
    const p = String(relPath || "").trim();
    if (!p) return;

    setSourceOpen(true);
    setSourceLoading(true);
    setSourceError("");
    setSourceTitle(humanizeSourceLabel(p));
    setSourceKind("unknown");
    setSourceText("");
    setSourceFileUrl("");
    setSourceRelPath(p);

    try {
      const res = await fetch(`/api/knowledge?path=${encodeURIComponent(p)}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setSourceError(data?.error || "Failed to load source");
        return;
      }

      // Your API returns kind: "text" | "pdf"
            const kind = String((data as any)?.kind ?? "").toLowerCase().trim();

      // txt/text -> show the text
      if (kind === "txt" || kind === "text") {
        setSourceKind("text");
        setSourceText(String((data as any)?.text ?? ""));
        return;
      }

      // pdf -> show iframe + open link
      if (kind === "pdf") {
        setSourceKind("pdf");
        setSourceFileUrl(
          String((data as any)?.fileUrl ?? "") ||
            `/api/pdf?path=${encodeURIComponent(p)}`
        );
        return;
      }

      setSourceError(
        `Unsupported source type. kind=${JSON.stringify((data as any)?.kind)}`
      );

    } catch {
      setSourceError("Network error loading source");
    } finally {
      setSourceLoading(false);
    }
  }

  // ---------- LIBRARY ITEMS (YOU WILL SET PATHS) ----------
  const items: LibraryItem[] = useMemo(
    () => [
      {
        id: "1",
        title: "1) Charity Short Stories",
        description:
          "Problem → solution short stories (per charity). This is the core manufactured conversation backbone.",
        docs: [
          // ✅ Replace these with your real file paths under /knowledge
          { label: "Open doc", path: "charities/Charity Short Stories.txt" },
        ],
      },
      {
        id: "2",
        title: "2) Intros & ISH",
        description:
          "How we stop people (ISH), how we open, and how we create the first consistent energy.",
        docs: [{ label: "Open doc", path: "core/Intros and ISH.txt" }],
      },
      {
        id: "3",
        title: "3) Presentation and Rapport Building",
        description:
          "Holding the table: welcoming presence, confidence, retention, pacing, and smooth transitions into story.",
        docs: [{ label: "Open doc", path: "core/Presentation and Rapport.txt" }],
      },
      {
        id: "4",
        title: "4) Closing with Confidence",
        description:
          "How we ask cleanly, confidently, and consistently. Close language is standardized.",
        docs: [{ label: "Open doc", path: "core/standard-close.txt" }],
      },
      {
        id: "5",
        title: "5) iPad and Rehash",
        description:
          "Mechanics: iPad flow + rehash to reinforce impacts and confirm the decision.",
        docs: [{ label: "Open doc", path: "core/Tablet Signup Process.txt" }],
      },
      {
        id: "6",
        title: "6) Full 5 Step Review",
        description:
          "End-to-end review of the complete manufactured conversation system.",
        docs: [{ label: "Open doc", path: "core/5 Steps.txt" }],
      },
      {
        id: "7",
        title: "7) Rebuttal System",
        description:
          "Post-close objection handling with approved rebuttals and USPs (no inventing).",
        docs: [{ label: "Open doc", path: "rebuttals/Core Rebuttals.txt" }],
      },
      {
        id: "8",
        title: "8) AIC — Answer Impulse Close",
        description:
          "Mid-pitch interruption handling before the close. Direct answers + bridge back to close.",
        docs: [{ label: "Open doc", path: "core/AIC Answer Impulse Close.txt" }],
      },
    ],
    []
  );

  // UI helpers
  function Card({ item }: { item: LibraryItem }) {
    return (
      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,0.18)",
          background: "rgba(148,163,184,0.06)",
          padding: 14,
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 6 }}>{item.title}</div>
        <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: 13 }}>
          {item.description}
        </div>

        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {item.docs.map((d, idx) => (
            <button
              key={`${item.id}-${idx}-${d.path}`}
              type="button"
              onClick={() => openSource(d.path)}
              title={d.path}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                fontWeight: 900,
                border: "1px solid rgba(56,189,248,0.30)",
                background: "rgba(56,189,248,0.10)",
                color: "#7dd3fc",
                cursor: "pointer",
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main
      style={{
        maxWidth: 980,
        margin: "40px auto",
        padding: 16,
        color: "#e5e7eb",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,0.18)",
          background: "#050505",
          padding: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
              Systems and Charity Pitch Library
            </h1>
            <div style={{ marginTop: 6, color: "#94a3b8", fontWeight: 700, fontSize: 13 }}>
              This is the exact teaching order we use in the field: short story → ISH → rapport → close → iPad → review → rebuttals → AIC.
            </div>
          </div>

          <Link
            href="/fr-hub"
            style={{
              alignSelf: "flex-start",
              padding: "10px 12px",
              borderRadius: 12,
              fontWeight: 900,
              border: "1px solid rgba(148,163,184,0.22)",
              background: "rgba(148,163,184,0.06)",
              color: "#e5e7eb",
              textDecoration: "none",
            }}
          >
            ← Back to FR Hub
          </Link>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {items.map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(56,189,248,0.18)",
            background: "rgba(56,189,248,0.06)",
            color: "#bae6fd",
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          Tip: These 8 docs are the core training order. Keep filenames stable so links never break.
        </div>
      </div>

      {/* SOURCE MODAL (same working behavior as Chat) */}
      {sourceOpen && (
        <div
          onClick={closeSource}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 980,
              height: "86vh",
              background: "#0b0b0b",
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.25)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 12,
                borderBottom: "1px solid rgba(148,163,184,0.25)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{sourceTitle}</strong>
                <div style={{ fontSize: 12, opacity: 0.6 }}>{sourceRelPath}</div>
              </div>
              <button onClick={closeSource}>✕</button>
            </div>

            <div style={{ padding: 12, overflow: "auto", flex: 1 }}>
              {sourceLoading && <div>Loading…</div>}

              {sourceError && (
                <div style={{ color: "#fca5a5", fontWeight: 900 }}>
                  {sourceError}
                </div>
              )}

              {!sourceLoading && sourceKind === "text" && (
                <pre style={{ whiteSpace: "pre-wrap" }}>{sourceText}</pre>
              )}

              {!sourceLoading && sourceKind === "pdf" && (
                <>
                  <a href={sourceFileUrl} target="_blank" rel="noreferrer">
                    Open PDF in new tab
                  </a>
                  <iframe
                    src={sourceFileUrl}
                    style={{ width: "100%", height: "70vh", marginTop: 8 }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
