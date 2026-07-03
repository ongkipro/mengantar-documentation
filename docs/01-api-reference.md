# Mengantar Public API — Referensi Endpoint

**Sumber utama:** dokumentasi resmi Mengantar — `https://app.mengantar.com/docs/` (di-mirror & dirapikan di sini).
**Sumber pelengkap:** pembedahan plugin WooCommerce *Woo Mengantar* v1.0.32 (untuk pola caching, validasi
pra-kirim, dan perilaku operasional yang tidak dijelaskan di docs resmi — ditandai **[plugin]**).

> Bagian endpoint, parameter, dan bentuk response di bawah **sudah dicocokkan dengan docs resmi**.
> Catatan yang masih perlu diuji dengan akun asli ditandai **[verifikasi]**.

---

## 1. Base URL & Autentikasi

Endpoint utama memakai pola **API key di dalam path**:

```
{BASE_URL}/api/public/{API_KEY}/{endpoint}
```

| Mode | Base URL | Sumber |
|------|----------|--------|
| Produksi | `https://api-public.mengantar.com` | **[plugin]** |
| Sandbox  | `https://sandbox.mengantar.com` | **[plugin]** |

> Docs resmi memakai placeholder `{BASE_URL}` tanpa menyebut host konkret; host di atas berasal
> dari plugin. **Konfirmasi base URL final** dengan tim Mengantar saat menerima API key ([verifikasi]).

**Penting:** karena key ada di URL, **JANGAN** panggil API ini dari kode browser/klien.
Selalu proxy lewat server (Astro endpoint / Next.js route handler) supaya key tidak bocor.

### Endpoint TANPA prefix `/api/public/{key}`

Tiga endpoint estimasi bersifat publik dan **tidak** memakai `/api/public/{key}`:

```
{BASE_URL}/api/order/allEstimatePublic     (GET)
{BASE_URL}/api/order/allEstimate3PL        (GET)
```

Dan untuk `GET /address/search`, docs resmi menyatakan: **`{API_KEY}` boleh diisi string apa pun**
karena tidak divalidasi pada route ini (bagian dari legacy system) — tapi struktur path tetap dipertahankan.

### Header

- `GET` & `POST` form: tanpa header khusus (form `application/x-www-form-urlencoded` atau `multipart` via `-F`).
- `POST` JSON (`getPerformancePublic`): `Content-Type: application/json`, `Accept: application/json`.
- `POST /order` di docs resmi memakai form (`-F`); plugin mengirim JSON. Keduanya diterima ([verifikasi]).

### Amplop response

Semua response membungkus hasil dalam amplop dengan `success`:

```json
{ "success": true,  "data": { } }
{ "success": false, "message": "…", "errors": { }, "errorsFront": "…", "courier": "JNE" }
```

`errorsFront` = pesan ramah-user (**[plugin]** mengekstrak ini). GET sukses aman di-cache 5 menit **[plugin]**.

---

## 2. Ringkasan Endpoint (lengkap — 18)

Relatif terhadap `{BASE_URL}/api/public/{API_KEY}` kecuali ditandai **(no-key)** atau **[plugin]**.

