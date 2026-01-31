"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

function useIsMobile(breakpointPx = 820) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [breakpointPx]);

  return isMobile;
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

  // folder UI state (session-only)
  const [folderOpen, setFolderOpen] = useState<Record<string, boolean>>({});
  const [folderPage, setFolderPage] = useState<Record<string, number>>({});

  const PAGE_SIZE = 12;

  const isMobile = useIsMobile(860);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/library")
      .then((res) => res.json())
      .then((json) => {
        if (!json?.files) {
          setError("No library data found.");
          return;
        }

        const grouped = groupByFolder(json.files);
        setData(grouped);

        // default: open all folders (can tweak later)
        setFolderOpen((prev) => {
          const next = { ...prev };
          for (const k of Object.keys(grouped)) {
            if (next[k] === undefined) next[k] = true;
          }
          return next;
        });

        // default: page 1 for all folders
        setFolderPage((prev) => {
          const next = { ...prev };
          for (const k of Object.keys(grouped)) {
            if (next[k] === undefined) next[k] = 1;
          }
          return next;
        });
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
    return [
      ...preferred.filter((f) => existing.includes(f)),
      ...existing.filter((f) => !preferred.includes(f)).sort((a, b) => a.localeCompare(b)),
    ];
  }, [data]);

  function toggleFolder(folder: string) {
    setFolderOpen((prev) => ({ ...prev, [folder]: !(prev[folder] ?? true) }));
  }

  function getPageFor(folder: string) {
    return folderPage[folder] ?? 1;
  }

  function setPageFor(folder: string, page: number) {
    setFolderPage((prev) => ({ ...prev, [folder]: page }));
  }

  async function openFile(fullPath: string) {
  const isPdf = fullPath.toLowerCase().endsWith(".pdf");

  setOpenPath(fullPath);
  setOpenContent("");
  setOpenError("");

  // PDFs are streamed via /api/pdf, no JSON fetch needed here
  if (isPdf) {
    setOpenLoading(false);

    // Mobile UX: scroll viewer into view after selecting a file
    if (isMobile) {
      setTimeout(
        () => viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50
      );
    }
    return;
  }

  // TXT path (existing behavior)
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

    // Mobile UX: scroll viewer into view after selecting a file
    if (isMobile) {
      setTimeout(
        () => viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50
      );
    }
  }
}


  function closeViewer() {
    setOpenPath("");
    setOpenContent("");
    setOpenError("");
    setOpenLoading(false);
  }

  const gridColumns = isMobile ? "1fr" : openPath ? "1fr 1fr" : "1fr";


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
        This shows exactly what Fundraise Coach is trained on today. Tap any file to view it.
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
            gridTemplateColumns: gridColumns,
            gap: 12,
            marginTop: 16,
            alignItems: "start",
          }}
        >
          {/* LIST */}
          <div
            style={{
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(148,163,184,0.06)",
              borderRadius: 14,
              padding: 14,
              // Desktop: keep list usable even with many files
              maxHeight: isMobile ? undefined : 620,
              overflow: isMobile ? undefined : "auto",
            }}
          >
            {folderOrder.map((folder) => {
              const files = (data[folder] ?? []).slice().sort((a, b) => a.localeCompare(b));
              return (
                <div key={folder} style={{ marginBottom: 14 }}>
  {/* Folder header row */}
  <button
    type="button"
    onClick={() => toggleFolder(folder)}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      padding: "8px 10px",
      borderRadius: 12,
      border: "1px solid rgba(148,163,184,0.18)",
      background: "rgba(148,163,184,0.06)",
      cursor: "pointer",
      textAlign: "left",
    }}
    aria-expanded={!!folderOpen[folder]}
    title={folderOpen[folder] ? "Collapse" : "Expand"}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 14, lineHeight: 1 }}>
        {folderOpen[folder] ? "▾" : "▸"}
      </span>
      <span style={{ fontWeight: 900, color: "#e5e7eb" }}>
        {folder.toUpperCase()}
      </span>
      <span style={{ color: "#94a3b8", fontWeight: 800, fontSize: 12 }}>
        ({files.length})
      </span>
    </div>

    <span style={{ color: "#9ca3af", fontWeight: 800, fontSize: 12 }}>
      {folderOpen[folder] ? "Hide" : "Show"}
    </span>
  </button>

  {/* Folder body */}
  {folderOpen[folder] && (() => {
    const total = files.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(getPageFor(folder), totalPages);

    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const pageFiles = files.slice(startIndex, endIndex);

    const canPrev = page > 1;
    const canNext = page < totalPages;

    // build page numbers (simple + clean)
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div style={{ marginTop: 10, paddingLeft: 6 }}>
        {/* List */}
        <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1" }}>
          {pageFiles.map((f) => {
            const fullPath = folder === "root" ? f : `${folder}/${f}`;
            const active = fullPath === openPath;

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
                    color: active ? "#93c5fd" : "#bae6fd",
                    fontWeight: 850,
                    cursor: "pointer",
                    textAlign: "left",
                    textDecoration: active ? "underline" : "none",
                  }}
                  title={`Open ${fullPath}`}
                >
                  {f}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Pagination (only if needed) */}
        {totalPages > 1 && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => canPrev && setPageFor(folder, page - 1)}
              disabled={!canPrev}
              style={{
                padding: "6px 10px",
                borderRadius: 12,
                fontWeight: 900,
                border: "1px solid rgba(148,163,184,0.22)",
                background: "rgba(148,163,184,0.06)",
                color: canPrev ? "#e5e7eb" : "#64748b",
                cursor: canPrev ? "pointer" : "not-allowed",
              }}
              aria-label="Previous page"
              title="Previous page"
            >
              ←
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {pages.map((p) => {
                const active = p === page;
                return (
                  <button
                    key={`${folder}-page-${p}`}
                    type="button"
                    onClick={() => setPageFor(folder, p)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 12,
                      fontWeight: 950,
                      border: active
                        ? "1px solid rgba(56,189,248,0.45)"
                        : "1px solid rgba(148,163,184,0.22)",
                      background: active ? "rgba(56,189,248,0.10)" : "rgba(148,163,184,0.06)",
                      color: active ? "#7dd3fc" : "#e5e7eb",
                      cursor: "pointer",
                    }}
                    aria-label={`Page ${p}`}
                    title={`Page ${p}`}
                  >
                    {p}
                  </button>
                      );
                      })}
                   </div>
                    <button
                      type="button"
                      onClick={() => canNext && setPageFor(folder, page + 1)}
                      disabled={!canNext}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 12,
                        fontWeight: 900,
                        border: "1px solid rgba(148,163,184,0.22)",
                        background: "rgba(148,163,184,0.06)",
                        color: canNext ? "#e5e7eb" : "#64748b",
                        cursor: canNext ? "pointer" : "not-allowed",
                      }}
                      aria-label="Next page"
                      title="Next page"
                    >
                      →
                    </button>                     
                    <span style={{ color: "#94a3b8", fontWeight: 800, fontSize: 12 }}>
                      Page {page} of {totalPages}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

              );
            })}
          </div>

          {/* VIEWER (Desktop right column) */}
          {!isMobile && openPath && (
            <div
              style={{
                border: "1px solid rgba(56,189,248,0.25)",
                background: "rgba(56,189,248,0.06)",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <Viewer
                openPath={openPath}
                openContent={openContent}
                openLoading={openLoading}
                openError={openError}
                closeViewer={closeViewer}
              />
            </div>
          )}

          {/* VIEWER (Mobile modal overlay) */}
              {isMobile && openPath && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9999,
                    background: "rgba(0,0,0,0.72)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 14,
                  }}
                  onClick={closeViewer}
                >
                  <div
                    ref={viewerRef}
                    style={{
                      width: "100%",
                      maxWidth: 720,
                      maxHeight: "85vh",
                      overflow: "auto",
                      border: "1px solid rgba(56,189,248,0.30)",
                      background: "rgba(11,11,11,0.98)",
                      borderRadius: 16,
                      padding: 14,
                      boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
                    }}
                    onClick={(e) => e.stopPropagation()} // prevents closing when tapping inside
                  >
                    <Viewer
                      openPath={openPath}
                      openContent={openContent}
                      openLoading={openLoading}
                      openError={openError}
                      closeViewer={closeViewer}
                      mobile
                      modal
                    />
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
          <li>Easy future expansion (drop new files into folders)</li>
        </ul>
      </div>
    </div>
  );
}

