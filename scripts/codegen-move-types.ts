#!/usr/bin/env tsx
/**
 * Codegen Move struct types → TS types.
 *
 * Reads the deployed Move package's BCS schema (via `sui client`) → writes
 * packages/sdk-ts/src/types/move-types.ts.
 *
 * Run: `pnpm exec tsx scripts/codegen-move-types.ts`
 * Spec: docs/05-our-architecture/00-overview/TOOLING_DECISIONS.md "Cross-language coordination" section.
 *
 * Skeleton — implemented as part of Pillar 1 (Move) → Pillar 2 (SDK) handoff.
 */

console.log("codegen-move-types: skeleton (implemented in Pillar 1 → 2 handoff)");