| # | Method | Endpoint | Fungsi |
|---|--------|----------|--------|
| 1 | GET | `/address/search?keyword=` | Cari data wilayah → `origin_id` / `destination_id` |
| 2 | POST | `/address` | Tambah / update alamat pickup |
| 3 | GET | `/address` | List alamat pickup milik akun |
| 4 | POST | `/time` | Tambah jadwal pickup |
| 5 | GET | `/time?address=` | List jadwal pickup satu alamat |
| 6 | GET | `/order/estimate` | Cek ongkir (single kurir / `all`) |
| 7 | GET | `/api/order/allEstimatePublic` **(no-key)** | Cek ongkir semua kurir (flat diskon 20%) |
| 8 | GET | `/api/order/allEstimate3PL` **(no-key)** | Cek ongkir 3PL (harga standar, tanpa promo) |
| 9 | POST | `/order/getPerformancePublic` | Skor performa kurir |
| 10 | GET | `/invoices` | Invoice + saldo akun |
| 11 | POST | `/order` | Buat shipment (batch) → `cnote_no` + `ORDER_ID` |
| 12 | GET | `/my-users` | List assignee (user tim) |
| 13 | POST | `/order/pay-unpaid` | Bayar order unpaid dalam satu batch |
| 14 | GET | `/order` | List order (filter/pagination) atau lacak by `order_id`/`tracking_id` |
| 15 | DELETE | `/order` | Hapus order (by `ids` / `orderIds`) |
| 16 | GET | `/batch` | List batch |
| 17 | DELETE | `/batch` | Hapus batch |
| 18 | GET | `/getReceiverScoreByNumberUser?search=` | Skor penerima per kurir (by no. HP) |
| — | GET | `/` **[plugin]** | Ping ringan (tak didokumentasikan resmi) |

---

## 3. Alamat

### 3.1 Cari data wilayah — `GET /address/search?keyword={q}`

Menghasilkan kode origin & destination. `{API_KEY}` tidak divalidasi di route ini (legacy).

**Query:**

| Field | Tipe | Keterangan |
|-------|------|------------|
| `keyword` | String | Province / City / District / Subdistrict / Zip |

**Response (dipangkas):**
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

- `_id` → dipakai sebagai `origin_id`, `destination_id`, dan `customerAddressDataId`.
- Field `*_SI` / `CODE_SAP` adalah kode internal per kurir (SiCepat / SAP).

### 3.2 Tambah / update alamat pickup — `POST /address`

Ambil dulu data wilayah dari `GET /address/search`, lalu kirim `_id`-nya sebagai `PICKUP_AUTOFILL`.
Sertakan `_id` (alamat) untuk **update** alamat yang sudah ada.

```bash
curl -X POST {BASE_URL}/api/public/{API_KEY}/address \
  -F 'PICKUP_AUTOFILL=5fc63038f8f44b34aa4c1cc4' \
  -F 'PICKUP_ADDRESS=Jl. Sederhana No. 142' \
  -F 'PICKUP_PIC_PHONE=085270391495' \
  -F 'PICKUP_PIC=PIC Name' \
  -F 'PICKUP_NAME=Seller or Store Name'
```

**Body params:**

| Field | Tipe | Keterangan |
|-------|------|------------|
| `PICKUP_AUTOFILL` | String | `_id` data wilayah dari `/address/search` |
| `PICKUP_ADDRESS` | String | Teks alamat |
| `PICKUP_PIC_PHONE` | String | No. HP PIC |
| `PICKUP_PIC` | String | Nama PIC |
| `PICKUP_NAME` | String | Nama seller/toko |
| `SHIPPER_ADDR1` | String | *(opsional)* jika alamat retur berbeda |
| `SHIPPER_AUTOFILL` | String | *(opsional)* `_id` data wilayah retur |
| `SHIPPER_CONTACT` | String | *(opsional)* nama seller/toko retur |
| `SHIPPER_PHONE` | String | *(opsional)* no. HP retur |
| `_id` | String | *(opsional)* ID alamat — kirim untuk **update** |

Response mengembalikan objek alamat lengkap (`PICKUP_DESTINATION_CODE`, `PICKUP_ORIGIN_CODE`, dst).

### 3.3 List alamat pickup — `GET /address`

Response: `{ success, data: [ {…alamat pickup…} ] }`. Ambil `_id` sebagai **`origin_id`**.

---

## 4. Jadwal Pickup

### 4.1 Tambah jadwal — `POST /time`

Dipakai saat `pickup.type = scheduledPickup` di create order.

