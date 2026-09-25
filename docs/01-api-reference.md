# Mengantar API — Referensi Lengkap (24 Endpoint + Webhook)

> Spesifikasi resmi Mengantar Public API, disinkronkan langsung dengan dokumentasi live
> [Mengantar Public API](https://api-public.mengantar.com/docs/).
> Mencakup **24 endpoint aktif**, arsitektur **Webhook resmi (HMAC-SHA256)**, modul **Dropshipper**,
> cetak label PDF asynchronous, dan penanganan **Dangerous Goods (DG)**.

---

## 1. Base URL & Autentikasi

Semua request (kecuali endpoint public non-key) diarahkan ke URL berformat:

```
{BASE_URL}/api/public/{API_KEY}/...
```

- **Base URL Produksi:** `https://api-public.mengantar.com`
- **Base URL Sandbox:** `https://sandbox.mengantar.com`
- **API Key:** Diambil dari *Pengaturan Akun (Account Settings) → Integrasi Public API* di dashboard Mengantar.
  API key disematkan langsung di **path URL**, bukan di header `Authorization`.
- ⚠️ **Kredensial Server-Only:** Karena API key berada di path URL, **jangan pernah mengekspos endpoint ini ke client-side / browser bundle**. Semua pemanggilan harus melalui backend server-side (Next.js Server Actions/Route Handlers, Astro endpoints, PHP backend, Node.js server, dll).

### Catatan Status Kurir (September 2026)
- **Ninja Discontinued:** Efektif mulai **1 September 2026**, kurir `Ninja` resmi dinonaktifkan di seluruh public API Mengantar (tidak dapat digunakan untuk cek ongkir maupun pembuatan order).
- **Kurir POS:** Resmi aktif dan didukung untuk pembuatan order (`pos`).
- **Kurir SPX (Shopee Express):** Muncul sebagai key `spx` di `GET /order/estimate?courier=all` (live, produksi, 2026-09-25), tetapi **belum ada di docs resmi**. Estimasi single-courier untuk SPX ditolak (`400 Invalid courier`); create-order dengan `courier: "spx"` **dikonfirmasi support Mengantar, belum teramati live** **[verifikasi]**. Detail: [02-couriers-and-rules.md](02-couriers-and-rules.md) §1.2.

### Header Standar
```http
Content-Type: application/json
Accept: application/json
```
- Integrator WooCommerce: Wajib menyertakan header `x-client-source: woocommerce` agar analitik pesanan tidak tercatat sebagai `directCall`.

### Amplop Response Standar
```json
{
  "success": true,
  "data": { ... },
  "message": "Opsional jika ada pesan"
}
```
Jika gagal (`success: false`):
```json
{
  "success": false,
  "message": "Deskripsi kesalahan",
  "errors": { ... },
  "errorsFront": "Pesan ramah pengguna"
}
```

---

## 2. Ringkasan Endpoint Resmi (Lengkap — 24 Endpoint + Webhook)

| # | Method | Path | Kategori | Keterangan |
|---|--------|------|----------|------------|
| 1 | GET | `/address/search?keyword=` | Alamat | Cari data wilayah → `origin_id` / `destination_id` |
| 2 | POST | `/address` | Alamat | Tambah / in-place update alamat pickup (mendukung koordinat `pinpointData`) |
| 3 | GET | `/address` | Alamat | List alamat pickup milik akun |
| 4 | DELETE | `/address` | Alamat | Hapus alamat pickup (body `{ "id": "..." }`) |
| 5 | PUT | `/address/{id}` | Alamat | Update field alamat pickup by ID |
| 6 | POST | `/time` | Jadwal Pickup | Tambah jadwal pickup (slot jam & tanggal `mm-dd-yyyy`) |
| 7 | GET | `/time?address=` | Jadwal Pickup | List slot jadwal pickup untuk alamat tertentu |
| 8 | GET | `/order/estimate` | Ongkir | Cek ongkir akun (single kurir atau `all`, mendukung DG & COD) |
| 9 | GET | `/api/order/allEstimatePublic` **(no-key)** | Ongkir | Cek ongkir semua kurir (flat diskon 20%, mendukung DG) |
| 10 | GET | `/api/order/allEstimate3PL` **(no-key)** | Ongkir | Cek ongkir 3PL (harga standar tanpa promo, mendukung DG) |
| 11 | POST | `/order/getPerformancePublic` | Ongkir | Ambil skor performa kurir di kota tujuan |
| 12 | GET | `/invoices` | Keuangan | Cek mutasi invoice, saldo dompet Mengantar, & filter keyword/tanggal |
| 13 | POST | `/dropshippers` | Dropshipper | Daftarkan master dropshipper baru (otomatis dedup by nama + no. HP) |
| 14 | GET | `/dropshippers` | Dropshipper | Cari master dropshipper tersimpan (prefix nama / no. HP) |
| 15 | POST | `/order` | Order | Buat order shipment (batch) → return nomor resi (`cnote_no`) & `ORDER_ID` |
| 16 | GET | `/my-users` | Tim | List assignee (pengguna/staf dalam tim akun) |
| 17 | POST | `/order/pay-unpaid` | Order | Bayar order berstatus unpaid dalam satu batch |
| 18 | GET | `/order` | Order | List order (filter & pagination) atau tracking by `order_id` / `tracking_id` |
| 19 | DELETE | `/order` | Order | Batalkan / hapus order (by `ids` / `orderIds`) |
| 20 | GET | `/batch` | Order | List batch pengiriman |
| 21 | DELETE | `/batch` | Order | Hapus batch pengiriman |
| 22 | GET | `/getReceiverScoreByNumberUser?search=` | Pencegahan RTS | Cek skor riwayat & reputasi penerima sebelum kirim COD |
| 23 | POST | `/label-generation` | Label PDF (BETA) | Request render label PDF asinkron (kuota 8 print/menit, whitelist) |
| 24 | GET | `/label-generation/{id}` | Label PDF (BETA) | Cek status & download URL PDF label (aktif 15 menit) |
| ⚡ | POST | *URL Webhook Integrator* | Webhook | Event notifikasi perubahan status order (HMAC-SHA256 signature) |

---

## 3. Modul Alamat Pickup & Wilayah

### 3.1 Cari data wilayah — `GET /address/search?keyword={q}`

Menghasilkan referensi ID wilayah untuk origin & destination. `{API_KEY}` tidak divalidasi ketat pada route ini.

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/address/search?keyword=papua'
```

**Query params:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| `keyword` | String | Provinsi, Kota, Kecamatan, Kelurahan, atau Kode Pos |

**Response (potongan):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "5fc63038f8f44b34aa4c1cc4",
      "COUNTRY_NAME": "Indonesia",
      "PROVINCE_NAME": "PAPUA",
      "CITY_NAME": "MERAUKE",
      "CITY_NAME_SI": "Kab. Merauke",
      "DISTRICT_NAME": "MUTING",
      "SUBDISTRICT_NAME": "SEED AGUNG (SEDAYU AGUNG PRASASTI)",
      "ZIP_CODE": "99652",
      "ORIGIN_CODE": "DJJ20400",
      "DESTINATION_CODE": "DJJ20411",
      "CODE_SAP": "PA1510"
    }
  ]
}
```

- Simpan `_id`: gunakan sebagai `origin_id`/`destination_id` di estimasi ongkir, serta `customerAddressDataId` saat membuat order.

### 3.2 Tambah / Update Alamat Pickup — `POST /address`

```bash
curl -X POST '{BASE_URL}/api/public/{API_KEY}/address' \
  -H 'Content-Type: application/json' \
  -d '{
    "PICKUP_AUTOFILL": "5fc63038f8f44b34aa4c1cc4",
    "PICKUP_ADDRESS": "Jl. Sederhana No. 142",
    "PICKUP_PIC_PHONE": "085270391495",
    "PICKUP_PIC": "PIC Name",
    "PICKUP_NAME": "Gudang Utama",
    "pinpointData": { "lat": -6.175392, "lng": 106.827153 }
  }'
```

**Body params:**
| Field | Tipe | Wajib | Keterangan |
|-------|------|:-----:|------------|
| `PICKUP_AUTOFILL` | String | Ya | `_id` wilayah dari `/address/search` |
| `PICKUP_ADDRESS` | String | Ya | Teks alamat lengkap pickup |
| `PICKUP_PIC_PHONE` | String | Ya | Nomor telepon penanggung jawab (PIC) |
| `PICKUP_PIC` | String | Ya | Nama penanggung jawab (PIC) |
| `PICKUP_NAME` | String | Ya | Nama toko / gudang asal |
| `pinpointData` | Object | Opsional | `{ lat: number, lng: number }`. Wajib untuk pengiriman kurir Instant / Same Day |
| `SHIPPER_ADDR1` | String | Opsional | Alamat retur (jika berbeda dari pickup) |
| `SHIPPER_AUTOFILL` | String | Opsional | `_id` wilayah retur dari `/address/search` |
| `SHIPPER_CONTACT` | String | Opsional | Nama kontak retur |
| `SHIPPER_PHONE` | String | Opsional | Nomor telepon kontak retur |
| `_id` | String | Opsional | Sertakan ID alamat lama bila ingin melakukan in-place update |

### 3.3 List Alamat Pickup — `GET /address`

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/address'
```

Mengembalikan array alamat pickup terdaftar.
- Ambil `_id` sebagai `address_id` untuk endpoint `/time` dan field `pickup.address_id` di `POST /order`.
- Ambil `PICKUP_AUTOFILL` sebagai `origin_id` saat cek ongkir.

### 3.4 Hapus Alamat Pickup — `DELETE /address`

```bash
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/address' \
  -H 'Content-Type: application/json' \
  -d '{ "id": "632d6c76361422945dbaafd8" }'
```

**Body params:**
| Field | Tipe | Wajib | Keterangan |
|-------|------|:-----:|------------|
| `id` | String | Ya | ObjectId alamat pickup yang akan dihapus |

### 3.5 Update Alamat Pickup — `PUT /address/{id}`

```bash
curl -X PUT '{BASE_URL}/api/public/{API_KEY}/address/632d6c76361422945dbaafd8' \
  -H 'Content-Type: application/json' \
  -d '{
    "PICKUP_NAME": "Gudang Cabang Baru",
    "PICKUP_PIC": "Ahmad",
    "PICKUP_PIC_PHONE": "081234567890",
    "PICKUP_ADDRESS": "Jl. Sudirman No. 100"
  }'
