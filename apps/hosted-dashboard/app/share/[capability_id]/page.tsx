import Link from "next/link";
import { Icon } from "@/components/Icon";
import { shortId } from "@/lib/public-verify";
import {
  holderSelfRevokeCommand,
  loadShareCapability,
  namespaceKindLabel,
  type ShareCapabilityLoadResult,
} from "@/lib/share-capability";
import { ShareCapabilityAccountHint } from "./ShareCapabilityAccountHint";

export const dynamic = "force-dynamic";

type Params = Promise<{ capability_id: string }>;
type ShareCapabilityPageData = Extract<ShareCapabilityLoadResult, { ok: true }>["data"];

const CLAIM_BOUNDARY = [
  "The capability object already belongs to the owner shown on this page.",
  "There is no separate hosted claim transaction in contract v0.1.",
  "Using the capability still requires the owning wallet or a delegated runtime credential.",
];

const NOT_CLAIMED = [
  "This page does not transfer ownership.",
  "It does not decrypt Walrus or Seal payloads.",
  "It does not prove the recipient has used the capability inside an agent runtime yet.",
];

export default async function ShareCapabilityLandingPage({ params }: { params: Params }) {
  const { capability_id } = await params;
  const result = await loadShareCapability(capability_id);

  return (
    <main className="container" style={{ maxWidth: 920, padding: "44px 24px 80px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <Icon name="share" size={20} />
        <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: "1.2rem" }}>
          OneMem
        </span>
        <span className="badge badge-chain" style={{ marginLeft: 6 }}>
          <span className="dot" />
          share capability
        </span>
      </header>

      {!result.ok ? (
        <section className="card" style={{ padding: 28 }}>
          <span className="badge badge-grey">
            <Icon name="xCircle" size={14} />
            Unavailable
          </span>
          <h1 style={{ fontSize: 24, marginTop: 14 }}>Capability not found</h1>
          <p style={{ color: "var(--danger)", marginTop: 8 }}>{result.error}</p>
          <p className="mono muted" style={{ overflowWrap: "anywhere", marginTop: 10 }}>
            {capability_id}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <a className="xlink" href={result.suiscanCapability} target="_blank" rel="noreferrer">
              View object on Suiscan <Icon name="external" size={14} />
            </a>
            <Link className="btn btn-ghost btn-sm" href="/share">
              Open share tools
            </Link>
          </div>
        </section>
      ) : (
        <CapabilityView data={result.data} />
      )}
    </main>
  );
}

