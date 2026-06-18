const NETWORKS = {
  testnet: {
    label: "Testnet",
    rpcUrl: "https://fullnode.testnet.sui.io:443",
    suiscanBase: "https://suiscan.xyz/testnet",
    packageId: "0xc2e839c719e1c61222440f5661199e68de5413d8cfb49dd8bae3223e92fcf138",
    enabled: true,
  },
  mainnet: {
    label: "Mainnet",
    rpcUrl: "https://fullnode.mainnet.sui.io:443",
    suiscanBase: "https://suiscan.xyz/mainnet",
    packageId: "",
    enabled: false,
  },
};

const ACTION_EVENT = "events::ActionCallEmittedEvent";
const ZERO_HASH = new Uint8Array(32);
const HEX_ID = /^0x[0-9a-fA-F]{64}$/;

const $ = (id) => document.getElementById(id);

window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const network = params.get("network") || "testnet";
  const pathSession = location.pathname.match(/\/verify\/(0x[0-9a-fA-F]{64})\/?$/)?.[1] || "";
  const session = params.get("session") || params.get("session_id") || pathSession;
  if (NETWORKS[network]?.enabled) $("network").value = network;
  if (session) $("sessionId").value = session;
  $("verifyForm").addEventListener("submit", submitVerify);
  if (session) $("verifyForm").requestSubmit();
});

async function submitVerify(event) {
  event.preventDefault();
  const networkKey = $("network").value;
  const network = NETWORKS[networkKey];
  const sessionId = $("sessionId").value.trim();

  if (!network?.enabled || !network.packageId) {
    setState("warn", "Unavailable", "This network is not configured for public verification yet.");
    return;
  }
  if (!HEX_ID.test(sessionId)) {
    setState("warn", "Check ID", "Enter a full Sui object ID beginning with 0x.");
    return;
  }

  setBusy(true);
  setState("neutral", "Checking", "Reading TraceSession object and ActionCall events from Sui...");
  try {
    const [session, events] = await Promise.all([
      fetchSession(network, sessionId),
      fetchEvents(network, sessionId),
    ]);
    const verification = await verifyChain(session, events);
    renderResult(network, sessionId, session, events, verification);
  } catch (error) {
    setState("bad", "Failed", error instanceof Error ? error.message : String(error));
    $("result").hidden = true;
  } finally {
    setBusy(false);
  }
}

async function fetchSession(network, sessionId) {
  const result = await rpc(network, "sui_getObject", [
    sessionId,
    { showContent: true, showType: true },
  ]);
  if (result.error || !result.data) {
    throw new Error(`TraceSession not found: ${JSON.stringify(result.error ?? null)}`);
  }
  const content = result.data.content;
  if (!content || content.dataType !== "moveObject" || !content.fields) {
    throw new Error("Object is not a Move TraceSession.");
  }
  if (result.data.type && !result.data.type.includes("::trace::TraceSession")) {
    throw new Error(`Object type is not trace::TraceSession: ${result.data.type}`);
  }
  const fields = content.fields;
  return {
    fields,
    agentId: String(fields.agent_id ?? ""),
    environment: String(fields.environment ?? ""),
    namespaceId: String(fields.namespace_id ?? ""),
    callCount: Number(fields.call_count ?? 0),
    status: statusLabel(Number(fields.status ?? -1)),
    merkleRoot: toBytes(fields.merkle_root),
    lastContentHash: toBytes(fields.last_content_hash),
    capturedBy: String(fields.captured_by_address ?? ""),
    startedAt: Number(fields.started_at ?? 0),
  };
}

async function fetchEvents(network, sessionId) {
  const eventType = `${network.packageId}::${ACTION_EVENT}`;
  const events = [];
  let cursor = null;

  for (;;) {
    const page = await rpc(network, "suix_queryEvents", [
      { MoveEventType: eventType },
      cursor,
      100,
      false,
    ]);
    for (const event of page.data ?? []) {
      const fields = event.parsedJson;
      if (!fields || fields.session_id !== sessionId) continue;
      events.push(parseEvent(event, fields));
    }
    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }

  return events.sort((a, b) => a.timestampMs - b.timestampMs);
}

function parseEvent(event, fields) {
  const toolNamespace = String(fields.tool_namespace ?? "");
  const toolName = String(fields.tool_name ?? "");
  return {
    timestampMs: Number(event.timestampMs ?? fields.captured_at ?? 0),
    txDigest: event.id?.txDigest ?? "",
    callId: String(fields.call_id ?? ""),
    parentCallId: optionalId(fields.parent_call_id),
    label: optionalString(fields.label) || [toolNamespace, toolName].filter(Boolean).join("/"),
    toolNamespace,
    toolName,
    contentHash: toBytes(fields.content_hash),
    prevHash: toBytes(fields.prev_hash),
  };
}

