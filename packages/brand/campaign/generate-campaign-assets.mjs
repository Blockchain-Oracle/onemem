import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assets,
  escapeText,
  linkLine,
  logoChip,
  logoIcon,
  mark,
  memoryCard,
  namespaceVault,
  palette,
  runtimePill,
  svg,
  xUrl,
} from "./campaign-kit.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function readmeHero() {
  const { width, height } = assets.readmeHero;
  return svg({
    width,
    height,
    title: "OneMem README hero",
    desc: "A shallow GitHub README banner showing OneMem as one memory layer for every agent.",
    body: `
  <rect width="${width}" height="${height}" fill="url(#dark-sheen)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)" opacity=".72"/>
  <path d="M70 286h310l104-24h210l118 30h486" fill="none" stroke="${palette.violet}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
  <path d="M812 292h486" fill="none" stroke="${palette.sui}" stroke-width="3" stroke-linecap="round" opacity=".78"/>
  ${mark(72, 64, 78)}
  <text class="display" x="174" y="112" fill="${palette.paper}" font-size="52">OneMem</text>
  <text class="display" x="72" y="178" fill="${palette.paper}" font-size="44">One memory layer for every agent.</text>
  <text class="body" x="74" y="220" fill="${palette.muted}" font-size="24">Persistent AI memory across SDKs, MCP, plugins, and Sui.</text>
  ${runtimePill(74, 264, "Claude Code", "violet", 170)}
  ${runtimePill(262, 264, "Codex", "violet", 118)}
  ${runtimePill(398, 264, "OpenClaw", "violet", 148)}
  ${runtimePill(564, 264, "Hermes", "violet", 130)}
  ${namespaceVault(805, 62, 318, 210, "MemoryNamespace")}
  ${logoChip({ x: 1162, y: 78, w: 174, h: 78, label: "Seal", sub: "encrypt", file: "svg/seal.svg", accent: palette.lime, imageW: 52, imageH: 32 })}
  ${logoChip({ x: 1162, y: 172, w: 174, h: 78, label: "Walrus", sub: "store blob", file: "svg/walrus-icon.svg", accent: palette.sui, imageW: 42, imageH: 42 })}
  <circle cx="1298" cy="292" r="18" fill="${palette.lime}"/>
  <path d="m1288 291 8 8 17-22" fill="none" stroke="${palette.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <text class="mono" x="1100" y="318" fill="${palette.paper}" font-size="16">onememe.xyz</text>
  ${xUrl(1220, 318, 15)}
`,
  });
}

function xHeader() {
  const { width, height } = assets.xHeader;
  return svg({
    width,
    height,
    title: "OneMem X header",
    desc: "Profile header for x.com/OneMemAI showing one persistent memory layer across runtimes.",
    body: `
  <rect width="${width}" height="${height}" fill="url(#dark-sheen)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)" opacity=".75"/>
  <rect x="0" y="360" width="330" height="140" fill="${palette.dark}" opacity=".55"/>
  <path d="M118 298h210l96-6h188l106 32h188l86-92h370" fill="none" stroke="${palette.violet}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M992 232h370" fill="none" stroke="${palette.sui}" stroke-width="3" stroke-linecap="round" opacity=".82"/>
  <circle cx="118" cy="298" r="13" fill="${palette.violet}"/>
  <circle cx="424" cy="292" r="13" fill="${palette.violet}"/>
  <circle cx="718" cy="324" r="13" fill="${palette.violet}"/>
  <circle cx="992" cy="232" r="13" fill="${palette.sui}"/>
  <circle cx="1362" cy="232" r="19" fill="${palette.lime}"/>
  <path d="m1351 231 9 9 18-23" fill="none" stroke="${palette.ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  ${mark(104, 72, 88)}
  <text class="display" x="216" y="130" fill="${palette.paper}" font-size="78">OneMem</text>
  <text class="display" x="106" y="218" fill="${palette.paper}" font-size="50">One memory layer for every agent.</text>
  <text class="body" x="108" y="266" fill="${palette.muted}" font-size="26">Decentralized persistent memory for AI agents.</text>
  ${runtimePill(108, 332, "SDK", "violet", 92)}
  ${runtimePill(218, 332, "MCP", "blue", 94)}
  ${runtimePill(330, 332, "Plugins", "violet", 126)}
  ${runtimePill(474, 332, "Frameworks", "violet", 156)}
  <text class="mono" x="1112" y="400" fill="${palette.paper}" font-size="25">onememe.xyz</text>
  ${xUrl(1112, 436, 23)}
`,
  });
}

