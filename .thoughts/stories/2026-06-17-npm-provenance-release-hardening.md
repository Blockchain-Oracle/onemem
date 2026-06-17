# Stories: npm Provenance Release Hardening

Date: 2026-06-17

## Story 1: Release Maintainer

As a release maintainer, I want the GitHub release workflow to call the
repo-owned publish script for TS packages so release behavior is reviewed and
tested in one place.

Acceptance:

- The workflow publish command is `bash scripts/publish-all.sh ts`.
- The script is the place that configures npm publish defaults before running
  Changesets.

## Story 2: npm Consumer

As a package consumer, I want published OneMem npm packages to be public scoped
packages with provenance where CI supports it.

Acceptance:

- The CI release path opts into npm provenance.
- Public access remains configured for first-time scoped publishes.

## Story 3: Future Agent

As a future coding agent, I want tests to catch release workflow drift so I do
not accidentally reintroduce the implicit bare Changesets publish path.

Acceptance:

- Structure tests inspect the release workflow and publish script.
- The test fails if provenance/access configuration disappears.

## Story 4: Honest Status

As Abu, I want the repo to be honest about what changed: release hardening is
done, but actual npm upload is not claimed unless npm registry state proves it.

Acceptance:

- The verification artifact records npm auth and package registry evidence.
- Wiki status distinguishes hardening from successful publication.

