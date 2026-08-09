#!/usr/bin/env bash
# check-links.sh — validasi integritas repo dokumentasi Mengantar.
# 1) OpenAPI spec valid  2) semua link relatif internal (.md/.yaml) menunjuk file nyata.
# Exit 0 = bersih, non-zero = ada masalah. Tidak butuh network.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 2
fail=0
broken_file="$(mktemp)"
trap 'rm -f "$broken_file"' EXIT

echo "== 1. OpenAPI spec =="
if python3 -c "import yaml,sys; d=yaml.safe_load(open('spec/openapi.yaml')); print('  spec OK — paths:', len(d['paths']), 'schemas:', len(d['components']['schemas']))" 2>/tmp/mgt_yaml_err; then
  :
else
  echo "  SPEC INVALID:"; sed 's/^/    /' /tmp/mgt_yaml_err; fail=1
fi

echo "== 2. Link internal =="
# Cari semua [teks](path) dan href="path" yang menunjuk .md/.yaml lokal (bukan http, bukan anchor).
while IFS= read -r file; do
  dir="$(dirname "$file")"
  grep -oE '(\]\(|href=")([^)"#]+\.(md|yaml))' "$file" 2>/dev/null \
    | sed -E 's/^(\]\(|href=")//' \
    | while IFS= read -r target; do
        case "$target" in http*|/*) continue;; esac
        if [ ! -f "$dir/$target" ]; then
          echo "  BROKEN: $file -> $target"; echo x >>"$broken_file"
        fi
      done
done < <(find . -name '*.md' -not -path './.git/*')

if [ -s "$broken_file" ]; then fail=1; else echo "  semua link OK"; fi

echo "== 3. Higienis: tidak ada key/token bocor =="
if grep -rnE '(secret_key|api[_-]?key|@key)\s*[=:]\s*["'"'"']?[A-Za-z0-9_-]{16,}' \
  --include='*.md' --include='*.ts' --include='*.yaml' --include='*.http' --include='*.sh' . 2>/dev/null \
  | grep -viE 'GANTI|API_KEY|placeholder|example|<' ; then
  echo "  WARNING: kemungkinan kredensial nyata di atas"; fail=1
else
  echo "  tidak ada kredensial nyata terdeteksi"
fi

echo
[ "$fail" -eq 0 ] && echo "✅ check-links: BERSIH" || echo "❌ check-links: ADA MASALAH"
exit "$fail"
