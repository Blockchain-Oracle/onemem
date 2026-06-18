export const PROBLEMS = [
  [
    "memory",
    "Memory is trapped",
    "Every app keeps its own silo. Switch tools and your agent forgets everything — there's no portable, shared memory.",
  ],
  [
    "search",
    "Context loses its history",
    '"It sent money / made a video / did research" - but which skill, which model, what inputs? The trace is gone the moment the run ends.',
  ],
  [
    "shield",
    "Nothing is provable",
    "No way to show a teammate, an auditor, or a skeptic that the agent did exactly what it claims - untampered.",
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
    "Memories and every tool / skill / MCP call are captured automatically - encrypted and chained as they happen.",
    'agent.run("send 5 USDC to Maya")',
  ],
  [
    "3",
    "Verify & share",
    "Open the dashboard or CLI, walk the chain, and watch it turn green. Share a public proof link with anyone.",
    "$ onemem verify 0x7a3f…d201",
  ],
] as const;

export const PILLARS = [
  [
    "01",
    "memory",
    "Persistent memory",
    "Encrypted Walrus blobs, threshold-encrypted with Seal, access-controlled by on-chain namespaces. Cross-device sync without trusting a vendor.",
  ],
  [
    "02",
    "trace",
    "Action trace + replay",
    "Every tool / skill / MCP call captured as a Merkle-chained node. Replay any run purely from chain + Walrus — no original runtime needed.",
  ],
  [
    "03",
    "everywhere",
    "Cross-runtime",
    "The same memory namespace and trace format across every runtime and framework. One dashboard for all of them.",
  ],
] as const;

export const INTEGRATIONS = [
  ["bolt", "Claude Code"],
  ["cube", "Hermes"],
  ["settings", "Cursor"],
  ["branch", "OpenClaw"],
  ["bolt", "Vercel AI SDK"],
  ["bolt", "OpenAI Agents"],
  ["branch", "CrewAI"],
  ["apps", "LiveKit"],
  ["apps", "ElevenLabs"],
] as const;
