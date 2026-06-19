# apps/docs

Mintlify docs source for `docs.onemem.xyz`.

Current deployment status, 2026-06-19: live. The hosted docs are served from
the Vercel `onemem-docs` project using a Mintlify static export, not a native
Mintlify dashboard deployment. Deployment `dpl_F4iKnanzYDEq968cbtq1Z3hHNwLb`
is aliased to `docs.onemem.xyz`; `/`, `/quickstart`, `/reference/cli`, and
`/integrations/runtimes` return HTTP 200.

Run locally: `npx mintlify dev` from this directory. For the current hosting
path, export with `npx mintlify@latest export`, deploy the exported static
directory to Vercel, and reassign `docs.onemem.xyz`.

See `docs/05-our-architecture/07-marketing-and-docs/docs-architecture.md`.