```bash
curl -X POST {BASE_URL}/api/public/{API_KEY}/time \
  -F 'address_id=62e27d67ecf5ae2893bc070a' \
  -F 'date=11-27-2022' \
  -F 'time=13:00'
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `address_id` | String | `_id` alamat pickup (origin) |
| `date` | String | **Format `mm-dd-yyyy`** ⚠️ (bulan-tanggal-tahun, bukan ISO) |
| `time` | String | Salah satu: `9:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00` |

> ⚠️ **Perhatikan format tanggal `mm-dd-yyyy`** (contoh resmi `11-27-2022` = 27 Nov 2022), **bukan** `YYYY-MM-DD`.

### 4.2 List jadwal — `GET /time?address={address_id}`

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/time' -d 'address=62e27d67ecf5ae2893bc070a'
```

Response: `{ success, data: [ { "_id": "…", "date": "2023-02-24T12:00:00.000Z", "time": "12:00" } ] }`.
`_id` slot inilah yang dipakai sebagai `pickup.time_id` di create order.

> **[plugin]** Plugin juga memakai `DELETE /time/{time_id}` untuk menghapus slot. Endpoint ini
> **tidak ada di docs resmi** — verifikasi sebelum diandalkan ([verifikasi]).

---

## 5. Estimasi Ongkir

### 5.1 Cek ongkir — `GET /order/estimate`

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order/estimate' \
  -d 'origin_id=5fc62f5df8f44b34aa4c0d8c' \
  -d 'destination_id=5fc64714f8f44b34aa4cdd60' \
  -d 'courier=Sap' -d 'weight=1' -d 'COD_AMOUNT=123'
```

**Query params:**

| Field | Tipe | Keterangan |
|-------|------|------------|
| `origin_id` | String | **`_id` WILAYAH** (kecamatan) dari `/address/search`, **atau** `PICKUP_AUTOFILL` dari alamat pickup |
| `destination_id` | String | **`_id` WILAYAH** dari `/address/search` |
| `courier` | String | `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `Ninja`, `lion`, `anteraja`, atau `all`. **Default `JNE`.** `all` → array/map per kurir |
| `weight` | Number | Default `1`, satuan **kg** |
| `COD_AMOUNT` | Number | *(opsional)* COD = Nilai Barang + Ongkir. Dipakai menghitung `codFee` |

> ⚠️ **`origin_id`/`destination_id` di estimate = `_id` WILAYAH** (kecamatan, dari `/address/search`) —
> **bukan** `_id` objek alamat pickup dari `GET /address`. Untuk asal, ambil `PICKUP_AUTOFILL` dari alamat
> pickup-mu (itu memang `_id` wilayah). Sebaliknya, `pickup.address_id` di create order (§7.2) & `/time?address=`
> memakai **`_id` objek alamat pickup**. *(Live-verified 2026-07-03: pakai pickup `_id` di estimate → `success:false`.)*

**Response (single kurir):**
```json
{
  "success": true,
  "data": {
    "price": 23000,
    "coverage_cod": false,
    "currency": "IDR",
    "discountPercent": 20,
    "discount": 4600,
    "codFee": 4,
    "estimatedPrice": 23004,
    "estimatedSpecialPrice": 18404,
    "unsupported_cod": false,
    "unsupported": false
  }
}
```

- `estimatedPrice` = harga akhir; `estimatedSpecialPrice` = harga setelah diskon.
- **Diskon berbasis volume pengiriman akun** (lihat *Diskon Ongkos Kirim*) — berbeda dari
  `/allEstimatePublic` yang selalu diskon flat 20%.

**Matriks `unsupported` × `unsupported_cod`:**

| `unsupported` | `unsupported_cod` | Arti |
|:---:|:---:|------|
| true | (apa pun) | Tidak bisa kirim ke tujuan (COD & non-COD) |
| false | true | Bisa **non-COD**, tidak bisa COD |
| false | false | Bisa COD **maupun** non-COD |

### 5.2 Cek ongkir semua kurir (public) — `GET /api/order/allEstimatePublic` (no-key)

```bash
curl -X GET '{BASE_URL}/api/order/allEstimatePublic' \
  -d 'origin_id=…' -d 'destination_id=…' -d 'weight=1' -d 'COD_AMOUNT=123'
```

