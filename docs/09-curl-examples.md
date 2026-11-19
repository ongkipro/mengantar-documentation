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
`success:true` → key valid. `403 {"success":false,"message":"Not allowed"}` → key salah lingkungan / nonaktif, tanpa permission, atau IP tidak diizinkan.

## 2. Cari data wilayah
```bash
curl -sS "$MGT_PREFIX/address/search?keyword=$(printf 'menteng' | jq -sRr @uri)" | jq '.data[0]'
```
Ambil `.data[0]._id` sebagai `destination_id`; untuk asal, pakai nilai `PICKUP_AUTOFILL`
dari alamat pickup (`GET /address`), bukan `_id` alamat pickup.

## 3. List alamat pickup (origin)
```bash
curl -sS "$MGT_PREFIX/address" | jq '.data[] | {pickup_address_id:._id, origin_wilayah_id:.PICKUP_AUTOFILL, name:.PICKUP_NAME, addr:.PICKUP_ADDRESS}'
```

## 4. Buat / update alamat pickup (JSON)
```bash
curl -sS -X POST "$MGT_PREFIX/address" \
  -H "Content-Type: application/json" \
  -d '{
    "PICKUP_AUTOFILL":"ORIGIN_WILAYAH_ID",
    "PICKUP_ADDRESS":"Jl. Contoh No. 1, Jakarta",
    "PICKUP_PIC_PHONE":"08123456789",
    "PICKUP_PIC":"Budi",
    "PICKUP_NAME":"Gudang Utama"
  }' | jq
# Mengubah alamat: PUT /address/PICKUP_ADDRESS_ID (POST hanya menambah)
```

## 5. Jadwal pickup
```bash
# List slot untuk satu alamat pickup
curl -sS "$MGT_PREFIX/time?address=PICKUP_ADDRESS_ID" | jq

# Tambah slot  ⚠️ date = MM-DD-YYYY (atau Unix ms number), time = 09:00..20:00 (dua digit; "9:00" ditolak),
# dan jadwal harus minimal 90 menit dari sekarang.
curl -sS -X POST "$MGT_PREFIX/time" \
  -H "Content-Type: application/json" \
  -d '{"address_id":"PICKUP_ADDRESS_ID","date":"07-10-2026","time":"13:00"}' | jq
```

## 6. Estimasi ongkir
```bash
# Semua kurir
curl -sS "$MGT_PREFIX/order/estimate?origin_id=ORIGIN_WILAYAH_ID&destination_id=DESTINATION_WILAYAH_ID&courier=all&weight=2" | jq '.data'

# Tarif SPX: courier=spx kini 200 (sandbox 2026-11-19), atau ambil dari courier=all. Entri spx membawa pickupSchedule.
# Buang bila unsupported / unsupportedOriginSpx bernilai true.
curl -sS "$MGT_PREFIX/order/estimate?origin_id=ORIGIN_WILAYAH_ID&destination_id=DESTINATION_WILAYAH_ID&courier=all&weight=1&COD_AMOUNT=100000" \
  | jq '.data.spx | select(. != null) | {price, estimate_delivery, unsupported, unsupported_cod, unsupportedOriginSpx, unsupportedPickup}'

# Satu kurir + COD (perhatikan COD_AMOUNT huruf besar; courier case-sensitive: Sap ✅, SAP ❌)
curl -sS "$MGT_PREFIX/order/estimate?origin_id=ORIGIN_WILAYAH_ID&destination_id=DESTINATION_WILAYAH_ID&courier=JNE&weight=2&COD_AMOUNT=150000" | jq

# Public (flat diskon 20%) — TANPA prefix key
curl -sS "$MGT_BASE/api/order/allEstimatePublic?origin_id=ORIGIN_WILAYAH_ID&destination_id=DESTINATION_WILAYAH_ID&weight=2" | jq '.data'

# 3PL (harga standar, tanpa promo) — TANPA prefix key
curl -sS "$MGT_BASE/api/order/allEstimate3PL?origin_id=ORIGIN_WILAYAH_ID&destination_id=DESTINATION_WILAYAH_ID&weight=2" | jq '.data'
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

## 10. Buat shipment (JSON)
> ⚠️ Membuat shipment ASLI. Pakai **sandbox** untuk testing.
```bash
curl -sS -X POST "$MGT_PREFIX/order" \
  -H "Content-Type: application/json" \
  -d '{
    "courier":"JNE",
    "pickup":{
      "type":"scheduledPickup",
      "volume":"volumeMobil",
      "address_id":"PICKUP_ADDRESS_ID",
      "time_id":"TIME_ID"
    },
    "orders":[{
      "customerAddressDataId":"DESTINATION_WILAYAH_ID",
      "customerAddress":"Jl. Tujuan No. 5, Bandung, Jawa Barat 40123",
      "customerName":"Siti",
      "customerPhone":"08111111111",
      "parcelContent":"Kaos katun",
      "weight":2,
      "quantity":1,
      "goodsValue":150000
    }]
  }' | jq
