/* fundraise-coach/app/(app)/team/family-tree/page.tsx */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type NodeType = "diamond" | "circle" | "box"; // diamond=Team Leader, circle=Leader, box=Field Rep

type TreeNode = {
  id: string;
  type: NodeType;
  x: number; // canvas coords
  y: number;
  title: string;

  positive: string;
  workOn: string;
  totalSalesLastWeek: string;
  scoringRatio: string; // percent string
  campaigns: string;
};

type Edge = {
  id: string;
  from: string; // parent node id
  to: string; // child node id
};

const STORAGE_KEY = "fc_team_family_tree_v2_cards";

const CANVAS_W = 2600;
const CANVAS_H = 1600;

const SCALE_MIN = 0.6;
const SCALE_MAX = 1.6;

function uid(prefix = "n") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function shapeStyle(t: NodeType) {
  // Card-style nodes (no more clip-path shapes)
  // Keep these in sync with your card rendering dimensions.
  const w = CARD_W;

  // Approximate card height for line anchoring.
  // Your NodeCard content is ~220-260px depending on text,
  // so we use a stable anchor height for consistent lines.
  const h = 260;

  return { w, h };
}


function roleLabel(t: NodeType) {
  if (t === "diamond") return "Team Leader";
  if (t === "circle") return "Leader";
  return "Field Rep";
}

function borderFor(t: NodeType) {
  // consistent thickness; role-coded color
  if (t === "diamond") return "2px solid rgba(168,85,247,0.85)";
  if (t === "circle") return "2px solid rgba(56,189,248,0.85)";
  return "2px solid rgba(34,197,94,0.80)";
}

function badgeFor(t: NodeType) {
  if (t === "diamond")
    return { text: "Team Leader", color: "#ddd6fe", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.35)" };
  if (t === "circle")
    return { text: "Leader", color: "#7dd3fc", bg: "rgba(56,189,248,0.12)", border: "rgba(56,189,248,0.35)" };
  return { text: "Field Rep", color: "#86efac", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.35)" };
}

const CARD_W = 340;

