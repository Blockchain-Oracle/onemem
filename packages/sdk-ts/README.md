# @onemem/sdk-ts

TypeScript SDK for OneMem. Thin wrapper over `@mysten-incubation/memwal` adding the verifiable-trace primitives (TraceSession, ActionCall, Merkle chain helpers, `event::emit_authenticated` consumers).

Current API truth is the source in `src/` and exported types from `src/index.ts`.
The architecture docs in `docs/05-our-architecture/02-sdks/` are historical
design context and may not match the implemented surface exactly.
