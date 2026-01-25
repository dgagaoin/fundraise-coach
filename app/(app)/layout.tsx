/*fundraise-coach/app/(app)/layout.tsx*/
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type AppRole = "fr" | "leader" | "admin" | "owner";

function normalizeRole(value: string | null): AppRole {
  const v = String(value ?? "").toLowerCase().trim();
  if (v === "leader") return "leader";
  if (v === "admin") return "admin";
  if (v === "owner") return "owner";
  return "fr";
}

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
        border: active
          ? "1px solid rgba(59,130,246,0.55)"
          : "1px solid rgba(148,163,184,0.18)",
        background: active ? "rgba(59,130,246,0.12)" : "rgba(148,163,184,0.06)",
        color: active ? "#93c5fd" : "#e5e7eb",
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
      const saved = window.localStorage.getItem("fundraise_app_role");
      setRole(normalizeRole(saved));
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
    // Header order must be:
    // Chat, KPIs, FR Hub, Leaders HQ, Sites, Recruitment, Owner, Library
    //
    // Visibility rules:
    // - FR: Chat, KPIs, FR Hub, Library
    // - Leader: Chat, KPIs, FR Hub, Leaders HQ, Library
    // - Admin: Chat, KPIs, FR Hub, Leaders HQ, Sites, Recruitment, Library
    // - Owner: everything
    //
    // Notes:
    // - Leaders & Owners should still see FR Hub
    // - Sites: Admin + Owner only
    // - Recruitment: Admin + Owner only
    // - Owner tab: Owner only
    // - Library always last

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

  // Minimal safety: if you switch roles and your current tab disappears, nav still works.
  // We aren't redirecting automatically to avoid surprises.
  useEffect(() => {
    const visibleHrefs = new Set(tabs.map((t) => t.href));
    if (!visibleHrefs.has(pathname)) {
      // intentionally no redirect
    }
  }, [pathname, tabs]);

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#e5e7eb" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid #111827",
          background: "rgba(0,0,0,0.85)",
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "rgba(34,197,94,0.85)",
                boxShadow: "0 0 18px rgba(34,197,94,0.35)",
              }}
            />
            <div style={{ fontWeight: 1000, letterSpacing: 0.2 }}>Fundraise Coach</div>
            <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 800 }}>Demo Shell</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.20)",
                background: "rgba(148,163,184,0.06)",
              }}
              title="Role lens: changes which tabs appear (demo / training view)."
            >
              <span style={{ fontSize: 12, fontWeight: 900, color: "#cbd5e1" }}>Role</span>
              <select
                value={role}
                onChange={(e) => onRoleChange(e.target.value as AppRole)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.25)",
                  background: "#0b0b0b",
                  color: "#e5e7eb",
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

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {tabs.map((t) => (
                <NavLink key={t.href} href={t.href} label={t.label} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 16px" }}>{children}</div>
    </div>
  );
}
