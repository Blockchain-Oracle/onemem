"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { Icon } from "./Icon";
import { cycleTheme } from "./ThemeScript";

export interface Crumb {
  label: string;
  href?: string;
  mono?: boolean;
}

const NAV = [
  { key: "overview", label: "Overview", href: "/", icon: "overview" },
  { key: "memories", label: "Memories", href: "/memories", icon: "memory" },
  { key: "apps", label: "Apps", href: "/apps", icon: "apps" },
  { key: "sessions", label: "Sessions", href: "/sessions", icon: "sessions" },
  { key: "share", label: "Share", href: "/share", icon: "share" },
] as const;

function BrandMark() {
  // Vault-Rail lockbox glyph (on-brand inline SVG, from the prototype).
  return (
    <span
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static brand SVG
      dangerouslySetInnerHTML={{
        __html: `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" fill="var(--ink)"/><path d="M8 12h8" stroke="var(--paper)" stroke-width="1.7" stroke-linecap="round"/><path d="M12 7.6v8.8" stroke="var(--paper)" stroke-width="1.7" stroke-linecap="round" opacity=".5"/><circle cx="12" cy="12" r="2.5" fill="var(--primary)"/></svg>`,
      }}
    />
  );
}

export function AppShell({
  children,
  crumbs = [],
  namespace = "default",
  namespaceRole = "USER",
  wide = false,
}: {
  children: ReactNode;
  crumbs?: Crumb[];
  namespace?: string;
  namespaceRole?: string;
  wide?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [themeIcon, setThemeIcon] = useState<"moon" | "sun">("moon");

  useEffect(() => {
    setThemeIcon(document.documentElement.getAttribute("data-theme") === "dark" ? "sun" : "moon");
  }, []);

  const activeKey =
    NAV.find((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)))?.key ??
    (pathname.startsWith("/settings") ? "settings" : "overview");

  return (
    <div className="app">
      <aside className={`sidebar${open ? " open" : ""}`} id="sidebar">
        <div className="sb-brand">
          <BrandMark />
          <span
            style={{
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: "1.15rem",
              letterSpacing: "-0.03em",
            }}
          >
            OneMem
          </span>
        </div>
        <nav className="sb-nav">
          {NAV.map((n) => (
            <Link
              key={n.key}
              className={`nav-item${activeKey === n.key ? " active" : ""}`}
              href={n.href}
              onClick={() => setOpen(false)}
            >
              <Icon name={n.icon} />
              {n.label}
            </Link>
          ))}
          <div style={{ flex: 1 }} />
          <Link
            className={`nav-item${activeKey === "settings" ? " active" : ""}`}
            href="/settings"
            onClick={() => setOpen(false)}
          >
            <Icon name="settings" />
            Settings
          </Link>
        </nav>
        <div className="sb-foot">
          <div className="badge badge-live" style={{ width: "100%", justifyContent: "center" }}>
            <span className="dot" />
            relayer · live
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="btn-icon sb-toggle"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name="menu" size={18} />
          </button>
          <div className="crumbs">
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${c.href ?? "x"}`}>
                {i > 0 && <span className="sep">›</span>}
                {c.href ? (
                  <Link href={c.href} className={c.mono ? "mono" : "muted"}>
                    {c.label}
                  </Link>
                ) : (
                  <span className={c.mono ? "mono" : undefined}>{c.label}</span>
                )}
              </span>
            ))}
          </div>
          <div className="spacer" />
          <button type="button" className="ns-select">
            <span className="ns-name">{namespace}</span>
            <span className="ns-role">{namespaceRole}</span>
            <Icon name="chevDown" size={14} />
          </button>
          <button
            type="button"
            className="btn-icon"
            aria-label="Theme"
            onClick={() => setThemeIcon(cycleTheme() === "dark" ? "sun" : "moon")}
          >
            <Icon name={themeIcon} size={18} />
          </button>
        </header>

        <div className={`page${wide ? " page-wide" : ""}`}>{children}</div>
      </div>

      {open && (
        <button
          type="button"
          className="sb-scrim"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