```

---

## 4. Jadwal Pickup

### 4.1 Tambah Jadwal Pickup — `POST /time`

```bash
curl -X POST '{BASE_URL}/api/public/{API_KEY}/time' \
  -H 'Content-Type: application/json' \
  -d '{"address_id":"62e27d67ecf5ae2893bc070a","date":"11-27-2026","time":"13:00"}'
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `address_id` | String | `_id` alamat pickup |
| `date` | String | **Format wajib `mm-dd-yyyy`** ⚠️ (contoh `11-27-2026` = 27 Nov 2026) |
| `time` | String | Salah satu slot: `9:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00` |

> ⚠️ **Aturan Batas Waktu:** Jadwal pickup harus ditentukan minimal **90 menit dari waktu saat ini**. Request yang lebih cepat akan ditolak oleh sistem Mengantar.

### 4.2 List Jadwal Pickup — `GET /time?address={address_id}`

```bash
curl -G '{BASE_URL}/api/public/{API_KEY}/time' \
  --data-urlencode 'address=62e27d67ecf5ae2893bc070a'
```

Ambil `_id` slot dari respon ini untuk dipasang di `pickup.time_id` saat membuat shipment.

---

## 5. Estimasi Ongkir & Dangerous Goods

### 5.1 Cek Ongkir Akun — `GET /order/estimate`

