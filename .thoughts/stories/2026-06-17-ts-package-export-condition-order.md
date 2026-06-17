# Stories: TS Package Export Condition Order

## Traceability

- Spec:
  `.thoughts/specs/2026-06-17-ts-package-export-condition-order.md`
- Requirements: R1-R6.

## Story 1: Maintainer Gets Clean Package Builds

As a OneMem maintainer,
I want TypeScript package builds to avoid export-condition warnings,
so that release evidence is clean and warning-free.

### Acceptance Criteria

- Covers R1, R2, R3, R5, AC1, AC2.
- SDK and provider package builds pass without the previous
  `condition "types"` warning.
- Runtime `import` and `require` entrypoints stay unchanged.

### Scenarios

- Given an affected package manifest,
  when its root export lists `types` before `import` and `require`,
  then tsup does not warn that `types` is unreachable.

### Notes

- This story does not include version bumps or publishing.

## Story 2: Future Agent Catches Manifest Drift

As a future agent preparing release work,
I want structure tests to reject the bad condition order,
so that the warning does not silently return.

### Acceptance Criteria

- Covers R4, R6, AC3, AC4.
- Structure tests inspect package root export condition order.
- Context Engineering artifacts are registered in the structure guard.

### Scenarios

- Given a package root export object with `import`, `require`, then `types`,
  when `pnpm test:structure` runs,
  then it fails with a clear package path.

## Open Questions

- Whether release versioning should be batched across all changed packages is
  outside this slice.
