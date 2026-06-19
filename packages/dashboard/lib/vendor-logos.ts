const LOGOS = {
  "claude-code": "claude-code-color.svg",
  codex: "codex-color.svg",
  cursor: "cursor.svg",
  windsurf: "windsurf.svg",
  cline: "cline.svg",
  opencode: "opencode.svg",
  openclaw: "openclaw-color.svg",
  hermes: "hermes-agent.svg",
  "hermes-agent": "hermes-agent.svg",
  "vercel-ai": "vercel-ai-sdk.svg",
  "openai-agents": "openai.svg",
  crewai: "crewai.svg",
  livekit: "livekit.svg",
  elevenlabs: "elevenlabs.svg",
  mcp: "model-context-protocol.svg",
  sui: "sui.svg",
  walrus: "walrus-icon.svg",
  seal: "seal.svg",
} as const;

type LogoKey = keyof typeof LOGOS;

export const VENDOR_LOGO_FILES = Object.freeze([...new Set(Object.values(LOGOS))]);

function normalize(id: string): string {
  return id.trim().toLowerCase();
}

export function vendorLogoFile(id: string): string | null {
  const key = normalize(id);
  if (key in LOGOS) return LOGOS[key as LogoKey];
  if (key.startsWith("claude-code") || key.includes("claude-code")) return LOGOS["claude-code"];
  if (key.startsWith("codex") || key.includes("codex")) return LOGOS.codex;
  if (key.startsWith("openclaw") || key.includes("openclaw")) return LOGOS.openclaw;
  if (key.startsWith("hermes") || key.includes("hermes")) return LOGOS.hermes;
  if (key.startsWith("vercel-ai") || key.includes("vercel-ai")) return LOGOS["vercel-ai"];
  if (key.startsWith("openai-agents") || key.includes("openai-agents")) {
    return LOGOS["openai-agents"];
  }
  if (key.startsWith("elevenlabs") || key.includes("elevenlabs")) return LOGOS.elevenlabs;
  if (key.startsWith("livekit") || key.includes("livekit")) return LOGOS.livekit;
  if (key.startsWith("crewai") || key.includes("crewai")) return LOGOS.crewai;
  if (key === "mcp" || key.includes("mcp")) return LOGOS.mcp;
  return null;
}

export function vendorLogoSrc(id: string): string | null {
  const file = vendorLogoFile(id);
  return file ? `/vendor-logo/${file}` : null;
}