```bash
curl -G '{BASE_URL}/api/public/{API_KEY}/order/estimate' \
  --data-urlencode 'origin_id=5fc62f5df8f44b34aa4c0d8c' \
  --data-urlencode 'destination_id=5fc64714f8f44b34aa4cdd60' \
  --data-urlencode 'courier=all' \
  --data-urlencode 'weight=1' \
  --data-urlencode 'COD_AMOUNT=150000' \
  --data-urlencode 'isDangerousGoods=false'
```

**Query params:**
| Field | Tipe | Default | Keterangan |
|-------|------|:-------:|------------|
| `origin_id` | String | — | `_id` wilayah asal (dari `/address/search` atau `PICKUP_AUTOFILL`) |
| `destination_id` | String | — | `_id` wilayah tujuan (dari `/address/search`) |
| `courier` | String | `JNE` | `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, atau `all`. **Case-sensitive**, divalidasi terhadap nama shipment (`Sap` ✅, `SAP`/`sap` ❌ → `400 Invalid courier`). SPX **tidak** bisa diminta sendiri — ambil dari `all`. *(Ninja discontinued → `400 COURIER_DISABLED`)* |
| `weight` | Number | 1 | Berat total dalam satuan kg |
| `COD_AMOUNT` | Number | — | *(opsional)* Nilai COD = Nilai Barang + Ongkir. Wajib bila ingin kalkulasi COD |
| `isDangerousGoods`| Boolean | false | Set `true` atau `1` untuk tarif barang berbahaya (JT, SiCepat, iDexpress) |

> ⚠️ **Penting:**
> 1. Respon `courier=all` berbentuk **Map Objek** `Record<string, CourierRate>`, bukan array.
>    Key map memakai casing campuran yang **berbeda** dari nama shipment. Key yang teramati live (produksi, 2026-09-25):
>    `JNE`, `JNECargo`, `SiCepat`, `SiCepatCargo`, `SAP`, `SAPLite`, `SapCargo`, `iDexpress`, `JT`, `lion`,
>    `iDexpressCargo`, `anteraja`, `spx`, `pos` (tanpa Ninja). Pemetaan key → nama shipment: [02](02-couriers-and-rules.md) §1.1.
> 2. ETD: per 2026-07-19 entri estimasi akun teramati **tanpa** field ETD. Per 2026-09-25 entri `spx` **membawa**
>    `estimate_delivery` (mis. `"1 - 3 days"`) dan `estimatedDate` (mis. `"2-4 hari"`). Perlakukan ETD sebagai opsional per kurir.
> 3. Evaluasi flag ketersediaan:
>    - `unsupported: true` → Kurir tidak melayani rute ini.
>    - `unsupported_cod: true` → Kurir bisa kirim, tetapi **tidak menerima metode COD**.
>    - `unsupportedOriginSpx: true` (entri `spx`) → origin tidak dilayani SPX; **perlakukan seperti `unsupported: true`**.
>    - `unsupportedPickup` (entri `spx`) — arti belum dipastikan **[verifikasi]**; teramati `false`.
> 4. Pada DG request, `isDangerousGoodsSupported` = kapabilitas kurir, `unsupported` = cakupan tujuan — cek keduanya (docs resmi).

Contoh entri `spx` dari respon `courier=all&COD_AMOUNT=100000` (live, Jakarta → Jakarta Selatan, 1 kg; `pickupSchedule` dipotong):

```json
"spx": {
  "currency": "IDR", "unsupported": false, "unsupported_cod": false,
  "estimate_delivery": "1 - 3 days", "price": 13700,
  "pickupSchedule": { "2026-09-25": [ { "timeRangeId": 1, "start": "14:00", "end": "22:00", "timeEpoch": 1790326800 } ] },
  "discountPercent": 30, "discount": 4110, "codFee": 3329, "estimatedPrice": 17029, "estimatedSpecialPrice": 12234,
  "estimatedDate": "2-4 hari", "discountExtraPercent": 5, "discountExtra": 685,
  "unsupportedOriginSpx": false, "unsupportedPickup": false
}
```

### 5.2 Cek Ongkir Public (Diskon Flat 20%) — `GET /api/order/allEstimatePublic` (Tanpa Key)
```bash
curl -G '{BASE_URL}/api/order/allEstimatePublic' \
  --data-urlencode 'origin_id=5fc62f5df8f44b34aa4c0d8c' \
  --data-urlencode 'destination_id=5fc64714f8f44b34aa4cdd60' \
  --data-urlencode 'weight=1' \
  --data-urlencode 'isDangerousGoods=false'