function NodeCard(props: {
  node: TreeNode;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<TreeNode>) => void;
  onPointerDownCard: (e: React.PointerEvent) => void;

  // drag-to-reconnect parent line
  onStartLinkDrag: (e: React.PointerEvent) => void;

  onDelete?: () => void;
}) {
  const { node, selected } = props;
  const badge = badgeFor(node.type);

  const cardStyle: React.CSSProperties = {
    width: CARD_W,
    borderRadius: 16,
    background: "rgba(148,163,184,0.06)",
    border: selected ? "2px solid rgba(255,255,255,0.35)" : borderFor(node.type),
    boxShadow: selected ? "0 0 0 3px rgba(255,255,255,0.07)" : "none",
    color: "#e5e7eb",
    padding: 12,
    boxSizing: "border-box",
    position: "absolute",
    left: node.x,
    top: node.y,
    userSelect: "none",
    cursor: "grab",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 900,
    color: "rgba(203,213,225,0.92)",
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(148,163,184,0.06)",
    color: "#e5e7eb",
    fontWeight: 850,
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box",
  };

  const miniInputStyle: React.CSSProperties = {
    ...inputStyle,
    padding: "7px 9px",
    fontSize: 12,
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: 38,
    resize: "none",
    lineHeight: 1.25,
  };

  return (
    <div
      data-nodeid={node.id}
      style={cardStyle}
      onPointerDown={props.onPointerDownCard}
      onClick={(e) => {
        e.stopPropagation();
        props.onSelect();
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 1000, fontSize: 13, letterSpacing: 0.2 }}>Node</div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Drag-to-reconnect handle */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              props.onStartLinkDrag(e);
            }}
            title="Drag this handle onto another card to reconnect this node’s parent line"
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.28)",
              background: "rgba(15,23,42,0.55)",
              color: "#cbd5e1",
              display: "grid",
              placeItems: "center",
              fontWeight: 1000,
              cursor: "grab",
            }}
          >
            ↔
          </button>

            {props.onDelete ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onDelete?.();
                }}
                title="Delete node"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  border: "1px solid rgba(248,113,113,0.35)",
                  background: "rgba(248,113,113,0.12)",
                  color: "#fecaca",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 1000,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                ×
              </button>
            ) : null}

          <div
            style={{
              fontSize: 11,
              fontWeight: 1000,
              color: badge.color,
              border: `1px solid ${badge.border}`,
              background: badge.bg,
              padding: "6px 10px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {badge.text}
          </div>
        </div>
      </div>

      {/* Role dropdown */}
      <div style={{ marginTop: 10 }}>
        <div style={labelStyle}>Role</div>
        <select
          value={node.type}
          onChange={(e) => props.onChange({ type: e.target.value as NodeType })}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
          ...miniInputStyle,
          fontWeight: 900,
          cursor: "pointer",
          background: "rgba(15,23,42,0.85)",
          color: "#e5e7eb",
          border: "1px solid rgba(148,163,184,0.28)",
          colorScheme: "dark", // ✅ makes native dropdown render dark in most browsers
        }}

        >
          <option value="diamond" style={{ background: "#0b1220", color: "#e5e7eb" }}>Team Leader</option>
          <option value="circle"  style={{ background: "#0b1220", color: "#e5e7eb" }}>Leader</option>
          <option value="box"     style={{ background: "#0b1220", color: "#e5e7eb" }}>Field Rep</option>

        </select>
      </div>

      {/* Name */}
      <div style={{ marginTop: 10 }}>
        <div style={labelStyle}>Name</div>
        <input
          value={node.title}
          onChange={(e) => props.onChange({ title: e.target.value })}
          placeholder={node.type === "diamond" ? "Team Leader (e.g., Callum)" : node.type === "circle" ? "Leader name" : "FR name"}
          style={inputStyle}
          onPointerDown={(e) => e.stopPropagation()}
        />
      </div>

      {/* Metrics */}
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <div style={labelStyle}>Sales (wk)</div>
          <input
            value={node.totalSalesLastWeek}
            onChange={(e) => props.onChange({ totalSalesLastWeek: e.target.value })}
            placeholder="12"
            style={miniInputStyle}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>
        <div>
          <div style={labelStyle}>Scoring %</div>
          <input
            value={node.scoringRatio}
            onChange={(e) => props.onChange({ scoringRatio: e.target.value })}
            placeholder="80%"
            style={miniInputStyle}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Campaigns */}
      <div style={{ marginTop: 10 }}>
        <div style={labelStyle}>Campaigns</div>
        <input
          value={node.campaigns}
          onChange={(e) => props.onChange({ campaigns: e.target.value })}
          placeholder="CARE, IFAW"
          style={miniInputStyle}
          onPointerDown={(e) => e.stopPropagation()}
        />
      </div>

      {/* Positive / Work on */}
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
        <div>
          <div style={labelStyle}>Positive</div>
          <textarea
            value={node.positive}
            onChange={(e) => props.onChange({ positive: e.target.value })}
            placeholder="What they did well"
            style={textareaStyle}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>
        <div>
          <div style={labelStyle}>Work on</div>
          <textarea
            value={node.workOn}
            onChange={(e) => props.onChange({ workOn: e.target.value })}
            placeholder="What to improve"
            style={textareaStyle}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>

    </div>
  );
}

