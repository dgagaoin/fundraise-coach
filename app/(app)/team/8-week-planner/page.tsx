/*fundraise-coach/app/(app)/team/8-week-planner/page.tsx*/
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type WeekBlock = {
  dateRange: string;
  promptAnswer: string;
};

type EightWeekPlan = {
  id: string;
  title: string; // quick label
  endGoal: string;

  week1: WeekBlock;
  week2: WeekBlock;
  week3: WeekBlock;
  week4: WeekBlock;
  week5: WeekBlock;
  week6: WeekBlock;
  week7: WeekBlock;
  week8: WeekBlock;

  createdAt: string; // ISO
  updatedAt: string; // ISO
};

const STORAGE_KEY = "fc_leaders_8_week_planner_v1";

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function fmtDateShort(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

const emptyWeek = (): WeekBlock => ({ dateRange: "", promptAnswer: "" });

const makeNewPlan = (): EightWeekPlan => {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: "Untitled 8-Week Plan",
    endGoal: "",

    week1: emptyWeek(),
    week2: emptyWeek(),
    week3: emptyWeek(),
    week4: emptyWeek(),
    week5: emptyWeek(),
    week6: emptyWeek(),
    week7: emptyWeek(),
    week8: emptyWeek(),

    createdAt: now,
    updatedAt: now,
  };
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 900, color: "#cbd5e1", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function TextInput(props: { value: string; onChange: (v: string) => void; placeholder: string }) {
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
      }}
    />
  );
}

