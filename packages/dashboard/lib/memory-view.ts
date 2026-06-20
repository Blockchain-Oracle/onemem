// Display helpers for the local memory feed.

export function shortId(value: string | null | undefined, head = 10, tail = 6): string {
  if (!value) return "-";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function formatTime(ms: number): string {
  if (!ms) return "unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

export interface TypeMeta {
  readonly label: string;
  readonly emoji: string;
  readonly cls: string;
}

const TYPE_META: Record<string, TypeMeta> = {
  bugfix: { label: "Bug fix", emoji: "🔴", cls: "t-bugfix" },
  feature: { label: "Feature", emoji: "🟣", cls: "t-feature" },
  refactor: { label: "Refactor", emoji: "🔄", cls: "t-refactor" },
  change: { label: "Change", emoji: "✅", cls: "t-change" },
  discovery: { label: "Discovery", emoji: "🔵", cls: "t-discovery" },
  decision: { label: "Decision", emoji: "⚖️", cls: "t-decision" },
  security_alert: { label: "Security alert", emoji: "🚨", cls: "t-security" },
  security_note: { label: "Security note", emoji: "🔐", cls: "t-security" },
};

export function typeMeta(type: string): TypeMeta {
  return TYPE_META[type] ?? { label: type.replaceAll("_", " "), emoji: "•", cls: "t-change" };
}

export function runtimeLabel(id: string): string {
  const key = id.toLowerCase();
  if (key === "claude-code") return "Claude Code";
  if (key === "codex") return "Codex";
  if (key === "openclaw") return "OpenClaw";
  if (key === "windsurf") return "Windsurf";
  if (key === "cursor") return "Cursor";
  return id;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function projectName(path: string | null | undefined): string {
  if (!path) return "unknown project";
  const clean = path.replace(/\/+$/, "");
  return clean.split(/[\\/]/).pop() || clean;
}
