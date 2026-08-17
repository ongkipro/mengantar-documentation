#!/usr/bin/env bash
# check-links.sh — validasi link internal dan higiene kredensial.
# Validasi OpenAPI dijalankan oleh target `spec-lint` sebelum script ini.
# Exit 0 = bersih, non-zero = ada masalah. Tidak butuh network.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 2
fail=0
broken_file="$(mktemp)"
trap 'rm -f "$broken_file"' EXIT

echo "== 1. Link internal =="
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
done < <(find . -path './.git' -prune -o -path './node_modules' -prune -o -name '*.md' -print)

if [ -s "$broken_file" ]; then fail=1; else echo "  semua link OK"; fi

echo "== 2. Higiene: tidak ada key/token bocor =="
if grep -rnEi 'API-[A-Za-z0-9]{12,}|(secret_key|api[_-]?key|@key)["'"'"']?[[:space:]]*[=:][[:space:]]*["'"'"']?[A-Za-z0-9][A-Za-z0-9_-]{15,}' \
  --exclude-dir='.git' --exclude-dir='node_modules' \
  --include='*.md' --include='*.ts' --include='*.yaml' --include='*.yml' --include='*.http' \
  --include='*.sh' --include='*.json' --include='Makefile' --include='.env.example' . 2>/dev/null \
  | grep -viE 'GANTI|replace_with|your_' ; then
  echo "  WARNING: kemungkinan kredensial nyata di atas"; fail=1
else
  echo "  tidak ada kredensial nyata terdeteksi"
fi

echo
[ "$fail" -eq 0 ] && echo "✅ check-links: BERSIH" || echo "❌ check-links: ADA MASALAH"
exit "$fail"
