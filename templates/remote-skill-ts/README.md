# Remote Skill TS Template

This workspace package is the default starting point for new Skillfoundry external
skills.

## Intended Use

Use this template when a new skill should be:

- remote-first
- stateless by default
- TypeScript-based
- deployable to Cloudflare Workers
- measurable from day one

## What It Includes

- Streamable HTTP MCP server skeleton
- health route
- example tool registration
- stable telemetry envelope types
- one-place activation metric declaration

## What To Change First

1. rename the package and Worker in `package.json` and `wrangler.toml.example`
2. change the skill metadata in `src/index.ts`
3. replace the example tool with the narrow real tool set
4. define the activation metric in `src/lib/skill-config.ts`
5. connect telemetry events to your chosen sink

## Local Setup

```bash
corepack pnpm install
corepack pnpm --filter @skillfoundry/remote-skill-ts-template dev
```

## Deployment Rule

Do not deploy the template directly. Copy it into a real product directory first.
