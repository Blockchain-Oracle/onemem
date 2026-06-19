import { Icon } from "@/components/Icon";
import { VerifyDemo } from "@/components/VerifyDemo";
import { INTEGRATION_TIERS, PILLARS, PROBLEMS, STEPS } from "./landing-content";

const appUrl = process.env.NEXT_PUBLIC_ONEMEM_APP_URL ?? "https://app.onemem.xyz";

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
          <a href={appUrl}>Dashboard</a>
          <a href="#integrations">Integrations</a>
          <a href="#demo">Live proof</a>
        </div>
        <a className="btn btn-primary btn-sm" href={appUrl} style={{ marginLeft: 8 }}>
          Get started <Icon name="arrowRight" size={16} />
        </a>
      </nav>

      <header className="hero">
        <div className="hero-grid-bg grid-bg grid-fade" />
        <div className="container hero-inner">
          <div>
            <span className="hero-kicker">
              <Icon name="shield" size={14} />
              Verifiable action traces + memory you own.
            </span>
            <h1>
              See exactly what your <span className="em">agent did</span> — and{" "}
              <span className="em">prove it</span>.
            </h1>
            <p className="sub">
              Every tool, MCP, and skill call your agent makes is recorded as a Merkle-chained node
              on Sui; its memory is encrypted on Walrus and owned by you. Open one dashboard, replay
              what happened, and{" "}
              <strong>hand anyone a public link to verify it — no login, no vendor trust</strong>.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary" href={appUrl}>
                <Icon name="bolt" size={16} />
                Get started
              </a>
              <a className="btn btn-ghost" href="#demo">
                <Icon name="play" size={16} />
                Watch the proof demo
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
                <span className="n">Public</span>
                <span className="l">verify, no login</span>
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
              Your agent's useful context gets scattered across tools, logs, and local machines.
              OneMem gives that context a portable memory namespace with a verifiable history.
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
            <h2>Three steps to persistent agent memory.</h2>
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
            <h2>Proof turns the page green.</h2>
            <p>
              Click Verify and OneMem walks every call, recomputes each hash, and compares it to the
              on-chain root. Memory stays encrypted; integrity is public.
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
          {INTEGRATION_TIERS.map((group) => (
            <div key={group.tier} style={{ marginBottom: 20 }}>
              <div className="lab" style={{ marginBottom: 8 }}>
                {group.tier} — <span className="muted">{group.note}</span>
              </div>
              <div className="int-grid">
                {group.items.map(([logo, name]) => (
                  <div
                    className="card"
                    key={name}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: 16 }}
                  >
                    <span className="rt-logo">
                      <img
                        src={`/logos/${logo}`}
                        alt=""
                        width={18}
                        height={18}
                        style={{ display: "block", objectFit: "contain" }}
                      />
                    </span>
                    <span className="nm">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            <span className="tick">✦</span>Get started
          </span>
          <h2 style={{ marginTop: 16 }}>Make every agent accountable.</h2>
          <p className="sub">
            Install in under a minute. Store a memory, run a trace, and prove it.
          </p>
          <div className="cta" style={{ marginTop: 24 }}>
            <a className="btn btn-primary" href={appUrl}>
              <Icon name="bolt" size={16} />
              Get started
            </a>
            <a className="btn btn-ghost" href={appUrl}>
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