function CapabilityView({ data }: { readonly data: ShareCapabilityPageData }) {
  const { capability, namespace } = data;
  const owner = capability.ownerAddress ?? capability.ownerDisplay;
  const revokeCommand = holderSelfRevokeCommand(capability.id, capability.kind);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section className="card trace-shell verified-glow" style={{ padding: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 18,
          }}
        >
          <div>
            <span className="eyebrow">
              <span className="tick">*</span>
              Recipient landing
            </span>
            <h1 style={{ fontSize: 30, marginTop: 10 }}>Shared namespace capability</h1>
            <p className="mono" style={{ color: "var(--ink-2)", marginTop: 6, fontSize: 13 }}>
              {shortId(capability.id, 16, 10)}
            </p>
          </div>
          <span className="badge badge-verify">
            <Icon name="shield" size={14} />
            {capability.kind}
          </span>
        </div>

        <div className="receipt" style={{ marginTop: 22 }}>
          <ReceiptRow label="Capability" value={shortId(capability.id, 16, 10)} />
          <ReceiptRow label="Owner" value={shortId(owner, 16, 10)} tone="ok" />
          <ReceiptRow label="Owner kind" value={capability.ownerKind} />
          <ReceiptRow label="Namespace" value={shortId(capability.namespaceId, 16, 10)} />
          <ReceiptRow label="Network" value={data.network} />
          <ReceiptRow
            label="Namespace status"
            value={namespace ? (namespace.active ? "active" : "inactive") : "unavailable"}
            tone={namespace?.active ? "ok" : "warn"}
          />
        </div>

        <ShareCapabilityAccountHint
          capabilityId={capability.id}
          capabilityKind={capability.kind}
          network={data.network}
          ownerAddress={capability.ownerAddress}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
          <a className="xlink" href={data.suiscanCapability} target="_blank" rel="noreferrer">
            View capability on Suiscan <Icon name="external" size={14} />
          </a>
          <a className="xlink" href={data.suiscanNamespace} target="_blank" rel="noreferrer">
            View namespace on Suiscan <Icon name="external" size={14} />
          </a>
        </div>
      </section>

      <section className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 20, display: "flex", alignItems: "center", gap: 9 }}>
          <Icon name="revoke" size={18} />
          Holder self-revoke
        </h2>
        <p className="muted" style={{ fontSize: ".9rem", marginTop: 10, maxWidth: 760 }}>
          Holders can self-revoke by consuming the capability object. Run this from the wallet or
          runtime credential that owns the object:
        </p>
        <div className="copyline" style={{ marginTop: 14 }}>
          <span className="cmd mono" style={{ overflowWrap: "anywhere" }}>
            {revokeCommand}
          </span>
        </div>
        <p className="muted" style={{ fontSize: ".86rem", marginTop: 12, maxWidth: 760 }}>
          Namespace admins can marker-revoke a capability by ID through CLI/MCP; this recipient page
          does not prepare that hosted admin transaction. Admin capabilities include the CLI safety
          flag because revoking one can remove namespace administration access.
        </p>
      </section>

      <section className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 20, display: "flex", alignItems: "center", gap: 9 }}>
          <Icon name="cube" size={18} />
          Namespace
        </h2>
        {namespace ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 14,
              marginTop: 16,
            }}
          >
            <Meta label="Name" value={namespace.name || "unnamed"} />
            <Meta label="Kind" value={namespaceKindLabel(namespace.kind)} />
            <Meta label="Owner" value={shortId(namespace.owner, 14, 8)} />
            <Meta label="Active" value={namespace.active ? "yes" : "no"} />
          </div>
        ) : (
          <p className="muted" style={{ fontSize: ".9rem", marginTop: 10 }}>
            Namespace metadata could not be loaded: {data.namespaceError ?? "unknown error"}. The
            capability object above is still the source of truth for ownership.
          </p>
        )}
      </section>

      <section className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 20, display: "flex", alignItems: "center", gap: 9 }}>
          <Icon name="info" size={18} />
          What this page proves
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
            marginTop: 16,
          }}
        >
          <ProofList title="Proven" icon="checkCircle" items={CLAIM_BOUNDARY} tone="ok" />
          <ProofList title="Not proven" icon="xCircle" items={NOT_CLAIMED} tone="muted" />
        </div>
      </section>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  tone,
}: {
  readonly label: string;
  readonly value: string;
  readonly tone?: "ok" | "warn";
}) {
  return (
    <div className="receipt-row">
      <span>{label}</span>
      <strong className={`mono ${tone === "ok" ? "ok" : tone === "warn" ? "warn" : ""}`}>
        {value}
      </strong>
    </div>
  );
}

function Meta({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div style={{ border: "1px solid var(--line)", padding: 14, background: "var(--card-2)" }}>
      <div className="muted" style={{ fontSize: ".76rem" }}>
        {label}
      </div>
      <div className="mono" style={{ marginTop: 6, overflowWrap: "anywhere" }}>
        {value}
      </div>
    </div>
  );
}

function ProofList({
  title,
  icon,
  items,
  tone,
}: {
  readonly title: string;
  readonly icon: string;
  readonly items: readonly string[];
  readonly tone: "ok" | "muted";
}) {
  return (
    <div style={{ border: "1px solid var(--line)", padding: 16, background: "var(--card-2)" }}>
      <h3 style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name={icon} size={16} />
        {title}
      </h3>
      <ul style={{ display: "grid", gap: 8, margin: "12px 0 0", paddingLeft: 18 }}>
        {items.map((item) => (
          <li
            key={item}
            className={tone === "ok" ? "" : "muted"}
            style={{ fontSize: ".9rem", lineHeight: 1.45 }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