export default function FamilyTreePage() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [savedAt, setSavedAt] = useState<string>("");

  const [scale, setScale] = useState<number>(1);

  // Drag state
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    nodeStartX: number;
    nodeStartY: number;
  } | null>(null);

  // Link-drag state (rewire parent)
  const linkRef = useRef<{
    active: boolean;
    childId: string;
    startClientX: number;
    startClientY: number;
    clientX: number;
    clientY: number;
  } | null>(null);

  // Edge-end dragging (drag the line endpoint to a new parent)
  const edgeDragRef = useRef<{
    active: boolean;
    edgeId: string;
    childId: string;
    clientX: number;
    clientY: number;
  } | null>(null);


  // Load / init
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.nodes?.length) setNodes(parsed.nodes);
        if (parsed?.edges?.length) setEdges(parsed.edges);
        if (parsed?.selectedId) setSelectedId(parsed.selectedId);
        return;
      }
    } catch {
      // ignore
    }

    // Default: create Team Leader near canvas center
    const initial: TreeNode = {
      id: uid("diamond"),
      type: "diamond",
      x: Math.round(CANVAS_W / 2 - CARD_W / 2),
      y: Math.round(CANVAS_H / 2 - 160),
      title: "Team Leader",
      positive: "",
      workOn: "",
      totalSalesLastWeek: "",
      scoringRatio: "",
      campaigns: "",
    };
    setNodes([initial]);
    setSelectedId(initial.id);

    requestAnimationFrame(() => centerOnNode(initial.id, 1));
  }, []);

  // Autosave
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges, selectedId }));
        setSavedAt(new Date().toLocaleString());
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(t);
  }, [nodes, edges, selectedId]);

  const diamondId = useMemo(() => nodes.find((n) => n.type === "diamond")?.id ?? "", [nodes]);

  function updateNode(id: string, patch: Partial<TreeNode>) {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  // Enforce parent rules:
  // - each child has at most 1 parent (one incoming edge)
  // - parent cannot be Field Rep (box)
  function setParent(childId: string, newParentId: string) {
    if (!childId || !newParentId) return;
    if (childId === newParentId) return;

    const parent = nodes.find((n) => n.id === newParentId);
    if (!parent) return;

    // parent must not be Field Rep
    if (parent.type === "box") return;

    setEdges((prev) => {
      const hasIncoming = prev.some((e) => e.to === childId);
      if (!hasIncoming) return [...prev, { id: uid("e"), from: newParentId, to: childId }];

      return prev.map((e) => (e.to === childId ? { ...e, from: newParentId } : e));
    });
  }

  function addNode(type: NodeType) {
    const parentId = selectedId || diamondId;

    const parent = nodes.find((n) => n.id === parentId);
    const spawnX = parent ? parent.x + 420 + Math.random() * 40 : CANVAS_W / 2;
    const spawnY = parent ? parent.y + (Math.random() * 80 - 40) : CANVAS_H / 2;

    const n: TreeNode = {
      id: uid(type),
      type,
      x: Math.round(clamp(spawnX, 20, CANVAS_W - CARD_W - 20)),
      y: Math.round(clamp(spawnY, 20, CANVAS_H - 220)),
      title: roleLabel(type),
      positive: "",
      workOn: "",
      totalSalesLastWeek: "",
      scoringRatio: "",
      campaigns: "",
    };

    setNodes((prev) => [...prev, n]);

    const from = parentId && parentId !== n.id ? parentId : diamondId;
    if (from && from !== n.id) {
      setEdges((prev) => [...prev, { id: uid("e"), from, to: n.id }]);
    }
    setSelectedId(n.id);
  }

  function removeNode(id: string) {
    const node = nodes.find((n) => n.id === id);
    if (node?.type === "diamond") return; // keep TL in MVP

    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
    if (selectedId === id) setSelectedId(diamondId);
  }

  function clearAll() {
    if (!confirm("Clear the entire family tree canvas? (Local-only)")) return;

    const d: TreeNode = {
      id: uid("diamond"),
      type: "diamond",
      x: Math.round(CANVAS_W / 2 - CARD_W / 2),
      y: Math.round(CANVAS_H / 2 - 160),
      title: "Team Leader",
      positive: "",
      workOn: "",
      totalSalesLastWeek: "",
      scoringRatio: "",
      campaigns: "",
    };
    setNodes([d]);
    setEdges([]);
    setSelectedId(d.id);
    setScale(1);

    requestAnimationFrame(() => centerOnNode(d.id, 1));

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  function centerOnNode(nodeId: string, nextScale = scale) {
    const sc = scrollRef.current;
    const node = nodes.find((n) => n.id === nodeId);
    if (!sc || !node) return;

    const nodeCx = node.x + CARD_W / 2;
    const nodeCy = node.y + 140;

    const viewW = sc.clientWidth;
    const viewH = sc.clientHeight;

    const targetLeft = nodeCx * nextScale - viewW / 2;
    const targetTop = nodeCy * nextScale - viewH / 2;

    sc.scrollLeft = Math.max(0, targetLeft);
    sc.scrollTop = Math.max(0, targetTop);
  }

  // Drag node (accounts for zoom scale)
  function onNodePointerDown(nodeId: string, e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();

    const n = nodes.find((x) => x.id === nodeId);
    if (!n) return;

    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    dragRef.current = {
      id: nodeId,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: n.x,
      nodeStartY: n.y,
    };
  }

  function onWrapPointerMove(e: React.PointerEvent) {
    // live preview line while relinking
    if (linkRef.current?.active) {
      linkRef.current.clientX = e.clientX;
      linkRef.current.clientY = e.clientY;
      // trigger rerender
      setTick((t) => t + 1);
      return;
    }

    // live preview while dragging an edge endpoint
    if (edgeDragRef.current?.active) {
      edgeDragRef.current.clientX = e.clientX;
      edgeDragRef.current.clientY = e.clientY;
      setTick((t) => t + 1);
      return;
    }

    if (!dragRef.current) return;

    const d = dragRef.current;
    const dx = (e.clientX - d.startX) / scale;
    const dy = (e.clientY - d.startY) / scale;

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== d.id) return n;
        const newX = clamp(d.nodeStartX + dx, 20, CANVAS_W - CARD_W - 20);
        const newY = clamp(d.nodeStartY + dy, 20, CANVAS_H - 220);
        return { ...n, x: Math.round(newX), y: Math.round(newY) };
      })
    );
  }

  function onWrapPointerUp(e: React.PointerEvent) {
    dragRef.current = null;

    // finish relink
    const lr = linkRef.current;
    if (lr?.active) {
      linkRef.current = null;

      // find card under cursor
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const targetCard = el?.closest?.("[data-nodeid]") as HTMLElement | null;
      const targetId = targetCard?.dataset?.nodeid || "";

      if (targetId && targetId !== lr.childId) {
        setParent(lr.childId, targetId);
      }
      setTick((t) => t + 1);
    }

    const er = edgeDragRef.current;
    if (er?.active) {
      edgeDragRef.current = null;

      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const targetCard = el?.closest?.("[data-nodeid]") as HTMLElement | null;
      const targetId = targetCard?.dataset?.nodeid || "";

      if (targetId && targetId !== er.childId) {
        setParent(er.childId, targetId);
      }
      setTick((t) => t + 1);
    }

  }

  // relink start: dragging the handle on a card means "this node's parent will be changed"
  function onStartLinkDrag(childId: string, e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();

    // child cannot be Team Leader (it has no parent)
    const child = nodes.find((n) => n.id === childId);
    if (!child || child.type === "diamond") return;

    linkRef.current = {
      active: true,
      childId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      clientX: e.clientX,
      clientY: e.clientY,
    };

    // capture pointer on wrapper so we keep getting move/up events
    wrapRef.current?.setPointerCapture?.(e.pointerId);
    setTick((t) => t + 1);
  }

  function onStartEdgeDrag(edgeId: string, childId: string, e: React.PointerEvent) {
  e.preventDefault();
  e.stopPropagation();

  const child = nodes.find((n) => n.id === childId);
  if (!child || child.type === "diamond") return;

    edgeDragRef.current = {
      active: true,
      edgeId,
      childId,
      clientX: e.clientX,
      clientY: e.clientY,
    };

    wrapRef.current?.setPointerCapture?.(e.pointerId);
    setTick((t) => t + 1);
  }


  // cheap rerender tick for link preview
  const [tick, setTick] = useState(0);

  // Lines
  const lineData = useMemo(() => {
  const map = new Map<string, TreeNode>();
  nodes.forEach((n) => map.set(n.id, n));

  return edges
    .map((e: Edge) => {
      const a = map.get(e.from);
      const b = map.get(e.to);
      if (!a || !b) return null;

      const as = shapeStyle(a.type);
      const bs = shapeStyle(b.type);

      const ax = a.x + as.w / 2;
      const ay = a.y + as.h / 2;
      const bx = b.x + bs.w / 2;
      const by = b.y + 16; // near the top edge of the card

      return { id: e.id, ax, ay, bx, by, to: e.to };
    })
    .filter(Boolean) as Array<{
      id: string;
      ax: number;
      ay: number;
      bx: number;
      by: number;
      to: string;
    }>;
}, [nodes, edges]);


  // Link preview line (in canvas coords)
  const previewLine = useMemo(() => {
    const lr = linkRef.current;
    const sc = scrollRef.current;
    if (!lr?.active || !sc) return null;

    const child = nodes.find((n) => n.id === lr.childId);
    if (!child) return null;

    // Convert client coords -> scroll container local -> scaled canvas coords
    const scRect = sc.getBoundingClientRect();
    const localX = lr.clientX - scRect.left + sc.scrollLeft;
    const localY = lr.clientY - scRect.top + sc.scrollTop;

    const canvasX = localX / scale;
    const canvasY = localY / scale;

    const bx = child.x + CARD_W / 2;
    const by = child.y + 20;

    return { ax: canvasX, ay: canvasY, bx, by };
  }, [nodes, scale, tick]);

  return (
    <main
      style={{
        maxWidth: 1400,
        margin: "32px auto",
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
        {/* Top header */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 1000 }}>Team Family Tree</h1>
            <div style={{ marginTop: 6, color: "#94a3b8", fontWeight: 800, fontSize: 13 }}>
              One-look snapshot org map. Drag cards. Drag a line (or the endpoint dot) onto another card to reconnect the parent.
            </div>
            <div style={{ marginTop: 6, color: "#64748b", fontWeight: 800, fontSize: 12 }}>
              {savedAt ? `Autosaved: ${savedAt}` : "Autosave ready."}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Link
              href="/team"
              style={{
                textDecoration: "none",
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 900,
                border: "1px solid rgba(148,163,184,0.22)",
                background: "rgba(148,163,184,0.06)",
                color: "#e5e7eb",
              }}
            >
              ← Back to Leaders HQ
            </Link>

            <button
              onClick={clearAll}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 900,
                border: "1px solid rgba(248,113,113,0.28)",
                background: "rgba(248,113,113,0.10)",
                color: "#fecaca",
                cursor: "pointer",
              }}
            >
              Clear Canvas
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div
          style={{
            marginTop: 14,
            borderRadius: 14,
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(148,163,184,0.06)",
            padding: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => addNode("circle")}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000,
                border: "1px solid rgba(56,189,248,0.35)",
                background: "rgba(56,189,248,0.10)",
                color: "#7dd3fc",
                cursor: "pointer",
              }}
            >
              + Add Leader
            </button>

            <button
              type="button"
              onClick={() => addNode("box")}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000,
                border: "1px solid rgba(34,197,94,0.30)",
                background: "rgba(34,197,94,0.10)",
                color: "#86efac",
                cursor: "pointer",
              }}
            >
              + Add Field Rep
            </button>

            <button
              type="button"
              onClick={() => selectedId && centerOnNode(selectedId, scale)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000,
                border: "1px solid rgba(148,163,184,0.22)",
                background: "rgba(148,163,184,0.06)",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
              title="Center view on selected node"
            >
              Center Selected
            </button>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 8 }}>
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(SCALE_MIN, Math.round((s - 0.1) * 10) / 10))}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000,
                border: "1px solid rgba(148,163,184,0.22)",
                background: "rgba(148,163,184,0.06)",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
              title="Zoom out"
            >
              −
            </button>

            <button
              type="button"
              onClick={() => setScale((s) => Math.min(SCALE_MAX, Math.round((s + 0.1) * 10) / 10))}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000,
                border: "1px solid rgba(148,163,184,0.22)",
                background: "rgba(148,163,184,0.06)",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
              title="Zoom in"
            >
              +
            </button>

            <button
              type="button"
              onClick={() => setScale(1)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000,
                border: "1px solid rgba(148,163,184,0.22)",
                background: "rgba(148,163,184,0.06)",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
              title="Reset zoom"
            >
              100%
            </button>

            <div
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000,
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(15,23,42,0.55)",
                color: "#cbd5e1",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
              }}
            >
              {Math.round(scale * 100)}%
            </div>
          </div>

          </div>
          <div style={{ color: "#cbd5e1", fontWeight: 900, fontSize: 12, opacity: 0.9 }}>
            Selected:{" "}
            <span style={{ color: "#e5e7eb" }}>
              {nodes.find((n) => n.id === selectedId)?.title || "None"}
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={scrollRef}
          style={{
            marginTop: 14,
            borderRadius: 16,
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(2,6,23,0.35)",
            height: "72vh",
            overflow: "auto",
            position: "relative",
          }}
        >

          <div
            ref={wrapRef}
            onClick={() => setSelectedId(diamondId)}
            onPointerMove={onWrapPointerMove}
            onPointerUp={onWrapPointerUp}
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              position: "relative",
              transform: `scale(${scale})`,
              transformOrigin: "0 0",
              touchAction: "pan-x pan-y",
            }}
          >
            {/* Lines */}
            <svg
              width={CANVAS_W}
              height={CANVAS_H}
              style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}
            >
              {lineData.map((l) => (
                <g key={l.id}>
                  {/* fat invisible hit target so you can grab the line easily */}
                    <line
                      x1={l.ax}
                      y1={l.ay}
                      x2={l.bx}
                      y2={l.by}
                      stroke="transparent"
                      strokeWidth={18}
                      style={{ pointerEvents: "stroke", cursor: "grab" }}
                      onPointerDown={(e) => onStartEdgeDrag(l.id, l.to, e)}
                    />

                    {/* visible line */}
                    <line
                      x1={l.ax}
                      y1={l.ay}
                      x2={l.bx}
                      y2={l.by}
                      stroke="rgba(148,163,184,0.55)"
                      strokeWidth={2}
                      style={{ pointerEvents: "none" }}
                    />

                  {/* draggable endpoint dot (child side) */}
                  <circle
                    cx={l.bx}
                    cy={l.by}
                    r={10}
                    fill="rgba(226,232,240,0.85)"
                    stroke="rgba(15,23,42,0.9)"
                    strokeWidth={2}
                    style={{ pointerEvents: "auto", cursor: "grab" }}
                    onPointerDown={(e) => onStartEdgeDrag(l.id, l.to, e)}
                  />
                </g>
              ))}

              {/* Preview line while dragging reconnect */}
              {previewLine ? (
                <line
                  x1={previewLine.ax}
                  y1={previewLine.ay}
                  x2={previewLine.bx}
                  y2={previewLine.by}
                  stroke="rgba(226,232,240,0.65)"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  style={{ pointerEvents: "none" }}
                />
              ) : null}
            </svg>

            {/* Nodes */}
            {nodes.map((n) => (
              <NodeCard
                key={n.id}
                node={n}
                selected={n.id === selectedId}
                onSelect={() => setSelectedId(n.id)}
                onChange={(patch) => updateNode(n.id, patch)}
                onPointerDownCard={(e) => onNodePointerDown(n.id, e)}
                onStartLinkDrag={(e) => onStartLinkDrag(n.id, e)}
                onDelete={n.type === "diamond" ? undefined : () => removeNode(n.id)}
              />
            ))}

          </div>
        </div>
      </div>
    </main>
  );
}
