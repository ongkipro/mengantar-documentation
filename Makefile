# Mengantar docs+toolkit — entrypoint terminal untuk manusia & CI.
# Jalankan `make` atau `make help` untuk daftar target.
.DEFAULT_GOAL := help
SHELL := bash

.PHONY: help check smoke smoke-full client-check spec-lint all

help: ## Tampilkan daftar target
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

check: ## Validasi spec + link + higiene kredensial (offline, cepat)
	@bash scripts/check-links.sh

spec-lint: ## Validasi OpenAPI spec saja
	@python3 -c "import yaml; d=yaml.safe_load(open('spec/openapi.yaml')); print('spec OK — paths', len(d['paths']))"

client-check: ## Typecheck client TypeScript (butuh npx/tsc)
	@npx -y -p typescript tsc -p examples/tsconfig.json && echo "client OK (tsc --strict)"

smoke: ## Smoke-test READ-ONLY ke API (butuh MENGANTAR_API_KEY di env/.env)
	@bash scripts/smoke.sh

smoke-full: ## Smoke-test + operasi tulis (buat/hapus slot pickup) — HATI-HATI, pakai sandbox
	@bash scripts/smoke.sh --full

all: check client-check ## check + client-check (yang dijalankan CI)