function linkCard() {
  const { width, height } = assets.linkCard;
  const links = [
    ["Domain", "onememe.xyz", palette.lime],
    ["GitHub", "github.com/Blockchain-Oracle/onemem", palette.violet],
    ["Docs", "docs.onemem.ai", palette.sui],
    ["npm", "npmjs.com/package/@onemem/sdk-ts", palette.violet],
    ["MCP", "npmjs.com/package/@onemem/mcp", palette.violet],
    ["PyPI", "pypi.org/project/hermes-onemem", palette.green],
    ["X", "x.com/OneMemAI", palette.ink, "svg/x.svg"],
  ];
  const linkRows = links
    .map((item, index) => {
      const y = 212 + index * 48;
      return `<g>
        <rect x="612" y="${y - 27}" width="482" height="38" rx="8" fill="${palette.paper}" stroke="#e7e1d5"/>
        ${
          item[3]
            ? logoIcon(item[3], 630, y - 17, 16, 16)
            : `<circle cx="638" cy="${y - 8}" r="6" fill="${item[2]}"/>`
        }
        <text class="mono" x="660" y="${y - 3}" fill="${palette.mutedDark}" font-size="13">${escapeText(item[0])}</text>
        <text class="small" x="756" y="${y - 3}" fill="${palette.ink}" font-size="16">${escapeText(item[1])}</text>
      </g>`;
    })
    .join("\n");

  return svg({
    width,
    height,
    title: "OneMem start here link card",
    desc: "A social link card listing OneMem public links and package entry points.",
    body: `
  <rect width="${width}" height="${height}" fill="url(#paper-sheen)"/>
  <rect x="52" y="52" width="1096" height="526" rx="8" fill="${palette.paper}" stroke="#e4ded1" stroke-width="2"/>
  <rect x="52" y="52" width="502" height="526" rx="8" fill="${palette.dark2}"/>
  <rect x="52" y="52" width="502" height="526" rx="8" fill="url(#tight-grid)" opacity=".74"/>
  ${mark(98, 104, 86)}
  <text class="display" x="204" y="158" fill="${palette.paper}" font-size="62">OneMem</text>
  <text class="display" x="98" y="244" fill="${palette.paper}" font-size="46">Start here.</text>
  <text class="body" x="100" y="292" fill="${palette.muted}" font-size="25">Decentralized persistent memory</text>
  <text class="body" x="100" y="324" fill="${palette.muted}" font-size="25">for AI agents.</text>
  ${memoryCard(100, 344, 330, "memory.add()", "Seal encrypted Walrus blob", "lime")}
  ${memoryCard(144, 442, 330, "memory.search()", "same context, every runtime", "violet")}
  <text class="mono" x="100" y="540" fill="${palette.lime}" font-size="18">One memory layer for every agent.</text>
  <text class="display" x="612" y="118" fill="${palette.ink}" font-size="46">Relevant links</text>
  <text class="body" x="614" y="156" fill="${palette.mutedDark}" font-size="20">Campaign, source, packages, docs, and social handle.</text>
  ${linkRows}
`,
  });
}

