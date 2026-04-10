# Operator TODO

## Do These In Order

### 1. Confirm the canonical runtime is healthy

Run:

```bash
/opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint/deploy/smoke_check.sh https://skillfoundry.synaplex.ai/products/launchpad-lint
```

### 2. AgenticMarket

Use:

- [agenticmarket-submission.md](/opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint/docs/agenticmarket-submission.md)

Do:

- fix wallet funding
- submit the listing
- set `AGENTICMARKET_SECRET` after approval

### 3. Smithery

Use:

- [smithery-submission.md](/opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint/docs/smithery-submission.md)

Do:

- publish the canonical hosted MCP URL

### 4. MCP Registry

Use:

- [mcp-registry-submission.md](/opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint/docs/mcp-registry-submission.md)

Do:

- install `mcp-publisher`
- login with GitHub
- publish from `products/launchpad-lint`

### 5. Record the experiments

Use:

- [channel-experiment-agenticmarket.md](/opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint/docs/channel-experiment-agenticmarket.md)
- [channel-experiment-smithery.md](/opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint/docs/channel-experiment-smithery.md)
- [channel-experiment-mcp-registry.md](/opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint/docs/channel-experiment-mcp-registry.md)

### 6. Watch the live product metrics

After each channel launch, check:

- `https://skillfoundry.synaplex.ai/products/launchpad-lint/feedback/summary`
- `https://skillfoundry.synaplex.ai/products/launchpad-lint/telemetry/summary`
