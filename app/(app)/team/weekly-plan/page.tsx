/*fundraise-coach/app/(app)/team/weekly-plan/page.tsx*/
"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";

type WeeklyPlan = {
  weekOf: string;
  teamName: string;
  themeForWeek: string;

  teamGoal: string;
  lastWeekTotal: string;

  monthlyDv: string;
  raisedForYear: string;
  raised5Year: string;

  lastWeekScoringRatio: string;
  lastWeekScoringAvg: string;

  teamMembers: string;

  weeklyNetworkCallPerson: string;
  weeklyNetworkCallTopic: string;

  frFocusPromotion: string;

  personalDevelopmentGoals: string;
  studyOutsideWork: string;

  highlights: string;
  morningCrewMeetingsPlan: string;

  crewNight: string;
};

const STORAGE_KEY = "fc_leaders_weekly_plan_v2";

const emptyPlan: WeeklyPlan = {
  weekOf: "",
  teamName: "",
  themeForWeek: "",

  teamGoal: "",
  lastWeekTotal: "",

  monthlyDv: "",
  raisedForYear: "",
  raised5Year: "",

  lastWeekScoringRatio: "",
  lastWeekScoringAvg: "",

  teamMembers: "",

  weeklyNetworkCallPerson: "",
  weeklyNetworkCallTopic: "",

  frFocusPromotion: "",

  personalDevelopmentGoals: "",
  studyOutsideWork: "",

  highlights: "",
  morningCrewMeetingsPlan: "",

  crewNight: "",
};

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

        // key: allow flex layouts to stretch the textarea
        height: "100%",
        minHeight: 120,

        ...props.style,
      }}
    />
  );
}