```
Resi ada di `.data[0].cnote_no`, status pembayaran di `.data[0].isPaid`, order id di
`.data[0].ORDER_ID`, dan batch di `.data[0].batch_id`/`.batch_id`.
> JT Premium / SiCepat: **jangan** kirim batch paralel — gabung ke satu request (hindari `409`). *(Ninja discontinued per 1 Sept 2026)*.

### 10a. Create order idempotent (retry aman)

```bash
curl -sS -X POST "$MGT_PREFIX/order" \
  -H 'Content-Type: application/json' \
  -H 'idempotencyKey: INV-2026-0001' \
  --data @order.json -D - -o response.json
# Timeout/putus? Kirim ULANG perintah yang sama persis (kunci & order.json sama).
# Header "Idempotent-Replayed: true" = salinan respons pertama, bukan order baru.
```

## 11. Bayar order unpaid (saldo kurang saat create)
```bash
curl -sS -X POST "$MGT_PREFIX/order/pay-unpaid" \
  -H "Content-Type: application/json" \
  -d '{"courier":"JNE","batch_id":"BATCH_ID"}' | jq
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
  -H "Content-Type: application/json" \
  -d '{"courier":"JNE","ids":["ORDER_OBJECT_ID_1","ORDER_OBJECT_ID_2"]}' | jq
```

## 14. Batch
```bash
# List batch
curl -sS "$MGT_PREFIX/batch?page=1&size=50&courier=JNE" | jq '.data | length'

# Hapus batch
curl -sS -X DELETE "$MGT_PREFIX/batch" \
  -H "Content-Type: application/json" \
  -d '{"courier":"JNE","id":"BATCH_ID"}' | jq
```

## 14a. Simulasi status order (SANDBOX saja)

```bash
curl -sS -X POST "$MGT_PREFIX/order/simulation" \
  -H 'Content-Type: application/json' \
  -d '{"courier":"JNE","orderId":"240429Q34UPQ","statusCategory":"DELIVERED"}'
# Produksi selalu 404. Memicu satu webhook bila Webhook URL terpasang.
```

## 15. Skor penerima (cek risiko RTS sebelum COD)
```bash
curl -sS "$MGT_PREFIX/getReceiverScoreByNumberUser?search=8123456789" | jq '.data'
```

## 16. Dropshipper (Tambah & Cari)
```bash
# Tambah data profil dropshipper
curl -sS -X POST "$MGT_PREFIX/dropshippers" \
  -H "Content-Type: application/json" \
  -d '{"name":"Toko Cantik Official","phone":"081299887766"}' | jq

# Cari profil dropshipper berdasarkan nama
curl -sS "$MGT_PREFIX/dropshippers?name=Cantik" | jq '.data'
```

## 17. Cetak Label PDF Asinkron (BETA)
```bash
# Request async label generation: SATU orderId per request (array / daftar dipisah koma ditolak).
# format: normal-1|normal-2|normal-4|normal-6, thermal-10x10|thermal-10x15|thermal-8x6,
#         thermal-new-10x10|thermal-new-10x15 (khusus JT / SPX). Kuota 8 aksi Print / menit.
curl -sS -X POST "$MGT_PREFIX/label-generation" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId":"ORDER-JNE-001",
    "courier":"JNE",
    "format":"thermal-10x15"
  }' | jq
# Response: 2xx {"success":true,"data":{"labelGenerationId":"LABEL_GEN_ID","status":"PENDING"}} — tidak pernah ada downloadUrl di sini

# Cek status & ambil link unduh PDF (Google Cloud Storage signed URL 15 menit)
curl -sS "$MGT_PREFIX/label-generation/LABEL_GEN_ID" | jq
```

## 18. Update & Hapus Alamat Pickup
```bash
# Update alamat pickup
curl -sS -X PUT "$MGT_PREFIX/address" \
  -H "Content-Type: application/json" \
  -d '{
    "_id":"PICKUP_ADDRESS_ID",
    "PICKUP_NAME":"Gudang Pusat Update",
    "PICKUP_ADDRESS":"Jl. Baru No. 88, Jakarta Barat",
    "PICKUP_PIC":"Bambang",
    "PICKUP_PIC_PHONE":"081299990000"
  }' | jq

# Hapus alamat pickup
curl -sS -X DELETE "$MGT_PREFIX/address" \
  -H "Content-Type: application/json" \
  -d '{"id":"PICKUP_ADDRESS_ID"}' | jq
```

---

## Urutan smoke-test end-to-end (disarankan, sandbox)

```
1) #1  validasi key                     → success:true
2) #3  list pickup                       → catat PICKUP_ADDRESS_ID + ORIGIN_WILAYAH_ID
3) #2  cari tujuan                       → catat DESTINATION_WILAYAH_ID
4) #6  estimasi                          → pakai ORIGIN_WILAYAH_ID, bukan PICKUP_ADDRESS_ID
5) #7  performa kurir                    → skor/rekomendasi (opsional)
6) #5  list/tambah pickup time           → pakai PICKUP_ADDRESS_ID, catat TIME_ID
7) #9  my-users                          → catat assignee (opsional)
8) #10 buat shipment                     → pickup.address_id = PICKUP_ADDRESS_ID
9) #11 pay-unpaid            → bila saldo kurang saat create
10) #12 tracking by order_id  → cek status & cnote_no
11) #15 receiver score        → validasi sebelum kirim COD besar
```

Rekam tiap response apa adanya ke [10-verification-checklist.md](10-verification-checklist.md)
untuk memvalidasi/melengkapi skema di [01-api-reference.md](01-api-reference.md).

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
