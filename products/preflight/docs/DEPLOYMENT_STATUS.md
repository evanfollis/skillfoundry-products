# Preflight Deployment Status

Verified on 2026-07-26 at release `0.1.1`.

## Live endpoints

| Endpoint | URL | Verified identity |
|----------|-----|-------------------|
| Landing page | `https://skillfoundry.synaplex.ai/products/preflight/` | v0.1.1 and canonical source link |
| Health | `https://skillfoundry.synaplex.ai/products/preflight/health` | v0.1.1 |
| REST API | `https://skillfoundry.synaplex.ai/products/preflight/api/check` | live |
| MCP JSON-RPC | `https://skillfoundry.synaplex.ai/products/preflight/mcp/` | `preflight` v0.1.1 |
| Registry manifest | `https://skillfoundry.synaplex.ai/products/preflight/server.json` | v0.1.1 and canonical repository |
| Server card | `https://skillfoundry.synaplex.ai/products/preflight/.well-known/mcp/server-card.json` | v0.1.1 |
| Direct Worker origin | `https://preflight.skillfoundry.workers.dev/` | v0.1.1 and canonical source link |

Preflight and Launchpad Lint are separate products with separate manifests,
runtime routes, and registry identities.

## Source and runtime ownership

- Canonical source: `skillfoundry-products/products/preflight`
- Canonical repository: `https://github.com/evanfollis/skillfoundry-products`
- Canonical public route: nginx on `127.0.0.1:8020` proxies the Preflight path
  to a Node process on `127.0.0.1:8030`; Cloudflare Tunnel publishes the
  Skillfoundry hostname.
- Direct origin: the same `src/index.ts` Worker entry point is deployed to
  `preflight.skillfoundry.workers.dev`.
- Local service: `preflight.service`, enabled with restart-on-failure and
  executing the checksum-verified Node.js v24.18.0 binary at
  `/opt/workspace/runtime/toolchains/node-v24.18.0-linux-x64/bin/node`.
- Runtime containment: both `preflight.service` and
  `preflight-watcher.service` use dedicated project identities, empty capability
  sets, `ProtectSystem=strict`, `NoNewPrivileges`, private devices/tmp/mounts,
  kernel/control-group/namespace/SUID restrictions, and explicit network
  policy. The gateway accepts loopback only; the watcher has no IP access and
  may write only `runtime/.alerts/preflight-real-user.log`.
- Access preparation is explicit and bounded:
  `deploy/prepare_service_access.sh` grants the gateway read/traverse ACLs for
  the exact Node 24 toolchain and built `dist/`, then assigns only the watcher
  alert file to its service identity. The gateway deliberately omits
  `MemoryDenyWriteExecute` because the Node/V8 JIT requires executable memory;
  this exception is dated 2026-07-27 and must be retested on a runtime change.
  The watcher retains `ProtectProc=invisible` but omits `ProcSubset=pid` because
  `journalctl` requires `/proc/sys/kernel/random/boot_id`; this exception was
  canary-proven on 2026-07-27 and must be retested if the watcher stops using
  `journalctl`.
- Runtime preflight: `deploy/verify_node_runtime.sh` fails closed unless the
  installed binary reports v24.18.0 and matches the repository-pinned binary
  SHA-256.
- The standalone `evanfollis/preflight` repository is archived lineage and is
  not a release source.

## Distribution status

### MCP Registry

- **Published:** `io.github.evanfollis/preflight` v0.1.1
- **Publisher source:** the pinned, GitHub-OIDC workflow in this monorepo
- **Manifest repository:** `https://github.com/evanfollis/skillfoundry-products`
- **Verify:** `curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.evanfollis/preflight"`

### Smithery

- The Streamable HTTP endpoint and server card are live.
- Listing status is not attested in this document.

### npm

- The package remains private intentionally. Preflight is operated as a remote
  MCP/REST service, not claimed as a published CLI.

## Release and rollback

A push or merge is not itself a deployment. The current release path is manual
on both serving surfaces:

1. merge only after `make check` and protected GitHub checks pass;
2. deploy the Worker from `products/preflight/wrangler.toml`;
3. canary the unchanged Node build on a spare port under the exact runtime
   declared by `deploy/preflight.service`, then stop it and exercise rollback
   under the previously installed runtime;
4. retain the prior unit and `dist/`, atomically install the tracked unit,
   daemon-reload, and restart `preflight.service`;
5. externally verify the landing page, health response, manifest, and MCP
   `initialize` response on both public surfaces.

Worker releases are versioned by Cloudflare and can be rolled back with
`wrangler rollback <version-id>`. The systemd-backed build rolls back by
restoring the retained prior `dist/` and restarting `preflight.service`.

The absence of an automated dual-runtime deploy pipeline is an explicit
operational gap; do not infer deployed state from Git or CI state.