```

> ⚠️ Teramati 2026-09-25: pemanggilan `…/order/allEstimatePublic` dengan parameter yang sama seperti §5.1 mengembalikan
> `404 {"success":false,"message":"Not Found"}` pada akun uji. Belum dipastikan apakah endpoint berubah secara global atau
> path yang dipanggil berbeda dari path resmi di atas (tanpa prefix key) **[verifikasi]**. Untuk integrasi berbasis akun,
> gunakan `/order/estimate?courier=all`.

### 5.3 Cek Ongkir 3PL (Tarif Mentah Tanpa Diskon) — `GET /api/order/allEstimate3PL` (Tanpa Key)
```bash
curl -G '{BASE_URL}/api/order/allEstimate3PL' \
  --data-urlencode 'origin_id=5fc62f5df8f44b34aa4c0d8c' \
  --data-urlencode 'destination_id=5fc64714f8f44b34aa4cdd60' \
  --data-urlencode 'weight=1'
```

### 5.4 Skor Performa Kurir — `POST /order/getPerformancePublic`
Mengembalikan rekomendasi kurir terbaik (`bestCourier` dan `recommended`) serta skor performa di kota tujuan.

---

## 6. Invoice & Saldo — `GET /invoices`

```bash
curl -G '{BASE_URL}/api/public/{API_KEY}/invoices' \
  --data-urlencode 'page=1' \
  --data-urlencode 'size=20' \
  --data-urlencode 'keyword=ORD-12345' \
  --data-urlencode 'invoiceFilter=all'
