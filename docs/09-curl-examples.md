# Contoh cURL (Smoke Test)

Perintah siap-pakai untuk menguji tiap endpoint begitu API key tersedia. Ganti placeholder.
Base URL memakai host dari plugin (**konfirmasi dengan tim Mengantar**); untuk sandbox ganti host.

```bash
# Set sekali di shell-mu (JANGAN commit nilai aslinya)
export MGT_KEY="GANTI_DENGAN_API_KEY"
export MGT_BASE="https://api-public.mengantar.com"     # konfirmasi base URL final
export MGT_PREFIX="$MGT_BASE/api/public/$MGT_KEY"
```

> Tips: tambahkan `-sS | jq` untuk output rapi (`jq` sudah ada di mesin). Simpan response ke file
> untuk mengisi [10-verification-checklist.md](10-verification-checklist.md).

## 1. Validasi key (estimate dummy) — [plugin]
```bash
curl -sS "$MGT_PREFIX/order/estimate?origin_id=5fc62f63f8f44b34aa4c0e0a&destination_id=5fc62de8f8f44b34aa4bdc58&courier=all&weight=1" | jq
```
`success:true` → key valid. `success:false` (mis. `X001`) → key salah / tidak punya akses.

## 2. Cari data wilayah
```bash
curl -sS "$MGT_PREFIX/address/search?keyword=$(printf 'menteng' | jq -sRr @uri)" | jq '.data[0]'
```
Ambil `.data[0]._id` sebagai `origin_id` / `destination_id`.

## 3. List alamat pickup (origin)
```bash
curl -sS "$MGT_PREFIX/address" | jq '.data[] | {id:._id, name:.PICKUP_NAME, addr:.PICKUP_ADDRESS}'
```

## 4. Buat / update alamat pickup (form)
```bash
curl -sS -X POST "$MGT_PREFIX/address" \
  --data-urlencode "PICKUP_AUTOFILL=DEST_ID_WILAYAH" \
  --data-urlencode "PICKUP_ADDRESS=Jl. Contoh No. 1, Jakarta" \
  --data-urlencode "PICKUP_PIC_PHONE=08123456789" \
  --data-urlencode "PICKUP_PIC=Budi" \
  --data-urlencode "PICKUP_NAME=Gudang Utama" | jq
# Tambahkan --data-urlencode "_id=ADDRESS_ID" untuk update
```

## 5. Jadwal pickup
```bash
# List slot untuk satu origin
curl -sS "$MGT_PREFIX/time?address=ORIGIN_ID" | jq

# Tambah slot  ⚠️ date = mm-dd-yyyy (bulan-tanggal-tahun), time = 9:00..18:00
curl -sS -X POST "$MGT_PREFIX/time" \
  --data-urlencode "address_id=ORIGIN_ID" \
  --data-urlencode "date=07-10-2026" \
  --data-urlencode "time=13:00" | jq
```

## 6. Estimasi ongkir
```bash
# Semua kurir
curl -sS "$MGT_PREFIX/order/estimate?origin_id=ORIGIN_ID&destination_id=DEST_ID&courier=all&weight=2" | jq '.data'

# Satu kurir + COD (perhatikan COD_AMOUNT huruf besar)
curl -sS "$MGT_PREFIX/order/estimate?origin_id=ORIGIN_ID&destination_id=DEST_ID&courier=JNE&weight=2&COD_AMOUNT=150000" | jq

# Public (flat diskon 20%) — TANPA prefix key
curl -sS "$MGT_BASE/api/order/allEstimatePublic?origin_id=ORIGIN_ID&destination_id=DEST_ID&weight=2" | jq '.data'

# 3PL (harga standar, tanpa promo) — TANPA prefix key
curl -sS "$MGT_BASE/api/order/allEstimate3PL?origin_id=ORIGIN_ID&destination_id=DEST_ID&weight=2" | jq '.data'
```

