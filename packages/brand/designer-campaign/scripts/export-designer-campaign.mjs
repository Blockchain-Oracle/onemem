#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const campaignRoot = path.resolve(here, "..");
const brandRoot = path.resolve(campaignRoot, "..");
const sourceZip = path.join(campaignRoot, "raw/one-mem-campaign-source.zip");
const outRoot = path.join(campaignRoot, "exports");
const staticOut = path.join(outRoot, "static");
const videoOut = path.join(outRoot, "video");
const framesOut = path.join(outRoot, ".frames");
const audioPath = path.join(campaignRoot, "audio/onemem-launch-bed.wav");
const chromeBin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const fps = 30;
const durationSeconds = 30;

const boards = [
  { id: "readme-hero", board: "hero", component: "HeroBanner", width: 1280, height: 420 },
  { id: "x-header", board: "xheader", component: "XHeader", width: 1500, height: 500 },
  { id: "link-card", board: "linkcard", component: "LinkCard", width: 1200, height: 630 },
  { id: "tools-poster", board: "poster", component: "ToolsPoster", width: 1600, height: 900 },
  { id: "architecture", board: "arch", component: "Architecture", width: 1920, height: 1080 },
];

const args = new Set(process.argv.slice(2));
const shouldDoBoards = !args.has("--video-only");
const shouldDoVideo = args.has("--video") || args.has("--all");
const keepTemp = args.has("--keep-temp");

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function formatRel(abs) {
  return path.relative(campaignRoot, abs).replaceAll(path.sep, "/");
}

function ensureTools() {
  for (const item of [sourceZip, audioPath]) {
    if (!existsSync(item)) throw new Error(`Missing required file: ${item}`);
  }
  if (!existsSync(chromeBin)) throw new Error(`Google Chrome not found at ${chromeBin}`);
  for (const cmd of ["unzip", "ffmpeg", "ffprobe"]) {
    const found = spawnSync("which", [cmd], { encoding: "utf8" });
    if (found.status !== 0) throw new Error(`Missing command: ${cmd}`);
  }
}

