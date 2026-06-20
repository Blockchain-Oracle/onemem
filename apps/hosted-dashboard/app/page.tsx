import { Icon } from "@/components/Icon";

export default function HostedRoot() {
  return (
    <main
      className="container"
      style={{ maxWidth: 760, padding: "80px 24px", textAlign: "center" }}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <Icon name="cube" size={28} />
        <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: "1.5rem" }}>
          OneMem
        </span>
      </div>
      <h1 style={{ fontSize: "2.4rem", lineHeight: 1.1 }}>
        Decentralized memory for your agents.{" "}
        <span style={{ color: "var(--primary)" }}>Stored on MemWal.</span>
      </h1>
      <p className="muted" style={{ fontSize: "1.05rem", margin: "16px auto 0", maxWidth: 560 }}>
        OneMem's hosted surface: connect an account and pair a terminal with a MemWal delegate key.
      </p>
      <div
        className="cta"
        style={{ justifyContent: "center", marginTop: 30, display: "flex", gap: 12 }}
      >
        <a className="btn btn-primary" href="/login">
          <Icon name="bolt" size={16} />
          Get started
        </a>
        <a className="btn btn-ghost" href="/login">
          Sign in
        </a>
      </div>
    </main>
  );
}
