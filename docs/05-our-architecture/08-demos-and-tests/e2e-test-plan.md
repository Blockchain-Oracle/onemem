# E2E Test Plan — OneMem

> Current implementation note, 2026-06-17: CI now includes a deterministic demo
> matrix gate via `pnpm test:demo-matrix`. That command runs demo package tests,
> typechecks, lints, and builds across `demos/*`. It does **not** run
> `demo:trace`, because those commands mint real Sui testnet objects and should
> remain manual/on-demand until a separately researched scheduled or
> workflow-dispatch live testnet job exists.

End-to-end test matrix covering every v0.1 runtime + framework + SDK. Runs in CI on every push to main; full matrix runs nightly against mainnet.

---

## Test layers

| Layer | Tooling | What's tested |
|---|---|---|
| Unit | vitest (TS) / pytest (Py) | Per-package logic, isolated |
| Integration | vitest + miniature relayer mock | SDK ↔ relayer ↔ chain (with mocked Sui RPC) |
| Contract | sui move test + Move test suite | Move package behavior in isolation |
| E2E (mainnet) | playwright + real mainnet contract | Full stack: plugin → SDK → relayer → Walrus → Sui → dashboard |

---

## E2E test matrix

| Test | Runtime | Framework | Pillars |
|---|---|---|---|
| `test-claude-code-basic` | Claude Code | — | 1, 2, 3, 6 |
| `test-claude-code-trace` | Claude Code | — | 1, 2, 3, 7 |
| `test-openclaw-basic` | OpenClaw | — | 1, 2, 3 |
| `test-hermes-basic` | Hermes | — | 1, 2, 3 |
| `test-hermes-delegation` | Hermes | — | 1, 2, 3 (cross-runtime composition) |
| `test-vercel-ai` | (none) | Vercel AI SDK | 1, 2, 4 |
| `test-openai-agents` | (none) | OpenAI Agents SDK | 1, 2, 4 |
| `test-crewai` | (none) | CrewAI | 1, 2, 4 |
| `test-livekit` | (none) | LiveKit | 1, 2, 4 |
| `test-elevenlabs` | (none) | ElevenLabs | 1, 2, 4 |
| `test-mcp-cursor` | Cursor | — | 1, 2, 3, 6 |
| `test-mcp-codex` | Codex | — | 1, 2, 3, 6 |
| `test-cli-flows` | (none) | — | 5 |
| `test-dashboard-routes` | (none) | — | 7 |
| `test-share-flow` | (none) | — | 1, 7 (capability transfer) |
| `test-verify-success` | (none) | — | 1, 2 (chain integrity) |
| `test-verify-broken` | (none) | — | 1 (intentionally break chain) |
| `test-replay-from-chain` | (none) | — | 1, 2 (reconstruct session) |
| `test-cross-runtime-composition` | Claude Code + Hermes | — | 1, 2, 3 (the headline) |
| `test-walrus-sites-mirror` | (none) | — | 7 (decentralized fallback) |

---

## Per-test pattern

Each E2E test follows:

```ts
// tests/e2e/test-claude-code-trace.spec.ts
import { test, expect } from "@playwright/test";
import { startTestSuiteRelayer, stopTestSuiteRelayer } from "./fixtures";

test.describe("Claude Code: trace capture + verify", () => {
  let suite: TestSuite;

  test.beforeAll(async () => {
    suite = await startTestSuiteRelayer();
    await suite.installOneMemInClaudeCode();
    await suite.loginViaTestWallet();
  });

  test("captures every tool call as ActionCall", async () => {
    // Simulate a Claude Code session via the test harness
    const session = await suite.runClaudeCodeSession([
      { tool: "Read", input: { file_path: "/tmp/foo.txt" } },
      { tool: "Bash", input: { command: "echo hi" } },
    ]);

    // Verify via SDK
    const calls = await suite.client.trace.getCalls(session.sessionId);
    expect(calls.length).toBe(2);
    expect(calls[0].toolName).toBe("Read");
    expect(calls[1].toolName).toBe("Bash");
  });

  test("verifies the Merkle chain end-to-end", async () => {
    const session = await suite.runClaudeCodeSession([/* ... */]);
    const result = await suite.client.trace.verifySession(session.sessionId);
    expect(result.verified).toBe(true);
  });

  test.afterAll(() => stopTestSuiteRelayer(suite));
});
```

---

## Mainnet vs testnet for E2E

| Test type | Network |
|---|---|
| Unit + Integration | Mocked (no chain) |
| Contract | Sui localnet (`sui start`) |
| Nightly E2E | Sui testnet (cheap, predictable) |
| Pre-release verification | Sui mainnet (final smoke test) |

---

## CI integration

```yaml
# .github/workflows/e2e.yml
name: E2E
on: [push, pull_request]
jobs:
  e2e-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:integration

  e2e-mainnet:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'  # nightly only
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm test:e2e:mainnet
        env:
          ONEMEM_DELEGATE_KEY: ${{ secrets.E2E_DELEGATE_KEY }}
          ONEMEM_ACCOUNT_ID: ${{ secrets.E2E_ACCOUNT_ID }}
          ONEMEM_NAMESPACE_ID: ${{ secrets.E2E_NAMESPACE_ID }}
```

---

## Coverage targets

| Package | Coverage target |
|---|---|
| `@onemem/sdk-ts` | 80%+ unit + 100% public API surface |
| `onemem-sdk-python` | 80%+ unit + 100% public API surface |
| `@onemem/cli` | 60%+ (CLI testing is harder; smoke tests for every command) |
| `@onemem/dashboard` | 50%+ (visual tests via playwright; unit tests for data fetching) |
| Move contract | 100% line coverage (`sui move test --coverage`) |

---

## What we DON'T test at v0.1

- Performance / load (no SLA at v0.1; that's v0.2)
- Cross-chain interop (not in scope)
- Long-running soak tests (v0.2)
- Mobile / native app integration (no mobile SDK at v0.1)

---

## Cross-references

- `README.md` — demo matrix
- All `04-frameworks/*.md` and `03-runtimes/*.md` — each gets a test in the matrix
- `../02-sdks/compatibility-contract.md` — version compatibility tests
- `../06-dashboard/data-flow.md` — dashboard test points