```

| Param | Tipe | Keterangan |
|-------|------|------------|
| `keyword` | String | Cari berdasarkan nomor invoice, `ORDER_ID`, atau resi (`cnote_no`) |
| `page` / `size` | Number | Pagination riwayat |
| `dateRange` | String | JSON ISO date: `{"startDate":"...","endDate":"..."}` |
| `invoiceFilter` | String | Filter transaksi: `typeWithdraw`, `typeAddSaldo`, `typePayment`, `all` |

Response mengembalikan array mutasi `data[]` beserta `balance` (saldo rupiah saat ini).

---

## 7. Modul Master Dropshipper

Fitur master dropshipper memungkinkan pengiriman paket atas nama entitas pihak ketiga / reseller.

### 7.1 Tambah Dropshipper — `POST /dropshippers`

```bash
curl -X POST '{BASE_URL}/api/public/{API_KEY}/dropshippers' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Toko Sejahtera Partner",
    "phone": "081234567890"
  }'
```

- Response: HTTP 201 `{ "success": true, "data": { "id": "66ab1234...", "name": "...", "phone": "..." } }`.
- **Idempoten:** Jika nama dan nomor HP persis sama sudah ada di akun Anda, API mengembalikan record lama tanpa membuat data ganda.

### 7.2 Cari Master Dropshipper — `GET /dropshippers`

```bash
curl -G '{BASE_URL}/api/public/{API_KEY}/dropshippers' \
  --data-urlencode 'search=Toko' \
  --data-urlencode 'page=1' \
  --data-urlencode 'perPage=20'
