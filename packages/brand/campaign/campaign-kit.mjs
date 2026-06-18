import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const vendorRoot = join(here, "..", "vendor-logos");

export const palette = {
  dark: "#080a0f",
  dark2: "#0a0f18",
  stroke: "#2b3244",
  strokeSoft: "#202838",
  cream: "#faf8f5",
  paper: "#fffdf8",
  ink: "#171717",
  muted: "#b9b6ad",
  mutedDark: "#5f6572",
  violet: "#8f7cff",
  lime: "#d4ff5e",
  sui: "#0090ff",
  green: "#16a34a",
};

const fonts = {
  display: "Bricolage Grotesque, Hanken Grotesk, Inter, Arial, sans-serif",
  body: "Hanken Grotesk, Inter, Arial, sans-serif",
  mono: "JetBrains Mono, SFMono-Regular, Consolas, monospace",
};

export const assets = {
  readmeHero: { file: "readme-hero.svg", width: 1400, height: 360 },
  xHeader: { file: "x-header.svg", width: 1500, height: 500 },
  linkCard: { file: "link-card.svg", width: 1200, height: 630 },
  toolsGrid: { file: "tools-grid.svg", width: 1600, height: 900 },
  architecture: { file: "architecture.svg", width: 1920, height: 1080 },
  motionStoryboard: { file: "motion-storyboard.svg", width: 1920, height: 1080 },
};

