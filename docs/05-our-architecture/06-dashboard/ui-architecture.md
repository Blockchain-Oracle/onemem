# Dashboard UI Architecture — OneMem

**Load-bearing file.** Routes, components, state management, data fetching strategy. Read first when implementing any dashboard work.

> **Audit update 2026-05-26.** Two corrections rolled in:
> 1. Framework is **Next.js 15** (was 14 in this doc — corrected). Rationale + tradeoff analysis in `../00-overview/TOOLING_DECISIONS.md` "TS build (dashboard)" section.
> 2. Hosted-only routes live in the hosted shell — `/verify/[session_id]` (public chain verifier, no login), `/onboarding` (first-time provisioning), `/cli-login`, `/login`, and hosted `/share` sponsored capability minting. The local deploy at `localhost:4040` does NOT serve those hosted auth/sponsorship routes. See `purpose-local-vs-hosted.md` for the authoritative local-vs-hosted split.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router, `output: 'standalone'`) | SSR for hosted; standalone bundle the CLI spawns for local; `next export` for Walrus Sites mirror; co-located server + client code |
| Styling | Tailwind CSS + shadcn/ui | Match BRAND_AND_SURFACES; shadcn for accessible primitives |
| Component primitives | Radix Themes | MystenLabs's official Sui visual language (per OnlyFins CSS parse) |
| Wallet / Sui chain | `@mysten/dapp-kit-react` + `@mysten/sui` | Direct chain reads + wallet connect |
| Auth (hosted only) | `@mysten/enoki` (zkLogin via Google OAuth) | Gasless onboarding |
| Real-time updates | SSE (`EventSource`) | Lifted from claude-mem; simpler than WebSocket |
| Data fetching | SWR + native fetch | Cache + revalidate; SSE updates SWR cache directly |
| Forms | react-hook-form + zod | Validation, type-safe |
| Charts (Gantt) | visx (or D3 directly for trace tree) | No heavyweight chart library |
| Tree view | Custom (collapsible nodes via Radix Collapsible) | LangSmith-inspired |
| Code blocks | shiki (light/dark themes matching brand) | Same renderer as Mintlify docs |

---

## Routes (Next.js App Router)

The `packages/dashboard/` package ships the local/shared inspection routes. The
`apps/hosted-dashboard/` shell wraps hosted auth/sponsorship surfaces and owns
routes that require internet users, Enoki, wallet signing, or public
verification (`/login`, `/cli-login`, `/onboarding`, `/share`,
`/verify/[session_id]`). Per `purpose-local-vs-hosted.md`.

```
# packages/dashboard/app/  (shared — local AND hosted serve these)
app/
├── layout.tsx                         # Root layout: brand fonts, providers, sidebar
├── page.tsx                           # / (overview)
├── memories/
│   └── page.tsx                       # /memories
├── apps/
│   └── page.tsx                       # /apps
├── trace/
│   └── [session_id]/
│       └── page.tsx                   # /trace/[session_id] — HEADLINE
├── sessions/
│   └── [session_id]/
│       └── page.tsx                   # /sessions/[session_id]
├── share/
│   ├── page.tsx                       # /share — local CLI-guided capability sharing
│   └── ShareView.tsx
├── settings/
│   └── page.tsx                       # /settings
└── api/
    ├── stream/
    │   └── route.ts                   # SSE stream
    ├── memories/
    │   └── route.ts                   # GET /api/memories
    ├── sessions/
    │   └── route.ts                   # GET /api/sessions
    ├── verify/
    │   └── [session_id]/
    │       └── route.ts               # GET /api/verify/[session_id]
    └── ... (mirroring the SDK surface)

# apps/hosted-dashboard/app/  (hosted-only routes — NOT served on localhost:4040)
hosted-app/
├── login/page.tsx                     # /login (Enoki + dApp Kit)
├── cli-login/page.tsx                 # /cli-login (CLI callback target)
├── onboarding/page.tsx                # /onboarding (first-time MemWalAccount mint via sponsored tx)
├── share/page.tsx                     # /share (sponsored owner capability minting + event history)
├── share/HostedShareView.tsx
├── share/ShareHistoryPanel.tsx
├── api/share/history/route.ts         # GET read-only Sui event-backed history
└── verify/
    └── [session_id]/
        └── page.tsx                   # /verify/[session_id] — PUBLIC chain verifier; no login
                                       # See route-verify-public.md for spec
```

