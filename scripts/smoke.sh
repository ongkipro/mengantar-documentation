#!/usr/bin/env bash
# smoke.sh — smoke-test API Mengantar dari terminal.
# Default: READ-ONLY (validasi key, cari wilayah, list origin, estimasi). Aman.
# Flag --full: tambah operasi TULIS (add + delete slot pickup) — pakai SANDBOX.
#
# Kredensial dari env atau file .env (tidak di-commit):
#   MENGANTAR_API_KEY   (wajib)   — atau MGT_KEY
#   MENGANTAR_BASE_URL  (opsional) — default https://api-public.mengantar.com
#
# Butuh: curl, jq. Exit 0 = semua lolos.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 2

# Muat .env bila ada (tanpa mengekspor sembarangan ke child yang tak perlu)
[ -f .env ] && set -a && . ./.env && set +a

KEY="${MENGANTAR_API_KEY:-${MGT_KEY:-}}"
BASE="${MENGANTAR_BASE_URL:-${MGT_BASE:-https://api-public.mengantar.com}}"
FULL=0; [ "${1:-}" = "--full" ] && FULL=1

command -v jq >/dev/null || { echo "❌ butuh 'jq'"; exit 2; }
[ -n "$KEY" ] || { echo "❌ set MENGANTAR_API_KEY (atau salin .env.example → .env)"; exit 2; }

PREFIX="$BASE/api/public/$KEY"
redact() { sed -E "s#$KEY#**redacted**#g"; }
pass=0; fail=0
ok()  { echo "  ✅ $1"; pass=$((pass+1)); }
bad() { echo "  ❌ $1"; fail=$((fail+1)); }
# curl helper → simpan body, cek .success
get() { curl -sS --max-time 20 "$1"; }

echo "== Mengantar smoke-test =="
echo "  base: $BASE   key: **redacted**   mode: $([ $FULL -eq 1 ] && echo FULL || echo READ-ONLY)"
echo

echo "1) Validasi key (estimate dummy)"
r=$(get "$PREFIX/order/estimate?origin_id=5fc62f63f8f44b34aa4c0e0a&destination_id=5fc62de8f8f44b34aa4bdc58&courier=all&weight=1")
if echo "$r" | jq -e '.success == true' >/dev/null 2>&1; then ok "key valid"; else
  bad "key invalid / offline"; echo "$r" | redact | head -c 300; echo; echo "  → stop."; exit 1; fi

echo "2) Cari wilayah (keyword=menteng)"
r=$(get "$PREFIX/address/search?keyword=menteng")
DEST=$(echo "$r" | jq -r '.data[0]._id // empty')
CITY=$(echo "$r" | jq -r '.data[0].CITY_NAME // empty')
[ -n "$DEST" ] && ok "destination_id=$DEST ($CITY)" || bad "tak ada hasil wilayah"

echo "3) List alamat pickup (origin)"
r=$(get "$PREFIX/address")
PICKUP_ID=$(echo "$r" | jq -r '.data[0]._id // empty')          # untuk create order & /time
ORIGIN_WIL=$(echo "$r" | jq -r '.data[0].PICKUP_AUTOFILL // empty') # wilayah _id → untuk estimate
[ -n "$PICKUP_ID" ] && ok "pickup _id=$PICKUP_ID · origin wilayah=$ORIGIN_WIL" || bad "belum ada alamat pickup di akun"

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
  ok "saldo: $(echo "$r" | jq -r '.balance // "?"')"; else bad "gagal ambil invoice"; fi

if [ $FULL -eq 1 ] && [ -n "$PICKUP_ID" ]; then
  echo "6) [FULL] Tambah + hapus slot pickup (mm-dd-yyyy) — address_id = pickup _id"
  d=$(date -d "+3 days" +%m-%d-%Y 2>/dev/null || date -v+3d +%m-%d-%Y 2>/dev/null)
  r=$(curl -sS --max-time 20 -X POST "$PREFIX/time" \
        --data-urlencode "address_id=$PICKUP_ID" --data-urlencode "date=$d" --data-urlencode "time=13:00")
  TID=$(echo "$r" | jq -r '.data[-1]._id // .data._id // empty' 2>/dev/null)
  if [ -n "$TID" ]; then ok "slot dibuat ($d 13:00) id=$TID"
    r=$(curl -sS --max-time 20 -X DELETE "$PREFIX/time/$TID")
    echo "$r" | jq -e '.success == true' >/dev/null 2>&1 && ok "slot dihapus" || bad "gagal hapus slot (DELETE /time plugin-only?)"
  else bad "gagal buat slot"; fi
fi

echo
echo "== hasil: $pass lolos, $fail gagal =="
[ $fail -eq 0 ] && echo "✅ smoke: OK" || echo "❌ smoke: ADA GAGAL"
exit $fail
