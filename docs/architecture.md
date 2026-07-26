# Architecture

This is a domain-specific monorepo:

- `products/` contains independently deployable public offerings;
- `mechanisms/` contains internal deterministic factory tools;
- `templates/` contains intentional scaffolds;
- `deploy/` owns the shared public gateway configuration.

The root `make check` traverses every maintained TypeScript workspace and both
Python test suites. Preflight and Launchpad Lint remain separate products with
distinct MCP identities. Preflight’s canonical source and MCP Registry
publisher are here; `evanfollis/preflight` is archived lineage.

Mutable deployment credentials and telemetry are runtime artifacts and remain
gitignored. The products are deterministic parsers and validators and make no
LLM calls, so the declared aggregate risk is `none`.

## July 2026 transition exceptions

The new `AGENTS.md`/`CLAUDE.md` instruction front door has not yet received a
fresh ADR-0039 behavioral baseline. Owner: Skillfoundry products. Milestone:
baseline the instruction surface before central conformance advances from
`migrating`.

Python dependency ranges are not yet represented by a cross-platform lock;
TypeScript dependencies are locked in `pnpm-lock.yaml`. Owner: Skillfoundry
products. Milestone: adopt and CI-verify a Python lock before claiming complete
supply-chain conformance.

The July 2026 TypeScript toolchain uses TypeScript 7.0.2 and Cloudflare Workers
types 5.20260726.1. Preflight's Node declarations intentionally stay on the
current `@types/node` 24 line because its installed production runtime is the
checksum-verified Node.js 24.18.0 binary; newer declaration majors do not define
the deployed runtime contract. The remote-skill template uses Zod 4.4.3, which
is inside MCP SDK 1.29's declared `^3.25 || ^4.0` peer range.
