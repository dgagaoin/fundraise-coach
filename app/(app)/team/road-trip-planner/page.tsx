"use client";

import { useEffect, useMemo, useState } from "react";

type RoadTrip = {
  id: string;
  name: string; // display title (derived from location)
  updatedAt: number;

  location: string;
  length: string;
  peopleCount: string;
  plannedCampaign: string;
  estimatedAirbnbCosts: string;
  salesBreakEven: string;
  teamGoal: string;
  whyRunThisRoadTrip: string;
};

const STORAGE_KEY = "fc_road_trip_planner_v1";

function uid() {
  // good-enough unique id for localStorage tools
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function now() {
  return Date.now();
}

function safeParseTrips(raw: string | null): RoadTrip[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(Boolean)
      .map((t: any) => ({
        id: String(t.id ?? uid()),
        name: String(t.name ?? "Untitled Road Trip"),
        updatedAt: Number(t.updatedAt ?? now()),
        location: String(t.location ?? ""),
        length: String(t.length ?? ""),
        peopleCount: String(t.peopleCount ?? ""),
        plannedCampaign: String(t.plannedCampaign ?? ""),
        estimatedAirbnbCosts: String(t.estimatedAirbnbCosts ?? ""),
        salesBreakEven: String(t.salesBreakEven ?? ""),
        teamGoal: String(t.teamGoal ?? ""),
        whyRunThisRoadTrip: String(t.whyRunThisRoadTrip ?? ""),
      }));
  } catch {
    return [];
  }
}

function buildDefaultTrip(): RoadTrip {
  return {
    id: uid(),
    name: "Untitled Road Trip",
    updatedAt: now(),
    location: "",
    length: "",
    peopleCount: "",
    plannedCampaign: "",
    estimatedAirbnbCosts: "",
    salesBreakEven: "",
    teamGoal: "",
    whyRunThisRoadTrip: "",
  };
}

function deriveNameFromLocation(location: string) {
  const v = location.trim();
  if (!v) return "Untitled Road Trip";
  // keep it clean; no over-formatting
  return v.length > 42 ? `${v.slice(0, 42)}…` : v;
}

