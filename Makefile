SHELL := bash
.DEFAULT_GOAL := help
NPM ?= npm

.PHONY: help check smoke client-check client-test spec-lint all

help: ## Tampilkan daftar target
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

check: spec-lint ## Validasi spec + link internal + higiene kredensial
	@bash scripts/check-links.sh

spec-lint: ## Lint OpenAPI dengan dependency yang terkunci
	@$(NPM) exec -- redocly lint spec/openapi.yaml

client-check: ## Typecheck client TypeScript
	@$(NPM) exec -- tsc -p examples/tsconfig.json && echo "client OK (tsc --strict)"

client-test: ## Jalankan contract test client TypeScript
	@$(NPM) exec -- tsx --test examples/mengantar-client.test.ts

smoke: ## Smoke-test READ-ONLY ke API (key hanya dari environment)
	@bash scripts/smoke.sh

all: check client-check client-test ## Validasi yang sama dengan CI
