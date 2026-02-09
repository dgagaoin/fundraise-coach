/*fundraise-coach/app/(app)/team/smart-goals/page.tsx*/
"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";

type SmartGoal = {
  id: string;
  createdAt: number;
  title: string;

  specific: string;
  measurable: string;
  achievable: string;
  reason: string;
  timeFrame: string;

  finalReflection: string;
};

const STORAGE_KEY = "fc_smart_goals_v1";

function uid() {
  return Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

const emptyGoal = (): SmartGoal => ({
  id: uid(),
  createdAt: Date.now(),
  title: "Untitled Goal",

  specific: "",
  measurable: "",
  achievable: "",
  reason: "",
  timeFrame: "",

  finalReflection: "",
});

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 900, color: "#cbd5e1", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function TextInput(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  style?: CSSProperties;
}) {
  return (
    <input
      className="fcInput"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(148,163,184,0.18)",
        background: "rgba(148,163,184,0.06)",
        color: "#e5e7eb",
        fontWeight: 850,
        fontSize: 14,
        outline: "none",
        ...props.style,
      }}
    />
  );
}

function TextArea(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
  style?: CSSProperties;
}) {
  return (
    <textarea
      className="fcTextarea"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      rows={props.rows ?? 6}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(148,163,184,0.18)",
        background: "rgba(148,163,184,0.06)",
        color: "#e5e7eb",
        fontWeight: 800,
        fontSize: 14,
        outline: "none",
        resize: "vertical",
        lineHeight: 1.35,

        height: "100%",
        minHeight: 120,

        ...props.style,
      }}
    />
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid rgba(148,163,184,0.20)",
        background: "rgba(148,163,184,0.06)",
        color: "#cbd5e1",
        fontWeight: 900,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function SmartGoalsPage() {
  const [goals, setGoals] = useState<SmartGoal[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [savedAt, setSavedAt] = useState<string>("");

  const activeGoal = useMemo(() => goals.find((g) => g.id === activeId) ?? null, [goals, activeId]);

  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SmartGoal[];
        if (Array.isArray(parsed) && parsed.length) {
          setGoals(parsed);
          setActiveId(parsed[0].id);
          return;
        }
      }
    } catch {
      // ignore
    }

    // first-time seed
    const seed = emptyGoal();
    setGoals([seed]);
    setActiveId(seed.id);
  }, []);

  // Autosave
  useEffect(() => {
    if (!goals.length) return;

    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
        setSavedAt(new Date().toLocaleString());
      } catch {
        // ignore
      }
    }, 350);

    return () => clearTimeout(t);
  }, [goals]);

  function updateActive(patch: Partial<SmartGoal>) {
    setGoals((prev) =>
      prev.map((g) => (g.id === activeId ? { ...g, ...patch } : g))
    );
  }

  function addGoal() {
    const next = emptyGoal();
    setGoals((prev) => [next, ...prev]);
    setActiveId(next.id);
  }

  function clearAll() {
    const ok = confirm("Are you sure you want to clear all your smart goals?");
    if (!ok) return;

    const seed = emptyGoal();
    setGoals([seed]);
    setActiveId(seed.id);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([seed]));
      setSavedAt(new Date().toLocaleString());
    } catch {
      // ignore
    }
  }

  function deleteActiveGoal() {
    const ok = confirm("Are you sure you want to clear this SMART Goal?");
    if (!ok) return;

    setGoals((prev) => {
      const remaining = prev.filter((g) => g.id !== activeId);
      const nextList = remaining.length ? remaining : [emptyGoal()];
      // choose new active
      setActiveId(nextList[0].id);
      return nextList;
    });
  }

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "40px auto",
        padding: 16,
        color: "#e5e7eb",
        fontFamily: "sans-serif",
      }}
    >
      {/* Small global styles for placeholders/scrollbars */}
      <style jsx global>{`
        .fcInput::placeholder,
        .fcTextarea::placeholder {
          color: rgba(148, 163, 184, 0.75);
          font-weight: 800;
          font-size: 13px;
          line-height: 1.35;
        }
        .fcTextarea {
          scrollbar-width: none;
        }
        .fcTextarea::-webkit-scrollbar {
          width: 0;
          height: 0;
        }
      `}</style>

      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,0.18)",
          background: "#050505",
          padding: 18,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 1000 }}>SMART Goal Planner</h1>
              <Pill>For Individuals & Teams (Sales + Marketing Leaders)</Pill>
            </div>

            <div style={{ marginTop: 6, color: "#94a3b8", fontWeight: 850, fontSize: 13 }}>
              Usable for individual growth or full team planning. Local-first. Autosaves on typing.
            </div>

            <div style={{ marginTop: 6, color: "#64748b", fontWeight: 850, fontSize: 12 }}>
              {savedAt ? `Autosaved: ${savedAt}` : "Autosave ready."}
            </div>

            <div style={{ marginTop: 8, color: "#cbd5e1", fontWeight: 900, fontSize: 12 }}>
              Credited origin: <span style={{ color: "#93c5fd" }}>George T. Doran</span> (often cited in business writing for introducing SMART goals).
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
              onClick={addGoal}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 900,
                border: "1px solid rgba(34,197,94,0.28)",
                background: "rgba(34,197,94,0.12)",
                color: "#bbf7d0",
                cursor: "pointer",
              }}
              title="Create another SMART Goal"
            >
              + New Goal
            </button>
          </div>
        </div>

        {/* What is SMART + org tweak */}
        <div
          style={{
            marginTop: 14,
            borderRadius: 14,
            border: "1px solid rgba(34,197,94,0.18)",
            background: "rgba(34,197,94,0.06)",
            padding: 14,
          }}
        >
          <div style={{ fontWeight: 1000, marginBottom: 6 }}>What is a SMART Goal?</div>
          <div style={{ color: "#cbd5e1", fontWeight: 800, lineHeight: 1.45, fontSize: 13 }}>
            SMART goals are a popular goal-setting framework used in business and coaching to turn vague intentions into clear outcomes.
            The concept is commonly attributed to management writing from the early 1980s and has since been widely adopted across sales,
            education, and performance coaching. In our organization, we use <b>R = Reason</b> (your “Why”) to drive consistency and resilience.
          </div>
        </div>

        {/* Main layout */}
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "minmax(220px, 0.75fr) minmax(0, 2.25fr)",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          {/* LEFT: list */}
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(148,163,184,0.04)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              minHeight: 720,
            }}
          >
            <div style={{ fontWeight: 1000 }}>Your SMART Goals</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {goals.map((g) => {
                const active = g.id === activeId;
                return (
                  <button
                    key={g.id}
                    onClick={() => setActiveId(g.id)}
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderRadius: 12,
                      border: active
                        ? "1px solid rgba(56,189,248,0.35)"
                        : "1px solid rgba(148,163,184,0.18)",
                      background: active ? "rgba(56,189,248,0.10)" : "rgba(148,163,184,0.06)",
                      color: "#e5e7eb",
                      cursor: "pointer",
                    }}
                    title="Select goal"
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                      <div style={{ fontWeight: 1000, fontSize: 13 }}>
                        {g.title?.trim() ? g.title.trim() : "Untitled Goal"}
                      </div>
                      <div style={{ color: "rgba(148,163,184,0.9)", fontWeight: 900, fontSize: 11 }}>
                        {new Date(g.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ marginTop: 4, color: "rgba(148,163,184,0.9)", fontWeight: 850, fontSize: 12 }}>
                      Tap to edit
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Clear All (BOTTOM of left list) */}
            <button
              onClick={clearAll}
              style={{
                marginTop: 8,
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 950,
                border: "1px solid rgba(248,113,113,0.35)",
                background: "rgba(248,113,113,0.12)",
                color: "#fecaca",
                cursor: "pointer",
              }}
              title="Clear all saved SMART Goals"
            >
              Clear All Saved SMART Goals
            </button>
          </div>

          {/* RIGHT: editor */}
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(148,163,184,0.04)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minHeight: 720,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <FieldLabel>Goal Title (quick label)</FieldLabel>
                <TextInput
                  value={activeGoal?.title ?? ""}
                  onChange={(v) => updateActive({ title: v })}
                  placeholder="Example: High Roll Road Trip (March)"
                />
                <div style={{ marginTop: 6, color: "rgba(148,163,184,0.9)", fontWeight: 850, fontSize: 12 }}>
                  Tip: Keep it short. This is what shows in your goal list.
                </div>
              </div>
            </div>

            {/* S */}
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(148,163,184,0.06)",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>S — Specific</div>
              <div style={{ color: "rgba(148,163,184,0.95)", fontWeight: 850, fontSize: 13, lineHeight: 1.45 }}>
                A strong goal is clear and focused. If someone else read it, they should understand exactly what success looks like.
                Examples: Hit 10 sales in a week. High Roll a road trip this month. Get promoted to Promoting Leader or Crew Leader.
              </div>
              <div style={{ marginTop: 10 }}>
                <FieldLabel>Your Specific Target</FieldLabel>
                <TextArea
                  value={activeGoal?.specific ?? ""}
                  onChange={(v) => updateActive({ specific: v })}
                  placeholder="Write your specific goal here..."
                  rows={4}
                />
              </div>
            </div>

            {/* M */}
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(148,163,184,0.06)",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>M — Measurable</div>
              <div style={{ color: "rgba(148,163,184,0.95)", fontWeight: 850, fontSize: 13, lineHeight: 1.45 }}>
                If it can’t be measured, it can’t be coached or improved. Measurement turns effort into feedback.
                Examples: Sales done in a day/week. Road trip sales + location. Leaders promoted. Owner’s profit achieved.
              </div>
              <div style={{ marginTop: 10 }}>
                <FieldLabel>How You Will Measure Progress</FieldLabel>
                <TextArea
                  value={activeGoal?.measurable ?? ""}
                  onChange={(v) => updateActive({ measurable: v })}
                  placeholder="What metrics will prove progress?"
                  rows={4}
                />
              </div>
            </div>

            {/* A */}
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(148,163,184,0.06)",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>A — Achievable</div>
              <div style={{ color: "rgba(148,163,184,0.95)", fontWeight: 850, fontSize: 13, lineHeight: 1.45 }}>
                Ask: is this doable with your current skill level and resources — and if not, what would you need to build?
                Examples: Do you have enough people to promote? Can you build them soon? Can you road trip this month?
                Is it possible to promote 4 1st-gen leaders and 2 2nd-gen leaders in your timeframe?
              </div>
              <div style={{ marginTop: 10 }}>
                <FieldLabel>What Makes This Achievable?</FieldLabel>
                <TextArea
                  value={activeGoal?.achievable ?? ""}
                  onChange={(v) => updateActive({ achievable: v })}
                  placeholder="What skills, people, resources, or schedule changes make this possible?"
                  rows={4}
                />
              </div>
            </div>

            {/* R */}
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(148,163,184,0.06)",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>R — Reason (your “Why”)</div>
              <div style={{ color: "rgba(148,163,184,0.95)", fontWeight: 850, fontSize: 13, lineHeight: 1.45 }}>
                In our organization, Reason drives consistency and resilience when things get hard.
                Examples: Use extra money to buy a car. Build a strong team to hit weekly leaderboards.
                Open an expansion office in 6–9 months.
              </div>
              <div style={{ marginTop: 10 }}>
                <FieldLabel>Your Reason</FieldLabel>
                <TextArea
                  value={activeGoal?.reason ?? ""}
                  onChange={(v) => updateActive({ reason: v })}
                  placeholder="Write your reason (your why)..."
                  rows={4}
                />
              </div>
            </div>

            {/* T */}
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(148,163,184,0.06)",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>T — Time Frame</div>
              <div style={{ color: "rgba(148,163,184,0.95)", fontWeight: 850, fontSize: 13, lineHeight: 1.45 }}>
                A timeframe creates urgency and focus. It can change if needed — but having one helps hold you accountable.
                Examples: By May 30th. By June / the summer. By Dec 2026.
              </div>
              <div style={{ marginTop: 10 }}>
                <FieldLabel>Your Time Frame</FieldLabel>
                <TextArea
                  value={activeGoal?.timeFrame ?? ""}
                  onChange={(v) => updateActive({ timeFrame: v })}
                  placeholder="By when will you achieve this goal?"
                  rows={3}
                />
              </div>
            </div>

            {/* Final Reflection */}
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(168,85,247,0.22)",
                background: "rgba(168,85,247,0.10)",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>Final Reflection</div>
              <div style={{ color: "rgba(221,214,254,0.95)", fontWeight: 850, fontSize: 13, lineHeight: 1.45 }}>
                Bridge your SMART goal into action. What is the next small action you can take this week to move this forward?
              </div>
              <div style={{ marginTop: 10 }}>
                <FieldLabel>Next Action This Week</FieldLabel>
                <TextArea
                  value={activeGoal?.finalReflection ?? ""}
                  onChange={(v) => updateActive({ finalReflection: v })}
                  placeholder={`Example:
Sign up for the next road trip, Network with a country high roller or office owner, push an extra hour every day this week.`}
                  rows={4}
                />
              </div>
            </div>

            {/* Delete this SMART Goal (BOTTOM under Final Reflection) */}
            <button
              onClick={deleteActiveGoal}
              style={{
                marginTop: 2,
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 950,
                border: "1px solid rgba(248,113,113,0.35)",
                background: "rgba(248,113,113,0.12)",
                color: "#fecaca",
                cursor: "pointer",
                alignSelf: "flex-start",
              }}
              title="Delete this SMART Goal"
            >
              Delete this Smart Goal
            </button>

            <div
              style={{
                marginTop: 6,
                padding: 10,
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(148,163,184,0.06)",
                color: "#cbd5e1",
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              Local-first MVP note: this saves to your browser (localStorage). Later we can add “Save to Supabase” for teams/offices.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
