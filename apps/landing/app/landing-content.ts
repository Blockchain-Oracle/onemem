export const PROBLEMS = [
  [
    "search",
    "What did it actually do?",
    '"It sent money / made a video / did research" — but which skill, which model, what inputs? The trace is gone the moment the run ends.',
  ],
  [
    "shield",
    "Nothing is provable",
    "No way to show a teammate, an auditor, or a skeptic that the agent did exactly what it claims — untampered.",
  ],
  [
    "memory",
    "Memory is trapped",
    "Every app keeps its own silo. Switch tools and your agent forgets everything — there's no portable, owned memory.",
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
    "Use your agent normally",
    "Native-hook runtimes record automatically once installed and trusted. MCP clients call OneMem tools explicitly.",
    'agent.run("send 5 USDC to Maya")',
  ],
  [
    "3",
    "Verify & share",
    "Open the dashboard or CLI, walk the chain, and watch it turn green. Share a public proof link anyone can check — no login.",
    "$ onemem verify 0x7a3f…d201",
  ],
] as const;

export const PILLARS = [
  [
    "01",
    "trace",
    "Action trace + replay",
    "See exactly what your agent did — every tool, MCP, and skill call recorded as a Merkle-chained node on Sui. Replay it from chain, and verify it independently with no vendor in the loop.",
  ],
  [
    "02",
    "memory",
    "Memory you own",
    "Encrypted Walrus blobs, threshold-encrypted with Seal, access-controlled by on-chain namespaces. Portable across devices and tools without trusting a vendor.",
  ],
  [
    "03",
    "everywhere",
    "Cross-runtime",
    "The same namespace and trace format across supported native runtimes, MCP clients, and framework adapters — read from one dashboard.",
  ],
] as const;

// Honest capability tiers — what OneMem can actually do depends on where the code
// runs. Native runtimes auto-capture; MCP clients are explicit-tools-only;
// framework adapters trace a deployed app and are viewed on the hosted dashboard.
// First tuple element is the vendor logo file under /public/logos (real brand
// marks from packages/brand/vendor-logos, used only for truthful integration
// identification — no endorsement implied, per that package's manifest).
export const INTEGRATION_TIERS = [
  {
    tier: "Native runtimes",
    note: "Automatic trace capture on your machine.",
    items: [
      ["claude-code.svg", "Claude Code"],
      ["codex.svg", "Codex"],
      ["openclaw.svg", "OpenClaw"],
      ["hermes-agent.svg", "Hermes"],
    ],
  },
  {
    tier: "MCP clients",
    note: "Explicit OneMem tools — no automatic capture.",
    items: [
      ["cursor.svg", "Cursor"],
      ["windsurf.svg", "Windsurf"],
      ["cline.svg", "Cline"],
      ["opencode.svg", "OpenCode"],
    ],
  },
  {
    tier: "Framework adapters",
    note: "Trace your deployed app; view it on the hosted dashboard.",
    items: [
      ["vercel-ai-sdk.svg", "Vercel AI SDK"],
      ["openai.svg", "OpenAI Agents"],
      ["crewai.svg", "CrewAI"],
      ["livekit.svg", "LiveKit"],
      ["elevenlabs.svg", "ElevenLabs"],
    ],
  },
] as const;
