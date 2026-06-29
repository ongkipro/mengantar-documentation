# Contoh cURL (Smoke Test)

Perintah siap-pakai untuk menguji tiap endpoint begitu API key tersedia. Ganti placeholder.
Semua memakai base produksi; untuk sandbox ganti host ke `https://sandbox.mengantar.com`.

```bash
# Set sekali di shell-mu (JANGAN commit nilai aslinya)
export MGT_KEY="GANTI_DENGAN_API_KEY"
export MGT_BASE="https://api-public.mengantar.com"
export MGT_PREFIX="$MGT_BASE/api/public/$MGT_KEY"
```

> Tips: tambahkan `-sS | jq` untuk output rapi (`jq` sudah ada di mesin). Simpan response ke file
> untuk mengisi [10-verification-checklist.md](10-verification-checklist.md).

## 0. Ping / cek koneksi
```bash
curl -sS "$MGT_PREFIX/" | jq
```

## 1. Cek koneksi + validasi key (estimate dummy)
```bash
curl -sS "$MGT_PREFIX/order/estimate?origin_id=5fc62f63f8f44b34aa4c0e0a&destination_id=5fc62de8f8f44b34aa4bdc58&courier=all&weight=1" | jq
```
`success:true` → key valid. `success:false` → key salah / tidak punya akses.

## 2. Cari wilayah tujuan
```bash
curl -sS "$MGT_PREFIX/address/search?keyword=$(printf 'menteng' | jq -sRr @uri)" | jq '.data[0]'
```
Ambil `.data[0].id` sebagai `destination_id`.

## 3. List alamat pickup (origin)
```bash
curl -sS "$MGT_PREFIX/address" | jq '.data[] | {id:._id, name:.PICKUP_NAME, addr:.PICKUP_ADDRESS}'
```
Ambil `_id` sebagai `origin_id`.

## 4. Estimasi ongkir (semua kurir)
```bash
curl -sS "$MGT_PREFIX/order/estimate?origin_id=ORIGIN_ID&destination_id=DEST_ID&courier=all&weight=2" | jq '.data'
```
Varian 3PL:
```bash
curl -sS "$MGT_BASE/api/order/allEstimate3PL?origin_id=ORIGIN_ID&destination_id=DEST_ID&courier=all&weight=2" | jq '.data'
```
Dengan COD:
```bash
curl -sS "$MGT_PREFIX/order/estimate?origin_id=ORIGIN_ID&destination_id=DEST_ID&courier=JNE&weight=2&cod_amount=150000" | jq
```

## 5. Jadwal pickup
```bash
# List slot
curl -sS "$MGT_PREFIX/time?address=ORIGIN_ID" | jq

# Tambah slot
curl -sS -X POST "$MGT_PREFIX/time" \
  --data-urlencode "address_id=ORIGIN_ID" \
  --data-urlencode "date=2026-07-10" \
  --data-urlencode "time=09:00" | jq

# Hapus slot
curl -sS -X DELETE "$MGT_PREFIX/time/TIME_ID" | jq
```

## 6. Buat / update alamat pickup (form)
```bash
curl -sS -X POST "$MGT_PREFIX/address" \
  --data-urlencode "PICKUP_NAME=Gudang Utama" \
  --data-urlencode "PICKUP_PIC=Budi" \
  --data-urlencode "PICKUP_PIC_PHONE=08123456789" \
  --data-urlencode "PICKUP_AUTOFILL=DEST_ID_ORIGIN" \
  --data-urlencode "PICKUP_ADDRESS=Jl. Contoh No. 1, Jakarta" | jq
# Tambahkan --data-urlencode "_id=ADDRESS_ID" untuk update
```

## 7. Buat shipment (JSON)
> ⚠️ Membuat shipment ASLI. Pakai **sandbox** untuk testing.
```bash
curl -sS -X POST "$MGT_PREFIX/order" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "courier": "JNE",
    "pickup": {
      "type": "scheduledPickup",
      "address_id": "ORIGIN_ID",
      "time_id": "TIME_ID",
      "volume": "volumeMobil"
    },
    "orders": [
      {
        "customerAddressDataId": "DEST_ID",
        "customerAddress": "Jl. Tujuan No. 5, Bandung, Jawa Barat 40123",
        "customerName": "Siti",
        "customerPhone": "08111111111",
        "weight": 2,
        "quantity": 1,
        "parcelContent": "Kaos katun",
        "goodsValue": 150000
      }
    ]
  }' | jq
```
Resi ada di `.data[0].cnote_no`, order id di `.data[0].ORDER_ID`.

## 8. Tracking
```bash
curl -sS "$MGT_PREFIX/order?order_id=ORDER_ID" | jq
curl -sS "$MGT_PREFIX/order?tracking_id=CNOTE_NO" | jq
```

## 9. Invoice
```bash
curl -sS "$MGT_PREFIX/invoices" | jq
```

---

## Urutan smoke-test end-to-end (disarankan, sandbox)

```
1) #1 validasi key          → success:true
2) #3 list origin           → catat origin_id
3) #2 cari tujuan           → catat destination_id
4) #4 estimasi              → lihat harga per kurir
5) #5 list pickup time      → catat time_id (atau tambah dgn #5)
6) #7 buat shipment         → catat cnote_no + ORDER_ID
7) #8 tracking by order_id  → cek status & cnote_no
```

Rekam tiap response apa adanya ke [10-verification-checklist.md](10-verification-checklist.md)
untuk memvalidasi/melengkapi skema di [01-api-reference.md](01-api-reference.md).

---
<sub>Bagian dari <a href="README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
