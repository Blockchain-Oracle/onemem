# Demo: Agent Sends Money

OpenAI Agents SDK agent sends Sui from a treasury wallet on user instruction. The full trace (input → reasoning → tool call → Sui tx hash → result) is captured to OneMem. Auditor visits `app.onemem.ai/verify/[session_id]` → chartreuse "Verified ✓".

Reproduce steps + recording setup land in Pillar 8 per `docs/05-our-architecture/08-demos-and-tests/agent-sends-money.md`.