async function verifyChain(session, events) {
  let running = ZERO_HASH;
  let previousContent = ZERO_HASH;
  let brokenAt = null;

  for (const [index, event] of events.entries()) {
    if (brokenAt === null && !sameBytes(event.prevHash, previousContent)) {
      brokenAt = index;
    }
    running = await chainHash(running, event.contentHash);
    previousContent = event.contentHash;
  }

  const countMatches = events.length === session.callCount;
  const rootMatches = sameBytes(running, session.merkleRoot);
  return {
    ok: brokenAt === null && rootMatches && countMatches,
    brokenAt,
    countMatches,
    rootMatches,
    computedRoot: running,
    expectedRoot: session.merkleRoot,
  };
}

async function rpc(network, method, params) {
  const response = await fetch(network.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  if (!response.ok) throw new Error(`${method} HTTP ${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(`${method}: ${body.error.message ?? JSON.stringify(body.error)}`);
  return body.result;
}

async function chainHash(running, content) {
  const buffer = new Uint8Array(running.length + content.length);
  buffer.set(running, 0);
  buffer.set(content, running.length);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", buffer));
}

function renderResult(network, sessionId, session, events, verification) {
  const statusText = verification.ok ? "Verified" : "Broken";
  setState(
    verification.ok ? "good" : "bad",
    statusText,
    verification.ok
      ? "Merkle root, prev_hash chain, and call count match on-chain evidence."
      : "The recomputed evidence does not match the TraceSession object.",
  );
  $("result").hidden = false;
  renderFacts("sessionFacts", [
    ["Session", short(sessionId)],
    ["Agent", session.agentId || "unknown"],
    ["Environment", session.environment || "unknown"],
    ["Status", session.status],
    ["Namespace", short(session.namespaceId)],
    ["Captured by", short(session.capturedBy)],
    ["Started", formatTime(session.startedAt)],
    ["Suiscan", link(`${network.suiscanBase}/object/${sessionId}`, "Open object")],
  ]);
  renderFacts("verifyFacts", [
    ["Expected root", bytesHex(verification.expectedRoot)],
    ["Computed root", bytesHex(verification.computedRoot)],
    ["Root match", String(verification.rootMatches)],
    ["Call count", `${events.length} evidence / ${session.callCount} session`],
    ["Count match", String(verification.countMatches)],
    ["Broken at", verification.brokenAt === null ? "none" : String(verification.brokenAt + 1)],
  ]);
  renderCalls(network, events);
}

function renderFacts(id, rows) {
  $(id).innerHTML = rows
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${value}</dd>`)
    .join("");
}

function renderCalls(network, events) {
  if (events.length === 0) {
    $("calls").innerHTML = "<p class=\"message\">No ActionCall events found.</p>";
    return;
  }
  $("calls").innerHTML = events
    .map((event, index) => {
      const title = event.label || "unknown call";
      const detail = `${event.toolNamespace || "unknown"}/${event.toolName || "unknown"} - ${short(
        event.callId,
      )}`;
      const href = event.txDigest ? `${network.suiscanBase}/tx/${event.txDigest}` : "";
      const tx = href ? link(href, short(event.txDigest, 10, 6)) : "no tx";
      return `<div class="call"><span class="seq">${index + 1}</span><div><strong>${escapeHtml(
        title,
      )}</strong><span>${escapeHtml(detail)}</span></div><div>${tx}</div></div>`;
    })
    .join("");
}

function toBytes(value) {
  if (value instanceof Uint8Array) return value;
  if (Array.isArray(value)) return Uint8Array.from(value.map((item) => Number(item)));
  if (typeof value === "string" && value.startsWith("0x")) {
    return Uint8Array.from(value.slice(2).match(/.{1,2}/g)?.map((x) => parseInt(x, 16)) ?? []);
  }
  throw new Error("Expected a vector<u8> field from Sui.");
}

function optionalString(value) {
  if (typeof value === "string") return value;
  if (value && Array.isArray(value.vec) && value.vec.length > 0) return String(value.vec[0]);
  return "";
}

function optionalId(value) {
  return optionalString(value) || null;
}

function sameBytes(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function bytesHex(bytes) {
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function short(value, head = 12, tail = 8) {
  if (!value) return "none";
  return value.length > head + tail + 3 ? `${value.slice(0, head)}...${value.slice(-tail)}` : value;
}

function formatTime(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "unknown";
  return new Date(ms).toISOString();
}

function statusLabel(status) {
  return ["Active", "Completed", "Failed", "Aborted"][status] ?? `Unknown(${status})`;
}

function link(href, label) {
  return `<a href="${escapeHtml(href)}" rel="noreferrer" target="_blank">${escapeHtml(label)}</a>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setBusy(isBusy) {
  $("verifyButton").disabled = isBusy;
  $("verifyButton").textContent = isBusy ? "Verifying" : "Verify";
}

function setState(kind, label, message) {
  $("statusBadge").className = `badge ${kind}`;
  $("statusBadge").textContent = label;
  $("message").textContent = message;
}
