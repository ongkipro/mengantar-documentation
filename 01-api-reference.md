# Mengantar Public API — Referensi Endpoint

Sumber: `includes/class-wm-api-client.php` (Woo Mengantar v1.0.32).

## 1. Base URL & Autentikasi

| Mode | Base URL |
|------|----------|
| Produksi | `https://api-public.mengantar.com` |
| Sandbox  | `https://sandbox.mengantar.com` |

API key disisipkan **di path**, bukan di header `Authorization`:

```
{BASE_URL}/api/public/{API_KEY}/{endpoint}
```

Contoh:
```
https://api-public.mengantar.com/api/public/abc123KEY/order/estimate?origin_id=...
```

> Karena key ada di URL, **JANGAN** panggil API ini dari kode browser/client.
> Selalu proxy lewat server (Astro endpoint / Next.js route handler) supaya key tidak bocor.

Ada **2 endpoint estimasi khusus** yang TIDAK memakai pola `/api/public/{key}` (lihat §4.2):
`/api/order/allEstimatePublic` dan `/api/order/allEstimate3PL`.

### Header

- Request `GET` & form `POST`: tanpa header khusus (plugin kirim `application/x-www-form-urlencoded` via body array).
- Request `POST` JSON (`create_order`): `Content-Type: application/json`, `Accept: application/json`.

### Pola error global

Setiap response dicek: kalau body punya `success === false`, dianggap error.

```json
{
  "success": false,
  "message": "Pesan error",
  "errors": { "...": "..." },
  "errorsFront": "Pesan ramah untuk user",
  "courier": "JNE"
}
```

GET sukses di-cache 5 menit (di plugin via transient). Replikasi caching ini opsional di sisimu.

---

## 2. Ringkasan Endpoint

Semua relatif terhadap `{BASE_URL}/api/public/{API_KEY}` kecuali ditandai.

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/` | Ping / cek ketersediaan |
| GET | `/address/search?keyword={q}` | Cari alamat tujuan (district/kecamatan) |
| GET | `/address` | List alamat pickup/origin milik akun |
| POST | `/address` | Buat / update alamat pickup (form) |
| GET | `/order/estimate?{query}` | Estimasi ongkir (normal) |
| GET | `/api/order/allEstimatePublic?{query}` | Estimasi semua kurir (public) — **bukan** di bawah `/api/public/{key}` |
| GET | `/api/order/allEstimate3PL?{query}` | Estimasi semua kurir (mode 3PL) — idem |
| POST | `/order` | Buat shipment (JSON) |
| GET | `/order?tracking_id={id}` | Lacak shipment by tracking ID |
| GET | `/order?order_id={id}` | Ambil shipment by Mengantar order ID |
| GET | `/invoices` | List invoice akun |
| GET | `/time?address={address_id}` | List jadwal pickup untuk satu alamat |
| POST | `/time` | Tambah jadwal pickup (form) |
| DELETE | `/time/{time_id}` | Hapus jadwal pickup |

---

## 3. Alamat

### 3.1 Cari alamat tujuan — `GET /address/search?keyword={q}`

Dipakai untuk autocomplete alamat customer di checkout. `keyword` minimal 3 karakter (aturan plugin).

**Response (sukses):**
```json
{
  "success": true,
  "data": [
    {
      "id": "65f...",
      "_id": "65f...",
      "SUBDISTRICT_NAME": "Kelurahan ...",
      "DISTRICT_NAME": "Kecamatan ...",
      "CITY_NAME": "Kota/Kabupaten ...",
      "PROVINCE_NAME": "Provinsi ...",
      "zip": "40123"
    }
  ]
}
```

- `id` (atau `_id`) → inilah **`destination_id`** yang dipakai untuk estimasi & create order.
- Field nama kadang datang dalam variasi case: `DISTRICT_NAME` / `district_name` / `name`, dst.
  Saat parsing, dukung fallback: `item.DISTRICT_NAME ?? item.district_name ?? item.name`.

### 3.2 List alamat pickup — `GET /address`

Alamat asal/pengirim (gudang) yang terdaftar di akun Mengantar.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "origin123",
      "PICKUP_NAME": "Gudang Utama",
      "PICKUP_PIC": "Budi",
      "PICKUP_PIC_PHONE": "08123456789",
      "PICKUP_AUTOFILL": "districtId",
      "PICKUP_FULL_AUTOFILL": "Kecamatan, Kota, Provinsi",
      "PICKUP_ADDRESS": "Jl. Contoh No. 1 ..."
    }
  ]
}
```

`_id` di sini = **`origin_id`** (alamat asal pengiriman).

### 3.3 Buat / update alamat pickup — `POST /address` (form-urlencoded)

Create dan update memakai endpoint yang sama. Jika `_id` disertakan → update; jika tidak → create.

