# Demo: Agent Sends Money — Trace + Verify

**Wedge moment:** the audit/trace layer becomes tangible. Abu's use case: "I told my agent to send money; show me which wallet skill it used, what amounts, what oracle data."

**Duration:** ~90 seconds.

---

## Story

Abu uses Claude Code + an OpenAI Agents SDK-style wallet skill that can send USDC on Sui. He instructs the agent to "send 5 USDC to alice.sui". The agent does it. Abu then opens the dashboard and walks through every step the agent took.

The chartreuse "VERIFIED ✓" moment is the demo climax.

---

## Script

```
[0:00 — Claude Code in foreground]
Narrator: "I'm going to ask my agent to send money."

Abu (in Claude Code): "Send 5 USDC to alice.sui. Use the smallest gas-efficient
                        route."

[0:08 — Agent reasoning + tool calls]
[Claude calls multiple tools:
  1. resolve_suins("alice.sui") → 0xalice...
  2. fetch_pyth_oracle("USDC/USD") → confirms price
  3. check_gas_estimate(...)
  4. execute_payment(0xalice..., 5_000_000)  // 5 USDC = 5,000,000 base units
]

Claude: "Done. Sent 5 USDC to alice.sui (0xalice...). Tx: 0xtxdigest..."

[0:30 — Abu opens dashboard]
Abu: "$ onemem dashboard"
[Browser opens to /trace/[latest-session-id]]

[0:35 — Tree view shows the call chain]
Narrator: "Here's the full trace tree. Every tool the agent used."

[Tree:
  ✓ memwal_write
   ├─ ✓ resolve_suins("alice.sui")
   ├─ ✓ fetch_pyth_oracle("USDC/USD")
   ├─ ✓ check_gas_estimate(...)
   └─ ✓ execute_payment(0xalice..., 5_000_000)
        └─ Output: tx 0xtxdigest...
]

[0:48 — Abu clicks "execute_payment" call]
[Detail panel shows: inputs (recipient + amount), outputs (txdigest), Sui Suiscan link]

Narrator: "Each call's input and output is encrypted on Walrus. The chain of
           hashes is on Sui. Anyone can verify it."

[0:58 — Abu clicks "Verify chain"]
[VerifyDrawer slides up. Walks chain. Each call ticks green.]

[1:10 — VERIFIED]
[Page glows chartreuse. "✓ VERIFIED" banner. All 5 calls verified.
 Shows: "Merkle chain integrity: ✓  Walrus blobs match: ✓  Seal decryptions: ✓"]

Narrator: "If a compliance officer or a teammate or even me-3-months-from-now
           asks 'did the agent really do exactly this?', I can prove it.
           From the chain. Independently. Without trusting OneMem."

[1:25 — Demo card]
"OneMem · onemem.xyz"
[End]
```

---

## What's exercised

- Pillar 1: ActionCall Merkle chain (the headline)
- Pillar 1: event::emit_authenticated (light-client verifiable)
- Pillar 2: SDK trace.appendCall + closeCall + verifySession
- Pillar 3: Claude Code plugin captures every tool call
- Pillar 4: OpenAI Agents SDK-style function tools (the wallet skill is a function tool)
- Pillar 7: `/trace/[id]` headline view, Verify drawer, the chartreuse moment
- Sui: PTB execution + on-chain commits per call
- Walrus: encrypted I/O blobs per call

---

## Reproducibility

The wallet skill code (a minimal example agent for the demo):

```python
# demo/wallet_agent.py
from agents import Agent, function_tool
from onemem.openai_agents import save_memory, search_memory
import requests

@function_tool
async def resolve_suins(name: str) -> str:
    """Resolve a SuiNS name to a Sui address."""
    # ... calls SuiNS resolver
    return "0xalice..."

@function_tool
async def fetch_pyth_oracle(symbol: str) -> dict:
    """Fetch latest price from Pyth Lazer."""
    # ...
    return {"price": 1.00, "confidence": 0.001}

@function_tool
async def check_gas_estimate(tx_kind: str) -> int:
    """Estimate Sui gas cost."""
    return 1_000_000  # 0.001 SUI

@function_tool
async def execute_payment(recipient: str, amount_base_units: int) -> str:
    """Send USDC on Sui."""
    # ... builds PTB + signs + executes
    return "0xtxdigest..."

agent = Agent(
    name="wallet_agent",
    instructions="You can send USDC on Sui via the execute_payment tool. Always verify recipient via SuiNS + check oracle first.",
    tools=[resolve_suins, fetch_pyth_oracle, check_gas_estimate, execute_payment, save_memory, search_memory],
)

if __name__ == "__main__":
    result = agent.run("Send 5 USDC to alice.sui. Use the smallest gas-efficient route.")
    print(result)
```

Run with OneMem Claude Code plugin active → trace auto-captured.

---

## What makes this demo land

1. **Tangible action.** "Sending money" is concrete. Judges instantly understand the stakes.
2. **Tree view is visually satisfying.** 4-5 calls in a clear hierarchy.
3. **Verify moment.** Chartreuse glow + "VERIFIED" banner + checkmarks per call.
4. **The narrator's closing line.** "If a compliance officer asks 'did the agent really do exactly this?' — I can prove it" — this is the wedge in one sentence.

---

## Failure modes (test before recording)

- Tools all return fake data (don't actually send USDC on mainnet during recording)
- OR record on testnet, then re-record final scene with explanatory caption
- Don't claim to send real money in the demo; use mock execution

---

## Cross-references

- `README.md` — demo matrix
- `../01-protocol/events-and-attestation.md` — Merkle chain + verification flow
- `../04-frameworks/openai-agents-tools.md` — function tool pattern
- `../06-dashboard/route-trace.md` — Verify drawer detail
- `../03-runtimes/claude-code-plugin.md` — auto-capture
