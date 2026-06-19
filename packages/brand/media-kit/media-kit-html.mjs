function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function preview(asset) {
  const src = htmlEscape(`../${asset.file}`);
  const label = htmlEscape(asset.label);
  if (/\.(png|svg)$/i.test(asset.file)) {
    return `<img src="${src}" alt="${label}" loading="lazy">`;
  }
  if (/\.mp4$/i.test(asset.file)) {
    return `<video src="${src}" muted controls preload="metadata"></video>`;
  }
  if (/\.(wav|mp3)$/i.test(asset.file)) {
    return `<audio src="${src}" controls preload="metadata"></audio>`;
  }
  return `<div class="file-preview">${htmlEscape(asset.file.split("/").at(-1))}</div>`;
}

function assetSection(group) {
  return `
    <section>
      <div class="section-head">
        <p>${htmlEscape(group.title)}</p>
        <span>${htmlEscape(group.use)}</span>
      </div>
      <div class="grid">
        ${group.assets
          .map(
            (asset) => `
              <article>
                <div class="preview">${preview(asset)}</div>
                <h2>${htmlEscape(asset.label)}</h2>
                <p>${htmlEscape(asset.use)}</p>
                <code>${htmlEscape(asset.file)}</code>
              </article>`,
          )
          .join("")}
      </div>
    </section>`;
}

function logoSection(group) {
  return `
    <section>
      <div class="section-head">
        <p>${htmlEscape(group.title)}</p>
        <span>Preferred vendor marks for truthful identification.</span>
      </div>
      <div class="logo-grid">
        ${group.assets
          .map(
            (asset) => `
              <article>
                <div class="logo-preview"><img src="../${htmlEscape(asset.preferredFile)}" alt="${htmlEscape(asset.label)}" loading="lazy"></div>
                <h2>${htmlEscape(asset.label)}</h2>
                <code>${htmlEscape(asset.preferredFile)}</code>
              </article>`,
          )
          .join("")}
      </div>
    </section>`;
}

export function buildHtml(kit) {
  const assetSections = kit.assetGroups.map(assetSection);
  const logoSections = kit.logoGroups.map(logoSection);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OneMem Media Kit</title>
  <style>
    :root { color-scheme: light; --paper: #fffaf0; --card: #ffffff; --ink: #211f1b; --muted: #65615a; --line: #ded8ca; --violet: #3959da; --green: #0a924b; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); color: var(--ink); font: 16px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 1320px; margin: 0 auto; padding: 40px 28px 64px; }
    header { display: grid; gap: 12px; margin-bottom: 34px; }
    h1 { margin: 0; font-size: clamp(40px, 7vw, 88px); line-height: .92; letter-spacing: 0; }
    header p { max-width: 760px; margin: 0; color: var(--muted); font-size: 20px; }
    .links { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
    .links span { border: 1px solid var(--line); background: var(--card); border-radius: 999px; padding: 8px 12px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
    section { margin-top: 42px; }
    .section-head { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 14px; border-bottom: 1px solid var(--line); padding-bottom: 10px; }
    .section-head p { margin: 0; font-size: 24px; font-weight: 750; }
    .section-head span { color: var(--muted); text-align: right; }
    .grid, .logo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
    article { min-width: 0; border: 1px solid var(--line); background: rgba(255,255,255,.72); border-radius: 8px; padding: 12px; }
    .preview, .logo-preview { display: grid; place-items: center; overflow: hidden; height: 168px; border-radius: 6px; background: #f3efe4; border: 1px solid #e7e0d2; }
    .logo-preview { height: 112px; }
    img, video, audio { max-width: 100%; max-height: 100%; object-fit: contain; }
    audio { width: 92%; }
    .file-preview { color: var(--violet); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; text-align: center; overflow-wrap: anywhere; }
    h2 { margin: 12px 0 4px; font-size: 17px; }
    article p { margin: 0 0 8px; color: var(--muted); min-height: 44px; }
    code { display: block; color: var(--violet); font-size: 12px; overflow-wrap: anywhere; }
    .guardrails { display: grid; gap: 6px; margin-top: 16px; max-width: 760px; }
    .guardrails div { border-left: 3px solid var(--green); padding-left: 10px; color: var(--muted); }
    .proof-boundary { color: var(--muted); max-width: 820px; }
    @media (max-width: 640px) {
      main { padding: 36px 28px 56px; }
      h1 { font-size: clamp(42px, 12vw, 56px); }
      header p { font-size: 20px; }
      .section-head { display: grid; align-items: start; gap: 6px; }
      .section-head span { text-align: left; }
      .grid, .logo-grid { grid-template-columns: minmax(0, 1fr); }
      article p { min-height: 0; }
      .links span { max-width: 100%; font-size: 12px; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>OneMem Media Kit</h1>
      <p>${htmlEscape(kit.identity.motto)} ${htmlEscape(kit.identity.socialLine)}</p>
      <div class="links">
        <span>${htmlEscape(kit.identity.domain)}</span>
        <span>${htmlEscape(kit.identity.docs)}</span>
        <span>${htmlEscape(kit.identity.x)}</span>
        <span>${htmlEscape(kit.identity.github)}</span>
      </div>
      <div class="guardrails">${kit.guardrails.map((item) => `<div>${htmlEscape(item)}</div>`).join("")}</div>
    </header>
    ${assetSections.join("")}
    ${logoSections.join("")}
    <section>
      <div class="section-head">
        <p>Proof Boundary</p>
        <span>Use these assets without overstating live proof.</span>
      </div>
      <p class="proof-boundary">${htmlEscape(kit.proofBoundary)}</p>
    </section>
  </main>
</body>
</html>
`;
}
