// OneMem icon set — ported verbatim from the designer's onemem.js (cdr-kit
// convention: 24-grid, ~1.8px round stroke, currentColor, fill:none; brand
// marks are solid). Rendered as raw SVG so the paths stay pixel-identical to
// the prototype.

const S =
  'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"';
const V = 'viewBox="0 0 24 24"';

export const ICONS: Record<string, string> = {
  overview: `<svg ${V}><path ${S} d="M4 13h7V4H4zM13 20h7v-9h-7zM4 20h7v-4H4zM13 8h7V4h-7z"/></svg>`,
  memory: `<svg ${V}><path ${S} d="M12 3c-2.2 0-4 1.6-4 3.6 0 .5.1 1 .3 1.4C7 8.7 6 10 6 11.6c0 1 .4 1.9 1.1 2.5-.3.5-.5 1.1-.5 1.7 0 2 1.8 3.6 4 3.6"/><path ${S} d="M12 3c2.2 0 4 1.6 4 3.6 0 .5-.1 1-.3 1.4 1.6.7 2.6 2 2.6 3.6 0 1-.4 1.9-1.1 2.5.3.5.5 1.1.5 1.7 0 2-1.8 3.6-4 3.6"/><path ${S} d="M12 3v16"/></svg>`,
  apps: `<svg ${V}><path ${S} d="M4 7l8-4 8 4-8 4z"/><path ${S} d="M4 7v10l8 4 8-4V7"/><path ${S} d="M12 11v10"/></svg>`,
  sessions: `<svg ${V}><path ${S} d="M3 6h13M3 12h13M3 18h13"/><circle cx="20" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="20" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="20" cy="18" r="1.3" fill="currentColor" stroke="none"/></svg>`,
  trace: `<svg ${V}><circle cx="6" cy="6" r="2.4" ${S}/><circle cx="6" cy="18" r="2.4" ${S}/><circle cx="18" cy="12" r="2.4" ${S}/><path ${S} d="M6 8.4v7.2M8.4 6h4.6a2 2 0 0 1 2 2v2M8.2 17.4l5-3.6"/></svg>`,
  share: `<svg ${V}><circle cx="6" cy="12" r="2.6" ${S}/><circle cx="18" cy="6" r="2.6" ${S}/><circle cx="18" cy="18" r="2.6" ${S}/><path ${S} d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6"/></svg>`,
  settings: `<svg ${V}><circle cx="12" cy="12" r="3" ${S}/><path ${S} d="M12 2.6v2.2M12 19.2v2.2M21.4 12h-2.2M4.8 12H2.6M18.6 5.4l-1.6 1.6M7 17l-1.6 1.6M18.6 18.6 17 17M7 7 5.4 5.4"/></svg>`,
  search: `<svg ${V}><circle cx="11" cy="11" r="6.5" ${S}/><path ${S} d="m20 20-3.6-3.6"/></svg>`,
  chevDown: `<svg ${V}><path ${S} d="m6 9 6 6 6-6"/></svg>`,
  chevRight: `<svg ${V}><path ${S} d="m9 6 6 6-6 6"/></svg>`,
  chevUp: `<svg ${V}><path ${S} d="m6 15 6-6 6 6"/></svg>`,
  check: `<svg ${V}><path ${S} d="m20 6-11 11L4 12"/></svg>`,
  checkCircle: `<svg ${V}><circle cx="12" cy="12" r="9" ${S}/><path ${S} d="m8.5 12 2.4 2.4 4.6-4.8"/></svg>`,
  x: `<svg ${V}><path ${S} d="M18 6 6 18M6 6l12 12"/></svg>`,
  xCircle: `<svg ${V}><circle cx="12" cy="12" r="9" ${S}/><path ${S} d="m15 9-6 6M9 9l6 6"/></svg>`,
  copy: `<svg ${V}><rect x="9" y="9" width="11" height="11" rx="2.4" ${S}/><path ${S} d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>`,
  external: `<svg ${V}><path ${S} d="M14 4h6v6M20 4l-9 9M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></svg>`,
  lock: `<svg ${V}><rect x="5" y="11" width="14" height="9" rx="2.2" ${S}/><path ${S} d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
  unlock: `<svg ${V}><rect x="5" y="11" width="14" height="9" rx="2.2" ${S}/><path ${S} d="M8 11V8a4 4 0 0 1 7.5-1.9"/></svg>`,
  key: `<svg ${V}><circle cx="8" cy="8" r="4" ${S}/><path ${S} d="m11 11 8 8M16 16l2-2M19 19l1.5-1.5"/></svg>`,
  shield: `<svg ${V}><path ${S} d="M12 3 5 6v5c0 4.2 2.9 8 7 9 4.1-1 7-4.8 7-9V6z"/><path ${S} d="m9 12 2.2 2.2L15 10"/></svg>`,
  play: `<svg ${V}><path d="M7 5.5v13l11-6.5z" fill="currentColor" stroke="none"/></svg>`,
  pause: `<svg ${V}><rect x="7" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" stroke="none"/><rect x="13.6" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" stroke="none"/></svg>`,
  skipBack: `<svg ${V}><path d="M18 6v12l-8.5-6z" fill="currentColor" stroke="none"/><rect x="6" y="6" width="2.4" height="12" rx="1" fill="currentColor" stroke="none"/></svg>`,
  skipFwd: `<svg ${V}><path d="M6 6v12l8.5-6z" fill="currentColor" stroke="none"/><rect x="15.6" y="6" width="2.4" height="12" rx="1" fill="currentColor" stroke="none"/></svg>`,
  replay: `<svg ${V}><path ${S} d="M4 12a8 8 0 1 1 2.5 5.8"/><path ${S} d="M4 20v-4h4"/></svg>`,
  arrowRight: `<svg ${V}><path ${S} d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  plus: `<svg ${V}><path ${S} d="M12 5v14M5 12h14"/></svg>`,
  filter: `<svg ${V}><path ${S} d="M4 5h16l-6 7v6l-4 2v-8z"/></svg>`,
  clock: `<svg ${V}><circle cx="12" cy="12" r="8.5" ${S}/><path ${S} d="M12 7.5V12l3 2"/></svg>`,
  menu: `<svg ${V}><path ${S} d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  sun: `<svg ${V}><circle cx="12" cy="12" r="4" ${S}/><path ${S} d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.4 5.6 16.7 7.3M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6"/></svg>`,
  moon: `<svg ${V}><path ${S} d="M20 13.5A8 8 0 1 1 10.5 4 6.3 6.3 0 0 0 20 13.5z"/></svg>`,
  github: `<svg ${V}><path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.36 1.08 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>`,
  bolt: `<svg ${V}><path ${S} d="M13 3 5 13h6l-1 8 8-10h-6z"/></svg>`,
  cube: `<svg ${V}><path ${S} d="M12 3 4 7v10l8 4 8-4V7zM4 7l8 4 8-4M12 11v10"/></svg>`,
  download: `<svg ${V}><path ${S} d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/></svg>`,
  info: `<svg ${V}><circle cx="12" cy="12" r="8.5" ${S}/><path ${S} d="M12 11v5M12 7.6v.2"/></svg>`,
  dot: `<svg ${V}><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/></svg>`,
  revoke: `<svg ${V}><circle cx="12" cy="12" r="8.5" ${S}/><path ${S} d="M6 6l12 12"/></svg>`,
  wallet: `<svg ${V}><rect x="3" y="6" width="18" height="13" rx="2.4" ${S}/><path ${S} d="M3 10h18M16 14h2"/></svg>`,
  google: `<svg ${V}><path fill="currentColor" stroke="none" d="M21.6 12.2c0-.7-.06-1.4-.18-2.06H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.24c1.9-1.75 3-4.32 3-7.34z"/><path fill="currentColor" stroke="none" d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.24-2.5c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H3.06v2.58A10 10 0 0 0 12 22z" opacity=".75"/><path fill="currentColor" stroke="none" d="M6.4 13.9a6 6 0 0 1 0-3.82V7.5H3.06a10 10 0 0 0 0 9z" opacity=".5"/><path fill="currentColor" stroke="none" d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.86-2.86A10 10 0 0 0 3.06 7.5L6.4 10.1C7.2 7.72 9.4 5.96 12 5.96z" opacity=".9"/></svg>`,
  branch: `<svg ${V}><circle cx="6" cy="6" r="2.2" ${S}/><circle cx="6" cy="18" r="2.2" ${S}/><circle cx="18" cy="8" r="2.2" ${S}/><path ${S} d="M6 8.2v7.6M8.2 6.6h5.6c1.6 0 2.2 1 2.2 2.4v0M16 10.2c0 4-4 3.4-10 5.4"/></svg>`,
  spinner: `<svg ${V} class="om-spin"><path ${S} d="M12 3a9 9 0 1 0 9 9" /></svg>`,
};

export type IconName = keyof typeof ICONS;

const SIZE_CLASS: Record<number, string> = { 14: "ic-14", 16: "ic-16", 18: "ic-18", 20: "ic-20" };

export function Icon({
  name,
  size = 16,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const svg = ICONS[name] ?? ICONS.dot ?? "";
  const known = SIZE_CLASS[size];
  const cls = [known, className].filter(Boolean).join(" ");
  const style = known ? undefined : { display: "inline-flex", width: size, height: size };
  return (
    <i
      className={cls}
      aria-hidden="true"
      style={style}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static, in-repo SVG strings (no user input)
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