function run(cmd, runArgs, options = {}) {
  const result = spawnSync(cmd, runArgs, { encoding: "utf8", stdio: "pipe", ...options });
  if (result.status !== 0) {
    throw new Error(`${cmd} failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout.trim();
}

function removeDir(dir) {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch {
    // Chrome can keep profile files open briefly after SIGTERM. A stale temp
    // profile must not fail an otherwise completed export.
  }
}

function extractSource() {
  const dir = path.join(tmpdir(), `onemem-campaign-export-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  run("unzip", ["-q", "-o", sourceZip, "-d", dir]);
  patchExtractedSource(dir);
  writeExportPages(dir);
  return dir;
}

function patchExtractedSource(dir) {
  const assetsA = path.join(dir, "kit/assets-a.jsx");
  let source = readFileSync(assetsA, "utf8");
  source = source
    .replaceAll("@OneMemAI", "x.com/OneMemAI")
    .replaceAll("Decentralized memory · Mem0-style", "Decentralized memory · agent-native");
  writeFileSync(assetsA, source);
}

function writeExportPages(dir) {
  writeFileSync(
    path.join(dir, "export-board.html"),
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden;background:#090d15}.om{box-sizing:border-box}</style></head><body><div id="root"></div>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin="anonymous"></script>
<script type="text/babel" src="kit/parts.jsx"></script>
<script type="text/babel" src="kit/assets-a.jsx"></script>
<script type="text/babel" src="kit/assets-b.jsx"></script>
<script type="text/babel">
const configs = ${JSON.stringify(Object.fromEntries(boards.map((b) => [b.board, b])))};
const config = configs[new URLSearchParams(location.search).get("board")];
function App(){ const Cmp = window[config.component]; React.useEffect(()=>{Promise.resolve(document.fonts?.ready).finally(()=>setTimeout(()=>{document.body.dataset.ready="true"},250));},[]); return <div id="capture" style={{width:config.width,height:config.height}}><Cmp /></div>; }
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
</script></body></html>`,
  );

  writeFileSync(
    path.join(dir, "export-launch.html"),
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden;background:#090d15}</style></head><body><div id="root"></div>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin="anonymous"></script>
<script type="text/babel" src="animations.jsx"></script>
<script type="text/babel" src="kit/parts.jsx"></script>
<script type="text/babel" src="video/scenes.jsx"></script>
<script type="text/babel">
const { TimelineContext, Sprite } = window;
function Backdrop(){return <React.Fragment><div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(to right, rgba(248,246,240,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(248,246,240,0.04) 1px, transparent 1px)",backgroundSize:"54px 54px",WebkitMaskImage:"radial-gradient(120% 120% at 50% 42%, #000 0%, #000 46%, transparent 82%)",maskImage:"radial-gradient(120% 120% at 50% 42%, #000 0%, #000 46%, transparent 82%)"}}/><div style={{position:"absolute",inset:0,boxShadow:"inset 0 0 240px 80px rgba(5,8,14,0.9)",pointerEvents:"none"}}/></React.Fragment>;}
function Video(){const [time,setTime]=React.useState(0); React.useEffect(()=>{window.__setExportTime=(v)=>new Promise((resolve)=>{setTime(Number(v)||0); requestAnimationFrame(()=>requestAnimationFrame(resolve));}); Promise.resolve(document.fonts?.ready).finally(()=>setTimeout(()=>{document.body.dataset.ready="true"},250));},[]); return <div id="video-capture" style={{position:"relative",width:1920,height:1080,overflow:"hidden",background:"#090d15"}}><TimelineContext.Provider value={{time,duration:30,playing:false,setTime,setPlaying:()=>{}}}><Backdrop/><Sprite start={0} end={4.4}><Scene1/></Sprite><Sprite start={4.4} end={9.4}><Scene2/></Sprite><Sprite start={9.4} end={14.8}><Scene3/></Sprite><Sprite start={14.8} end={22.2}><Scene4/></Sprite><Sprite start={22.2} end={27.2}><Scene5/></Sprite><Sprite start={27.2} end={30}><Scene6/></Sprite></TimelineContext.Provider></div>;}
ReactDOM.createRoot(document.getElementById("root")).render(<Video />);
</script></body></html>`,
  );
}

function serve(root) {
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    const file = path.resolve(root, pathname);
    if (!file.startsWith(root) || !existsSync(file)) {
      res.writeHead(404).end("not found");
      return;
    }
    const ext = path.extname(file);
    const type = ext === ".html" ? "text/html" : ext === ".jsx" ? "text/babel" : ext === ".svg" ? "image/svg+xml" : "application/octet-stream";
    res.writeHead(200, { "content-type": type });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function launchChrome() {
  const port = 39000 + Math.floor(Math.random() * 2000);
  const profile = path.join(tmpdir(), `onemem-chrome-${Date.now()}`);
  const proc = spawn(chromeBin, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--mute-audio",
    "--autoplay-policy=no-user-gesture-required",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--disable-background-networking",
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  proc.stderr.on("data", () => {});
  for (let i = 0; i < 120; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return { proc, port, profile };
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  proc.kill("SIGKILL");
  throw new Error("Chrome remote debugging endpoint did not start");
}

class Cdp {
  constructor(wsUrl) {
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
      this.ws.addEventListener("message", (event) => this.onMessage(event));
    });
  }
  onMessage(event) {
    const msg = JSON.parse(event.data);
    if (!msg.id || !this.pending.has(msg.id)) return;
    const { resolve, reject } = this.pending.get(msg.id);
    this.pending.delete(msg.id);
    if (msg.error) reject(new Error(`${msg.error.message}: ${JSON.stringify(msg.error.data ?? "")}`));
    else resolve(msg.result);
  }
  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  close() {
    this.ws?.close();
  }
}

async function newPage(port, width, height) {
  const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  if (!res.ok) throw new Error(`Could not create Chrome target: ${res.status}`);
  const target = await res.json();
  const page = new Cdp(target.webSocketDebuggerUrl);
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await page.send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: 1, mobile: false,
  });
  return page;
}

async function navigate(page, url) {
  await page.send("Page.navigate", { url });
  await waitUntil(page, "document.readyState === 'complete' && document.body?.dataset.ready === 'true'");
}

async function waitUntil(page, expression, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const out = await page.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (out.result.value) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

async function screenshot(page, file, width, height, format = "png", quality) {
  const result = await page.send("Page.captureScreenshot", {
    format,
    quality,
    fromSurface: true,
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width, height, scale: 1 },
  });
  writeFileSync(file, Buffer.from(result.data, "base64"));
}

function pngDimensions(file) {
  const buf = readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function videoProbe(file) {
  const data = JSON.parse(run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration:stream=codec_type,width,height,r_frame_rate",
    "-of", "json",
    file,
  ]));
  const video = data.streams.find((stream) => stream.codec_type === "video");
  return {
    width: video.width,
    height: video.height,
    durationSeconds: Number(Number(data.format.duration).toFixed(3)),
    frameRate: video.r_frame_rate,
  };
}

