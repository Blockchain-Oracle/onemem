# Agent Reputation Graphs — v0.2+ Vision

NOT BUILT AT v0.1. Documented here for the landing page Vision section + v0.2 roadmap.

---

## The idea

Every `ActionCall` an agent emits is verifiable. Over time, agents accumulate a track record:
- How many sessions completed successfully?
- How many sessions failed mid-way?
- How many actions had `level: ERROR` events?
- What's the agent's verified track record across namespaces it's been granted access to?

This data becomes a **reputation graph** — verifiable, on-chain, agent-attributed.

---

## Move primitives we'd add

```move
// v0.2 — NEW module
module onemem::reputation {
    public struct AgentReputation has key {
        id: UID,
        agent_id: String,                  // canonical agent identifier
        total_action_calls: u64,
        successful_calls: u64,
        failed_calls: u64,
        warning_events: u64,
        error_events: u64,
        verified_sessions: u64,
        broken_sessions: u64,              // sessions where verify failed
        first_seen: u64,
        last_seen: u64,
        // Reputation score derived from above; updated on each session_ended
        score: u64,
    }

    public entry fun emit_session_score(
        rep: &mut AgentReputation,
        session: &TraceSession,
        ctx: &mut TxContext,
    ) { /* ... */ }
}
```

Aggregated via session end events. Reputation is monotonic / accumulative — historical events can't be removed (auditability).

---

## Use cases

- "Show me agents with >95% verified-session success rate over the last 30 days"
- "This new agent has a clean reputation; this older agent has 12 failed sessions in the past week — choose accordingly"
- DAO governance: vote on whether to grant a memory namespace to an agent based on reputation
- Insurance: pay out per verified-action; deny payouts for sessions with broken Merkle chains

---

## Why v0.2 (not v0.1)

- Requires `ActionCall` history at scale (we have it at v0.1)
- Requires session-end events with status (we have those)
- Reputation scoring algorithm needs design + testing (not a 26-day item)
- Best paired with the ERC-8004 bridge (also v0.2) for cross-stack identity

---

## How it shows up on the landing page

Vision section bullet: "Agent reputation graphs — agents accrue verifiable track records."

That's the entire surface at v0.1. Implementation deferred.

---

## Cross-references

- `README.md`
- `erc-8004-bridge.md` — natural pair for reputation interop
- `../01-protocol/data-model.md` — ActionCall + TraceSession (data we'd aggregate)
- `../../02-inspirations/other-memory-systems/erc-8004.md` — EVM agent reputation pattern