function toolsGrid() {
  const { width, height } = assets.toolsGrid;
  const native = [
    ["Claude Code", "native plugin", "svg/claude-code-color.svg"],
    ["Codex", "native plugin", "svg/codex-color.svg"],
    ["OpenClaw", "@onemem/oc-onemem", "svg/openclaw-color.svg"],
    ["Hermes Agent", "hermes-onemem", "svg/hermes-agent.svg"],
  ];
  const mcp = [
    ["MCP", "stdio server", "svg/model-context-protocol.svg"],
    ["Cursor", "MCP client", "svg/cursor.svg"],
    ["Windsurf", "MCP client", "svg/windsurf.svg"],
    ["OpenCode", "MCP client", "svg/opencode.svg"],
    ["Cline", "MCP client", "svg/cline.svg"],
    ["VS Code Copilot", "MCP target", "svg/github-copilot.svg"],
    ["Antigravity", "Gemini-family", "svg/antigravity-color.svg"],
  ];
  const providers = [
    ["Vercel AI SDK", "framework provider", "svg/vercel-ai-sdk.svg"],
    ["OpenAI Agents", "framework provider", "svg/openai.svg"],
    ["CrewAI", "Python provider", "svg/crewai.svg"],
    ["LiveKit Agents", "voice provider", "svg/livekit.svg"],
    ["ElevenLabs", "voice provider", "svg/elevenlabs.svg"],
  ];
  const core = [
    ["Sui", "namespace + caps", "svg/sui.svg"],
    ["Walrus", "blob storage", "svg/walrus-icon.svg"],
    ["Seal", "encryption gate", "svg/seal.svg"],
    ["MemWal", "memory relayer", "svg/walrus-docs.svg"],
  ];

  const chips = [
    ...native.map((item, i) => logoChip({ x: 86, y: 170 + i * 88, label: item[0], sub: item[1], file: item[2], accent: palette.violet })),
    ...mcp.map((item, i) => logoChip({ x: 86 + (i % 2) * 252, y: 560 + Math.floor(i / 2) * 82, w: 236, label: item[0], sub: item[1], file: item[2], accent: palette.sui })),
    ...providers.map((item, i) => logoChip({ x: 1212, y: 170 + i * 88, label: item[0], sub: item[1], file: item[2], accent: palette.violet })),
    ...core.map((item, i) => logoChip({ x: 1212, y: 620 + i * 68, label: item[0], sub: item[1], file: item[2], accent: i === 0 ? palette.sui : palette.lime })),
  ].join("\n");

  return svg({
    width,
    height,
    title: "OneMem supported tools and integrations",
    desc: "Runtime, MCP, provider, and core protocol ecosystem supported by OneMem.",
    body: `
  <rect width="${width}" height="${height}" fill="url(#dark-sheen)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)" opacity=".58"/>
  <text class="display" x="86" y="92" fill="${palette.paper}" font-size="56">Meet the OneMem runtime surface</text>
  <text class="body" x="90" y="132" fill="${palette.muted}" font-size="23">One persistent memory namespace across plugins, MCP clients, framework providers, and the Sui/Walrus stack.</text>
  <text class="mono" x="86" y="160" fill="${palette.lime}" font-size="14">native runtime plugins</text>
  <text class="mono" x="86" y="548" fill="${palette.sui}" font-size="14">MCP-compatible clients</text>
  <text class="mono" x="1212" y="160" fill="${palette.violet}" font-size="14">framework providers</text>
  <text class="mono" x="1212" y="606" fill="${palette.lime}" font-size="14">core protocol stack</text>
  ${chips}
  ${namespaceVault(586, 262, 428, 294, "OneMem")}
  <text class="display" x="800" y="606" text-anchor="middle" fill="${palette.paper}" font-size="31">One memory layer</text>
  <text class="display" x="800" y="644" text-anchor="middle" fill="${palette.paper}" font-size="31">for every agent.</text>
  <text class="body" x="800" y="682" text-anchor="middle" fill="${palette.muted}" font-size="20">Add. Search. Share. Revoke. Recall anywhere.</text>
  ${linkLine(486, 346, 586, 366, palette.violet, "arrow-violet", 4, .9)}
  ${linkLine(486, 662, 586, 510, palette.sui, "arrow-blue", 4, .86)}
  ${linkLine(1014, 366, 1212, 346, palette.violet, "arrow-violet", 4, .9)}
  ${linkLine(1014, 510, 1212, 724, palette.lime, "arrow-lime", 4, .84)}
  <text class="mono" x="668" y="742" fill="${palette.paper}" font-size="16">onememe.xyz</text>
  ${xUrl(820, 742, 15)}
`,
  });
}