Params: `origin_id`, `destination_id`, `weight`, `COD_AMOUNT`. **Diskon selalu 20% untuk semua user**
(flat pricing dengan markup & struktur diskon standar Mengantar).

**Response** = map `courierKey → rate` dengan field kaya:
```json
{
  "success": true,
  "data": {
    "JT": {
      "unsupported": false, "unsupported_cod": false,
      "price": 21000, "estimate_delivery": "-", "estimatedDate": "2-4 hari",
      "discountPercent": 20, "discount": 4200, "codFee": 4,
      "estimatedPrice": 21004, "estimatedSpecialPrice": 16804,
      "cargoPrice": 0, "cargoEstimatedPrice": 0, "cargoDiscountPercent": 0,
      "discountExtraPercent": 0, "discountExtra": 0
    }
  }
}
```

Varian cargo/lite muncul sebagai key terpisah (`JNECargo`, `SiCepatCargo`, `SapCargo`, `SAPLite`,
`iDexpressCargo`, `iDlite`, `SapCargo`, `pos`, `paxel`, dst — lihat [02](02-couriers-and-rules.md)).

### 5.3 Cek ongkir 3PL — `GET /api/order/allEstimate3PL` (no-key)

```bash
curl -X GET '{BASE_URL}/api/order/allEstimate3PL' \
  -d 'origin_id=…' -d 'destination_id=…' -d 'weight=1'
```

**3PL (Third Party Logistics):** harga standar Mengantar **tanpa promo/diskon** — ideal untuk
mitra logistik & integrator yang butuh rate mentah. **Tidak ada flat pricing.**

```json
{
  "success": true,
  "data": {
    "JNE": { "unsupported": null, "unsupported_cod": null, "price": 14000, "estimatedDate": "1 - 2 days" },
    "JNECargo": { "price": 45000, "estimatedDate": "3 - 4 days", "minimumWeightCargo": 5 }
  }
}
```

`minimumWeightCargo` hanya muncul untuk kurir yang mendukung cargo (nilai informasi berat minimum cargo).

### 5.4 Skor performa kurir — `POST /order/getPerformancePublic`

Biasanya ditampilkan bersama estimasi ongkir. Kirim `city` + hasil `data` dari `/order/estimate?courier=all`
(atau `/allEstimatePublic`) sebagai `allEstimateData`.

```bash
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order/getPerformancePublic' \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"city":"JEMBER","allEstimateData":{ …hasil allEstimate… }}'
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `city` | String | `CITY_NAME` dari `/address/search` |
| `allEstimateData` | Object | `data` dari `/order/estimate?courier=all` atau `/allEstimatePublic` |

**Response:**
```json
{
  "success": true,
  "data": {
    "couriers": [ {"key":"JNE","score":95}, {"key":"SiCepat","score":100} ],
    "bestCourier": "SiCepat",
    "recommended": "JNE"
  }
}
```

---

## 6. Invoice & Saldo — `GET /invoices`

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/invoices'
```

Response: `{ success, data: [ {…invoice…} ], count: 19, balance: 9635676 }`.
Tiap invoice punya `inv_number`, `type` (mis. `typeWithdraw`), `amount`, `total`, `status`
(mis. `statusCleared`), `balance`, `paydAt`, dll. `balance` = saldo akun (rupiah).

---

## 7. Buat Shipment — `POST /order`

Docs resmi memakai form (`-F`), dengan `pickup` dan `orders` sebagai JSON-string di dalam field form.

```bash
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order' \
  -F 'courier=Sap' \
  -F 'pickup={ "type":"scheduledPickup", "volume":"volumeMotor", "address_id":"62e27d67ecf5ae2893bc070a", "time_id":"62e27d81ecf5ae2893bc070b" }' \
  -F 'orders=[{
        "assignee":"5fc62dd8f8f44b34aa4bc9aa",
        "COD":"12444",
        "customerAddressDataId":"5fc62dd8f8f44b34aa4bc9aa",
        "customerAddress":"address", "customerName":"name", "customerPhone":"123456",
        "parcelContent":"Kaos", "weight":1, "quantity":1,
        "customProducts":[{ "name":"Baju Biru","variant":"XL / Biru","qty":2,"price":120000 }]
      }]'
```

