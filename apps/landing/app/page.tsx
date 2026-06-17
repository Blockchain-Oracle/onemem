import { Icon } from "@/components/Icon";
import { VerifyDemo } from "@/components/VerifyDemo";

const PROBLEMS = [
  [
    "memory",
    "Memory is trapped",
    "Every app keeps its own silo. Switch tools and your agent forgets everything — there's no portable, shared memory.",
  ],
  [
    "search",
    "Actions are invisible",
    '"It sent money / made a video / did research" — but which skill, which model, what inputs? The trace is gone the moment the run ends.',
  ],
  [
    "shield",
    "Nothing is provable",
    "No way to show a teammate, an auditor, or a skeptic that the agent did exactly what it claims — untampered.",
  ],
] as const;

const STEPS = [
  [
    "1",
    "Install",
    "One line adds OneMem to your agent runtime. No rewrites, no SDK gymnastics.",
    "$ npm create onemem@latest",
  ],
  [
    "2",
    "Use your agent normally",
    "Memories and every tool / skill / MCP call are captured automatically — encrypted and chained as they happen.",
    'agent.run("send 5 USDC to Maya")',
  ],
  [
    "3",
    "Verify & share",
    "Open the dashboard or CLI, walk the chain, and watch it turn green. Share a public proof link with anyone.",
    "$ onemem verify 0x7a3f…d201",
  ],
] as const;

const PILLARS = [
  [
    "01",
    "memory",
    "Verifiable memory",
    "Encrypted Walrus blobs, threshold-encrypted with Seal, access-controlled by on-chain namespaces. Cross-device sync without trusting a vendor.",
  ],
  [
    "02",
    "trace",
    "Action trace + replay",
    "Every tool / skill / MCP call captured as a Merkle-chained node. Replay any run purely from chain + Walrus — no original runtime needed.",
  ],
  [
    "03",
    "everywhere",
    "Cross-runtime",
    "The same memory namespace and trace format across every runtime and framework. One dashboard for all of them.",
  ],
] as const;

const INTEGRATIONS = [
  ["bolt", "Claude Code"],
  ["cube", "Hermes"],
  ["settings", "Cursor"],
  ["branch", "OpenClaw"],
  ["bolt", "Vercel AI SDK"],
  ["bolt", "OpenAI Agents"],
  ["branch", "CrewAI"],
  ["apps", "LiveKit"],
  ["apps", "ElevenLabs"],
] as const;

