"use client";

import { useMemo, useState } from "react";

function n(value: string) {
  const cleaned = String(value ?? "").replace(/[,$\s]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function clamp(num: number, min: number, max: number) {
  return Math.min(max, Math.max(min, num));
}

function formatMoney(amount: number) {
  const v = Number.isFinite(amount) ? amount : 0;
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatNumber(amount: number, digits = 2) {
  const v = Number.isFinite(amount) ? amount : 0;
  return v.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export default function BreakEvenCalculatorPage() {
  // Inputs (simple + aligned to your steps)
  const [monthlyNeedsTotal, setMonthlyNeedsTotal] = useState<string>("");
  const [basePayMonthlyGross, setBasePayMonthlyGross] = useState<string>("");
  const [commissionPerSaleGross, setCommissionPerSaleGross] = useState<string>("");
  const [taxRatePercent, setTaxRatePercent] = useState<string>("25"); // default 25% => net 75%

  const computed = useMemo(() => {
    const needs = Math.max(n(monthlyNeedsTotal), 0);
    const baseGross = Math.max(n(basePayMonthlyGross), 0);
    const commGross = Math.max(n(commissionPerSaleGross), 0);

    const taxPct = clamp(n(taxRatePercent), 0, 60); // keep sane
    const taxRate = taxPct / 100;

    const baseNet = baseGross * (1 - taxRate);
    const commNet = commGross * (1 - taxRate);

    const gap = Math.max(needs - baseNet, 0);

    const canComputeSales = commNet > 0;
    const monthlySales = canComputeSales ? Math.ceil(gap / commNet) : null;

    const weeklySalesExact = monthlySales !== null ? monthlySales / 4 : null;
    const weeklySalesAim = weeklySalesExact !== null ? Math.ceil(weeklySalesExact) : null;

    const alreadyBreakevenOnBase = needs > 0 && baseNet >= needs;

    return {
      needs,
      baseGross,
      commGross,
      taxPct,
      taxRate,
      baseNet,
      commNet,
      gap,
      canComputeSales,
      monthlySales,
      weeklySalesExact,
      weeklySalesAim,
      alreadyBreakevenOnBase,
    };
  }, [monthlyNeedsTotal, basePayMonthlyGross, commissionPerSaleGross, taxRatePercent]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Break Even Calculator
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Live calculator. No backend. Simple inputs → clear weekly targets.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const ok = confirm("Reset all inputs to blank/default?");
              if (!ok) return;
              setMonthlyNeedsTotal("");
              setBasePayMonthlyGross("");
              setCommissionPerSaleGross("");
              setTaxRatePercent("25");
            }}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10 active:bg-white/15"
          >
            Reset
          </button>
        </div>

        {/* Layout */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[420px_1fr]">
          {/* Inputs */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-white/85">Inputs</div>
            <div className="mt-1 text-xs text-white/55">
              Enter rough numbers. Tax rate defaults to 25% (net ~75%).
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <Field
                label="Monthly Needs (Total)"
                hint="Add up rent, car, insurance, food, gas, etc."
                placeholder="3000"
                value={monthlyNeedsTotal}
                onChange={setMonthlyNeedsTotal}
              />

              <Field
                label="Monthly Base Pay (Gross)"
                hint="Your guaranteed/base income before taxes."
                placeholder="2000"
                value={basePayMonthlyGross}
                onChange={setBasePayMonthlyGross}
              />

              <Field
                label="Commission Per Sale (Gross)"
                hint="Net per sale after taxes will be calculated."
                placeholder="120"
                value={commissionPerSaleGross}
                onChange={setCommissionPerSaleGross}
              />

              <Field
                label="Tax Rate (%)"
                hint="Simple estimate used for base + commission."
                placeholder="25"
                value={taxRatePercent}
                onChange={setTaxRatePercent}
              />
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs font-semibold text-white/70">
                Quick Preview (after tax)
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                <Row
                  label="Base Pay (Net)"
                  value={formatMoney(computed.baseNet)}
                />
                <Row
                  label="Commission / Sale (Net)"
                  value={formatMoney(computed.commNet)}
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-white/85">Results</div>
            <div className="mt-1 text-xs text-white/55">
              Updates instantly as you type.
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <Card title="Breakeven Summary">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <Row label="Monthly Needs" value={formatMoney(computed.needs)} />
                  <Row
                    label={`Base Pay (Net @ ${formatNumber(computed.taxPct, 0)}%)`}
                    value={formatMoney(computed.baseNet)}
                  />
                  <Row
                    label="Remaining Gap"
                    value={formatMoney(computed.gap)}
                  />
                  <Row
                    label={`Commission / Sale (Net @ ${formatNumber(
                      computed.taxPct,
                      0
                    )}%)`}
                    value={formatMoney(computed.commNet)}
                  />

                  <div className="my-2 border-t border-white/10" />

                  <Row
                    label="Sales Needed / Month"
                    value={
                      computed.monthlySales === null
                        ? "—"
                        : String(computed.monthlySales)
                    }
                  />
                  <Row
                    label="Sales Needed / Week"
                    value={
                      computed.weeklySalesExact === null
                        ? "—"
                        : `${formatNumber(computed.weeklySalesExact, 2)}`
                    }
                  />
                  <Row
                    label="Weekly Target (Aim For)"
                    value={
                      computed.weeklySalesAim === null
                        ? "—"
                        : `${computed.weeklySalesAim} / week`
                    }
                  />
                </div>

                <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/60">
                  {computed.needs <= 0 ? (
                    <div>
                      Enter <span className="text-white/75">Monthly Needs</span>{" "}
                      to calculate breakeven.
                    </div>
                  ) : computed.alreadyBreakevenOnBase ? (
                    <div>
                      Your base pay (net) already covers monthly needs. Breakeven
                      is <span className="text-white/75">0 sales</span> — now
                      you can set targets for growth.
                    </div>
                  ) : !computed.canComputeSales ? (
                    <div>
                      Enter <span className="text-white/75">Commission Per Sale</span>{" "}
                      (gross) to calculate required sales.
                    </div>
                  ) : (
                    <div>
                      You need about{" "}
                      <span className="text-white/75">
                        {computed.monthlySales}
                      </span>{" "}
                      sales/month to cover the gap, which is about{" "}
                      <span className="text-white/75">
                        {computed.weeklySalesAim}
                      </span>{" "}
                      per week.
                    </div>
                  )}
                </div>

                <div className="mt-3 text-sm text-white/70">
                  <span className="font-semibold text-white/80">Reminder:</span>{" "}
                  Nobody is motivated by paying bills. Use breakeven to structure
                  goals for things you enjoy.
                </div>
              </Card>

              <Card title="HOW TO DO A BREAKEVEN">
                <div className="space-y-3 text-sm text-white/75">
                  <div>
                    <div className="font-semibold text-white/85">Definition:</div>
                    <div>Breakeven is when total net income equals total expenses.</div>
                  </div>

                  <div>
                    <div className="font-semibold text-white/85">Why use it:</div>
                    <ul className="ml-5 list-disc space-y-1 text-white/75">
                      <li>Not mandatory</li>
                      <li>Helps manage finances</li>
                      <li>Reduces pressure</li>
                      <li>Gives something specific to work toward</li>
                    </ul>
                  </div>

                  <div>
                    <div className="font-semibold text-white/85">Steps:</div>
                    <ol className="ml-5 list-decimal space-y-1 text-white/75">
                      <li>Add all monthly needs (rent, car, insurance, food, gas, etc.)</li>
                      <li>Calculate base pay after taxes (estimate 75%)</li>
                      <li>Subtract base pay from total needs</li>
                      <li>Determine commission per sale after taxes</li>
                      <li>Divide remaining monthly needs by commission per sale</li>
                      <li>Divide monthly sales by 4 for weekly target</li>
                    </ol>
                  </div>

                  <div>
                    <div className="font-semibold text-white/85">Reminder:</div>
                    <div>
                      Nobody is motivated by paying bills. Use breakeven to structure
                      goals for things you enjoy.
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-end justify-between gap-3">
        <div className="text-sm font-medium text-white/80">{props.label}</div>
      </div>
      <div className="mt-1 text-xs text-white/50">{props.hint}</div>
      <input
        inputMode="decimal"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25 focus:ring-0"
      />
    </label>
  );
}

function Card(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-sm font-semibold text-white/85">{props.title}</div>
      <div className="mt-3">{props.children}</div>
    </div>
  );
}

function Row(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-white/60">{props.label}</div>
      <div className="font-semibold text-white/85">{props.value}</div>
    </div>
  );
}