**Route ownership rule:** if a route requires "anyone on the internet" or "Enoki/zkLogin," it lives in `apps/hosted-dashboard/`. If it's a private inspector of the signed-in user's own data, it lives in `packages/dashboard/`.

---

## Top-level layout

```tsx
// app/layout.tsx
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const display = localFont({
  src: "../public/fonts/Ratch-Variable.ttf",
  variable: "--font-display",
  fallback: ["General Sans", "Geist", "system-ui"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="bg-[#FAF8F5] text-foreground">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Topbar />
              <main className="flex-1 p-6">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
```

---

## Providers (`components/providers.tsx`)

```tsx
"use client";
import { Theme } from "@radix-ui/themes";
import { SuiClientProvider, WalletProvider, createNetworkConfig } from "@mysten/dapp-kit";
import { EnokiFlowProvider } from "@mysten/enoki/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { OneMemProvider } from "@/lib/onemem-context";

const { networkConfig } = createNetworkConfig({
  mainnet: { url: "https://fullnode.mainnet.sui.io:443" },
  testnet: { url: "https://fullnode.testnet.sui.io:443" },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Theme accentColor="violet" grayColor="sand" radius="medium" scaling="100%">
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
          <EnokiFlowProvider apiKey={process.env.NEXT_PUBLIC_ENOKI_API_KEY!}>
            <WalletProvider autoConnect>
              <OneMemProvider>{children}</OneMemProvider>
            </WalletProvider>
          </EnokiFlowProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </Theme>
  );
}
```

Radix Theme: `accentColor="violet"` for lavender brand; `grayColor="sand"` for the cream-aligned neutral palette. We override accent color hex via CSS to match brand exactly (`#B08FFF`).

---

## State management