## 7. Skor performa kurir
```bash
# Ambil dulu allEstimateData dari #6 (courier=all), lalu:
curl -sS -X POST "$MGT_PREFIX/order/getPerformancePublic" \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"city":"JEMBER","allEstimateData": PASTE_DATA_ALLESTIMATE }' | jq '.data'
```

## 8. Invoice & saldo
```bash
curl -sS "$MGT_PREFIX/invoices" | jq '{count, balance, first: .data[0]}'
```

## 9. Assignee (opsional untuk create order)
```bash
curl -sS "$MGT_PREFIX/my-users" | jq '.data[] | {id:._id, name}'
```

## 10. Buat shipment (form)
> ⚠️ Membuat shipment ASLI. Pakai **sandbox** untuk testing.
```bash
curl -sS -X POST "$MGT_PREFIX/order" \
  -F 'courier=JNE' \
  -F 'pickup={"type":"scheduledPickup","volume":"volumeMobil","address_id":"ORIGIN_ID","time_id":"TIME_ID"}' \
  -F 'orders=[{
        "customerAddressDataId":"DEST_ID",
        "customerAddress":"Jl. Tujuan No. 5, Bandung, Jawa Barat 40123",
        "customerName":"Siti","customerPhone":"08111111111",
        "parcelContent":"Kaos katun","weight":2,"quantity":1,"goodsValue":150000
      }]' | jq
```
Resi ada di `.data[0].cnote_no`, order id di `.data[0].ORDER_ID`, batch di `.batch_id`.
> JT Premium / Ninja / SiCepat: **jangan** kirim batch paralel — gabung ke satu request (hindari `409`).

## 11. Bayar order unpaid (saldo kurang saat create)
```bash
curl -sS -X POST "$MGT_PREFIX/order/pay-unpaid" \
  --data-urlencode "courier=JNE" \
  --data-urlencode "batch_id=BATCH_ID" | jq
```

## 12. Tracking / list order
```bash
# Satu order + riwayat status
curl -sS "$MGT_PREFIX/order?order_id=ORDER_ID" | jq
curl -sS "$MGT_PREFIX/order?tracking_id=CNOTE_NO" | jq

# List dengan filter
curl -sS "$MGT_PREFIX/order?page=1&size=50&courier=JNE&cod=NON_COD&category=collected_customer" | jq '.data | length'
```

## 13. Hapus order
```bash
curl -sS -X DELETE "$MGT_PREFIX/order" \
  --data-urlencode 'courier=JNE' \
  --data-urlencode 'ids=["ORDER_OBJECT_ID_1","ORDER_OBJECT_ID_2"]' | jq
```

## 14. Batch
```bash
# List batch
curl -sS "$MGT_PREFIX/batch?page=1&size=50&courier=JNE" | jq '.data | length'

# Hapus batch
curl -sS -X DELETE "$MGT_PREFIX/batch" \
  --data-urlencode 'courier=JNE' --data-urlencode 'id=BATCH_ID' | jq
```

## 15. Skor penerima (cek risiko RTS sebelum COD)
```bash
curl -sS "$MGT_PREFIX/getReceiverScoreByNumberUser?search=8123456789" | jq '.data'
```

---

## Urutan smoke-test end-to-end (disarankan, sandbox)

```
1) #1  validasi key           → success:true
2) #3  list origin            → catat origin_id
3) #2  cari tujuan            → catat destination_id (_id)
4) #6  estimasi               → lihat harga per kurir
5) #7  performa kurir         → skor/rekomendasi (opsional)
6) #5  list/tambah pickup time → catat time_id
7) #9  my-users              → catat assignee (opsional)
8) #10 buat shipment          → catat cnote_no + ORDER_ID + batch_id
9) #11 pay-unpaid            → bila saldo kurang saat create
10) #12 tracking by order_id  → cek status & cnote_no
11) #15 receiver score        → validasi sebelum kirim COD besar
```

Rekam tiap response apa adanya ke [10-verification-checklist.md](10-verification-checklist.md)
untuk memvalidasi/melengkapi skema di [01-api-reference.md](01-api-reference.md).

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
