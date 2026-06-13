# Coding Guardrails

The detail behind root `CLAUDE.md` non-negotiable #8. Pulled out so CLAUDE.md stays light. Read this before opening a PR.

Grounded in: Sui Move best practices (docs.sui.io + Move Book code-quality checklist), TypeScript 2026 patterns (strict + typed catches + custom errors + Result), Python 2026 stack (Ruff + mypy + Pydantic + structlog), Pino structured logging.

Sources at the bottom.

---

## Cross-cutting (applies to every language)

### File + module size

- **Source files ≤ 400 lines.** Hard cap. Enforced by `tests/structure.test.ts`. Applies to `.ts/.tsx/.js/.py/.move/.rs` under `packages/`, `apps/`, `contracts/`. Test fixtures + generated codegen files are exempt.
- **Refactor at ~380 lines, not 600.** Splitting cold beats splitting under fire.
- **Functions ≤ ~50 lines.** Over that: extract helpers. Multiple small named functions read better than one giant one.
- **One responsibility per module.** If a file does two unrelated things, split. Module names should be one noun.

### Constants over magic literals

- **Named `const` for any value used twice OR with non-obvious meaning.** `MAX_RETRIES = 5` over scattered `5`s. `DEFAULT_PORT = 4040` over `4040` in a spawn call.
- **Magic strings:** if a literal is used to identify a thing (event type, route, error code, dynamic-field key), `const` it. Avoid string typos becoming silent bugs.
- **Document the *why*, not the value.** `const MAX_DELEGATE_KEYS = 20; // matches MemWal account.move cap` not `// twenty`.

### Named types over primitive bags

- **No `(string, string, string, number)` parameter lists.** Wrap in a struct / interface / TypedDict / `dataclass` with field names.
- **Phantom types over magic enums** where the type system can prove correctness (e.g. `NamespaceCapability<phantom KIND>` rejects wrong-kind usage at compile time).
- **Branded / nominal types** for IDs (`type NamespaceId = string & { __brand: "NamespaceId" }`) so you can't pass a `SessionId` where a `NamespaceId` is expected.

### Logging — never `console.log` / `print()` in shipped code

- **TypeScript / Node:** use **Pino**. Structured JSON logs, child loggers for request-scoped context, redact sensitive fields (`password`, `*.token`, `*.apiKey`, `req.headers.authorization`, `req.headers.cookie`). `pino-pretty` for local dev; raw JSON in production.
- **Python:** use **structlog** with JSON renderer in production; pair with Pydantic models for log payload validation.
- **Move:** no logging primitive — use `event::emit_authenticated` (per `events-and-attestation.md`) so observability is on-chain + verifiable.
- **Never log:** secrets (Seal delegate keys, Sui private keys, JWTs), full request bodies (PII risk), full encrypted blob contents.
- **Always include:** correlation IDs (namespace_id, session_id, call_id, agent_id) so multi-runtime logs can be stitched.

### Error handling