```

- `search`: Prefix pencarian nama atau nomor HP (case-insensitive). Encode `+` sebagai `%2B`.
- `perPage`: Maksimal 100 record per request.

---

## 8. Pembuatan Order (Shipment Creation) — `POST /order`

Endpoint utama untuk request resi dan jadwal penjemputan paket.

```bash
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order' \
  -H 'Content-Type: application/json' \
  -d '{
    "courier": "JNE",
    "pickup": {
      "type": "scheduledPickup",
      "volume": "volumeMotor",
      "address_id": "62e27d67ecf5ae2893bc070a",
      "time_id": "62e27d81ecf5ae2893bc070b"
    },
    "orders": [
      {
        "goodsValue": 150000,
        "customerAddressDataId": "5fc62dd8f8f44b34aa4bc9aa",
        "customerAddress": "Jl. Tebet Barat Raya No. 45, RT 01 / RW 02",
        "customerName": "Budi Santoso",
        "customerPhone": "081234567890",
        "parcelContent": "Kaos Katun Premium",
        "weight": 1,
        "quantity": 2,
        "isDangerousGoods": false,
        "cargo": false,
        "dropShipper": {
          "id": "66ab1234567890abcdef1234",
          "name": "Toko Sejahtera Partner",
          "phone": "081234567890"
        },
        "customProducts": [
          { "name": "Kaos Hitam", "variant": "L", "qty": 1, "price": 75000, "weight": 0.5 },
          { "name": "Kaos Putih", "variant": "XL", "qty": 1, "price": 75000, "weight": 0.5 }
        ]
      }
    ]
  }'
```

### 8.1 Aturan Payload & Parameter Kunci
1. **`courier`**:
   - Nilai valid (docs resmi): `"JNE"`, `"SiCepat"`, `"Sap"`, `"iDexpress"`, `"JT"`, `"lion"`, `"anteraja"`, `"pos"`.
   - `"spx"` (SPX / Shopee Express): **dikonfirmasi support Mengantar, belum ada di docs resmi, belum teramati di create-order live** **[verifikasi]**. Uji satu order dulu.
   - ⚠️ `Ninja` telah discontinued per 1 Sept 2026.
2. **`orders[].isDangerousGoods`**:
   - Boolean (`true`/`false`). Didukung kurir: `JT`, `SiCepat` (otomatis masuk layanan `HALU`), dan `iDexpress` (layanan `Regular`).
3. **`orders[].cargo`**:
   - Boolean (`true`/`false`). Kurir yang mendukung opsi kargo: `JNE`, `SiCepat`, `Sap`, `iDexpress`.
4. **`orders[].dropShipper`**:
   - Objek `{ id, name, phone }`. Wajib terdaftar di master dropshippers akun terlebih dahulu. Validasi dilakukan menyeluruh terhadap 1 batch; jika 1 invalid, seluruh batch ditolak.
5. **`orders[].COD` vs `orders[].goodsValue`**:
   - Non-COD: Kirim `goodsValue` (nominal rupiah barang).
   - COD: Kirim `COD` (Nilai Barang + Ongkir + Biaya COD).
6. **Invariant Ketat `customProducts`**:
   - Jika `customProducts` disertakan:
     - `orders.weight` **harus persis sama** dengan $\sum (\text{qty} \times \text{weight})$.
     - `orders.quantity` **harus persis sama** dengan $\sum (\text{qty})$.
   - Kurir yang mendukung rincian produk: `JNE`, `SiCepat`, `Sap`, `JNT`.

### 8.2 Konkurensi Batch (JT Premium & SiCepat)
Untuk kurir dengan generate resi terpusat di server (**JT Premium & SiCepat**):
- **Jangan pernah mengirim `POST /order` secara paralel** dari akun yang sama.
- Kirim order dalam 1 batch array. Bila terdeteksi ada proses yang sedang berjalan, API akan membalas dengan **HTTP `409 Conflict`**.

### 8.3 Order Unpaid (Saldo Kurang)
Jika saldo akun tidak mencukupi untuk order Non-COD, API **tidak melempar error**, melainkan membuat order dengan status `isPaid: false` dan `cnote_no: null`.
- Solusi: Top-up saldo, lalu jalankan `POST /order/pay-unpaid` memakai `batch_id` yang diterima. Resi akan langsung diterbitkan tanpa harus input ulang data pelanggan.

---

## 9. Tracking & Manajemen Order

- **Bayar Unpaid:** `POST /order/pay-unpaid` (body: `{ "batch_id": "...", "courier": "JNE" }`).
- **Lacak Order:** `GET /order?tracking_id={cnote_no}` atau `GET /order?order_id={ORDER_ID}`.
  - Format timestamp riwayat: `history[].date` terstandarisasi dalam format `DD-MM-YYYY HH:mm` (WIB).
- **Hapus / Batal Order:** `DELETE /order` (body: `{ "courier": "...", "ids": ["..."] }`). Khusus kurir Anteraja, pembatalan hanya dapat dilakukan setelah 5 menit sejak order dibuat.
- **Hapus Batch:** `DELETE /batch` (body: `{ "courier": "...", "id": "..." }`).
- **Skor Penerima:** `GET /getReceiverScoreByNumberUser?search={phone}`. Memeriksa rasio sukses deliveri vs RTS nomor HP pelanggan sebelum Anda memproses order COD berisiko tinggi.

---

## 10. Cetak Label PDF Asynchronous (BETA)

Endpoint pencetakan label modern yang memproses kompilasi PDF di latar belakang via worker queue.

> 🔒 **Akses Terbatas (Whitelist):** Fitur ini hanya dapat dipanggil oleh API Key akun yang telah di-whitelist oleh tim Mengantar (mendapat izin `labelGeneration`). Akun tanpa izin akan menerima HTTP 403.
> ⏱️ **Rate Limit:** Maksimal **8 action print per 60 detik** per akun induk.

### 10.1 Request Pembuatan Label — `POST /label-generation`
```bash
curl -X POST '{BASE_URL}/api/public/{API_KEY}/label-generation' \
  -H 'Content-Type: application/json' \
  -d '{
    "orderId": "ORDER-JNE-001",
    "courier": "JNE",
    "format": "thermal-10x15"
  }'