function architecture() {
  const { width, height } = assets.architecture;
  const box = (x, y, w, h, title, sub, accent = palette.violet) => `<g filter="url(#small-shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${palette.paper}" stroke="#e7e1d5" stroke-width="2"/>
    <path d="M${x + 18} ${y + 18}h${w - 36}" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    <text class="display" x="${x + 22}" y="${y + 58}" fill="${palette.ink}" font-size="28">${escapeText(title)}</text>
    <text class="body" x="${x + 22}" y="${y + 92}" fill="${palette.mutedDark}" font-size="18">${escapeText(sub)}</text>
  </g>`;
  const cap = (x, y, label, accent) => `<g>
    <rect x="${x}" y="${y}" width="154" height="44" rx="8" fill="${palette.dark2}" stroke="${accent}" stroke-width="1.5"/>
    <path d="M${x + 18} ${y + 25}h30m-9-9 9 9-9 9" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <text class="mono" x="${x + 62}" y="${y + 28}" fill="${palette.paper}" font-size="13">${escapeText(label)}</text>
  </g>`;

  return svg({
    width,
    height,
    title: "OneMem architecture diagram",
    desc: "Designed architecture flow for OneMem from agent runtimes to SDK/MCP/plugins, namespaces, capabilities, Seal, Walrus, MemWal, Sui, and dashboard surfaces.",
    body: `
  <rect width="${width}" height="${height}" fill="${palette.cream}"/>
  <rect x="56" y="54" width="1808" height="972" rx="8" fill="${palette.paper}" stroke="#e3dbce" stroke-width="2"/>
  <text class="display" x="96" y="126" fill="${palette.ink}" font-size="64">OneMem architecture</text>
  <text class="body" x="100" y="170" fill="${palette.mutedDark}" font-size="25">Decentralized persistent memory for AI agents, with proof as the confidence layer.</text>
  ${box(96, 250, 330, 158, "Agents & runtimes", "Claude Code, Codex, OpenClaw, Hermes", palette.violet)}
  ${box(96, 476, 330, 158, "Developer surface", "add, search, trace, share, revoke", palette.violet)}
  ${box(508, 250, 330, 158, "SDK / MCP / plugins", "@onemem/sdk-ts, @onemem/mcp, hooks", palette.violet)}
  ${box(508, 476, 330, 158, "Provider adapters", "Vercel, OpenAI Agents, CrewAI, voice", palette.violet)}
  ${namespaceVault(936, 294, 382, 274, "MemoryNamespace")}
  <text class="display" x="1430" y="278" fill="${palette.ink}" font-size="30">Capability authority</text>
  ${cap(1428, 314, "ReadOnly", palette.sui)}
  ${cap(1600, 314, "ReadWrite", palette.violet)}
  ${cap(1514, 374, "Admin", palette.lime)}
  ${box(1428, 476, 336, 138, "Seal encryption", "capability holders decrypt through gate", palette.lime)}
  ${box(1428, 676, 336, 138, "MemWal + Walrus", "manual memory API, encrypted blobs", palette.sui)}
  ${box(936, 706, 382, 138, "Sui proof plane", "namespace, caps, trace receipts", palette.sui)}
  ${box(508, 746, 330, 138, "Dashboard surfaces", "memories, sessions, trace, share", palette.lime)}
  ${box(96, 746, 330, 138, "Recall anywhere", "same namespace, different runtime", palette.violet)}
  ${linkLine(426, 328, 508, 328, palette.violet, "arrow-violet", 4)}
  ${linkLine(426, 554, 508, 554, palette.violet, "arrow-violet", 4)}
  ${linkLine(838, 328, 936, 386, palette.violet, "arrow-violet", 4)}
  ${linkLine(838, 554, 936, 474, palette.violet, "arrow-violet", 4)}
  ${linkLine(1318, 386, 1428, 348, palette.lime, "arrow-lime", 4)}
  ${linkLine(1596, 418, 1596, 476, palette.lime, "arrow-lime", 4)}
  ${linkLine(1596, 614, 1596, 676, palette.sui, "arrow-blue", 4)}
  ${linkLine(1428, 746, 1318, 776, palette.sui, "arrow-blue", 4)}
  ${linkLine(936, 776, 838, 816, palette.lime, "arrow-lime", 4)}
  ${linkLine(508, 816, 426, 816, palette.violet, "arrow-violet", 4)}
  <rect x="96" y="922" width="1668" height="46" rx="8" fill="${palette.dark2}"/>
  <text class="mono" x="122" y="951" fill="${palette.lime}" font-size="17">memory-first:</text>
  <text class="mono" x="270" y="951" fill="${palette.paper}" font-size="17">add -> encrypt -> store -> anchor -> share -> recall</text>
  <text class="mono" x="1436" y="951" fill="${palette.paper}" font-size="17">onememe.xyz</text>
  ${xUrl(1572, 951, 15)}
`,
  });
}