| State | Where | Strategy |
|---|---|---|
| Active namespace ID | OneMemContext (React Context) | Read from credentials on mount; user can switch via Topbar |
| Active session ID | URL (`/trace/[session_id]`) | Pages drive their own loading |
| Live trace events | SWR cache + SSE updates | SSE emits → mutate SWR cache → UI re-renders |
| Memory list | SWR | Auto-revalidate every 30s + SSE invalidates |
| Sessions list | SWR | Same |
| User wallet | dApp Kit's WalletProvider | Standard pattern |
| OneMem credentials (local mode) | localStorage (write-only mirror of CLI's credentials file) | Loaded once on mount; updated on `onemem login` from CLI |
| Theme (light/dark) | localStorage + media query | System default; user toggle in Topbar |

---

## OneMem context

```tsx
// lib/onemem-context.tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { OneMem, OneMemConfig } from "@onemem/sdk-ts";

interface OneMemContextValue {
  client: OneMem | null;
  activeNamespaceId: string | null;
  setActiveNamespaceId: (id: string) => void;
  isAuthenticated: boolean;
  credentials: Credentials | null;
}

const OneMemContext = createContext<OneMemContextValue | null>(null);

export function OneMemProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<OneMem | null>(null);
  const [activeNamespaceId, setActiveNamespaceId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  
  useEffect(() => {
    // In local mode: read from ~/.onemem/credentials.json via API
    // In hosted mode: read from Enoki session
    loadCredentials().then(async (creds) => {
      if (creds) {
        const c = await OneMem.create({
          key: creds.delegateKey,
          accountId: creds.accountId,
          serverUrl: process.env.NEXT_PUBLIC_RELAYER_URL!,
          namespaceId: creds.activeNamespaceId,
          agentId: "dashboard",
          environment: "production",
          network: "mainnet",
        });
        setClient(c);
        setActiveNamespaceId(creds.activeNamespaceId);
        setCredentials(creds);
      }
    });
  }, []);
  
  return (
    <OneMemContext.Provider value={{ client, activeNamespaceId, setActiveNamespaceId, isAuthenticated: !!credentials, credentials }}>
      {children}
    </OneMemContext.Provider>
  );
}

export const useOneMem = () => {
  const ctx = useContext(OneMemContext);
  if (!ctx) throw new Error("useOneMem must be used within OneMemProvider");
  return ctx;
};
```

---

## Component organization

```
components/
├── layout/
│   ├── sidebar.tsx                    # Left nav with brand wordmark
│   ├── topbar.tsx                     # Active namespace selector, theme toggle, account
│   └── footer.tsx                     # Doc links, version
├── trace/
│   ├── trace-tree.tsx                 # Collapsible tree of ActionCalls
│   ├── trace-gantt.tsx                # Time-axis Gantt (Phoenix-inspired)
│   ├── trace-call-detail.tsx          # Side panel showing one call's input/output/metadata
│   ├── verify-drawer.tsx              # The headline: walks chain, turns green on success
│   └── replay-modal.tsx               # Full session replay player
├── memory/
│   ├── memory-list.tsx                # Table with filter chips
│   ├── memory-detail.tsx              # Full memory view with verify badge
│   ├── memory-filter.tsx              # Filter UI (class, tier, namespace, date)
│   └── memory-add.tsx                 # Add memory dialog
├── app/
│   ├── runtime-card.tsx               # Per-runtime status + pause + coverage badge
│   └── runtime-installer.tsx          # 1-line install snippets
├── share/
│   ├── share-form.tsx                 # NamespaceCapability mint/share flow
│   └── capability-card.tsx            # Active capability status card
├── ui/                                # shadcn-style primitives + brand-customized
│   ├── button.tsx
│   ├── input.tsx
│   ├── badge.tsx                      # color variants: verified (chartreuse), sui (sui blue), etc
│   ├── table.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── drawer.tsx
│   ├── tabs.tsx
│   ├── code-block.tsx                 # shiki-rendered
│   ├── suiscan-link.tsx               # Sui blue link to Suiscan
│   ├── verify-badge.tsx               # Chartreuse on verified
│   └── coverage-tier-badge.tsx        # Full / Partial coverage
└── providers.tsx
```

---

## Data fetching pattern

For each route:

```tsx
// app/memories/page.tsx
"use client";
import useSWR from "swr";
import { useOneMem } from "@/lib/onemem-context";
import { MemoryList } from "@/components/memory/memory-list";
import { useSSE } from "@/lib/sse";

export default function MemoriesPage() {
  const { client, activeNamespaceId } = useOneMem();
  
  const { data, mutate } = useSWR(
    client && activeNamespaceId ? ["memories", activeNamespaceId] : null,
    async () => {
      const result = await client!.getAll({ namespaceId: activeNamespaceId! });
      return result.memories;
    },
    { refreshInterval: 30000 }
  );
  
  // SSE: when a new memory is written, revalidate
  useSSE("new_action_call", (event) => {
    if (event.namespaceId === activeNamespaceId) mutate();
  });
  
  return <MemoryList memories={data ?? []} loading={!data} />;
}
```

---

## SSE wiring

```tsx
// lib/sse.ts
"use client";
import { useEffect, useRef } from "react";

let globalEventSource: EventSource | null = null;
const listeners = new Map<string, Set<(event: any) => void>>();

function ensureConnected(url: string) {
  if (globalEventSource && globalEventSource.readyState !== EventSource.CLOSED) return;
  globalEventSource = new EventSource(url);
  globalEventSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    const handlers = listeners.get(data.type);
    handlers?.forEach((h) => h(data));
  };
  globalEventSource.onerror = () => {
    setTimeout(() => ensureConnected(url), 2000);  // reconnect
  };
}

export function useSSE(eventType: string, handler: (event: any) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  
  useEffect(() => {
    const url = `/api/stream?namespace=${getActiveNamespace()}`;
    ensureConnected(url);
    
    const set = listeners.get(eventType) ?? new Set();
    const wrapper = (e: any) => handlerRef.current(e);
    set.add(wrapper);
    listeners.set(eventType, set);
    
    return () => {
      set.delete(wrapper);
    };
  }, [eventType]);
}
```

API route at `app/api/stream/route.ts` opens an SSE stream that subscribes to OneMem SDK's `trace.subscribe` for the active namespace and forwards events.

---

## Cross-references

- `README.md` — design principles
- `purpose-local-vs-hosted.md` — authoritative local-vs-hosted purpose split (READ FIRST)
- `design-system.md` — brand token application
- `data-flow.md` — how dashboard reads from chain
- `route-*.md` — per-route specifications
- `route-verify-public.md` — hosted-only public verify page spec
- `../00-overview/TOOLING_DECISIONS.md` — rationale for Next.js 15 (vs Vite which was the earlier draft)
- `../00-overview/MONOREPO_LAYOUT.md` — `packages/dashboard/` + `apps/hosted-dashboard/` folder layout
- `../../02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` — claude-mem viewer SSE pattern
- `../../02-inspirations/BRAND_AND_SURFACES.md` — brand tokens
- `../../02-inspirations/langsmith-langfuse/TRACE_VIEWERS_COMPARISON.md` — trace UX patterns to adopt