function Viewer(props: {
  openPath: string;
  openContent: string;
  openLoading: boolean;
  openError: string;
  closeViewer: () => void;
  mobile?: boolean;
  modal?: boolean;
}) {

  const { openPath, openContent, openLoading, openError, closeViewer, mobile, modal } = props;

  return (
    <>
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
        <div style={{ color: "#e5e7eb", fontWeight: 800, wordBreak: "break-word" }}>{openPath}</div>

        <button
            type="button"
                onClick={closeViewer}
                  style={{
                    padding: modal ? "10px 12px" : "8px 10px",
                    borderRadius: 12,
                    fontWeight: 1000,
                    border: "1px solid rgba(148,163,184,0.22)",
                    background: "rgba(148,163,184,0.06)",
                    color: "#e5e7eb",
                    cursor: "pointer",
                    fontSize: modal ? 16 : 14,
                    lineHeight: 1,
                  }}
              aria-label="Close viewer"
            title="Close"
            >
              {modal ? "✕" : "Close"}
            </button>

                  </div>

      <div style={{ marginTop: 10 }}>
        {openLoading && <div style={{ color: "#93c5fd", fontWeight: 800 }}>Loading…</div>}

        {openError && <div style={{ color: "#f87171", fontWeight: 800 }}>{openError}</div>}

        {!openLoading && !openError && (() => {
        const isPdf = openPath.toLowerCase().endsWith(".pdf");

        if (isPdf) {
          const src = `/api/pdf?path=${encodeURIComponent(openPath)}`;

          return (
            <div
              style={{
                marginTop: 10,
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.18)",
                overflow: "hidden",
                background: "#0b0b0b",
              }}
            >
              <iframe
                src={src}
                title={openPath}
                style={{
                  width: "100%",
                  height: mobile ? 420 : 520,
                  border: "none",
                  display: "block",
                  background: "#0b0b0b",
                }}
              />
            </div>
          );
        }

        return (
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
              maxHeight: mobile ? 420 : 520,
            }}
          >
            {openContent || "(empty file)"}
          </pre>
        );
      })()}
      </div>
    </>
  );
}
