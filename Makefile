.PHONY: help setup check test typecheck build deploy-check

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
	python3 -m pip install -e "products/launchpad-lint[dev]" -e "mechanisms/bottleneck-radar[dev]"

check:
	@python3 -c 'import pathlib,tomllib; r=pathlib.Path("."); d=tomllib.loads((r/"repo.toml").read_text()); assert d["schema_version"] == 1 and d["shape"] == "monorepo"; [(_ for _ in ()).throw(AssertionError(f"missing {p}")) for p in ("README.md","repo.toml","Makefile","AGENTS.md","CLAUDE.md","docs/architecture.md") if not (r/p).exists()]'
	corepack pnpm -r --if-present check
	python3 -m pytest -q products/launchpad-lint/tests
	python3 -m pytest -q mechanisms/bottleneck-radar/tests
	git diff --check

test:
	python3 -m pytest -q products/launchpad-lint/tests
	python3 -m pytest -q mechanisms/bottleneck-radar/tests

typecheck:
	corepack pnpm -r --if-present typecheck

build:
	corepack pnpm -r --if-present build

deploy-check:
	test -f products/launchpad-lint/server.json
	test -f products/preflight/server.json
	test -f .github/workflows/publish-launchpad-lint-mcp.yml
	test -f .github/workflows/publish-preflight-mcp.yml
