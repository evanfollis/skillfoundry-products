# Launchpad Lint Monetization Channels

## Goal

Do not treat one marketplace as the business.

Treat each discovery and payment surface as one arm in a multi-armed bandit:

- ship one canonical product
- fan it out across multiple channels
- compare activation, economics, and repeat usage
- keep the channels that produce real value

## Canonical Runtime

The canonical runtime should stay under Skillfoundry control:

- homepage: `https://skillfoundry.synaplex.ai/products/launchpad-lint/`
- remote MCP endpoint: `https://skillfoundry.synaplex.ai/products/launchpad-lint/mcp`
- server card: `https://skillfoundry.synaplex.ai/products/launchpad-lint/.well-known/mcp/server-card.json`
- registry manifest: `https://skillfoundry.synaplex.ai/products/launchpad-lint/server.json`

Channels should point at this runtime rather than forcing product-specific forks.

## Channel Matrix

### 1. AgenticMarket

Role:

- marketplace discovery
- built-in billing and payouts

Why keep it:

- direct per-call monetization path
- low billing integration work

Risk:

- platform dependency
- listing review and funding friction

Primary metric:

- first paid two-call activation

### 2. Smithery

Role:

- distribution
- analytics
- install surface through Smithery Gateway

Why use it:

- URL publishing works with hosted Streamable HTTP servers
- supports static server cards when auto-scan is blocked

Risk:

- discovery does not automatically equal monetization
- may need a separate payment layer

Primary metric:

- installs and completed sessions attributed to Smithery traffic

### 3. MCP Registry

Role:

- official discoverability and metadata presence

Why use it:

- broad ecosystem visibility
- neutral registry rather than one storefront

Risk:

- registry is still in preview
- discovery only, not a native billing surface

Primary metric:

- traffic and installs attributable to registry presence

### 4. Direct paid access with x402

Role:

- direct monetization without marketplace dependency

Why use it:

- one canonical endpoint
- per-tool or per-route charging
- no platform revenue share

Risk:

- earlier client/payment adoption curve
- more responsibility for go-to-market

Primary metric:

- paid direct sessions and net revenue per successful activation

## Suggested Bandit Order

1. AgenticMarket
2. Smithery
3. MCP Registry
4. direct x402

This order is about speed to learning, not permanent strategic priority.

## Channel Experiment Rules

For each channel, track:

- channel-specific installs or sessions
- full two-call activations
- reduced-launch-ambiguity rate
- light-edit rate
- repeat-intent rate
- net cash collected or clear monetization signal

## Decision Rule

- keep channels that produce clean activations and clear economic signal
- tighten channels that send traffic but weakly qualified users
- kill channels that create setup burden without meaningful activation
