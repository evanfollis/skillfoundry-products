.PHONY: help setup check test typecheck build deploy-check

PYTHON := $(shell test -x .venv/bin/python && printf '%s' .venv/bin/python || command -v python3)

help:
	@printf '%s\n' \
		'make setup        Install locked TypeScript and Python development dependencies' \
		'make check        Run every maintained workspace deterministic gate' \
		'make test         Run Python product/mechanism tests' \
		'make typecheck    Type-check TypeScript workspaces' \
		'make build        Build/type-check maintained TypeScript workspaces' \
		'make deploy-check Validate release inputs without deploying'

setup:
	corepack pnpm install --frozen-lockfile
	@test -x .venv/bin/python || python3 -m venv .venv
	.venv/bin/python -m pip install -e "products/launchpad-lint[dev]" -e "mechanisms/bottleneck-radar[dev]"

check:
	@$(PYTHON) -c 'import pathlib,tomllib; r=pathlib.Path("."); d=tomllib.loads((r/"repo.toml").read_text()); assert d["schema_version"] == 1 and d["shape"] == "monorepo"; [(_ for _ in ()).throw(AssertionError(f"missing {p}")) for p in ("README.md","repo.toml","Makefile","AGENTS.md","CLAUDE.md","docs/architecture.md") if not (r/p).exists()]'
	corepack pnpm -r --if-present check
	$(PYTHON) -m ruff check products/launchpad-lint/src mechanisms/bottleneck-radar/src
	$(PYTHON) -m pytest -q products/launchpad-lint/tests
	$(PYTHON) -m pytest -q mechanisms/bottleneck-radar/tests
	$(MAKE) deploy-check
	git diff --check

test:
	$(PYTHON) -m pytest -q products/launchpad-lint/tests
	$(PYTHON) -m pytest -q mechanisms/bottleneck-radar/tests

typecheck:
	corepack pnpm -r --if-present typecheck

build:
	corepack pnpm -r --if-present build

deploy-check:
	test -f products/launchpad-lint/server.json
	test -f products/preflight/server.json
	test -f .github/workflows/publish-launchpad-lint-mcp.yml
	test -f .github/workflows/publish-preflight-mcp.yml
	test -x products/preflight/deploy/verify_node_runtime.sh
	/bin/sh -n products/preflight/deploy/verify_node_runtime.sh
	grep -Fqx 'ExecStartPre=/opt/workspace/projects/skillfoundry/skillfoundry-products/products/preflight/deploy/verify_node_runtime.sh' products/preflight/deploy/preflight.service
	grep -Fqx 'ExecStart=/opt/workspace/runtime/toolchains/node-v24.18.0-linux-x64/bin/node dist/serve.js' products/preflight/deploy/preflight.service
	grep -Fqx 'User=preflight' products/preflight/deploy/preflight.service
	grep -Fqx 'ProtectSystem=strict' products/preflight/deploy/preflight.service
	grep -Fqx 'NoNewPrivileges=yes' products/preflight/deploy/preflight.service
	grep -Fqx 'IPAddressAllow=localhost' products/preflight/deploy/preflight.service
	grep -Fqx 'User=preflight-watcher' products/preflight/deploy/preflight-watcher.service
	grep -Fqx 'ProtectSystem=strict' products/preflight/deploy/preflight-watcher.service
	grep -Fqx 'NoNewPrivileges=yes' products/preflight/deploy/preflight-watcher.service
	grep -Fqx 'ReadWritePaths=/opt/workspace/runtime/.alerts/preflight-real-user.log' products/preflight/deploy/preflight-watcher.service
	test -f products/preflight/deploy/preflight.sysusers
	test -x products/preflight/deploy/prepare_service_access.sh
	/bin/sh -n products/preflight/deploy/prepare_service_access.sh
	/bin/bash -n products/preflight/scripts/traffic-classification.sh
	/bin/bash -n products/preflight/scripts/real-user-watcher.sh
	/bin/bash -n products/preflight/scripts/usage.sh
	/bin/bash products/preflight/tests/traffic-classification.test.sh
	grep -Fqx 'Environment=LAUNCHPAD_LINT_ENVIRONMENT=production' products/launchpad-lint/deploy/launchpad-lint.service
	grep -Fqx 'Environment=LAUNCHPAD_LINT_TELEMETRY_PATH=/opt/workspace/runtime/projects/skillfoundry/launchpad-lint/telemetry.ndjson' products/launchpad-lint/deploy/launchpad-lint.service
	test -f products/platform/index.html