export default function WeeklyPlanPage() {
  const [plan, setPlan] = useState<WeeklyPlan>(emptyPlan);
  const [savedAt, setSavedAt] = useState<string>("");

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPlan({ ...emptyPlan, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
  }, []);

  // Autosave
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
        setSavedAt(new Date().toLocaleString());
      } catch {
        // ignore
      }
    }, 350);

    return () => clearTimeout(t);
  }, [plan]);

  function reset() {
    if (!confirm("Clear this weekly plan? (Local-only)")) return;
    setPlan(emptyPlan);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "40px auto",
        padding: 16,
        color: "#e5e7eb",
        fontFamily: "sans-serif",
      }}
    >
      {/* Placeholder styling */}
      <style jsx global>{`
        .fcInput::placeholder,
        .fcTextarea::placeholder {
          color: rgba(148, 163, 184, 0.75);
          font-weight: 800;
          font-size: 13px;
          line-height: 1.35;
        }

        /* Hide textarea scrollbars (still scrollable via mouse/keys) */
        .fcTextarea {
          scrollbar-width: none; /* Firefox */
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
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 1000 }}>Weekly Plan Template</h1>
            <div style={{ marginTop: 6, color: "#94a3b8", fontWeight: 800, fontSize: 13 }}>
              Simple, local-first weekly plan. Autosaves on typing. (No analytics yet.)
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
              onClick={reset}
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
              Clear
            </button>
          </div>
        </div>

        {/* Top row: week + team */}
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          <div>
            <FieldLabel>Week Of</FieldLabel>
            <TextInput
              value={plan.weekOf}
              onChange={(v) => setPlan((p) => ({ ...p, weekOf: v }))}
              placeholder="02/09 - 02/15"
            />
          </div>

          <div>
            <FieldLabel>Team Name</FieldLabel>
            <TextInput
              value={plan.teamName}
              onChange={(v) => setPlan((p) => ({ ...p, teamName: v }))}
              placeholder="AIP, 5PM, or Your Team"
            />
          </div>

          <div>
            <FieldLabel>Theme For The Week</FieldLabel>
            <TextInput
              value={plan.themeForWeek}
              onChange={(v) => setPlan((p) => ({ ...p, themeForWeek: v }))}
              placeholder="Mindset • Scoring • Objections • Consistency • etc."
            />
          </div>
        </div>

        {/* Last week stats */}
        <div
          style={{
            marginTop: 14,
            borderRadius: 14,
            border: "1px solid rgba(56,189,248,0.18)",
            background: "rgba(56,189,248,0.06)",
            padding: 14,
          }}
        >
          <div style={{ fontWeight: 1000, marginBottom: 10 }}>Last Week Snapshot</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 10,
              alignItems: "stretch",
            }}
          >
            <div style={{ gridColumn: "span 3" }}>
              <FieldLabel>Team Goal</FieldLabel>
              <TextInput
                value={plan.teamGoal}
                onChange={(v) => setPlan((p) => ({ ...p, teamGoal: v }))}
                placeholder="30–40"
              />
            </div>

            <div style={{ gridColumn: "span 3" }}>
              <FieldLabel>Last Week Total</FieldLabel>
              <TextInput
                value={plan.lastWeekTotal}
                onChange={(v) => setPlan((p) => ({ ...p, lastWeekTotal: v }))}
                placeholder="33"
              />
            </div>

            {/* Raised mega-box */}
            <div style={{ gridColumn: "span 6" }}>
              <FieldLabel>Raised Last Week</FieldLabel>
              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.18)",
                  background: "rgba(148,163,184,0.04)",
                  padding: 10,
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                  <div>
                    <FieldLabel>Monthly DV</FieldLabel>
                    <TextInput
                      value={plan.monthlyDv}
                      onChange={(v) => setPlan((p) => ({ ...p, monthlyDv: v }))}
                      placeholder="$1,089"
                    />
                  </div>
                  <div>
                    <FieldLabel>Raised for the Year</FieldLabel>
                    <TextInput
                      value={plan.raisedForYear}
                      onChange={(v) => setPlan((p) => ({ ...p, raisedForYear: v }))}
                      placeholder="$13,068"
                    />
                  </div>
                  <div>
                    <FieldLabel>5-Year Projection</FieldLabel>
                    <TextInput
                      value={plan.raised5Year}
                      onChange={(v) => setPlan((p) => ({ ...p, raised5Year: v }))}
                      placeholder="$65,340"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ gridColumn: "span 6" }}>
              <FieldLabel>Scoring Ratio</FieldLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
                <TextInput
                  value={plan.lastWeekScoringRatio}
                  onChange={(v) => setPlan((p) => ({ ...p, lastWeekScoringRatio: v }))}
                  placeholder="80%"
                />
                <div style={{ fontSize: 12, color: "rgba(148,163,184,0.9)", fontWeight: 850 }}>
                  75% or better ideal
                </div>
              </div>
            </div>

            <div style={{ gridColumn: "span 6" }}>
              <FieldLabel>Scoring Avg</FieldLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
                <TextInput
                  value={plan.lastWeekScoringAvg}
                  onChange={(v) => setPlan((p) => ({ ...p, lastWeekScoringAvg: v }))}
                  placeholder="1.75"
                />
                <div style={{ fontSize: 12, color: "rgba(148,163,184,0.9)", fontWeight: 850 }}>
                  1.5 or better ideal
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main two-page feel */}
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          {/* Page 1 */}
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(148,163,184,0.04)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minHeight: 680,
            }}
          >
            <div style={{ fontWeight: 1000 }}>Page 1</div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <FieldLabel>Team Members (names + notes)</FieldLabel>
              <TextArea
                value={plan.teamMembers}
                onChange={(v) => setPlan((p) => ({ ...p, teamMembers: v }))}
                placeholder={`Example:
Callum — goal: __ | last week: __ | work on: __
Carlos — goal: __ | last week: __ | work on: __
Omar — goal: __ | last week: __ | work on: __
Patrick — goal: __ | last week: __ | work on: __
Terrel — goal: __ | last week: __ | work on: __
Taylor — goal: __ | last week: __ | work on: __
Jade — goal: __ | last week: __ | work on: __
Alex — goal: __ | last week: __ | work on: __
Aurelio — goal: __ | last week: __ | work on: __`}
                rows={9}
                style={{ flex: 1, minHeight: 220 }}
              />
            </div>

            <div>
              <FieldLabel>Weekly Network Call</FieldLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <TextInput
                  value={plan.weeklyNetworkCallPerson}
                  onChange={(v) => setPlan((p) => ({ ...p, weeklyNetworkCallPerson: v }))}
                  placeholder="Person (e.g., Omar)"
                />
                <TextInput
                  value={plan.weeklyNetworkCallTopic}
                  onChange={(v) => setPlan((p) => ({ ...p, weeklyNetworkCallTopic: v }))}
                  placeholder="Topic (e.g., Team Management)"
                />
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <FieldLabel>FRs to Focus On for Promotion (who + what this week)</FieldLabel>
              <TextArea
                value={plan.frFocusPromotion}
                onChange={(v) => setPlan((p) => ({ ...p, frFocusPromotion: v }))}
                placeholder={`Example:
Terrel — needs solo box and systems test.
Jade — needs FR Box and Solobox before systems test.
Alex — needs systems review and test.`}
                rows={6}
                style={{ flex: 1, minHeight: 140 }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <FieldLabel>Personal Development Goals (2–3)</FieldLabel>
                <TextArea
                  value={plan.personalDevelopmentGoals}
                  onChange={(v) => setPlan((p) => ({ ...p, personalDevelopmentGoals: v }))}
                  placeholder={`Example:
• Get team consistent
• Get 1st-gen recruitment + promote leaders
• Raise individual scoring avgs for everyone`}
                  rows={5}
                  style={{ minHeight: 112 }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <FieldLabel>Study Outside Work (books / podcasts / people)</FieldLabel>
                <TextArea
                  value={plan.studyOutsideWork}
                  onChange={(v) => setPlan((p) => ({ ...p, studyOutsideWork: v }))}
                  placeholder="Example: Tony Robbins, Jordan Belfort, Atomic Habits by James Clear."
                  rows={5}
                  style={{ minHeight: 130 }}
                />
              </div>
            </div>
          </div>

          {/* Page 2 */}
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(148,163,184,0.04)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minHeight: 680,
            }}
          >
            <div style={{ fontWeight: 1000 }}>Page 2</div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <FieldLabel>Highlights / Shoutouts</FieldLabel>
              <TextArea
                value={plan.highlights}
                onChange={(v) => setPlan((p) => ({ ...p, highlights: v }))}
                placeholder={`Example:
• Raised $1,089 (monthly DV)
• 80% scoring ratio
• Shoutout: Callum — strong field presence + coaching culture`}
                rows={6}
                style={{ flex: 1, minHeight: 160 }}
              />
            </div>

            <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 6 }}>
              <FieldLabel>Morning Crew Meetings Plan (bullets are fine)</FieldLabel>
              <TextArea
                value={plan.morningCrewMeetingsPlan}
                onChange={(v) => setPlan((p) => ({ ...p, morningCrewMeetingsPlan: v }))}
                placeholder={`Example:
• Roger Bannister 4 minute mile
• Starfish story
• 3 Brick Layers`}
                rows={10}
                style={{ flex: 1, minHeight: 260 }}
              />
            </div>

            <div>
              <FieldLabel>Crew Night Plan (date / time / place)</FieldLabel>
              <TextInput
                value={plan.crewNight}
                onChange={(v) => setPlan((p) => ({ ...p, crewNight: v }))}
                placeholder="Example: Fri 7:30pm — Dave & Busters (Milpitas)"
              />
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
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
    </main>
  );
}