> Jika **saldo tidak cukup**, order tetap dibuat sebagai **unpaid** (`cnote_no` kosong, `unpaid=true`),
> lalu bisa dibayar lewat `POST /order/pay-unpaid`.

### 7.1 Field `courier`

Nilai: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `Ninja`, `lion`, `anteraja` (perhatikan kapitalisasi).

### 7.2 Field `pickup`

| Field | Tipe | Keterangan |
|-------|------|------------|
| `type` | String | `scheduledPickup` (dijemput) atau `dropOff` (antar sendiri) |
| `address_id` | String | `_id` alamat pickup (origin) |
| `time_id` | String | Wajib bila `type=scheduledPickup` (dari `/time`) |
| `volume` | String | `volumeTruck`, `volumeMobil`, `volumeMotor` (wajib bila `scheduledPickup`) |

### 7.3 Item `orders[]`

| Field | Tipe | Keterangan |
|-------|------|------------|
| `goodsValue` | Number | Nilai barang **NON-COD** |
| `COD` | Number | Nilai COD = Nilai Barang + Ongkir + COD Fee (**wajib bila `goodsValue` kosong**) |
| `customerAddressDataId` | String | `_id` dari `/address/search` |
| `customerAddress` | String | Alamat penerima |
| `customerName` | String | Nama penerima |
| `customerPhone` | String | No. HP penerima |
| `parcelContent` | String | Isi paket / nama produk |
| `weight` | Number | Berat total (kg). Bila `customProducts` valid, **harus = Σ(qty × weight)** |
| `quantity` | Number | Kuantitas. Bila `customProducts` valid, **harus = Σ(qty)** |
| `destinationMark` | String | *(opsional)* |
| `deliveryInstruction` | String | *(opsional)* |
| `dontIncludeSubdistrict` | Boolean | *(opsional)* |
| `cargo` | Boolean | *(opsional)* `true` → mode Cargo (JNE, SiCepat, Sap, iDexpress) |
| `customProducts` | Array | *(opsional)* rincian produk manual — lihat 7.4 |

### 7.4 `customProducts[]` (opsional)

Disimpan seperti "Tambah Manual" di aplikasi. **Saat ini hanya didukung untuk `JNE`, `SiCepat`, `Sap`, `JNT`.**

| Field | Tipe | Keterangan |
|-------|------|------------|
| `name` | String | Nama produk (wajib bila `customProducts` diisi) |
| `variant` | String/Object | *(opsional)* teks varian di tabel produk label |
| `qty` | Number | Kuantitas (alias diterima: `quantity`, `orderQuantity`) |
| `price` | Number | *(opsional)* harga (alias: `harga`, `regularPrice`) |
| `weight` | Number | *(opsional)* berat kg per produk (default 1) |

### 7.5 Response sukses

`data` adalah **array** (satu entri per order). Field kunci per entri:

| Field | Arti |
|-------|------|
| `ORDER_ID` | ID order Mengantar |
| `cnote_no` | **Nomor resi / tracking number** |
| `status` / `statusCategory` | Status shipment |
| `isPaid` | `true`/`false` |
| `batch` / `batch_id` | Batch pengelompokan (juga di tingkat atas) |

Tingkat atas: `success`, `batch`, `batch_id`, `errors: []`.

### 7.6 ⚠️ Konkurensi batch — JT Premium, Ninja, SiCepat

Untuk kurir yang resinya (`cnote_no`) di-generate di sisi Mengantar — **JT Premium, Ninja, SiCepat** —
nomor diberi berurutan per akun. **Hanya satu batch boleh diproses dalam satu waktu per akun.**

