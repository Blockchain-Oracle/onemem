# Dashboard Design System — OneMem

Brand + component tokens applied. Source-of-truth: `../../02-inspirations/BRAND_AND_SURFACES.md`.

---

## Color tokens (Tailwind config)

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand
        surface: "#FAF8F5",            // cream — page background
        "surface-dark": "#1A1815",     // dark mode cream-counterpart
        
        primary: {
          DEFAULT: "#B08FFF",          // lavender — primary accent
          50: "#F4EEFF",
          100: "#E8DEFF",
          500: "#B08FFF",
          600: "#9A75F0",
          900: "#3D2D77",
        },
        
        verify: {
          DEFAULT: "#D4FF5E",          // chartreuse — VERIFY AFFORDANCES ONLY
          dark: "#A6CC4B",
        },
        
        sui: {
          DEFAULT: "#0090FF",          // Sui blue — SUISCAN LINKS ONLY
          dark: "#0072CC",
        },
        
        // Functional
        success: "#22c55e",
        warning: "#facc15",
        error: "#ef4444",
        muted: "#94a3b8",
        
        // Typography (light mode)
        foreground: "#1A1815",
        "foreground-muted": "#6B6660",
        
        // Borders
        border: "#E8E2D8",
        "border-hover": "#D4CCBC",
      },
      fontFamily: {
        display: ["var(--font-display)", "General Sans", "Geist", "system-ui"],
        body: ["var(--font-body)", "Inter", "system-ui"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(26, 24, 21, 0.04)",
        medium: "0 4px 12px rgba(26, 24, 21, 0.08)",
        verify: "0 0 24px rgba(212, 255, 94, 0.4)",  // chartreuse glow when verified
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## Color usage rules (the "Verify turns the page green" rule)

1. **`#D4FF5E` chartreuse — VERIFY AFFORDANCES ONLY.** Never used as decoration, background, button color, or anywhere else. Reserved exclusively for:
   - `<VerifyBadge>` when a memory/session is verified
   - `<VerifyButton>` in the active state during verification
   - Chartreuse glow on `/trace/[id]` when the verification drawer's check passes
   - Verified ✓ icons in tables
   - That's it. No exceptions.

2. **`#0090FF` Sui blue — SUISCAN LINKS ONLY.** Never used as decoration. Reserved for:
   - `<SuiscanLink>` component (underlined link to Sui txid / object on Suiscan)
   - Sui ecosystem references in copy ("on Sui mainnet")
   - That's it.

3. **`#B08FFF` lavender — PRIMARY ACCENT.** Used for:
   - Primary buttons
   - Active sidebar items
   - Brand wordmark
   - Focus rings
   - Selected tabs

4. **`#FAF8F5` cream surface.** Page background. Card backgrounds are slightly lighter (`#FCFAF7` or pure white in dark mode).

5. **Functional colors** (success/warning/error) — only on functional UI (status pills, error states). Don't pair with primary or verify accents.

---

## Typography scale

```css
/* globals.css */
:root {
  --font-display: "Ratch Variable", "General Sans", "Geist", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Menlo", monospace;
}

h1 { font-family: var(--font-display); font-size: 2.5rem; font-weight: 600; line-height: 1.2; letter-spacing: -0.02em; }
h2 { font-family: var(--font-display); font-size: 1.875rem; font-weight: 600; line-height: 1.25; }
h3 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 500; line-height: 1.3; }
h4 { font-family: var(--font-display); font-size: 1.25rem; font-weight: 500; line-height: 1.4; }

body { font-family: var(--font-body); font-size: 1rem; font-weight: 400; line-height: 1.6; color: #1A1815; }
small { font-size: 0.875rem; }
code, pre { font-family: var(--font-mono); font-size: 0.9em; }
```

If Ratch is not licensable for the hosted deploy, fall back to General Sans (free via Fontshare) or Geist (Vercel's open license). Per `BRAND_AND_SURFACES.md`, Ratch is licensable from Pangram Pangram — paid commercial license for v0.2+ if budget allows.

---

## Component primitives (shadcn + customizations)

### Buttons

```tsx
// components/ui/button.tsx
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-600",
        secondary: "border border-border bg-white hover:bg-surface text-foreground",
        ghost: "hover:bg-surface text-foreground",
        verify: "bg-verify text-foreground hover:bg-verify-dark shadow-verify",  // CHARTREUSE — used for VERIFY ONLY
        sui: "text-sui underline hover:no-underline",                              // SUI BLUE — used for SUISCAN ONLY
        danger: "bg-error text-white hover:bg-red-600",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);
```

### VerifyBadge (the headline visual)

```tsx
// components/ui/verify-badge.tsx
export function VerifyBadge({ verified, animated = false }: { verified: boolean; animated?: boolean }) {
  if (verified) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-verify/20 text-verify-dark text-sm font-medium ${animated ? "animate-verify-pulse" : ""}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
      ✗ Unverified
    </span>
  );
}
```

With CSS animation:
```css
@keyframes verify-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212, 255, 94, 0.4); }
  50% { box-shadow: 0 0 24px 8px rgba(212, 255, 94, 0.6); }
}
.animate-verify-pulse { animation: verify-pulse 2s ease-in-out infinite; }
```

### SuiscanLink

```tsx
// components/ui/suiscan-link.tsx
export function SuiscanLink({ txDigest, objectId, children }: {
  txDigest?: string;
  objectId?: string;
  children: React.ReactNode;
}) {
  const url = txDigest
    ? `https://suiscan.xyz/mainnet/tx/${txDigest}`
    : `https://suiscan.xyz/mainnet/object/${objectId}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sui underline hover:no-underline inline-flex items-center gap-1">
      {children}
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}
```

### CoverageTierBadge

```tsx
// components/ui/coverage-tier-badge.tsx
export function CoverageTierBadge({ tier }: { tier: "full" | "partial" | "none" }) {
  const config = {
    full: { color: "bg-success/20 text-green-700", label: "Full coverage" },
    partial: { color: "bg-warning/20 text-yellow-700", label: "Partial coverage" },
    none: { color: "bg-muted/20 text-muted", label: "No coverage" },
  }[tier];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>{config.label}</span>;
}
```

---

## Spacing scale

8px grid:
- `space-1` = 4px
- `space-2` = 8px
- `space-3` = 12px
- `space-4` = 16px (most common)
- `space-6` = 24px
- `space-8` = 32px
- `space-12` = 48px

---

## Layout containers

| Container | Max-width |
|---|---|
| Page content (sidebar + main) | `100%` (full) |
| Main content area | `max-w-7xl` (1280px) |
| Trace view (wider for tree + gantt + details) | `max-w-screen-2xl` (1536px) |
| Settings forms | `max-w-2xl` (672px) |
| Modal / Dialog | `max-w-lg` (512px) default; `max-w-3xl` for replay modal |

---

## Dark mode

Tailwind's `class` strategy. Toggle in Topbar saves to localStorage. Brand colors adapt:

- Surface inverts: `#FAF8F5` → `#1A1815`
- Lavender stays vibrant: `#B08FFF` (no shift)
- Chartreuse stays vibrant: `#D4FF5E` (no shift — verify is the visual signature in both modes)
- Sui blue stays: `#0090FF`
- Foreground inverts: `#1A1815` → `#FAF8F5`

---

## Cross-references

- `../../02-inspirations/BRAND_AND_SURFACES.md` — source-of-truth brand
- `ui-architecture.md` — how design system is applied per route
- `../../02-inspirations/other-memory-systems/onlyfins/VISUAL_DESIGN.md` — Sui ecosystem Radix Themes reference