**Body (form fields):**
```
PICKUP_NAME       = Nama lokasi (mis. "Gudang Utama")
PICKUP_PIC        = Nama PIC
PICKUP_PIC_PHONE  = No. HP PIC
PICKUP_AUTOFILL   = District/destination ID alamat (dari /address/search)
PICKUP_ADDRESS    = Alamat lengkap (teks)
_id               = (opsional) ID alamat, hanya untuk update
```

Response: `{ "success": true, ... }`.

---

## 4. Estimasi Ongkir

### 4.1 Estimasi normal — `GET /order/estimate`

**Query params:**

| Param | Wajib | Default | Keterangan |
|-------|-------|---------|------------|
| `origin_id` | ya | `''` | ID alamat asal (lihat §3.2) |
| `destination_id` | ya | `''` | ID alamat tujuan (lihat §3.1) |
| `courier` | tidak | `all` | Kode kurir tunggal atau `all` |
| `weight` | tidak | `1` | Berat dalam **kg** |
| `cod_amount` | tidak | — | Nilai COD (IDR). Dihilangkan jika 0 |

Contoh:
```
GET /order/estimate?origin_id=ORIG&destination_id=DEST&courier=all&weight=2
```

### 4.2 Estimasi semua kurir (varian khusus)

Saat `courier=all`, plugin bisa memakai URL alternatif (di luar `/api/public/{key}`):

```
GET {BASE_URL}/api/order/allEstimatePublic?origin_id=...&destination_id=...&courier=all&weight=...
GET {BASE_URL}/api/order/allEstimate3PL?origin_id=...&destination_id=...&courier=all&weight=...
```

- `allEstimate3PL` dipakai bila opsi "use 3PL shipping fee" aktif (default `yes` di plugin).
- Query string sama dengan §4.1.

### 4.3 Bentuk Response Estimasi

**Satu kurir** (`courier=JNE`): `data` adalah satu objek.

```json
{
  "success": true,
  "data": {
    "price": 18000,
    "estimatedSpecialPrice": 16500,
    "estimate_delivery": "2-3 hari",
    "estimatedDate": "2026-07-03",
    "unsupported": false
  }
}
```

**Semua kurir** (`courier=all`): `data` adalah **map** `courierKey => objek`.

```json
{
  "success": true,
  "data": {
    "JNE":        { "price": 18000, "estimatedSpecialPrice": 16500, "estimatedDate": "...", "unsupported": false },
    "SiCepat":    { "price": 17000, "estimate_delivery": "1-2 hari", "unsupported": false },
    "JNETrucking":{ "price": 9000,  "unsupported": false },
    "JT":         { "unsupported": true }
  }
}
```

**Field per kurir yang dipakai plugin:**

| Field | Arti |
|-------|------|
| `price` | Harga normal (IDR) |
| `estimatedSpecialPrice` | Harga diskon; jika ada, dipakai menggantikan `price` |
| `estimate_delivery` | Estimasi durasi (teks, mis. "2-3 hari") |
| `estimatedDate` | Estimasi tanggal sampai (alternatif `estimate_delivery`) |
| `unsupported` | `true` = kurir tidak melayani rute ini → di-skip |

Aturan plugin saat memilih harga:
```
biaya = estimatedSpecialPrice ?? price
skip jika unsupported == true  ATAU  price <= 0
ETA   = estimate_delivery (jika != "-") else estimatedDate
```

Key kurir untuk varian cargo/lite muncul sebagai `JNETrucking`, `SiCepatCargo`, `SapCargo`,
`iDexpressCargo` (lihat [02-couriers-and-rules.md](02-couriers-and-rules.md)).

---

## 5. Buat Shipment — `POST /order` (JSON)

**Content-Type:** `application/json`

**Body:**
```json
{
  "courier": "JNE",
  "assignee": "(opsional)",
  "pickup": {
    "type": "scheduledPickup",
    "address_id": "ORIGIN_ID",
    "time_id": "PICKUP_TIME_ID",
    "time_label": "2026-07-03 [09:00-12:00]",
    "volume": "volumeMobil",
    "origin_label": "Gudang Utama"
  },
  "orders": [
    {
      "customerAddressDataId": "DEST_ID",
      "customerAddress": "Jl. Tujuan No. 5, RT01 ...",
      "customerName": "Siti",
      "customerPhone": "08111111111",
      "weight": 2,
      "quantity": 1,
      "parcelContent": "Kaos katun",
      "goodsValue": 150000
    }
  ]
}
```

