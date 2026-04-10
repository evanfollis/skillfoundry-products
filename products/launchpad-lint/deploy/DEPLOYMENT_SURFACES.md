# Launchpad Lint Deployment Surfaces

## Goal

Deploy the same product across multiple hosting surfaces and compare:

- time to first healthy deploy
- operational friction
- health-check reliability
- restart behavior
- log clarity
- cost and idle behavior

## Shared Runtime Contract

Every surface should expose the same routes:

- `/health`
- `/mcp/`
- `/feedback/summary`
- `/telemetry/summary`

Every surface should support these environment variables:

- `PORT`
- `LAUNCHPAD_LINT_ENVIRONMENT`
- `LAUNCHPAD_LINT_SHARED_SECRET`
- `AGENTICMARKET_SECRET`
- `LAUNCHPAD_LINT_FEEDBACK_PATH`
- `LAUNCHPAD_LINT_TELEMETRY_PATH`

## Surfaces To Try

### 1. Hetzner + systemd + Cloudflare tunnel

Status:

- already available

Artifacts:

- `deploy/REMOTE_DEPLOY.md`
- `deploy/launchpad-lint.service`

Why it matters:

- canonical Skillfoundry-owned path
- lowest platform abstraction
- good baseline for comparing managed hosts

### 2. Render

Artifacts:

- `render.yaml`
- `Dockerfile`
- `.dockerignore`

Notes:

- use the `skillfoundry-products` repo
- Render blueprint path should point to `products/launchpad-lint/render.yaml`
- service root should stay `products/launchpad-lint`

Why try it:

- straightforward managed web service
- zero-downtime deploys
- simple health checks

### 3. Railway

Artifacts:

- `railway.toml`
- `Dockerfile`
- `.dockerignore`

Notes:

- set the service root directory to `products/launchpad-lint`
- set custom config path to `/products/launchpad-lint/railway.toml`

Why try it:

- low-friction service deployment
- easy public networking
- fast iteration loop

### 4. Fly.io

Artifacts:

- `fly.toml`
- `Dockerfile`
- `.dockerignore`

Notes:

- run Fly commands from `products/launchpad-lint`
- set secrets through `fly secrets set`
- change the `app` name if `launchpad-lint` is unavailable

Why try it:

- strong control over runtime behavior
- autosleep and autostart options
- good fit for always-on APIs with light traffic

### 5. Generic Docker Host

Artifacts:

- `Dockerfile`
- `.dockerignore`

Why try it:

- baseline portability
- easiest path to additional VPS or container platforms later

## Suggested Trial Order

1. Render
2. Railway
3. Fly.io
4. keep Hetzner as the control baseline

## Comparison Questions

For each surface, record:

- how long did first healthy deploy take
- what broke first
- how easy was secret setup
- did health checks behave cleanly
- were logs legible enough to diagnose issues fast
- was the public URL stable and clean
- what would block repeated low-touch launches on the same surface
