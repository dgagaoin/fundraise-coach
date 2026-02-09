/*fundraise-coach/app/(app)/layout.tsx*/
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import WarmupPing from "./_components/WarmupPing";

type AppRole = "fr" | "leader" | "admin" | "owner";
type AppOffice = "none" | "aip" | "fivepoint" | "riseup" | "masterplan";

function normalizeRole(value: string | null): AppRole {
  const v = String(value ?? "").toLowerCase().trim();
  if (v === "leader") return "leader";
  if (v === "admin") return "admin";
  if (v === "owner") return "owner";
  return "fr";
}

function normalizeOffice(value: string | null): AppOffice {
  const v = String(value ?? "").toLowerCase().trim();
  if (v === "aip") return "aip";
  if (v === "fivepoint") return "fivepoint";
  if (v === "riseup") return "riseup";
  if (v === "masterplan") return "masterplan";
  return "none";
}

type OfficeTheme = {
  label: string;

  // What YOU asked for:
  // - header dominant (purple)
  // - surrounding page bg secondary (teal)
  headerBg: string;
  pageBg: string;
  pageOverlay?: string; // optional overlay tint for the whole app canvas

  // UI tokens
  surface: string;
  border: string;
  text: string;
  muted: string;

  primary: string; // brand primary accent (purple)
  secondary: string; // brand secondary accent (teal)

  // Optional logo in header (top-right)
  logoPath?: string; // should live in /public
  logoAlt?: string;
};

const OFFICE_THEMES: Record<AppOffice, OfficeTheme> = {
  none: {
    label: "None (Default Dark)",
    headerBg: "rgba(0,0,0,0.85)",
    pageBg: "#000000",
    surface: "rgba(148,163,184,0.06)",
    border: "rgba(148,163,184,0.20)",
    text: "#e5e7eb",
    muted: "#94a3b8",
    primary: "rgba(59,130,246,0.55)",
    secondary: "rgba(34,197,94,0.85)",
  },

  aip: {
  label: "AIP",

  // ✅ Matches the AIP site purple in your screenshot
  headerBg: "rgba(88, 75, 144, 0.98)", // #584B90

  pageBg: "#000000",

  // ✅ Teal tint overlay (uses the same teal as the "Open" links)

  // UI tokens (keep readable on purple header + teal wash)
  surface: "rgba(0,0,0,0.18)",
  border: "rgba(255,255,255,0.22)",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.86)",

  // Brand accents
  primary: "rgba(88, 75, 144, 0.98)",  // #584B90
  secondary: "rgba(93, 166, 196, 0.95)", // #5DA6C4

  logoPath: "/brands/aip-logo.png",
  logoAlt: "AIP (Anything Is Possible)",
},



  fivepoint: {
    label: "Five Point Marketing",
    headerBg: "rgba(233,75,125,0.92)", // hot pink header
    pageBg: "rgba(79,209,197,0.12)", // teal-ish canvas
    surface: "rgba(255,255,255,0.12)",
    border: "rgba(255,255,255,0.20)",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.78)",
    primary: "rgba(233,75,125,0.92)",
    secondary: "rgba(79,209,197,0.90)",
    // optional later:
    // logoPath: "/brands/fivepoint-logo.png",
    // logoAlt: "Five Point Marketing",
  },

  riseup: {
    label: "Rise Up Marketing",
    headerBg: "rgba(0,0,0,0.85)",
    pageBg: "#000000",
    surface: "rgba(148,163,184,0.06)",
    border: "rgba(148,163,184,0.20)",
    text: "#e5e7eb",
    muted: "#94a3b8",
    primary: "rgba(59,130,246,0.55)",
    secondary: "rgba(34,197,94,0.85)",
  },

  masterplan: {
    label: "Master Plan Marketing",
    headerBg: "rgba(0,0,0,0.85)",
    pageBg: "#000000",
    surface: "rgba(148,163,184,0.06)",
    border: "rgba(148,163,184,0.20)",
    text: "#e5e7eb",
    muted: "#94a3b8",
    primary: "rgba(59,130,246,0.55)",
    secondary: "rgba(34,197,94,0.85)",
  },
};

