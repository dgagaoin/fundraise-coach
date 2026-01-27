/*fundraise-coach/app/(app)/library/page.tsx*/
"use client";

import { useEffect, useMemo, useState } from "react";

type LibraryData = {
  [folder: string]: string[];
};

function groupByFolder(files: string[]): LibraryData {
  const grouped: LibraryData = {};

  for (const file of files) {
    const [folder, name] = file.includes("/")
      ? file.split(/\/(.+)/)
      : ["root", file];

    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(name);
  }

  return grouped;
}

export default function LibraryPage() {
  const [data, setData] = useState<LibraryData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // viewer state
  const [openPath, setOpenPath] = useState<string>("");
  const [openContent, setOpenContent] = useState<string>("");
  const [openLoading, setOpenLoading] = useState(false);
  const [openError, setOpenError] = useState<string>("");

  useEffect(() => {
    fetch("/api/library")
      .then((res) => res.json())
      .then((json) => {
        if (!json?.files) {
          setError("No library data found.");
          return;
        }
        setData(groupByFolder(json.files));
      })
      .catch(() => setError("Failed to load library."))
      .finally(() => setLoading(false));
  }, []);

  const folderOrder = useMemo(() => {
    const preferred = [
      "core",
      "systems",
      "rebuttals",
      "charities",
      "coaching",
      "motivation_stories",
      "root",
    ];
    const existing = Object.keys(data);
    const sorted = [
      ...preferred.filter((f) => existing.includes(f)),
      ...existing.filter((f) => !preferred.includes(f)).sort((a, b) => a.localeCompare(b)),
    ];
    return sorted;
  }, [data]);

  async function openFile(fullPath: string) {
    setOpenPath(fullPath);
    setOpenContent("");
    setOpenError("");
    setOpenLoading(true);

    try {
      const res = await fetch(`/api/library/file?path=${encodeURIComponent(fullPath)}`);
      const json = await res.json();

      if (!res.ok) {
        setOpenError(json?.error ?? "Failed to load file.");
        return;
      }

      setOpenContent(String(json?.content ?? ""));
    } catch {
      setOpenError("Failed to load file.");
    } finally {
      setOpenLoading(false);
    }
  }

  function closeViewer() {
    setOpenPath("");
    setOpenContent("");
    setOpenError("");
    setOpenLoading(false);
  }

  return (
    <div
      style={{
        background: "#050505",
        border: "1px solid #1f2937",
        borderRadius: 16,
        padding: 18,
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Knowledge Library</h1>
      <p style={{ marginTop: 8, color: "#9ca3af", fontWeight: 600 }}>
        This shows exactly what Fundraise Coach is trained on today. Click any file to view it.
      </p>

      {loading && <p style={{ marginTop: 14, color: "#93c5fd" }}>Loading library…</p>}

      {error && (
        <p style={{ marginTop: 14, color: "#f87171", fontWeight: 700 }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: openPath ? "1fr 1fr" : "1fr",
            gap: 12,
            marginTop: 16,
            alignItems: "start",
          }}
        >
          {/* LEFT: folder list */}
          <div
            style={{
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(148,163,184,0.06)",
              borderRadius: 14,
              padding: 14,
            }}
          >
            {folderOrder.map((folder) => {
              const files = (data[folder] ?? []).slice().sort((a, b) => a.localeCompare(b));
              return (
                <div key={folder} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 900, marginBottom: 8, color: "#e5e7eb" }}>
                    {folder.toUpperCase()}
                    <span style={{ marginLeft: 8, color: "#94a3b8", fontWeight: 700, fontSize: 12 }}>
                      ({files.length})
                    </span>
                  </div>

                  <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1" }}>
                    {files.map((f) => {
                      const fullPath = folder === "root" ? f : `${folder}/${f}`;
                      return (
                        <li key={fullPath} style={{ marginBottom: 6 }}>
                          <button
                            type="button"
                            onClick={() => openFile(fullPath)}
                            style={{
                              padding: 0,
                              margin: 0,
                              border: "none",
                              background: "transparent",
                              color: "#bae6fd",
                              fontWeight: 800,
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                            title={`Open ${fullPath}`}
                          >
                            {f}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* RIGHT: file viewer */}
          {openPath && (
            <div
              style={{
                border: "1px solid rgba(56,189,248,0.25)",
                background: "rgba(56,189,248,0.06)",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontWeight: 900, color: "#7dd3fc" }}>Viewing:</div>
                <div style={{ color: "#e5e7eb", fontWeight: 800, wordBreak: "break-word" }}>
                  {openPath}
                </div>

                <button
                  type="button"
                  onClick={closeViewer}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    fontWeight: 900,
                    border: "1px solid rgba(148,163,184,0.22)",
                    background: "rgba(148,163,184,0.06)",
                    color: "#e5e7eb",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>

              <div style={{ marginTop: 10 }}>
                {openLoading && <div style={{ color: "#93c5fd", fontWeight: 800 }}>Loading…</div>}

                {openError && (
                  <div style={{ color: "#f87171", fontWeight: 800 }}>
                    {openError}
                  </div>
                )}

                {!openLoading && !openError && (
                  <pre
                    style={{
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid rgba(148,163,184,0.18)",
                      background: "#0b0b0b",
                      color: "#e5e7eb",
                      whiteSpace: "pre-wrap",
                      overflowX: "auto",
                      maxHeight: 520,
                    }}
                  >
                    {openContent || "(empty file)"}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: 18,
          border: "1px solid rgba(56,189,248,0.25)",
          background: "rgba(56,189,248,0.08)",
          borderRadius: 14,
          padding: 14,
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 6, color: "#7dd3fc" }}>
          What this demonstrates
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#bae6fd" }}>
          <li>Transparent AI training sources</li>
          <li>Live connection to the knowledge base</li>
          <li>Easy future expansion (just drop files into folders)</li>
        </ul>
      </div>
    </div>
  );
}