- **Jangan** kirim beberapa request batch bersamaan (paralel).
- Gabungkan semua order ke **satu batch / satu request**.
- Jika terdeteksi request konkuren (JT Premium), API membalas **HTTP `409 Conflict`**:

```json
{ "success": false, "message": "Sedang ada proses pembuatan order JT Premium yang berjalan. Mohon gabungkan semua order dalam 1 batch yang sama…" }
```

---

## 8. Assignee — `GET /my-users`

List user tim yang bisa dipasang sebagai `orders.assignee`.

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/my-users'
```

Response: `{ success, data: [ { "_id":"…", "name":"abbi", "email":"…" } ] }`. Pakai `_id` sebagai `assignee`.

---

## 9. Order & Batch

### 9.1 Bayar unpaid — `POST /order/pay-unpaid`

```bash
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order/pay-unpaid' \
  -F 'courier=Sap' -F 'batch_id=6332f5b98c3ea4bc8e15f72d'
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `batch_id` | String | Batch `_id` |
| `courier` | String | Kurir batch |

Response: `{ success: true, count: 1 }` (jumlah order yang berhasil dibayar).

### 9.2 List order — `GET /order`

Lacak satu order (via `tracking_id` / `order_id`) **atau** list dengan filter & pagination.

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order' \
  -d 'page=1' -d 'size=50' \
  -d 'dateRange={"startDate":"2021-09-23T00:00:00.000Z","endDate":"2022-09-23T23:59:59.999Z"}' \
  -d 'courier=Sap' -d 'cod=NON_COD' -d 'category=collected_customer' -d 'status={"DELIVERED":true}'
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `page` / `size` | String | Pagination |
| `courier` | String | `JNE`/`SiCepat`/`Sap`/`iDexpress`/`JT`/`Ninja`/`lion`/`anteraja` |
| `tracking_id` | String | Ambil satu order + riwayat status (by resi) |
| `order_id` | String | Ambil satu order + riwayat status (by ORDER_ID) |
| `dateRange.startDate` / `.endDate` | Date | ISO 8601 |
| `batch` | String | Batch `_id` |
| `cod` | String | `COD` atau `NON_COD` |
| `status` | String | Status dipisah koma (atau objek `{"DELIVERED":true}`) |
| `category` | String | `collected_customer`, `yet_to_collect`, `need_attention`, `rts`, `pending_pickup`, `redelivery`, `undelivered`, `delivery_problem`, `over_sla`, `already_been_undelivered`, `been_undelivered_wo_ticket`, `been_undelivered_wo_proof` |
| `ticketFilter` | String | `withticket`, `without`, `open`, `replied` |
| `receiverFilter` | String | `1`–`10` |
| `no_update_after_hour` | String | mis. `48` |
| `no_update_after_day` | String | `4,6,8,10,12,14,21` |
| `reseller` | Boolean | Tampilkan order reseller |

**Status shipment:** untuk penyederhanaan, cukup bedakan `DELIVERED`, `RTS`, dan selain itu `ON GOING`.

### 9.3 Hapus order — `DELETE /order`

```bash
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/order' \
  -F 'courier=Sap' -F 'ids=["6332f9dfdeff6b0cae5e6c11","6332f9dfdeff6b0cae5e6c12"]'
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `ids` | Array | Array `_id` order |
| `orderIds` | Array | *(opsional)* array `ORDER_ID` — **jangan** kirim bersama `ids` (akan menimpa) |

> Untuk **anteraja**, order baru bisa dihapus **5 menit** setelah dibuat.

### 9.4 List batch — `GET /batch`

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/batch' \
  -d 'page=1' -d 'size=50' -d 'courier=Sap'
```

Params: `page`, `size`, `dateRange`, `courier`. Response `data[]` berisi ringkasan batch
(`orders`, `error`, `unpaid`, `delivered`, `undelivered`, `rts`, `active`, `totalToPay`, `address`, dll).

### 9.5 Hapus batch — `DELETE /batch`

