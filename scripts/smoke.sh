#!/usr/bin/env bash
# smoke.sh — smoke-test READ-ONLY API Mengantar dari terminal.
#
# Kredensial hanya dibaca dari environment:
#   MENGANTAR_API_KEY   (wajib)   — atau MGT_KEY
#   MENGANTAR_BASE_URL  (opsional) — default https://api-public.mengantar.com
#
# Butuh: curl, jq. Exit 0 = semua lolos.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 2

KEY="${MENGANTAR_API_KEY:-${MGT_KEY:-}}"
BASE="${MENGANTAR_BASE_URL:-${MGT_BASE:-https://api-public.mengantar.com}}"

command -v jq >/dev/null || { echo "❌ butuh 'jq'"; exit 2; }
[ -n "$KEY" ] || { echo "❌ set MENGANTAR_API_KEY di environment"; exit 2; }

PREFIX="$BASE/api/public/$KEY"
pass=0; fail=0
ok()  { echo "  ✅ $1"; pass=$((pass+1)); }
bad() { echo "  ❌ $1"; fail=$((fail+1)); }
get() { curl -sS --max-time 20 "$1"; }

echo "== Mengantar smoke-test =="
echo "  base: $BASE   key: **redacted**   mode: READ-ONLY"
echo

echo "1) Validasi key (estimate dummy)"
r=$(get "$PREFIX/order/estimate?origin_id=5fc62f63f8f44b34aa4c0e0a&destination_id=5fc62de8f8f44b34aa4bdc58&courier=all&weight=1")
if echo "$r" | jq -e '.success == true' >/dev/null 2>&1; then ok "key valid"; else
  bad "key invalid / offline (response omitted to prevent credential echo)"; exit 1; fi

echo "2) Cari wilayah (keyword=menteng)"
r=$(get "$PREFIX/address/search?keyword=menteng")
DEST=$(echo "$r" | jq -r '.data[0]._id // empty')
[ -n "$DEST" ] && ok "hasil wilayah tersedia" || bad "tak ada hasil wilayah"

echo "3) List alamat pickup (origin)"
r=$(get "$PREFIX/address")
PICKUP_ID=$(echo "$r" | jq -r '.data[0]._id // empty')
ORIGIN_WIL=$(echo "$r" | jq -r '.data[0].PICKUP_AUTOFILL // empty')
[ -n "$PICKUP_ID" ] && ok "alamat pickup tersedia" || bad "belum ada alamat pickup di akun"

if [ -n "$ORIGIN_WIL" ] && [ -n "$DEST" ]; then
  echo "4) Estimasi ongkir (all) — origin_id = PICKUP_AUTOFILL (wilayah), bukan pickup _id"
  r=$(get "$PREFIX/order/estimate?origin_id=$ORIGIN_WIL&destination_id=$DEST&courier=all&weight=1")
  n=$(echo "$r" | jq -r '[.data | to_entries[] | select(.value.unsupported != true)] | length' 2>/dev/null || echo 0)
  [ "$n" -gt 0 ] 2>/dev/null && ok "$n kurir tersedia" || bad "tak ada kurir tersedia / bentuk response beda"
else
  echo "4) Estimasi ongkir — dilewati (butuh origin & destination)"
fi

echo "5) Invoice & saldo"
r=$(get "$PREFIX/invoices")
if echo "$r" | jq -e '.success == true' >/dev/null 2>&1; then
  ok "endpoint invoice tersedia"; else bad "gagal ambil invoice"; fi

echo
echo "== hasil: $pass lolos, $fail gagal =="
[ $fail -eq 0 ] && echo "✅ smoke: OK" || echo "❌ smoke: ADA GAGAL"
exit $fail
