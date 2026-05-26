# Inflection Pi

## What it is

Pi is Inflection AI's personal AI companion — a closed-source consumer chat assistant. Inflection has gone through significant restructuring (the Microsoft talent deal in 2024) but Pi remains a live product. It is not an agent framework or developer memory product; it's a B2C empathetic-conversation model with multi-session memory.

This entry exists for completeness because the brief listed it. The architecture overlap with OneMem is minimal.

## Memory architecture (as publicly described)

- **Personal Knowledge Graph** for long-term memory per user.
- **Recursive Sentiment Loop** — Pi's distinctive architecture. Each draft response is re-evaluated against safety + empathy markers before being shown.
- **Pipeline:**
  1. Intent & sentiment analysis
  2. Context retrieval (long-term from PKG, real-time from web)
  3. Inflection-3 inference
  4. Tone & EQ check
- **Cross-platform session continuity** across web, mobile, and messaging.
- **In-house Inflection-3 model family.** No third-party LLM dependency.

## Storage model

- Closed. No public docs on the PKG's data model, backing store, or retention.
- Privacy posture: conversations not used for model training without consent; export and delete tools.

## API surface

- Consumer chat UI only (web, mobile, WhatsApp historically).
- No public API or developer SDK as of last check.
- No MCP integration.

## What we'd borrow for OneMem

- **Almost nothing technical** — closed product, B2C focus, no overlap with the agent-runtime memory category OneMem targets.
- **One useful framing:** the "Personal Knowledge Graph" branding is a useful consumer-facing way to describe what a memory namespace *is* for a non-developer. If OneMem ever needs a consumer-facing surface, this language travels.
- **Negative diff that matters:** Pi has zero portability. Users can't take their PKG to another assistant. OneMem's wedge for the consumer case is identical to the developer case — your memory is yours, your namespace is portable, your runtime is swappable.

## Sources

- https://inflection.ai/
- https://hokai.io/hub/tools/pi
- https://thetoolsverse.com/tools/pi-ai
- https://aitoolsdevpro.com/ai-tools/pi-guide/
- https://medium.com/version-1/pi-your-ai-companion-950ae269399b
