export const PROBLEMS = [
  [
    "memory",
    "Memory is trapped",
    "Every app keeps its own silo. Switch tools and your agent forgets everything — there's no portable, owned memory.",
  ],
  [
    "shield",
    "You don't own it",
    "Your agent's context lives on someone else's server, behind someone else's API. Lose access and you lose the memory.",
  ],
  [
    "search",
    "Recall is shallow",
    "Without durable, searchable memory across sessions, your agent re-asks what it already knew and repeats work you already did.",
  ],
] as const;

export const STEPS = [
  [
    "1",
    "Install",
    "One line adds OneMem to your agent runtime. No rewrites, no SDK gymnastics.",
    "$ npm create onemem@latest",
  ],
  [
    "2",
    "Store + recall",
    "Save what matters and search it back later. Native-hook runtimes also stream a live local dashboard once installed.",
    'agent.run("remember: ships at night")',
  ],
  [
    "3",
    "Carry it anywhere",
    "Open the dashboard or CLI. Your memory is encrypted on Walrus and travels with you across tools and devices.",
    "$ onemem search 'deploy steps'",
  ],
] as const;

export const PILLARS = [
  [
    "01",
    "memory",
    "Memory you own",
    "Encrypted Walrus blobs, threshold-encrypted with Seal, scoped by MemWal namespaces. Portable across devices and tools without trusting a vendor.",
  ],
  [
    "02",
    "recall",
    "Add, search, recall",
    "A Mem0-style memory layer — store a memory, vector-search it back, get/list/delete by scope. The relayer never sees your plaintext.",
  ],
  [
    "03",
    "everywhere",
    "Cross-runtime",
    "The same memory namespace across supported native runtimes, MCP clients, and framework adapters — read from one dashboard.",
  ],
] as const;

// Honest capability tiers — what OneMem does depends on where the code runs.
// Native runtimes expose memory tools AND stream a live local dashboard via
// hooks; MCP clients call OneMem memory tools explicitly; framework adapters add
// owned memory to a deployed app, viewed on the hosted dashboard.
// First tuple element is the vendor logo file under /public/logos (real brand
// marks from packages/brand/vendor-logos, used only for truthful integration
// identification — no endorsement implied, per that package's manifest).
export const INTEGRATION_TIERS = [
  {
    tier: "Native runtimes",
    note: "Memory tools + a live local dashboard.",
    items: [
      ["claude-code.svg", "Claude Code"],
      ["codex.svg", "Codex"],
      ["openclaw.svg", "OpenClaw"],
      ["hermes-agent.svg", "Hermes"],
    ],
  },
  {
    tier: "MCP clients",
    note: "Explicit OneMem memory tools.",
    items: [
      ["cursor.svg", "Cursor"],
      ["windsurf.svg", "Windsurf"],
      ["cline.svg", "Cline"],
      ["opencode.svg", "OpenCode"],
    ],
  },
  {
    tier: "Framework adapters",
    note: "Owned memory for your deployed app; view it on the hosted dashboard.",
    items: [
      ["vercel-ai-sdk.svg", "Vercel AI SDK"],
      ["openai.svg", "OpenAI Agents"],
      ["crewai.svg", "CrewAI"],
      ["livekit.svg", "LiveKit"],
      ["elevenlabs.svg", "ElevenLabs"],
    ],
  },
] as const;