```bash
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/batch' \
  -F 'courier=Sap' -F 'id=6332f9dfdeff6b0cae5e6c11'
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `id` | String | Batch `_id` |
| `courier` | String | Kurir batch |

---

## 10. Skor Penerima — `GET /getReceiverScoreByNumberUser?search={phone}`

Skor riwayat penerima per kurir (deteksi risiko RTS sebelum kirim COD).

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/getReceiverScoreByNumberUser?search=8123456789'
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `search` | String | No. HP penerima |

**Response** — per kurir: `total`, `value`, `inProgress`, `delivered`, `rts`, `undelivered`, `rate` (0–10):
```json
{
  "success": true,
  "data": {
    "phone": "8123456789",
    "JNE": { "total": 36, "delivered": 35, "rts": 1, "undelivered": 0, "rate": 9.7 },
    "Ninja": { "total": 4, "delivered": 4, "rts": 0, "rate": 10 }
  }
}
```

---

## 11. Kode Error

API resmi memakai kode error berikut (lihat [08-error-catalog.md](08-error-catalog.md) untuk penanganan):

| Kode | Arti |
|------|------|
| `X000` | Ada parameter wajib yang tidak dikirim |
| `X001` | `secret_key` tidak dikenal / tidak valid / kadaluarsa |
| `X002` | `secret_key` tidak valid untuk domain ini (key Developer/Universal bebas domain) |
| `X003` | User `token` tidak dikenal / tidak valid / kadaluarsa |

Plus **`409 Conflict`** untuk konkurensi batch JT Premium/Ninja/SiCepat (§7.6).

---

## 12. Pemetaan method client (referensi port) — [plugin]

Untuk memudahkan port dari plugin WooCommerce ke stack lain:

| Method PHP | HTTP | Endpoint |
|------------|------|----------|
| `search_address($keyword)` | GET | `/address/search?keyword=` |
| `get_user_addresses()` | GET | `/address` |
| `create_user_address()` / `update_user_address()` | POST | `/address` (dengan `_id` untuk update) |
| `check_shipping_fee(_,'normal')` | GET | `/order/estimate` |
| `check_shipping_fee(_,'public')` | GET | `/api/order/allEstimatePublic` |
| `check_shipping_fee(_,'3pl')` | GET | `/api/order/allEstimate3PL` |
| `create_order()` | POST | `/order` |
| `get_order_by_tracking_id()` / `get_order_by_order_id()` | GET | `/order?tracking_id=` / `?order_id=` |
| `get_user_invoices()` | GET | `/invoices` |
| `get_pickup_times()` | GET | `/time?address=` |
| `add_pickup_time()` | POST | `/time` |
| `ping()` | GET | `/` (plugin-only) |

---

## 13. Cek koneksi & validasi API key — [plugin]

Tidak ada endpoint validasi key khusus. Plugin memvalidasi key dengan estimate dummy:

```
GET /api/public/{API_KEY}/order/estimate?origin_id=5fc62f63f8f44b34aa4c0e0a&destination_id=5fc62de8f8f44b34aa4bdc58&courier=all&weight=1
```

| Kondisi | Arti |
|---------|------|
| Request gagal / tidak ada response | ❌ Server Offline |
| Response datang & `success` ≠ false | ✅ Online & License Valid |
| Response `success:false` (mis. `X001`) | ⚠️ Online, License Invalid |

ID dummy di atas milik environment Mengantar — sebaiknya ganti dengan origin/destination milikmu.

---

## 14. Caching (perilaku plugin) — [plugin]

- Semua **GET** sukses di-cache 5 menit (transient `wm_api_cache_{md5(url)}`).
- Origin optimizer menambah cache rate per-origin 10 menit + cache `search_address`.
- POST/DELETE tidak di-cache; setelah create/update address, cache `/address` di-clear.
- Karena URL mengandung API key, **redaksi key** di log (regex `/api/public/**redacted**`).

Replikasi caching opsional tapi disarankan (hemat kuota & latensi).

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