- **Throw / raise typed errors.** Never `throw "string"`, never `raise Exception("...")`. Use custom error classes that extend the platform base (`class NamespaceNotFoundError extends Error` / `class NamespaceNotFoundError(Exception)`).
- **TypeScript `catch (e)` blocks must narrow.** Use `if (e instanceof X)` patterns. `useUnknownInCatchVariables` is on (it's default in strict mode); don't fight it.
- **Preserve cause chains.** TS: `new Error("wrapper msg", { cause: original })`. Python: `raise NewError("...") from e`.
- **Don't silently swallow.** Empty `catch {}` is a bug. If you legitimately mean to ignore, log at debug level + comment WHY.
- **Result / Option patterns** for predictable failure paths in TS — `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`. Useful when failure is part of the API surface (e.g., `verifyChain` returning `{ ok: false, brokenAt }` instead of throwing).

### Dependencies — never hardcode versions from memory

- Default to `pnpm add <pkg>` / `uv add <pkg>` — the tool resolves to current latest-stable.
- If hand-writing a manifest, look up actual latest first via `pnpm view <pkg> version` or `uv pip index versions <pkg>`; use `^` prefix.
- Per feedback memory `feedback_pnpm_add_uv_add_not_hardcode_versions.md`.

### Comments

- **Doc comments (`///` in Move, JSDoc/TSDoc in TS, docstrings in Python) for public APIs.** Explain the contract; the function name + signature should tell the *what*; the doc explains the *why* + invariants + failure modes.
- **Inline `//` comments only for non-obvious WHY.** Never explain WHAT the next line does. If `// removes the first element` is needed, the code is unclear — rename the function instead.
- **No "fix later" comments without an issue link.** `TODO: fix later` rots. `TODO(#123): re-evaluate after Pillar 2 mainnet deploy` survives.

### Testing

- **Two tiers, both required.** Unit tests (automated, TDD-first, CI-default) AND manual testing on the real system (real runtime / real Walrus / live testnet), done **continuously per feature, not at the end**. Full policy: `TESTING_STRATEGY.md`.
- **`tsx`/smoke scripts are transpile-only** — they don't typecheck or build. Always also run `pnpm turbo run typecheck build`. CI does; so must you.
- **Env-gated real-system tests** (`*.integration.test.ts` / `test_*_integration.py`) run only under `ONEMEM_INTEGRATION=1` — they need a funded keystore, so they stay out of default CI.
- **Loggers are CI-enforced:** biome `suspicious.noConsole` (allow `warn`/`error`; off for `scripts/**`, CLI, tests) + ruff `T20`. Use Pino / structlog in shipped code.

### Research before every story; specs are hypotheses

- Treat the spec/architecture as a hypothesis — expect it to be subtly wrong and correct it as you build. Research **before every story**, not just big decisions: `context7` for live SDK docs, this repo's `docs/`, 3–5 inspirations under `docs/02-inspirations/`.
- **Tire-kick unfamiliar libraries in a `/tmp` scratch** before architecting around them (never commit the spike).

---

## TypeScript / JavaScript

### Strict mode is non-negotiable

- `tsconfig.base.json` has `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `verbatimModuleSyntax: true`. Don't loosen.
- Prefer `import type { ... }` for type-only imports (Biome rule `style/useImportType` is `error`).

### Types

- **No `any`.** Biome warns; treat warnings as errors in CI. Use `unknown` + narrowing when boundary type is opaque.
- **`interface` vs `type`:** `interface` for object shapes that may be extended; `type` for unions, intersections, mapped types, primitives.
- **Discriminated unions** for state machines and result types — `{ status: "loading" } | { status: "ready"; data: T } | { status: "error"; err: Error }`. The discriminant tag enables exhaustive `switch` checks.
- **`as const`** for literal-narrowing arrays + tuples. `["a", "b"] as const` → `readonly ["a", "b"]`.

### Imports + module style

- ESM everywhere. No CommonJS in new code (only kept for legacy interop via `tsup` dual-output).
- One responsibility per file; avoid barrel files (`index.ts` re-exporting everything) inside packages — they hurt tree-shaking + slow bundlers.

### Async + errors

- **Never `.then().catch()` in business logic.** Use `async/await` + `try/catch`.
- **Always `await` rejected promises.** Floating promises are a bug — Biome's `noFloatingPromises` rule (when configured) catches them.
- **Cancellation via `AbortSignal`** for long-running async (SSE, fetch, etc.) — pass `signal` down explicitly.

### React (dashboard + apps)

- **Functional components + hooks only.** No class components.
- **Strict effects** — `useEffect` dependencies must be exhaustive (Biome rule `correctness/useExhaustiveDependencies`).
- **Server components by default** in Next.js 15 App Router; `"use client"` only when needed (interactivity, hooks, browser APIs).
- **Forms via `react-hook-form` + `zod`** — never hand-roll form state at scale.

---

## Python

### Type hints + validation

- **Type hints on every public function + dataclass field.** Per Ruff config + `pyright`.
- **Pydantic models** for any external boundary (HTTP request bodies, API responses, file I/O, env vars). Validation at the edge; trust internal data inside.
- **`from __future__ import annotations`** at the top of every module so forward refs work without quotes.

### Modern syntax

- `from typing import Optional` is dead. Use `X | None` (PEP 604).
- `list[int]` over `List[int]` (PEP 585).
- Pattern matching (`match`/`case`) over chained `isinstance` checks for structural dispatching.

### Async

- Use `asyncio` + `pytest-asyncio`. Don't mix sync I/O into async code paths.
- `async with`, `async for` where the resource supports it.

### Logging

- `structlog` + JSON renderer in production; `structlog.dev.ConsoleRenderer` in dev.
- `logger.bind(namespace_id=ns_id, session_id=s_id)` to attach context once; subsequent log calls inherit.

---

## Move (Sui)

### Section headers

Per Sui Move Book code-quality checklist — structure every module with `===` section markers:

```move
module onemem::namespace;

// === Imports ===
use sui::dynamic_field as df;
use sui::event;

// === Errors ===
const EVersionMismatch: u64 = 1;
const ENotAdmin: u64 = 2;

// === Constants ===
const VERSION: u64 = 1;
const MAX_NAME_LENGTH: u64 = 64;

// === Structs ===
public struct MemoryNamespace has key { /* ... */ }

// === Events ===
public struct NamespaceCreated has copy, drop { /* ... */ }

// === Public Functions ===
// ...

// === Admin Functions ===
// ...

// === Private Functions ===
// ...

// === Test Functions ===
```

### Naming

- **Constants:** `UPPER_SNAKE_CASE` (`MAX_NAME_LENGTH`).
- **Error constants:** `EPascalCase` starting with `E` (`EVersionMismatch`, `ENotAdmin`). Descriptive — `EUnauthorized` over `EError1`.
- **Event structs:** `<Action>` not `<Action>Event` — but per docs.sui.io, the `Event` suffix IS the recommendation. We follow that: `NamespaceCreatedEvent`, `ActionCallEmittedEvent`. *(Cross-check current docs at implementation time; this convention is currently in flux.)*
- **Module names:** `snake_case` matching file name.

### Entry functions

- Use `entry` keyword when callable from PTBs but NOT from other Move packages. Private visibility (no `public` keyword) + `entry`. Per BlockEden + Sui docs.
- `public entry` (older pattern) is now discouraged for new code — pick one or the other based on intended call site.

### Versioning gate

- **Every state-mutating entry function** calls `assert_version_matches(&obj.id, VERSION)` at the top.
- Per `01-protocol/upgrade-strategy.md`. Lifted from MemWal `account.move`.

### Doc comments

- `///` for public functions + structs (explain contract).
- `//` for inline why-comments.

### Function ordering

- `init` first if present.
- Then group by purpose: public ops → view fns → admin ops → package fns → private helpers → tests.
- User-flow order beats alphabetical for readability.

---

## Tests

- **TDD per superpowers:test-driven-development.** Failing test first.
- **Test the contract, not the implementation.** Refactoring internals shouldn't break tests.
- **Test names are sentences:** `mints_capability_when_caller_is_admin` over `test1`. Both Vitest + pytest + `sui move test` support arbitrarily long names.
- **One assertion per behavior, multiple test functions over multi-assertion mega-tests.**
- **Test files can exceed the 400-line cap** when setup boilerplate justifies it, but if a test file > 600 lines, the unit under test is probably doing too much — split.

---

## Security

- **Never commit secrets.** `.env`, `*.pem`, `*.key`, `credentials.json` are in `.gitignore` — keep them there. Use `pnpm add` / `uv add` review for supply-chain risk on new deps.
- **Seal `/manual` flow for any plaintext touching the SDK.** Server never sees plaintext. Per `02-sdks/seal-integration.md`.
- **`security-reviewer` subagent on every Move diff + every encryption-touching TS/Python diff.** Mandatory before merge.
- **No user-input → shell exec.** Use language-native APIs (Node `child_process.spawn` with array args, Python `subprocess.run` with array args). Never `exec(user_input)`.

---

## Pre-commit checklist (self-review)

Before opening a PR ask:
- [ ] Any file > 380 lines? Extract before crossing 400.
- [ ] Any function > 50 lines? Extract helpers.
- [ ] Magic literals? Promote to named `const`.
- [ ] `(string, string, number)` parameter list? Wrap in a struct.
- [ ] `console.log` / `print()`? Replace with Pino / structlog.
- [ ] `catch (e)` without narrowing or rethrow? Fix or document why.
- [ ] Hardcoded dep version from memory? Re-resolve via `pnpm view` / `uv pip index`.
- [ ] Public API without doc comment? Add `///` / TSDoc / docstring.
- [ ] Failing test written FIRST? Verify the commit order.
- [ ] `pnpm test:structure` green? Required for monorepo changes.

---

## Sources

- [Sui Documentation — Move Best Practices](https://docs.sui.io/develop/write-move/move-best-practices)
- [The Move Book — Code Quality Checklist](https://move-book.com/guides/code-quality-checklist/)
- [Move 2024 Edition language features (MystenLabs)](https://github.com/MystenLabs/sui/issues/14062)
- [Sui Developer Cheat Sheet](https://docs.sui.io/guides/developer/dev-cheat-sheet)
- [TypeScript clean error handling (Marvin Roger, Medium)](https://medium.com/with-orus/the-5-commandments-of-clean-error-handling-in-typescript-93a9cbdf1af5)
- [TypeScript Best Practices (W3Schools 2026 update)](https://www.w3schools.com/typescript/typescript_best_practices.php)
- [The Complete Python Code Quality Stack in 2026: Ruff + mypy](https://blog.marcosalonso.dev/the-complete-python-code-quality-stack-in-2026-ruff-mypy)
- [Python structlog + Pydantic for structured logging](https://medium.com/@bhagyarana80/python-structlog-pydantic-bulletproof-structured-logging-in-microservices-1cf1578644f2)
- [Pino Logger — Complete Node.js Logging Guide (SigNoz, 2026)](https://signoz.io/guides/pino-logger/)
- [Pino — Better Stack Community Guide](https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-pino-to-log-node-js-applications/)
- [Implementing Entry Functions in Move Modules (BlockEden)](https://blockeden.xyz/docs/sui/sui-move/entry-functions/)
- [15 Essential Ways to Write Better Python Code in 2026](https://wittycoder.in/blog/15-essential-ways-to-write-better-python-code-in-2026)

Re-research yearly. Best-practice stacks shift.
