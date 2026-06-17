# Stories: Verifiable Research Agent Executable Demo

Date: 2026-06-17

## Story 1: Demo Viewer

As a demo viewer, I want to see a research agent accumulate knowledge across
multiple sessions so I understand OneMem's "memory over time" wedge.

Acceptance:

- The demo creates at least three day-labeled sessions.
- The final synthesis session references memory written by earlier sessions.
- The output artifact states the same namespace continuity claim.

## Story 2: Technical Evaluator

As a technical evaluator, I want to independently verify each session from chain
data so I know the demo is not only a local mock.

Acceptance:

- Every generated session has `ok: true`.
- The TS CLI can verify the generated session IDs.
- The artifact includes Merkle roots and Suiscan URLs.

## Story 3: Future Contributor

As a future contributor, I want the demo boundaries documented so I do not
overclaim real web/PDF/Hermes/MemWal behavior.

Acceptance:

- README has "What It Proves" and "What It Does Not Prove" sections.
- The JSON artifact carries proof-boundary text.
- The docs matrix says the runtime behavior is mocked.

## Story 4: Release Maintainer

As a release maintainer, I want structure tests to guard the demo's package,
script, and tests so the demo cannot silently become storyboard-only again.

Acceptance:

- `tests/structure.test.ts` includes the demo package in `DEMOS`.
- The structure test checks the trace script and model test file.