export default function LandingPage() {
  return (
    <>
      <nav className="lp-nav">
        <a className="lp-brand" href="/">
          <Icon name="cube" size={20} />
          OneMem
        </a>
        <div className="spacer" />
        <div className="lp-nav-links">
          <a href="http://localhost:4040">Dashboard</a>
          <a href="#integrations">Integrations</a>
          <a href="#demo">Verify demo</a>
        </div>
        <a
          className="btn btn-primary btn-sm"
          href="http://localhost:4040"
          style={{ marginLeft: 8 }}
        >
          Get started <Icon name="arrowRight" size={16} />
        </a>
      </nav>

      <header className="hero">
        <div className="hero-grid-bg grid-bg grid-fade" />
        <div className="container hero-inner">
          <div>
            <span className="hero-kicker">
              <Icon name="shield" size={14} />
              Stop trusting your AI agent. Verify it.
            </span>
            <h1>
              Verifiable agent <span className="em">memory</span> +{" "}
              <span className="em">trace</span>, for every runtime.
            </h1>
            <p className="sub">
              Every memory your agent writes is an encrypted blob on Walrus. Every action it takes
              is a Merkle-chained attestation on Sui. Open one dashboard — across Claude Code,
              Hermes, Cursor and more — and <strong>verify, replay, and share</strong> exactly what
              it did.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary" href="http://localhost:4040">
                <Icon name="bolt" size={16} />
                Get started
              </a>
              <a className="btn btn-ghost" href="#demo">
                <Icon name="play" size={16} />
                Watch the verify demo
              </a>
            </div>
            <div className="hero-meta">
              <div className="hm">
                <span className="n">Walrus</span>
                <span className="l">encrypted at rest</span>
              </div>
              <div className="hm">
                <span className="n">Sui</span>
                <span className="l">merkle-chained</span>
              </div>
              <div className="hm">
                <span className="n">8+</span>
                <span className="l">runtimes</span>
              </div>
            </div>
          </div>
          <VerifyDemo />
        </div>
      </header>

      <div className="trust">
        <div className="container">
          <div className="lab">Built on the Sui · Walrus · Seal stack</div>
          <div className="trust-row">
            <span className="tl">
              <Icon name="cube" size={16} />
              Sui
            </span>
            <span className="tl">
              <Icon name="lock" size={16} />
              Walrus
            </span>
            <span className="tl">
              <Icon name="key" size={16} />
              Seal
            </span>
            <span className="tl">
              <Icon name="memory" size={16} />
              MemWal
            </span>
            <span className="tl">
              <Icon name="shield" size={16} />
              Sui Overflow 2026
            </span>
          </div>
        </div>
      </div>

      <section className="lp-sec">
        <div className="container">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="tick">▚</span>The problem
            </span>
            <h2>Agents are powerful, stateless, and impossible to audit.</h2>
            <p>
              You can't see what your agent actually did, you can't take its memory with you, and
              you certainly can't prove any of it to anyone else.
            </p>
          </div>
          <div className="steps">
            {PROBLEMS.map(([icon, title, body]) => (
              <div className="card step" key={title}>
                <div className="no">
                  <Icon name={icon} size={18} />
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="lp-sec"
        style={{
          background: "var(--paper-2)",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="container">
          <div className="sec-head center">
            <span className="eyebrow">
              <span className="tick">✦</span>How it works
            </span>
            <h2>Three steps to a verifiable agent.</h2>
          </div>
          <div className="steps">
            {STEPS.map(([no, title, body, code]) => (
              <div className="card step" key={no}>
                <div className="no">{no}</div>
                <h3>{title}</h3>
                <p>{body}</p>
                <div className="mini-code mono">{code}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-sec">
        <div className="container">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="tick">✦</span>The pillars
            </span>
            <h2>Not one feature — a layer under every agent.</h2>
          </div>
          <div className="steps">
            {PILLARS.map(([no, tag, title, body]) => (
              <div className="card pillar" key={no}>
                <div className="pillar-no">
                  <span>{no}</span>
                  <span className="tag">{tag}</span>
                </div>
                <h3>{title}</h3>
                <p className="p-desc">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-sec demo-band" id="demo">
        <div className="container">
          <div className="sec-head center">
            <span className="eyebrow">
              <span className="tick">✦</span>The signature moment
            </span>
            <h2>Verification turns the page green.</h2>
            <p>
              Click Verify and OneMem walks every call, recomputes each hash, and compares it to the
              on-chain root. When the chain holds, the whole view lights up.
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <VerifyDemo />
          </div>
        </div>
      </section>

      <section
        className="lp-sec"
        id="integrations"
        style={{
          background: "var(--paper-2)",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="container">
          <div className="sec-head center">
            <span className="eyebrow">
              <span className="tick">✦</span>Integrations
            </span>
            <h2>Works where your agents already run.</h2>
          </div>
          <div className="int-grid">
            {INTEGRATIONS.map(([icon, name]) => (
              <div
                className="card"
                key={name}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: 16 }}
              >
                <span className="rt-logo">
                  <Icon name={icon} size={16} />
                </span>
                <span className="nm">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            <span className="tick">✦</span>Get started
          </span>
          <h2 style={{ marginTop: 16 }}>Stop trusting. Start verifying.</h2>
          <p className="sub">Install in under a minute. Watch your first trace turn green.</p>
          <div className="cta" style={{ marginTop: 24 }}>
            <a className="btn btn-primary" href="http://localhost:4040">
              <Icon name="bolt" size={16} />
              Get started
            </a>
            <a className="btn btn-ghost" href="http://localhost:4040">
              See a live trace
            </a>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="container">
          <div className="foot-bottom">
            <span className="fb-l">© 2026 OneMem · Apache-2.0 · Built for Sui Overflow 2026</span>
          </div>
        </div>
      </footer>
    </>
  );
}