function NavLink({
  href,
  label,
  theme,
}: {
  href: string;
  label: string;
  theme: Pick<OfficeTheme, "surface" | "border" | "text" | "muted"> & { activeBg: string; activeBorder: string };
}) {
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
        border: active ? `1px solid ${theme.activeBorder}` : `1px solid ${theme.border}`,
        background: active ? theme.activeBg : "rgba(0,0,0,0.22)",
        color: theme.text,
      }}
    >
      {label}
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AppRole>("fr");
  const [office, setOffice] = useState<AppOffice>("none");
  const pathname = usePathname();

  const theme = OFFICE_THEMES[office];

  // For link active styling: slightly different in brand header
  const navTheme = useMemo(() => {
    const isDefault = office === "none";
    return {
      surface: theme.surface,
      border: theme.border,
      text: theme.text,
      muted: theme.muted,
      activeBg: isDefault ? "rgba(59,130,246,0.12)" : "rgba(0,0,0,0.22)",
      activeBorder: isDefault ? "rgba(59,130,246,0.55)" : "rgba(255,255,255,0.45)",
    };
  }, [office, theme]);

  useEffect(() => {
    try {
      const savedRole = window.localStorage.getItem("fundraise_app_role");
      setRole(normalizeRole(savedRole));

      const savedOffice = window.localStorage.getItem("fundraise_app_office");
      setOffice(normalizeOffice(savedOffice));
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

  function onOfficeChange(next: AppOffice) {
    setOffice(next);
    try {
      window.localStorage.setItem("fundraise_app_office", next);
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
    // ✅ Surrounding empty space uses SECONDARY (teal) in AIP
    <div
      style={{
        minHeight: "100vh",
        background: theme.pageBg,
        color: theme.text,
        position: "relative",
      }}
>

      <WarmupPing />

      {/* Global brand tint overlay (fixes blending from child page backgrounds) */}
      {/*
      {theme.pageOverlay ? (
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            background: theme.pageOverlay,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ) : null}
      */}

      <div style={{ position: "relative", zIndex: 1 }}>

      {/* ✅ Header uses PRIMARY dominant color (purple) */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid rgba(0,0,0,0.25)",
          background: theme.headerBg,
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
                background: "rgba(255,255,255,0.95)",
                boxShadow: "0 0 16px rgba(255,255,255,0.25)",
              }}
            />
            <div style={{ fontWeight: 1000, letterSpacing: 0.2 }}>Fundraise Coach</div>
            <div style={{ color: theme.muted, fontSize: 12, fontWeight: 800 }}>Demo Shell</div>
          </div>

          {/* RIGHT: controls + tabs + logo */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* ROLE */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(0,0,0,0.18)",
              }}
              title="Role lens: changes which tabs appear (demo / training view)."
            >
              <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.90)" }}>Role</span>
              <select
                value={role}
                onChange={(e) => onRoleChange(e.target.value as AppRole)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(0,0,0,0.35)",
                  color: "#ffffff",
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

            {/* OFFICE */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(0,0,0,0.18)",
              }}
              title="Office skin: changes brand colors for demo / theming."
            >
              <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.90)" }}>Office</span>
              <select
                value={office}
                onChange={(e) => onOfficeChange(e.target.value as AppOffice)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(0,0,0,0.35)",
                  color: "#ffffff",
                  fontWeight: 900,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="none">None (Default)</option>
                <option value="aip">AIP</option>
                <option value="fivepoint">Five Point Marketing</option>
                <option value="riseup">Rise Up Marketing</option>
                <option value="masterplan">Master Plan Marketing</option>
              </select>
            </div>

            {/* ✅ LOGO TOP RIGHT */}
            {theme.logoPath ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 6,
                }}
                title={theme.label}
              >
                <Image
                  src={theme.logoPath}
                  alt={theme.logoAlt ?? theme.label}
                  width={160}
                  height={160}
                  style={{
                    height: 46,
                    width: "auto",
                    filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))",
                  }}
                  priority
                />

              </div>
            ) : null}    

            {/* NAV TABS */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {tabs.map((t) => (
                <NavLink key={t.href} href={t.href} label={t.label} theme={navTheme} />
              ))}
            </div>

            
          </div>
        </div>
      </div>

      {/* ✅ This “canvas” area shows the teal around the content */}
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 16px" }}>{children}</div>
      </div>
    </div>
  );
}
