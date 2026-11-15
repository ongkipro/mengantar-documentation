#!/usr/bin/env bash
# docs-watch.sh — pengingat update docs resmi Mengantar.
# Ambil https://api-public.mengantar.com/docs/ (+ host sandbox), normalisasi ke teks, bandingkan dengan
# docs/official-snapshot/official-docs.txt. Exit 0 = sama, 1 = berubah (lihat diff), 2 = gagal fetch.
#   bash scripts/docs-watch.sh            # cek + tampilkan diff
#   bash scripts/docs-watch.sh --update   # timpa snapshot setelah docs/spec/client disinkronkan
set -uo pipefail
cd "$(dirname "$0")/.." || exit 2
SNAP=docs/official-snapshot/official-docs.txt
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
norm() { python3 -c '
import re,html,sys
s=sys.stdin.read()
s=re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>","",s)
s=re.sub(r"(?i)<br\s*/?>|</(p|div|tr|li|h\d|pre|table)>","\n",s)
s=html.unescape(re.sub(r"(?s)<[^>]+>","",s))
print("\n".join(l.strip() for l in s.split("\n") if l.strip()))'; }
for h in api-public sandbox; do
  curl -fsSL --max-time 30 "https://$h.mengantar.com/docs/" | norm >"$tmp/$h.txt" || { echo "fetch gagal: $h"; exit 2; }
  [ -s "$tmp/$h.txt" ] || { echo "kosong: $h"; exit 2; }
done
cmp -s "$tmp/api-public.txt" "$tmp/sandbox.txt" || { echo "PERINGATAN: host produksi dan sandbox berbeda:"; diff "$tmp/api-public.txt" "$tmp/sandbox.txt" | head -40; }
if [ "${1:-}" = "--update" ]; then
  mkdir -p "$(dirname "$SNAP")"; cp "$tmp/api-public.txt" "$SNAP"; echo "snapshot diperbarui: $SNAP ($(date +%F))"; exit 0
fi
if diff -u "$SNAP" "$tmp/api-public.txt" >"$tmp/d"; then echo "docs resmi = snapshot (tidak ada perubahan)"; exit 0; fi
cat "$tmp/d"; echo; echo "BERUBAH: sinkronkan 01/02/07/spec/examples/requests.http/CHANGELOG, lalu: bash scripts/docs-watch.sh --update"; exit 1