function TextArea(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
  minHeight?: number;
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
        minHeight: props.minHeight ?? 120,
      }}
    />
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 900,
        color: "#a7f3d0",
        border: "1px solid rgba(34,197,94,0.28)",
        background: "rgba(34,197,94,0.10)",
        padding: "5px 10px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function EightWeekPlannerPage() {
  const [plans, setPlans] = useState<EightWeekPlan[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [savedAt, setSavedAt] = useState<string>("");

  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as EightWeekPlan[];
        if (Array.isArray(parsed) && parsed.length) {
          setPlans(parsed);
          setActiveId(parsed[0].id);
          return;
        }
      }
    } catch {
      // ignore
    }
    const first = makeNewPlan();
    setPlans([first]);
    setActiveId(first.id);
  }, []);

  const activePlan = useMemo(() => plans.find((p) => p.id === activeId) ?? null, [plans, activeId]);

  // Autosave
  useEffect(() => {
    if (!plans.length) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
        setSavedAt(new Date().toLocaleString());
      } catch {
        // ignore
      }
    }, 350);

    return () => clearTimeout(t);
  }, [plans]);

  function updateActive(partial: Partial<EightWeekPlan>) {
    setPlans((prev) =>
      prev.map((p) => (p.id === activeId ? { ...p, ...partial, updatedAt: new Date().toISOString() } : p))
    );
  }

  function updateWeek(
    key: keyof Pick<EightWeekPlan, "week1" | "week2" | "week3" | "week4" | "week5" | "week6" | "week7" | "week8">,
    block: Partial<WeekBlock>
  ) {
    if (!activePlan) return;
    const current = activePlan[key];
    updateActive({ [key]: { ...current, ...block } } as any);
  }

  function newPlan() {
    const p = makeNewPlan();
    setPlans((prev) => [p, ...prev]);
    setActiveId(p.id);
  }

  function clearAll() {
    const ok = confirm("Are you sure you want to clear all your saved 8-week plans?");
    if (!ok) return;

    const first = makeNewPlan();
    setPlans([first]);
    setActiveId(first.id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([first]));
    } catch {
      // ignore
    }
  }

  function deleteThisPlan() {
    if (!activePlan) return;
    const ok = confirm("Are you sure you want to clear this 8-week plan?");
    if (!ok) return;

    setPlans((prev) => {
      const next = prev.filter((p) => p.id !== activeId);
      const ensured = next.length ? next : [makeNewPlan()];
      const nextActive = ensured[0].id;
      setActiveId(nextActive);
      return ensured;
    });
  }

  const weekCards = [
    ["week1", "Week 1", "What are the first things I need or need to do to start?", "2 new starts"],
    ["week2", "Week 2", "What resources have I already gathered and do I need more?", "New starts become independent, 1 new start"],
    ["week3", "Week 3", "What actions am I taking consistently?", "Teach MTP to FRs, 2 new starts"],
    ["week4", "Week 4", "What actions of mine are compounding?", "Take best FR on road trip, show how to make $1000/week"],
    ["week5", "Week 5", "What am I heavily working on with the goal in mind?", "Promote first leader, 4 field reps, 2 new starts"],
    ["week6", "Week 6", "What have I completed or am close to completing?", "1 promoted leader, 4 field reps, 2 new starts"],
    ["week7", "Week 7", "What do I need to have done before the final week of my goal?", "Promote 1st leader, promote 2nd leader, 2 new starts"],
    ["week8", "Week 8", "What have I accomplished by this time?", "2 leaders on my team"],
  ] as Array<[keyof EightWeekPlan, string, string, string]>;

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
      <style jsx global>{`
        .fcInput::placeholder,
        .fcTextarea::placeholder {
          color: rgba(148, 163, 184, 0.75);
          font-weight: 800;
          font-size: 13px;
          line-height: 1.35;
        }

        /* Layout: desktop list-left / editor-right */
        .fc8Layout {
          margin-top: 14px;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          grid-template-areas: "list editor";
          gap: 12px;
          align-items: start;
        }
        .fc8List {
          grid-area: list;
          min-width: 0;
        }
        .fc8Editor {
          grid-area: editor;
          min-width: 0;
        }

        /* Mobile: editor first, list below */
        @media (max-width: 900px) {
          .fc8Layout {
            grid-template-columns: 1fr;
            grid-template-areas:
              "editor"
              "list";
          }
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 1000 }}>8 Week Planner</h1>
              <Pill>SMART-style planning</Pill>
              <Pill>For Individuals & Teams</Pill>
            </div>

            <div style={{ marginTop: 6, color: "#94a3b8", fontWeight: 800, fontSize: 13 }}>
              Break big goals into 8 focused weeks. Local-first. Autosaves on typing.
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
              onClick={newPlan}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 900,
                border: "1px solid rgba(34,197,94,0.28)",
                background: "rgba(34,197,94,0.10)",
                color: "#bbf7d0",
                cursor: "pointer",
              }}
              title="Create a new 8-week plan"
            >
              + New Plan
            </button>
          </div>
        </div>

        {/* What is it + instructions */}
        <div
          style={{
            marginTop: 14,
            borderRadius: 14,
            border: "1px solid rgba(56,189,248,0.18)",
            background: "rgba(56,189,248,0.06)",
            padding: 14,
          }}
        >
          <div style={{ fontWeight: 1000, marginBottom: 8 }}>What is an 8 Week Plan?</div>
          <div style={{ color: "#cbd5e1", fontWeight: 800, lineHeight: 1.45, fontSize: 13 }}>
            An 8 Week Plan is a simple SMART-style structure: you define an <b>end goal</b>, then work backwards from Week 8 to Week 1
            to break the goal into smaller, manageable parts. It’s useful for individual growth <i>and</i> team planning in sales +
            marketing leadership.
            <div style={{ marginTop: 8, color: "rgba(148,163,184,0.95)" }}>
              How do you eat a giant pizza? <b>One slice at a time.</b>
            </div>
          </div>

          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(148,163,184,0.04)",
              }}
            >
              <div style={{ fontWeight: 950, marginBottom: 6 }}>How to use this</div>
              <div style={{ color: "#cbd5e1", fontWeight: 800, fontSize: 13, lineHeight: 1.45 }}>
                1) Write the End Goal.
                <br />
                2) Start with Week 8: “What must be true by then?”
                <br />
                3) Walk backwards: Week 7 → 1.
                <br />
                4) Keep actions small, specific, and trackable.
              </div>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(148,163,184,0.04)",
              }}
            >
              <div style={{ fontWeight: 950, marginBottom: 6 }}>Leadership angle</div>
              <div style={{ color: "#cbd5e1", fontWeight: 800, fontSize: 13, lineHeight: 1.45 }}>
                For teams: plan coaching focuses, promotions, and road-trip readiness.
                <br />
                For individuals: plan skill reps, confidence wins, and output goals.
              </div>
            </div>
          </div>
        </div>

        {/* Layout: editor first on mobile, list below */}
        <div className="fc8Layout">
          {/* Right: Editor (shows first on mobile) */}
          <div
            className="fc8Editor"
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(148,163,184,0.04)",
              padding: 12,
            }}
          >
            {!activePlan ? (
              <div style={{ color: "#94a3b8", fontWeight: 900 }}>No plan selected.</div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  <div>
                    <FieldLabel>Plan Title (quick label)</FieldLabel>
                    <TextInput
                      value={activePlan.title}
                      onChange={(v) => updateActive({ title: v })}
                      placeholder="Example: Promote 2 Leaders + High Roll Road Trip"
                    />
                    <div style={{ marginTop: 6, color: "rgba(148,163,184,0.9)", fontWeight: 800, fontSize: 12 }}>
                      Tip: Keep it short. This is what shows in your plan list.
                    </div>
                  </div>

                  <div>
                    <FieldLabel>End Goal</FieldLabel>
                    <TextArea
                      value={activePlan.endGoal}
                      onChange={(v) => updateActive({ endGoal: v })}
                      placeholder="What is it that you are ultimately trying to achieve?"
                      rows={4}
                      minHeight={120}
                    />
                  </div>
                </div>

                {/* Weeks */}
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
                  {weekCards.map(([key, title, prompt, example]) => {
                    if (!String(key).startsWith("week")) return null;
                    const wk = (activePlan as any)[key] as WeekBlock;

                    return (
                      <div
                        key={String(key)}
                        style={{
                          borderRadius: 14,
                          border: "1px solid rgba(148,163,184,0.18)",
                          background: "rgba(148,163,184,0.04)",
                          padding: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 1000 }}>{title}</div>
                          <div style={{ fontSize: 11, fontWeight: 900, color: "rgba(148,163,184,0.9)" }}>Date range</div>
                        </div>

                        <div style={{ marginTop: 8 }}>
                          <TextInput
                            value={wk.dateRange}
                            onChange={(v) => updateWeek(key as any, { dateRange: v })}
                            placeholder="Example: Feb 10–Feb 16"
                          />
                        </div>

                        <div style={{ marginTop: 10, color: "rgba(148,163,184,0.95)", fontWeight: 850, fontSize: 12, lineHeight: 1.4 }}>
                          {prompt}
                        </div>

                        <div style={{ marginTop: 8 }}>
                          <TextArea
                            value={wk.promptAnswer}
                            onChange={(v) => updateWeek(key as any, { promptAnswer: v })}
                            placeholder={`Example: ${example}\n\nWrite your notes / action plan here...`}
                            rows={6}
                            minHeight={140}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delete (bottom) */}
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={deleteThisPlan}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      fontWeight: 1000,
                      border: "1px solid rgba(248,113,113,0.30)",
                      background: "rgba(248,113,113,0.10)",
                      color: "#fecaca",
                      cursor: "pointer",
                    }}
                    title="Delete this 8-week plan"
                  >
                    Delete this 8-Week Plan
                  </button>
                </div>

                <div
                  style={{
                    marginTop: 10,
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
              </>
            )}
          </div>

          {/* Left: Plan list (moves BELOW editor on mobile) */}
          <div
            className="fc8List"
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(148,163,184,0.04)",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              minHeight: 280,
            }}
          >
            <div style={{ fontWeight: 1000 }}>Your 8 Week Plans</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {plans.map((p) => {
                const active = p.id === activeId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveId(p.id)}
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderRadius: 12,
                      border: active ? "1px solid rgba(56,189,248,0.45)" : "1px solid rgba(148,163,184,0.18)",
                      background: active ? "rgba(56,189,248,0.10)" : "rgba(148,163,184,0.05)",
                      color: "#e5e7eb",
                      cursor: "pointer",
                    }}
                    title="Tap to edit"
                  >
                    <div style={{ fontWeight: 950, fontSize: 13, marginBottom: 4, lineHeight: 1.25 }}>
                      {p.title || "Untitled 8-Week Plan"}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 850, color: "rgba(148,163,184,0.9)" }}>
                      Updated: {fmtDateShort(p.updatedAt)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* tighter spacing (no giant empty gap on mobile) */}
            <button
              onClick={clearAll}
              style={{
                marginTop: 8,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000,
                border: "1px solid rgba(248,113,113,0.30)",
                background: "rgba(248,113,113,0.10)",
                color: "#fecaca",
                cursor: "pointer",
              }}
              title="Clear all saved 8-week plans"
            >
              Clear All Saved 8-Week Plans
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