async function exportBoards(serverPort, chromePort) {
  mkdirSync(staticOut, { recursive: true });
  const exported = [];
  for (const board of boards) {
    const file = path.join(staticOut, `${board.id}.png`);
    const page = await newPage(chromePort, board.width, board.height);
    const url = `http://127.0.0.1:${serverPort}/export-board.html?board=${board.board}`;
    await navigate(page, url);
    await screenshot(page, file, board.width, board.height);
    page.close();
    const stat = statSync(file);
    exported.push({ ...board, file: formatRel(file), sizeBytes: stat.size, sha256: sha256(file), dimensions: pngDimensions(file) });
    console.log(`[designer-export] wrote ${formatRel(file)}`);
  }
  return exported;
}

async function exportVideo(serverPort, chromePort) {
  mkdirSync(videoOut, { recursive: true });
  rmSync(framesOut, { recursive: true, force: true });
  mkdirSync(framesOut, { recursive: true });
  const page = await newPage(chromePort, 1920, 1080);
  await navigate(page, `http://127.0.0.1:${serverPort}/export-launch.html`);
  const frameCount = fps * durationSeconds;
  for (let i = 0; i < frameCount; i += 1) {
    const t = i / fps;
    await page.send("Runtime.evaluate", {
      expression: `window.__setExportTime__ ? window.__setExportTime__(${t}) : window.__setExportTime(${t})`,
      awaitPromise: true,
    });
    const file = path.join(framesOut, `frame-${String(i + 1).padStart(5, "0")}.jpg`);
    await screenshot(page, file, 1920, 1080, "jpeg", 92);
    if ((i + 1) % 90 === 0) console.log(`[designer-export] captured ${i + 1}/${frameCount} frames`);
  }
  page.close();
  const out = path.join(videoOut, "onemem-launch-30s.mp4");
  run("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error",
    "-framerate", String(fps),
    "-i", path.join(framesOut, "frame-%05d.jpg"),
    "-i", audioPath,
    "-t", String(durationSeconds),
    "-vf", "scale=in_range=full:out_range=tv,format=yuv420p",
    "-af", "volume=-1.5dB",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-color_range", "tv",
    "-movflags", "+faststart",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    out,
  ]);
  const stat = statSync(out);
  const probed = videoProbe(out);
  console.log(`[designer-export] wrote ${formatRel(out)}`);
  return { id: "launch-video-landscape", file: formatRel(out), fps, audioFile: path.relative(campaignRoot, audioPath).replaceAll(path.sep, "/"), audioSha256: sha256(audioPath), sizeBytes: stat.size, sha256: sha256(out), ...probed };
}

function writeManifest(staticBoards, launchVideo) {
  const manifest = {
    generatedAt: "2026-06-19",
    source: {
      zip: "raw/one-mem-campaign-source.zip",
      zipSha256: sha256(sourceZip),
      boundary: "Exports are generated from the designer HTML source. Third-party reference videos remain inside the raw zip only and are not sampled.",
      exportPatches: [
        "Apply border-box sizing to the campaign root so exact-size board exports do not clip padded content.",
        "Use x.com/OneMemAI instead of a bare X handle in generated social/link assets.",
        "Use the memory-first eyebrow 'Decentralized memory · agent-native' instead of 'Mem0-style'.",
      ],
    },
    staticBoards,
    launchVideos: launchVideo ? [launchVideo] : [],
  };
  mkdirSync(outRoot, { recursive: true });
  writeFileSync(path.join(outRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(path.join(outRoot, "README.md"), [
    "# OneMem Campaign Exports",
    "",
    "Generated from `designer-campaign/raw/one-mem-campaign-source.zip`.",
    "",
    "- Static boards are exact-size PNG exports from the designer Brand Kit HTML.",
    "- The launch video is rendered from the designer Launch Video HTML and paired with OneMem-owned generated audio.",
    "- Do not restore deleted `campaign/`, `og-images/`, or old render folders.",
    "",
    "Regenerate with:",
    "",
    "```sh",
    "npm run designer-campaign:export -- --all",
    "```",
    "",
  ].join("\n"));
}

async function main() {
  ensureTools();
  const temp = extractSource();
  const server = await serve(temp);
  const serverPort = server.address().port;
  const chrome = await launchChrome();
  try {
    const staticBoards = shouldDoBoards ? await exportBoards(serverPort, chrome.port) : [];
    const launchVideo = shouldDoVideo ? await exportVideo(serverPort, chrome.port) : null;
    writeManifest(staticBoards, launchVideo);
  } finally {
    server.close();
    chrome.proc.kill("SIGTERM");
    removeDir(chrome.profile);
    if (!keepTemp) removeDir(temp);
    removeDir(framesOut);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
