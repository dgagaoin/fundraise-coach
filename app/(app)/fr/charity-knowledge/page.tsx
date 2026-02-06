/*fundraise-coach/app/(app)/fr/charity-knowledge/page.tsx*/
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type SourceKind = "text" | "pdf" | "unknown";

type DocLink = {
  label: string;
  path: string; // relative to /knowledge
};

type CharityItem = {
  id: string;
  title: string;
  description: string;
  docs: DocLink[];
};

export default function CharityKnowledgePage() {
  // ---------- SOURCE MODAL STATE (same working behavior as /fr/systems) ----------
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

      const kind = String((data as any)?.kind ?? "").toLowerCase().trim();

      if (kind === "txt" || kind === "text") {
        setSourceKind("text");
        setSourceText(String((data as any)?.text ?? ""));
        return;
      }

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

  // ---------- CHARITY PRODUCT KNOWLEDGE ITEMS ----------
  const charities: CharityItem[] = useMemo(
    () => [
      {
        id: "cfi",
        title: "ChildFund International",
        description:
          "Key facts, legitimacy signals, impact points, and safe answers to common donor questions.",
        docs: [
          {
            label: "Open Product Knowledge",
            path: "charities/ChildFund Product Knowledge.txt",
          },
        ],
      },
      {
        id: "stc",
        title: "Save the Children",
        description:
          "Core mission framing, credibility points, and donor-friendly clarity (what, where, how).",
        docs: [
          {
            label: "Open Product Knowledge",
            path: "charities/Save the Children Product Knowledge.txt",
          },
        ],
      },
      {
        id: "care",
        title: "CARE",
        description:
          "Approved key facts + FAQs. Use for confidence, accuracy, and fast objection prevention.",
        docs: [
          {
            label: "Open Product Knowledge",
            path: "charities/Care Product Knowledge.txt",
          },
        ],
      },
      {
        id: "ifaw",
        title: "IFAW",
        description:
          "Animals + habitat + rescue/disaster response framing. Great for quick impact clarity.",
        docs: [
          {
            label: "Open Product Knowledge",
            path: "charities/IFAW Product Knowledge.txt",
          },
        ],
      },
      {
        id: "tnc",
        title: "The Nature Conservancy",
        description:
          "Conservation, land/water protection, science-backed work, and donor trust signals.",
        docs: [
          {
            label: "Open Product Knowledge",
            path: "charities/TNC Product Knowledge.txt",
          },
        ],
      },
    ],
    []
  );

  function CharityCard({ item }: { item: CharityItem }) {
    return (
      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,0.18)",
          background: "rgba(148,163,184,0.06)",
          padding: 14,
        }}
      >
        <div style={{ fontWeight: 1000, marginBottom: 6 }}>{item.title}</div>
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
          background: "#050505",
          border: "1px solid #1f2937",
          borderRadius: 16,
          padding: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 1000, margin: 0 }}>
              Charity Product Knowledge
            </h1>
            <p style={{ marginTop: 10, color: "#9ca3af", fontWeight: 700 }}>
              Approved facts, mission points, and confidence-building info per charity.
            </p>
          </div>

          <Link
            href="/fr"
            style={{
              alignSelf: "flex-start",
              textDecoration: "none",
              padding: "10px 12px",
              borderRadius: 12,
              fontWeight: 900,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(148,163,184,0.06)",
              color: "#e5e7eb",
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
          {charities.map((c) => (
            <CharityCard key={c.id} item={c} />
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
          Tip: Keep all charity knowledge files under /knowledge/charities so paths stay clean and portable.
        </div>
      </div>

      {/* SOURCE MODAL */}
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
