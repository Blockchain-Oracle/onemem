// Applies the persisted theme to <html data-theme> BEFORE first paint to avoid
// a light/dark flash. Mirrors onemem.js initTheme().
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('om-theme')||'light';var e=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.setAttribute('data-theme',e);document.documentElement.dataset.themePref=t;}catch(_){document.documentElement.setAttribute('data-theme','light');}})();`;

export function ThemeScript() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: static inline bootstrap, no user input
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}

export function cycleTheme(): "light" | "dark" | "system" {
  const order: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
  const cur = (document.documentElement.dataset.themePref as (typeof order)[number]) || "light";
  const next = order[(order.indexOf(cur) + 1) % order.length] as (typeof order)[number];
  const eff =
    next === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : next;
  document.documentElement.setAttribute("data-theme", eff);
  document.documentElement.dataset.themePref = next;
  try {
    localStorage.setItem("om-theme", next);
  } catch {
    /* ignore */
  }
  return next;
}
