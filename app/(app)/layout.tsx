/*fundraise-coach/app/(app)/layout.tsx*/
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import WarmupPing from "./_components/WarmupPing";

type AppRole = "fr" | "leader" | "admin" | "owner";

function normalizeRole(value: string | null): AppRole {
  const v = String(value ?? "").toLowerCase().trim();
  if (v === "leader") return "leader";
  if (v === "admin") return "admin";
  if (v === "owner") return "owner";
  return "fr";
}

type AppTheme = {
  headerBg: string;
  pageBg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;

  // nav active state
  activeBg: string;
  activeBorder: string;
};

const THEME: AppTheme = {
  headerBg: "rgba(0,0,0,0.85)",
  pageBg: "#050505",
  surface: "rgba(148,163,184,0.06)",
  border: "rgba(148,163,184,0.18)",
  text: "#e5e7eb",
  muted: "#94a3b8",
  activeBg: "rgba(56,189,248,0.10)",
  activeBorder: "rgba(56,189,248,0.45)",
};

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        fontWeight: 900,
        textDecoration: "none",
        border: active ? `1px solid ${THEME.activeBorder}` : `1px solid ${THEME.border}`,
        background: active ? THEME.activeBg : "rgba(0,0,0,0.22)",
        color: THEME.text,
      }}
    >
      {label}
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AppRole>("fr");
  const pathname = usePathname();

  useEffect(() => {
    try {
      const savedRole = window.localStorage.getItem("fundraise_app_role");
      setRole(normalizeRole(savedRole));
    } catch {
      // ignore
    }
  }, []);

  function onRoleChange(next: AppRole) {
    setRole(next);
    try {
      window.localStorage.setItem("fundraise_app_role", next);
    } catch {
      // ignore
    }
  }

  const tabs = useMemo(() => {
    const base = [
      { href: "/chat", label: "Chat", show: true },
      { href: "/kpis", label: "KPIs", show: true },
      { href: "/fr", label: "FR Hub", show: true },

      { href: "/team", label: "Leaders HQ", show: role !== "fr" }, // Leader/Admin/Owner

      { href: "/sites", label: "Sites", show: role === "admin" || role === "owner" }, // Admin/Owner only
      { href: "/recruitment", label: "Recruitment", show: role === "admin" || role === "owner" }, // Admin/Owner only
      { href: "/owner", label: "Owner", show: role === "owner" }, // Owner only

      { href: "/library", label: "Library", show: true }, // Always last
    ];

    return base.filter((t) => t.show);
  }, [role]);

  useEffect(() => {
    const visibleHrefs = new Set(tabs.map((t) => t.href));
    if (!visibleHrefs.has(pathname)) {
      // intentionally no redirect
    }
  }, [pathname, tabs]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: THEME.pageBg,
        color: THEME.text,
        position: "relative",
      }}
    >
      <WarmupPing />

      {/* Header (generic dark mode) */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: `1px solid ${THEME.border}`,
          background: THEME.headerBg,
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* LEFT: app label */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "rgba(34,197,94,0.95)",
                boxShadow: "0 0 16px rgba(34,197,94,0.25)",
              }}
            />
            <div style={{ fontWeight: 1000, letterSpacing: 0.2 }}>Fundraise Coach</div>
            <div style={{ color: THEME.muted, fontSize: 12, fontWeight: 800 }}>Free Tool</div>
          </div>

          {/* RIGHT: controls + tabs */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* ROLE */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 12,
                border: `1px solid ${THEME.border}`,
                background: "rgba(0,0,0,0.18)",
              }}
              title="Role lens: changes which tabs appear (demo / training view)."
            >
              <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(229,231,235,0.95)" }}>Role</span>
              <select
                value={role}
                onChange={(e) => onRoleChange(e.target.value as AppRole)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: `1px solid ${THEME.border}`,
                  background: "rgba(0,0,0,0.35)",
                  color: THEME.text,
                  fontWeight: 900,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="fr">Field Rep (FR)</option>
                <option value="leader">Leader</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            {/* NAV TABS */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {tabs.map((t) => (
                <NavLink key={t.href} href={t.href} label={t.label} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* App canvas */}
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 16px" }}>{children}</div>
    </div>
  );
}
