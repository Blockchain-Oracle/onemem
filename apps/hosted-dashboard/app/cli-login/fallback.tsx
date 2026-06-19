export function CliLoginFallback() {
  return (
    <div className="auth-wrap">
      <div className="auth-bg grid-bg grid-fade" />
      <div className="auth-card" style={{ maxWidth: 540 }}>
        <div className="auth-brand">OneMem CLI</div>
        <div className="card" style={{ padding: 26 }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>Pair your terminal</h2>
          <p className="muted" style={{ fontSize: ".9rem", marginBottom: 16 }}>
            Loading the local CLI pairing request.
          </p>
          <div className="verify-mini">
            <span className="vm-ic">i</span>
            <span>Preparing wallet connection and callback details.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