export function escapeText(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function logoData(file) {
  const path = join(vendorRoot, file);
  const mime = file.endsWith(".png") ? "image/png" : "image/svg+xml";
  return `data:${mime};base64,${readFileSync(path).toString("base64")}`;
}

function css() {
  return `<style>
    .display{font-family:${fonts.display};font-weight:800;letter-spacing:0}
    .body{font-family:${fonts.body};font-weight:500;letter-spacing:0}
    .mono{font-family:${fonts.mono};font-weight:600;letter-spacing:0}
    .small{font-family:${fonts.body};font-weight:700;letter-spacing:0}
  </style>`;
}

function defs() {
  return `<defs>
    <pattern id="grid" width="96" height="96" patternUnits="userSpaceOnUse">
      <path d="M96 0H0v96" fill="none" stroke="${palette.strokeSoft}" stroke-width="1" opacity=".62"/>
    </pattern>
    <pattern id="tight-grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0v48" fill="none" stroke="${palette.strokeSoft}" stroke-width="1" opacity=".45"/>
    </pattern>
    <linearGradient id="dark-sheen" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.dark2}"/>
      <stop offset=".52" stop-color="${palette.dark}"/>
      <stop offset="1" stop-color="#10141e"/>
    </linearGradient>
    <linearGradient id="paper-sheen" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.paper}"/>
      <stop offset="1" stop-color="${palette.cream}"/>
    </linearGradient>
    <filter id="soft-shadow" x="-20%" y="-30%" width="140%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity=".24"/>
    </filter>
    <filter id="small-shadow" x="-20%" y="-30%" width="140%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity=".20"/>
    </filter>
    <marker id="arrow-violet" markerWidth="14" markerHeight="14" refX="10" refY="5" orient="auto">
      <path d="M0 0 10 5 0 10z" fill="${palette.violet}"/>
    </marker>
    <marker id="arrow-blue" markerWidth="14" markerHeight="14" refX="10" refY="5" orient="auto">
      <path d="M0 0 10 5 0 10z" fill="${palette.sui}"/>
    </marker>
    <marker id="arrow-lime" markerWidth="14" markerHeight="14" refX="10" refY="5" orient="auto">
      <path d="M0 0 10 5 0 10z" fill="${palette.lime}"/>
    </marker>
  </defs>`;
}

export function svg({ width, height, title, desc, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeText(title)}</title>
  <desc id="desc">${escapeText(desc)}</desc>
  ${defs()}
  ${css()}
  ${body}
</svg>
`;
}

export function mark(x, y, size = 64) {
  const s = size / 64;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect width="64" height="64" rx="14" fill="${palette.ink}"/>
    <path d="M18 22.5 32 15l14 7.5v18.8L32 49l-14-7.7z" fill="none" stroke="${palette.lime}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M18 22.5 32 30l14-7.5M32 30v19" fill="none" stroke="${palette.violet}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

export function runtimePill(x, y, label, tone = "violet", width = 172) {
  const colors = { violet: [palette.violet, "#161223"], lime: [palette.lime, "#182010"], blue: [palette.sui, "#0b1b29"], cream: [palette.cream, "#191815"] }[tone];
  return `<g filter="url(#small-shadow)">
    <rect x="${x}" y="${y}" width="${width}" height="44" rx="8" fill="${colors[1]}" stroke="${colors[0]}" stroke-width="1.5" opacity=".96"/>
    <circle cx="${x + 22}" cy="${y + 22}" r="6" fill="${colors[0]}"/>
    <text class="mono" x="${x + 40}" y="${y + 28}" fill="${tone === "cream" ? palette.cream : palette.paper}" font-size="15">${escapeText(label)}</text>
  </g>`;
}

export function memoryCard(x, y, width, label, meta, tone = "violet") {
  const border = tone === "blue" ? palette.sui : tone === "lime" ? palette.lime : palette.violet;
  return `<g filter="url(#small-shadow)">
    <rect x="${x}" y="${y}" width="${width}" height="78" rx="8" fill="${palette.paper}" stroke="${border}" stroke-width="2"/>
    <rect x="${x + 18}" y="${y + 18}" width="36" height="36" rx="6" fill="${palette.dark2}"/>
    <path d="M${x + 27} ${y + 32}h18M${x + 27} ${y + 42}h13" stroke="${border}" stroke-width="3" stroke-linecap="round"/>
    <text class="small" x="${x + 70}" y="${y + 31}" fill="${palette.ink}" font-size="18">${escapeText(label)}</text>
    <text class="mono" x="${x + 70}" y="${y + 55}" fill="${palette.mutedDark}" font-size="12">${escapeText(meta)}</text>
  </g>`;
}

export function logoChip({
  x,
  y,
  w = 236,
  h = 70,
  label,
  sub,
  file,
  accent = palette.violet,
  imageW = 36,
  imageH = 36,
}) {
  const labelY = y + Math.round(h / 2) - 4;
  const subY = y + Math.round(h / 2) + 18;
  const accentTop = y + Math.max(16, Math.round(h * 0.26));
  const accentBottom = y + h - Math.max(16, Math.round(h * 0.26));
  const image = file
    ? `<image href="${logoData(file)}" x="${x + 18}" y="${y + (h - imageH) / 2}" width="${imageW}" height="${imageH}" preserveAspectRatio="xMidYMid meet"/>`
    : `<circle cx="${x + 36}" cy="${y + 35}" r="18" fill="${accent}"/><text class="mono" x="${x + 36}" y="${y + 41}" text-anchor="middle" fill="${palette.ink}" font-size="15">${escapeText(label.slice(0, 2).toUpperCase())}</text>`;
  return `<g filter="url(#small-shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${palette.paper}" stroke="#e7e1d5" stroke-width="1"/>
    ${image}
    <text class="small" x="${x + 68}" y="${labelY}" fill="${palette.ink}" font-size="16">${escapeText(label)}</text>
    <text class="mono" x="${x + 68}" y="${subY}" fill="${palette.mutedDark}" font-size="11">${escapeText(sub)}</text>
    <path d="M${x + w - 28} ${accentTop}v${accentBottom - accentTop}" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

export function logoIcon(file, x, y, w, h) {
  return `<image href="${logoData(file)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
}

export function docIcon(x, y, size = 18, color = palette.sui) {
  const fold = Math.round(size * 0.32);
  return `<g>
    <path d="M${x + 3} ${y + 1}h${size - fold - 4}l${fold + 1} ${fold + 1}v${size - 4}H${x + 3}z" fill="#f8fbff" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M${x + size - fold} ${y + 2}v${fold + 1}h${fold}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M${x + 7} ${y + size * 0.56}h${size - 11}M${x + 7} ${y + size * 0.74}h${size - 13}" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
  </g>`;
}

export function xUrl(x, y, size = 16) {
  const badge = Math.round(size * 1.4);
  return `<g>
    <rect x="${x}" y="${y - badge + 4}" width="${badge}" height="${badge}" rx="4" fill="${palette.paper}"/>
    ${logoIcon("svg/x.svg", x + 5, y - badge + 9, badge - 10, badge - 10)}
    <text class="mono" x="${x + badge + 10}" y="${y}" fill="${palette.lime}" font-size="${size}">x.com/OneMemAI</text>
  </g>`;
}

export function namespaceVault(x, y, w, h, label = "MemoryNamespace") {
  const compact = w < 340 || h < 240;
  const titleSize = compact ? 22 : 31;
  const metaSize = compact ? 10 : 13;
  const lidY = y + (compact ? 58 : 66);
  const midY = y + (compact ? 92 : 104);
  const bottomY = y + h - (compact ? 88 : 102);
  const titleY = y + h - (compact ? 54 : 56);
  const metaY = y + h - (compact ? 28 : 30);
  return `<g filter="url(#soft-shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${palette.ink}" stroke="${palette.lime}" stroke-width="3"/>
    <rect x="${x + 18}" y="${y + 18}" width="${w - 36}" height="${h - 36}" rx="6" fill="none" stroke="${palette.stroke}" stroke-width="1"/>
    <path d="M${x + 56} ${lidY} ${x + w / 2} ${y + 28} ${x + w - 56} ${lidY}v${bottomY - lidY}L${x + w / 2} ${bottomY} ${x + 56} ${bottomY - 10}z" fill="none" stroke="${palette.violet}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M${x + 56} ${lidY} ${x + w / 2} ${midY} ${x + w - 56} ${lidY}M${x + w / 2} ${midY}v${Math.max(8, bottomY - midY)}" fill="none" stroke="${palette.lime}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <text class="display" x="${x + w / 2}" y="${titleY}" text-anchor="middle" fill="${palette.paper}" font-size="${titleSize}">${escapeText(label)}</text>
    <text class="mono" x="${x + w / 2}" y="${metaY}" text-anchor="middle" fill="${palette.lime}" font-size="${metaSize}">user | agent | org | session | shared</text>
  </g>`;
}

export function linkLine(x1, y1, x2, y2, color, marker = "arrow-violet", width = 4, opacity = 1) {
  return `<path d="M${x1} ${y1}C${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" marker-end="url(#${marker})" opacity="${opacity}"/>`;
}