function motionStoryboard() {
  const { width, height } = assets.motionStoryboard;
  const beats = [
    ["01", "Runtime starts", "Useful context appears in a runtime.", palette.violet],
    ["02", "Memory captured", "memory.add writes the durable fragment.", palette.violet],
    ["03", "Capability checks", "ReadWrite or Admin authority controls access.", palette.lime],
    ["04", "Encrypt and store", "Seal encrypts, MemWal routes, Walrus stores.", palette.sui],
    ["05", "Receipt lands", "Sui anchors namespace and trace metadata.", palette.sui],
    ["06", "Recall anywhere", "Another runtime searches the namespace.", palette.lime],
  ];
  const frame = (beat, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 96 + col * 586;
    const y = 230 + row * 334;
    return `<g filter="url(#small-shadow)">
      <rect x="${x}" y="${y}" width="506" height="250" rx="8" fill="${palette.paper}" stroke="#e7e1d5" stroke-width="2"/>
      <rect x="${x}" y="${y}" width="506" height="58" rx="8" fill="${palette.dark2}"/>
      <text class="mono" x="${x + 22}" y="${y + 37}" fill="${beat[3]}" font-size="18">${beat[0]}</text>
      <text class="display" x="${x + 76}" y="${y + 39}" fill="${palette.paper}" font-size="25">${escapeText(beat[1])}</text>
      <text class="body" x="${x + 24}" y="${y + 104}" fill="${palette.ink}" font-size="22">${escapeText(beat[2])}</text>
      ${memoryCard(x + 28, y + 138, 260, index < 3 ? "memory fragment" : "encrypted memory", index < 3 ? "agent context" : "walrus://blob", index === 3 ? "blue" : "violet")}
      <circle cx="${x + 404}" cy="${y + 178}" r="48" fill="${palette.dark2}" stroke="${beat[3]}" stroke-width="4"/>
      <path d="M${x + 378} ${y + 178}h52m-18-18 18 18-18 18" fill="none" stroke="${beat[3]}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
  };

  return svg({
    width,
    height,
    title: "OneMem motion storyboard",
    desc: "Six-beat storyboard for a OneMem intro video using the memory infrastructure visual direction.",
    body: `
  <rect width="${width}" height="${height}" fill="url(#dark-sheen)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)" opacity=".52"/>
  ${mark(96, 82, 78)}
  <text class="display" x="198" y="130" fill="${palette.paper}" font-size="62">OneMem intro storyboard</text>
  <text class="body" x="100" y="178" fill="${palette.muted}" font-size="24">Six beats for a HyperFrames or Remotion bumper with sound design.</text>
  ${beats.map(frame).join("\n")}
  <text class="mono" x="96" y="962" fill="${palette.lime}" font-size="18">sound:</text>
  <text class="mono" x="166" y="962" fill="${palette.paper}" font-size="18">low pulse -> memory click -> encrypted sweep -> clean recall tone</text>
  <text class="mono" x="1526" y="962" fill="${palette.paper}" font-size="18">onememe.xyz</text>
  ${xUrl(1662, 962, 16)}
`,
  });
}

function writeAsset(asset, content) {
  writeFileSync(join(here, asset.file), content);
  console.log(`wrote packages/brand/campaign/${asset.file}`);
}

mkdirSync(here, { recursive: true });
writeAsset(assets.readmeHero, readmeHero());
writeAsset(assets.xHeader, xHeader());
writeAsset(assets.linkCard, linkCard());
writeAsset(assets.toolsGrid, toolsGrid());
writeAsset(assets.architecture, architecture());
writeAsset(assets.motionStoryboard, motionStoryboard());