> **Nilai `courier` harus nama ter-normalisasi** yang dipakai untuk shipment (bukan key estimasi).
> Plugin memetakan lewat `map_courier_name_for_shipment()` ke salah satu dari:
> `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `Ninja`, `lion`, `anteraja`
> (perhatikan kapitalisasi tidak konsisten — ikuti persis). Lihat [02-couriers-and-rules.md](02-couriers-and-rules.md).

### 5.1 Field `pickup`

| Field | Keterangan |
|-------|------------|
| `type` | `scheduledPickup` (dijemput, default) atau `dropOff` (antar sendiri) |
| `address_id` | `origin_id` alamat asal |
| `time_id` | ID jadwal pickup (dari `/time`) — wajib bila `type=scheduledPickup` |
| `time_label` | Label jadwal, format `YYYY-MM-DD [HH:MM-HH:MM]` (informasi) |
| `volume` | Volume kendaraan jemput, default `volumeMobil` |
| `origin_label` | Label alamat asal (informasi) |

> Catatan nilai `type`: konstanta default plugin menulis `scheduledPickup`; di UI setting
> nilainya `scheduled` / `dropOff`. Saat membangun payload sendiri, gunakan `scheduledPickup`
> (kalau ada `time_id`) atau `dropOff`. Verifikasi dengan akun asli karena ada inkonsistensi penamaan.

### 5.2 Field per item `orders[]`

| Field | Keterangan |
|-------|------------|
| `customerAddressDataId` | `destination_id` tujuan (dari `/address/search`) |
| `customerAddress` | Alamat lengkap penerima (teks; gabungan addr1 + kota + provinsi + kodepos + negara) |
| `customerName` | Nama penerima |
| `customerPhone` | No. HP penerima (plugin: digit saja, maks 15 char) |
| `weight` | Berat kg (min. 1; bisa berat volumetrik bila diaktifkan) |
| `quantity` | Jumlah barang |
| `parcelContent` | Deskripsi isi paket (nama produk + SKU + varian) |
| `goodsValue` | Nilai barang (IDR) — **dikirim saat NON-COD** |
| `COD` | Nilai tagih COD (IDR) — **dikirim sebagai pengganti `goodsValue` saat COD** |
| `customProducts` | (opsional) array rincian produk |

> Penting: untuk satu item, kirim **`goodsValue`** (non-COD) **atau** **`COD`** (COD), bukan keduanya.

**Nilai `COD` bukan sekadar harga barang.** Plugin menghitung COD = `nilai_barang + porsi_ongkir + porsi_cod_fee`,
dibagi proporsional per item terhadap total nilai keranjang, lalu `round()`. Jadi jumlah seluruh
`COD` item ≈ total belanja + ongkir + biaya COD. (Lihat [02-couriers-and-rules.md](02-couriers-and-rules.md) §4.)

**Struktur `customProducts[]`:**
```json
[
  { "name": "Kaos katun", "qty": 1, "price": 150000, "weight": 0.3, "variant": "L / Hitam" }
]
```

### 5.3 Response sukses (struktur sebenarnya)

```json
{
  "success": true,
  "batch": "BATCH-XYZ",
  "batch_id": "665f...",
  "courier": "JNE",
  "data": [
    {
      "ORDER_ID": "MGT-0001",
      "cnote_no": "JNE0012345678",
      "status": "...",
      "statusCategory": "...",
      "payment_status": "paid",
      "error": ""
    }
  ]
}
```

> **`data` adalah ARRAY** (satu entri per order yang dikirim di `orders[]`), bukan objek.

Field yang dibaca plugin dari tiap entri `data[]`:

| Field | Arti |
|-------|------|
| `ORDER_ID` | ID order internal Mengantar → disimpan sebagai `order_id` |
| `cnote_no` | **Nomor resi / tracking number** → disimpan sebagai `tracking` |
| `status` | Status shipment |
| `statusCategory` | Kategori status |
| `payment_status` | `paid` / `unpaid` |
| `error` | Pesan error per-item (kosong bila sukses) |

Field tingkat atas: `batch`, `batch_id`, `courier` (courier final yang dipakai server).

Jika satu order dibuat tapi `cnote_no` belum tersedia (mis. pembayaran belum lunas), plugin
menjadwalkan polling tracking (lihat [04-how-it-works.md](04-how-it-works.md)).

### 5.4 Response error & "pending pickup time"

Error umum mengikuti pola di §1 "Pola error global" (`success:false`, `message`, `errors`, `errorsFront`, `courier`).
Plugin secara khusus mendeteksi **error terkait jadwal pickup** (`is_pickup_time_api_error`):
bila create order gagal karena `time_id` tidak valid/penuh, shipment tidak dianggap gagal total
melainkan ditandai status `pending_pickup_time` untuk dipilihkan jadwal lalu di-resume.

---

## 6. Tracking & Order

### 6.1 `GET /order?tracking_id={id}`
Ambil detail shipment dari nomor resi (`cnote_no`). Response `{ success, data: {...} }`.

### 6.2 `GET /order?order_id={id}`
Ambil shipment dari Mengantar `ORDER_ID`. Dipakai juga oleh polling auto-tracking untuk
mengambil `cnote_no` begitu tersedia.

**Field response tracking yang dibaca plugin** (halaman tracking admin):

| Field | Arti |
|-------|------|
| `cnote_no` | Nomor resi |
| `ORDER_ID` | ID order Mengantar |
| `courier` | Kurir |
| `status` / `statusCategory` | Status & kategori status |
| `PICKUP_NAME` | Nama lokasi pickup |
| `PICKUP_SERVICE` | Layanan pickup |
| `RECEIVER_NAME` | Nama penerima |
| `RECEIVER_PHONE` | No. HP penerima |
| `FULL_RECEIVER_ADDRESS` | Alamat penerima lengkap |
| `GOODS_DESC` | Deskripsi barang |
| `WEIGHT` | Berat |
| `createdAt` | Waktu dibuat |
| `history[]` | Riwayat status (plugin membalik urutan → terbaru di atas) |

Halaman tracking publik Mengantar bisa di-link langsung ke customer.

---

## 7. Invoice — `GET /invoices`
List invoice/tagihan akun. Response `{ success, data: [...] }`.

---

## 8. Jadwal Pickup

### 8.1 `GET /time?address={address_id}`
List jadwal pickup tersedia untuk satu alamat asal. Response `{ success, data: [ {time_id, date, time, ...} ] }`.

### 8.2 `POST /time` (form)
Tambah jadwal pickup baru.
```
address_id = ORIGIN_ID
date       = YYYY-MM-DD
time       = HH:MM
```

### 8.3 `DELETE /time/{time_id}`
Hapus jadwal pickup berdasarkan ID.

---

## 9. Daftar method client (referensi pemetaan)

Pemetaan method plugin → endpoint, untuk memudahkan port:

| Method PHP | HTTP | Endpoint |
|------------|------|----------|
| `ping()` | GET | `/` |
| `search_address($keyword)` | GET | `/address/search?keyword=` |
| `get_user_addresses()` | GET | `/address` |
| `create_user_address($data)` | POST | `/address` |
| `update_user_address($data)` | POST | `/address` (dengan `_id`) |
| `check_shipping_fee($data,'normal')` | GET | `/order/estimate?...` |
| `check_shipping_fee($data,'public')` | GET | `/api/order/allEstimatePublic?...` |
| `check_shipping_fee($data,'3pl')` | GET | `/api/order/allEstimate3PL?...` |
| `create_order($data)` | POST | `/order` |
| `get_order_by_tracking_id($id)` | GET | `/order?tracking_id=` |
| `get_order_by_order_id($id)` | GET | `/order?order_id=` |
| `get_user_invoices()` | GET | `/invoices` |
| `get_pickup_times($address_id)` | GET | `/time?address=` |
| `add_pickup_time($data)` | POST | `/time` |
| `delete_pickup_time($time_id)` | DELETE | `/time/{id}` |

---

## 10. Cek koneksi & validasi API key

Plugin **tidak punya endpoint validasi key khusus**. Untuk mengecek "Online & License Valid",
plugin memanggil `/order/estimate` (via `check_shipping_fee`) dengan ID dummy tetap:

```
GET /api/public/{API_KEY}/order/estimate?origin_id=5fc62f63f8f44b34aa4c0e0a&destination_id=5fc62de8f8f44b34aa4bdc58&courier=all&weight=1
```

Interpretasi hasil:

| Kondisi | Arti |
|---------|------|
| Request gagal / tidak ada response | ❌ Server Offline |
| Response datang & `success` tidak false | ✅ Online & License Valid |
| Response datang tapi `success:false` (key salah) | ⚠️ Online, License Invalid |

Endpoint `ping()` (`GET /`) juga ada sebagai cek ketersediaan ringan, tapi jalur validasi
key utama memakai estimate dummy di atas. ID dummy itu milik environment Mengantar — boleh
dipakai sekadar smoke-test, tapi sebaiknya ganti dengan origin/destination milikmu sendiri.

---

## 11. Caching (perilaku plugin)

- Semua **GET** sukses di-cache 5 menit (transient `wm_api_cache_{md5(url)}`).
- Origin optimizer menambah cache rate per-origin 10 menit & cache hasil `search_address`.
- POST/DELETE tidak di-cache; setelah create/update address, cache `/address` di-clear.

Saat membangun ulang, replikasi caching ini opsional tapi disarankan (hemat kuota & latensi).
Karena URL mengandung API key, gunakan hash URL **tanpa** menampilkan key di log (plugin
menyensor key via regex `/api/public/**redacted**`).

---
<sub>Bagian dari <a href="README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