```
- Hanya menerima **satu `orderId` per request** (tidak menerima multi-order).
- Return HTTP 202 Accepted: `{ "success": true, "data": { "labelGenerationId": "66d84347...", "status": "PENDING" } }`.

**Daftar Format Label:**
| Format | Kurir yang Didukung |
|--------|---------------------|
| `normal-1`, `normal-2`, `normal-4`, `normal-6` | Semua kurir |
| `thermal-10x10`, `thermal-10x15`, `thermal-8x6` | Semua kurir |
| `thermal-new-10x10`, `thermal-new-10x15` | **Khusus order J&T (JT)** |

### 10.2 Polling Status Label — `GET /label-generation/{labelGenerationId}`
```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/label-generation/66d84347d792a71058fd6c10'
```
- Endpoint ini read-only dan **tidak memakan kuota 8 print/menit**.
- Lakukan polling berkala (mis. tiap 2-3 detik):
  - `PENDING` / `PROCESSING`: Tunggu dan polling kembali.
  - `COMPLETED`: Terdapat `downloadUrl` (signed GCS URL yang aktif selama 15 menit). Unduh file PDF segera.
  - `FAILED`: Gagal merender, baca keterangan di field `errorMessage`.

---

## 11. Arsitektur Webhook Resmi Mengantar (Production)

Mengantar kini menyediakan webhook berbasis push untuk memperbarui status pesanan secara real-time tanpa perlu polling `GET /order`.

### 11.1 Pendaftaran URL Webhook
Konfigurasikan Webhook URL Anda di:
**Dashboard Mengantar → Settings (Pengaturan) → Account (Akun) → Integrasi Public API**.
- Membutuhkan verifikasi OTP saat pertama kali menyimpan.
- Otomatis men-generate **`Webhook Secret`** rahasia Anda.
- URL wajib HTTPS dan dapat diakses publik.

### 11.2 Payload yang Dikirimkan Mengantar
Mengantar mengirim `POST` dengan body JSON setiap kali status order berubah:
```http
POST https://domain-anda.com/api/webhook/mengantar
Content-Type: application/json
x-timestamp: 1787548800000
x-signature: 05826dec707ea7164801d952cb7eaf7ce9adc0c8aa0b93366480434164a1a111