export default function RoadTripPlannerPage() {
  const [trips, setTrips] = useState<RoadTrip[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  // Load once
  useEffect(() => {
    const loaded = safeParseTrips(
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    );

    if (loaded.length > 0) {
      setTrips(loaded);
      setSelectedId(loaded[0].id);
      return;
    }

    const first = buildDefaultTrip();
    setTrips([first]);
    setSelectedId(first.id);
  }, []);

  const selected = useMemo(
    () => trips.find((t) => t.id === selectedId) ?? null,
    [trips, selectedId]
  );

  // Autosave whenever trips changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!trips) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  }, [trips]);

  function createNewTrip() {
    const next = buildDefaultTrip();
    setTrips((prev) => [next, ...prev]);
    setSelectedId(next.id);
  }

  function deleteTrip(id: string) {
    const ok = confirm("Delete this road trip? This cannot be undone.");
    if (!ok) return;

    setTrips((prev) => {
      const remaining = prev.filter((t) => t.id !== id);
      if (remaining.length === 0) {
        const fresh = buildDefaultTrip();
        setSelectedId(fresh.id);
        return [fresh];
      }

      // update selection if needed
      if (selectedId === id) {
        setSelectedId(remaining[0].id);
      }
      return remaining;
    });
  }

  function clearAll() {
    const ok = confirm("Clear ALL saved road trips? This cannot be undone.");
    if (!ok) return;

    const fresh = buildDefaultTrip();
    setTrips([fresh]);
    setSelectedId(fresh.id);
  }

  function updateSelected(patch: Partial<RoadTrip>) {
    if (!selected) return;

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== selected.id) return t;

        const nextLocation =
          patch.location !== undefined ? patch.location : t.location;

        const nextName =
          patch.name !== undefined
            ? patch.name
            : deriveNameFromLocation(nextLocation);

        return {
          ...t,
          ...patch,
          name: nextName,
          updatedAt: now(),
        };
      })
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Road Trip Planner
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Template-only planner. Autosaves locally on this device.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={createNewTrip}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10 active:bg-white/15"
            >
              New
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10 active:bg-white/15"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Layout */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
          {/* Left: Saved trips */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-2 px-1 pb-2">
              <div className="text-sm font-semibold text-white/80">
                Saved Road Trips
              </div>
              <div className="text-xs text-white/50">
                {trips.length} total
              </div>
            </div>

            <div className="space-y-2">
              {trips.map((t) => {
                const active = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={[
                      "w-full rounded-xl border px-3 py-3 text-left transition",
                      active
                        ? "border-white/25 bg-white/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {t.name || "Untitled Road Trip"}
                        </div>
                        <div className="mt-1 truncate text-xs text-white/55">
                          {t.length?.trim()
                            ? t.length.trim()
                            : "No length set"}
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-white/55">
                        {new Date(t.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => selected && deleteTrip(selected.id)}
                disabled={!selected}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10 active:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete Selected
              </button>
            </div>
          </div>

          {/* Right: Editor */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            {!selected ? (
              <div className="py-10 text-center text-sm text-white/60">
                No road trip selected.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-semibold text-white/85">
                    Editing
                  </div>
                  <div className="text-xs text-white/55">
                    Changes autosave. Title is based on{" "}
                    <span className="text-white/75">Road Trip Location</span>.
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 gap-4">
                  <Field
                    label="Road Trip Location"
                    placeholder="City and State"
                    value={selected.location}
                    onChange={(v) => updateSelected({ location: v })}
                  />

                  <Field
                    label="Length"
                    placeholder="How many weeks and what dates"
                    value={selected.length}
                    onChange={(v) => updateSelected({ length: v })}
                  />

                  <Field
                    label="Number of People"
                    placeholder="4–10"
                    value={selected.peopleCount}
                    onChange={(v) => updateSelected({ peopleCount: v })}
                  />

                  <Field
                    label="Planned Campaign"
                    placeholder="What charity"
                    value={selected.plannedCampaign}
                    onChange={(v) => updateSelected({ plannedCampaign: v })}
                  />

                  <Field
                    label="Estimated AirBnB Costs"
                    placeholder="$ amount (check Airbnb rates for target area)"
                    value={selected.estimatedAirbnbCosts}
                    onChange={(v) =>
                      updateSelected({ estimatedAirbnbCosts: v })
                    }
                  />

                  <TextareaField
                    label="Sales Break Even"
                    placeholder="Take Airbnb + gas + weekly fees, divide by owner’s profit"
                    value={selected.salesBreakEven}
                    onChange={(v) => updateSelected({ salesBreakEven: v })}
                    rows={3}
                  />

                  <Field
                    label="Team Goal"
                    placeholder="How many sales the team aims to do"
                    value={selected.teamGoal}
                    onChange={(v) => updateSelected({ teamGoal: v })}
                  />

                  <TextareaField
                    label="Why run this road trip?"
                    placeholder="Test a new market, development, promote leaders, competition"
                    value={selected.whyRunThisRoadTrip}
                    onChange={(v) => updateSelected({ whyRunThisRoadTrip: v })}
                    rows={4}
                  />
                </div>

                {/* Footer actions */}
                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-white/45">
                    Stored locally in your browser (localStorage).
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const ok = confirm(
                          "Reset this trip's fields to blank? This cannot be undone."
                        );
                        if (!ok) return;
                        updateSelected({
                          location: "",
                          length: "",
                          peopleCount: "",
                          plannedCampaign: "",
                          estimatedAirbnbCosts: "",
                          salesBreakEven: "",
                          teamGoal: "",
                          whyRunThisRoadTrip: "",
                        });
                      }}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10 active:bg-white/15"
                    >
                      Reset Fields
                    </button>

                    <button
                      type="button"
                      onClick={() => selected && deleteTrip(selected.id)}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10 active:bg-white/15"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-white/80">{props.label}</div>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25 focus:ring-0"
      />
    </label>
  );
}

function TextareaField(props: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-white/80">{props.label}</div>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        rows={props.rows ?? 4}
        className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25 focus:ring-0"
      />
    </label>
  );
}