{
  "cnote_no": "JNE1234567890",
  "order_id": "ORD-000123",
  "courier": "JNE",
  "status_category": "DELIVERED"
}
```

### 11.3 Status Category Resmi
- **Kurir:** `PENDING PICKUP`, `PICKED UP`, `ON DELIVERY`, `DELIVERED`, `UNDELIVERED`, `PICKUP FAILED`, `RTS`.
- **Internal Mengantar:** `ACTIVE/WAITING NEXT PROCESS`, `ERROR`.
- ⚠️ **Penanganan Pembatalan:** Tangani kedua ejaan pembatalan: `CANCELED` dan `CANCELLED`.

### 11.4 Rumus Verifikasi Signature (HMAC-SHA256)
Signature adalah hash HMAC-SHA256 (format hex) dari:
```
string_to_sign = x-timestamp + "." + raw_request_body
```
Menggunakan `Webhook Secret` Anda sebagai HMAC key.

#### Official Test Vector
- `Webhook Secret`: `testsecret`
- `x-timestamp`: `1787548800000`
- `raw_body`: `{"cnote_no":"JNE1234567890","order_id":"ORD-000123","courier":"JNE","status_category":"DELIVERED"}`
- String to sign: `1787548800000.{"cnote_no":"JNE1234567890","order_id":"ORD-000123","courier":"JNE","status_category":"DELIVERED"}`
- `Expected x-signature`: `05826dec707ea7164801d952cb7eaf7ce9adc0c8aa0b93366480434164a1a111`

### 11.5 Aturan SLA & Retry
1. **Timeout 5 Detik:** Server Anda harus merespons status `200 OK` sesegera mungkin (< 5 detik) sebelum melakukan proses database yang berat.
2. **Retry Otomatis:** Jika gagal (non-2xx/timeout), Mengantar me-retry hingga 3 kali (jeda ~1s, ~5s, dan ~15s).
3. **Auto-Pause:** Jika endpoint Anda gagal 20 kali berturut-turut dalam 24 jam, webhook akan di-*pause* otomatis. Anda dapat mengaktifkannya kembali dengan menekan tombol **"Aktifkan kembali"** di dashboard seller.
4. Gunakan `x-timestamp` untuk mencegah race condition dari event yang datang tidak berurutan karena retry.

---

## 12. Kode Error Resmi

| Kode | Arti | Tindakan |
|------|------|----------|
| `X000` | Parameter wajib tidak lengkap | Cek payload request, jangan kirim request ulang tanpa perbaikan |
| `X001` | `secret_key` tidak valid / expired | Perbarui API Key di pengaturan akun |
| `X002` | `secret_key` tidak valid untuk domain ini | Gunakan key tipe Universal / Developer atau daftarkan domain |
| `X003` | User token tidak valid / kadaluarsa | Refresh token user |
| `409 Conflict` | Konkurensi batch JT Premium / SiCepat | Antrekan request, gabungkan order ke 1 batch array |
| `400` `COURIER_DISABLED` | Kurir dinonaktifkan (mis. `courier=Ninja`) | Hapus kurir dari opsi |
| `400` `Invalid courier` | Nilai `courier` di estimasi tidak dikenali (case-sensitive; termasuk semua ejaan SPX) — teramati live 2026-09-25 | Pakai nama shipment persis; SPX ambil dari `courier=all` |
| `429 Too Many Requests` | Limit cetak label terlampaui | Batasi maksimal 8 aksi print per 60 detik |

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
