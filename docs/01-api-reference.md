# Mengantar API — Referensi Lengkap (25 Operasi + Webhook)

> Spesifikasi resmi Mengantar Public API, disinkronkan dengan **docs resmi v2.0.0** per **2026-11-19**
> ([Mengantar Public API](https://api-public.mengantar.com/docs/), Markdown per halaman di
> [`llms.txt`](https://api-public.mengantar.com/docs/llms.txt); salinan verbatim di [official-snapshot](official-snapshot/README.md)).
> Mencakup **25 operasi** (termasuk simulasi status khusus sandbox), arsitektur **Webhook resmi (HMAC-SHA256)**, modul **Dropshipper**,
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

- **Sandbox vs produksi:** key, akun, dan Webhook Secret **terpisah**. Key produksi di host sandbox → `403 Not allowed`.

### Permission key & penolakan seragam (docs v2)

| Permission | Default | Mengizinkan |
|------------|:-------:|-------------|
| `Create order` | On | Buat/hapus order, pay-unpaid, hapus batch, cari/baca/tambah/ubah/hapus alamat, baca/tambah jadwal pickup, tambah/cari dropshipper |
| `Check order status` | On | List order, list batch, simulasi status (sandbox) |
| `Check shipping fee` | On | Estimasi dengan key, skor performa kurir |
| `Check balance` | On | Invoice & saldo |
| `Check batch load` | Off | Khusus admin; endpointnya tidak dipublikasikan |

`/my-users` dan `/getReceiverScoreByNumberUser` cukup key aktif dari IP yang diizinkan. Halaman Update address menulis
`Create order`, sedangkan Get Started menyebutnya "key saja" — perlakukan sebagai `Create order` (lebih ketat).

**Satu bentuk penolakan:** key tidak dikenal/nonaktif, key tanpa permission endpoint, IP di luar allowlist key, atau
endpoint whitelist → **`403 {"success":false,"message":"Not allowed"}`** (dicek live di sandbox 2026-11-19, termasuk
`/address/search`). Ini masalah konfigurasi: jangan retry. IP whitelist key diminta lewat CS.

Endpoint whitelist (produksi): Get Courier Performance & Get Receiver Score (keduanya **terbuka di sandbox**),
Print Label PDF (BETA), dan Webhook (diaktifkan per akun di produksi; terbuka untuk semua akun sandbox).

### Catatan Status Kurir
- **Ninja Discontinued:** sejak **1 September 2026** create/pay/estimasi menolak `Ninja`; order & batch lama tetap bisa dibaca (`courier=Ninja` di list).
- **Kurir POS:** aktif (`pos`); COD tergantung delivered rate akun ([02 §3.3](02-couriers-and-rules.md)).
- **Kurir SPX (Shopee Express):** `spx` resmi untuk estimate, create order, pay-unpaid, delete, simulasi.
  Estimasi single-courier `courier=spx` → **200** dengan `pickupSchedule` (sandbox 2026-11-19; temuan lama `400 Invalid courier` 2026-09-25 sudah tidak berlaku).
  Create-order `spx` **belum teramati live** di repo ini **[verifikasi]**. Detail & batas: [02-couriers-and-rules.md](02-couriers-and-rules.md) §1.2.

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
Jika gagal (`success: false`) bentuknya bervariasi per endpoint — selalu ada `success` dan `message`, kadang `field`,
`code` (mis. `COURIER_DISABLED`, `IDEMPOTENCY_*`), `courier`, atau `errors` (EN) + `errorsFront` (ID) untuk validasi order:
```json
{ "success": false, "message": "Error in orders", "errors": [ ... ], "errorsFront": [ ... ], "courier": "JNE" }
```
Beberapa pesan mengikuti bahasa akun (ID/EN): cocokkan **status + field/code**, bukan teks pesan.

---

## 2. Ringkasan Endpoint Resmi (Lengkap — 25 Operasi + Webhook)

| # | Method | Path | Kategori | Keterangan |
|---|--------|------|----------|------------|
| 1 | GET | `/address/search?keyword=` | Alamat | Cari data wilayah → `origin_id` / `destination_id` |
| 2 | POST | `/address` | Alamat | Tambah alamat pickup (`pinpointData` wajib untuk scheduled pickup `pos`) |
| 3 | GET | `/address` | Alamat | List alamat pickup (`keyword`, `page`+`size` ≤ 100, `fields`) |
| 4 | DELETE | `/address` | Alamat | Hapus alamat pickup (body `{ "id": "..." }`) |
| 5 | PUT | `/address/{id}` | Alamat | Update field alamat pickup by ID |
| 6 | POST | `/time` | Jadwal Pickup | Tambah jadwal pickup (`date` `MM-DD-YYYY` atau Unix ms; jam `09:00`–`20:00`) |
| 7 | GET | `/time` | Jadwal Pickup | Jadwal mendatang (opsional `address`, `courier`) |
| 8 | GET | `/order/estimate` | Ongkir | Cek ongkir akun (single kurir atau `all`, mendukung DG & COD) |
| 9 | GET | `/api/order/allEstimatePublic` **(no-key)** | Ongkir | Semua kurir, diskon dasar 20% (+ `JTEco` dengan `withCourierServices=true`) |
| 10 | GET | `/api/order/allEstimate3PL` **(no-key)** | Ongkir | Semua kurir, harga standar tanpa diskon |
| 11 | POST | `/order/getPerformancePublic` | Ongkir | Skor performa kurir di kota tujuan (whitelist produksi) |
| 12 | GET | `/invoices` | Keuangan | Invoice + saldo; `cursor`, `ids`, `keyword`, `dateRange`, `invoiceFilter` |
| 13 | POST | `/dropshippers` | Dropshipper | Daftarkan master dropshipper baru (otomatis dedup by nama + no. HP) |
| 14 | GET | `/dropshippers` | Dropshipper | Cari master dropshipper tersimpan (prefix nama / no. HP) |
| 15 | POST | `/order` | Order | Buat order shipment (batch) → return nomor resi (`cnote_no`) & `ORDER_ID` |
| 16 | GET | `/my-users` | Tim | List assignee (pengguna/staf dalam tim akun) |
| 17 | POST | `/order/pay-unpaid` | Order | Bayar order berstatus unpaid dalam satu batch |
| 18 | GET | `/order` | Order | List order (`cursor`, filter) atau tracking by `order_id` / `tracking_id` |
| 19 | DELETE | `/order` | Order | Hapus order (by `ids` / `orderIds`) — cek `deletedCount` |
| 20 | GET | `/batch` | Order | List batch (`batchFilter=unpaid`, `keyword`, `address_id`) |
| 21 | DELETE | `/batch` | Order | Hapus batch — cek `deletedCount` / `unDeletedCount` |
| 22 | GET | `/getReceiverScoreByNumberUser?search=` | Pencegahan RTS | Skor penerima per kurir + `summary` (whitelist & batas harian di produksi) |
| 23 | POST | `/label-generation` | Label PDF (BETA) | Request render label PDF asinkron (kuota 8 print/menit, whitelist) |
| 24 | GET | `/label-generation/{id}` | Label PDF (BETA) | Cek status & download URL PDF label (aktif 15 menit) |
| 25 | POST | `/order/simulation` | Sandbox | **Sandbox saja** (produksi 404): pindahkan order ke ON DELIVERY / DELIVERED / RTS + kirim 1 webhook |
| ⚡ | POST | *URL Webhook Integrator* | Webhook | Event notifikasi perubahan status order (HMAC-SHA256 signature) |

---

## 3. Modul Alamat Pickup & Wilayah

### 3.1 Cari data wilayah — `GET /address/search?keyword={q}`

Menghasilkan ID wilayah untuk origin & destination. Butuh permission `Create order` — key invalid → `403 Not allowed`
(sandbox 2026-11-19; catatan lama "key tidak divalidasi" sudah tidak berlaku). Maks **50 hasil**, tanpa pagination.

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/address/search?keyword=papua'
```

**Query params:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| `keyword` | String | **Wajib.** Satu atau lebih kata; **setiap** kata harus cocok provinsi/kota/kecamatan/kelurahan/kode pos (case-insensitive; `. , - /` diabaikan). Hilang → `400`; tanpa kata tersisa → `200` data kosong |

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
      "DISTRICT_NAME": "MUTING",
      "SUBDISTRICT_NAME": "SEED AGUNG (SEDAYU AGUNG PRASASTI)",
      "ZIP_CODE": "99652",
      "fullAddress": "PAPUA, MERAUKE, MUTING, SEED AGUNG (SEDAYU AGUNG PRASASTI)"
    }
  ]
}
```

- Simpan `_id`: gunakan sebagai `origin_id`/`destination_id` di estimasi ongkir, serta `customerAddressDataId` saat membuat order.
- Field lain (kode kurir seperti `ORIGIN_CODE`, flag cakupan) adalah data internal — docs v2 meminta **jangan bergantung** padanya.

### 3.2 Tambah Alamat Pickup — `POST /address`

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
| `pinpointData` | Object \| null | Opsional | `{ lat, lng }` (number; lat −90..90, lng −180..180). **Wajib bila alamat dipakai untuk scheduled pickup Pos Indonesia (`pos`)** |
| `SHIPPER_ADDR1` | String | Opsional | Alamat retur (jika berbeda dari pickup) |
| `SHIPPER_AUTOFILL` | String | Opsional | `_id` wilayah retur dari `/address/search` |
| `SHIPPER_CONTACT` | String | Opsional | Nama kontak retur |
| `SHIPPER_PHONE` | String | Opsional | Nomor telepon kontak retur |

- Docs v2: `POST /address` **hanya menambah**. Untuk mengubah alamat pakai `PUT /address/{id}` (§3.5). *(Versi lama repo
  ini mendokumentasikan `_id` di body untuk "in-place update" — tidak ada di docs resmi v2.)*
- Galat: `400` dengan `field` (`PICKUP_NAME is required`, `PICKUP_PIC_PHONE is invalid`, `PICKUP_AUTOFILL` "address not found",
  `SHIPPER_AUTOFILL` "return address not found", `pinpointData.lat must be …`).

### 3.3 List Alamat Pickup — `GET /address`

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/address'
```

Tanpa parameter mengembalikan **semua** alamat. Opsional: `keyword` (substring `PICKUP_NAME`, pakai satu kata), `page` + `size`
(≤ 100, **hanya berlaku bila keduanya dikirim**; tidak ada total — berhenti saat halaman < `size`), `fields` (mis. `_id,PICKUP_NAME`).
Respons juga membawa `nowDate` (`MM-DD-YYYY`, WIB) dan `now` (jam WIB `00`–`23`).
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

Permanen. `data` = alamat sebelum dihapus. Galat: `id` hilang / sudah dihapus / bukan milik akun → `400 "Something went wrong"`;
`id` bukan ObjectId → `400 "Error on delete address"`. Menghapus kedua kali menghasilkan error pertama, bukan sukses.

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

- Semua field opsional; body kosong sukses tanpa perubahan; field di luar daftar diabaikan. Field yang bisa diubah:
  `PICKUP_NAME`, `PICKUP_PIC`, `PICKUP_PIC_PHONE` (tidak boleh `null`), `PICKUP_ADDRESS`, `PICKUP_AUTOFILL` (tidak boleh kosong),
  `pinpointData`, `SHIPPER_ADDR1`, `SHIPPER_AUTOFILL`, `SHIPPER_CONTACT`, `SHIPPER_PHONE`.
- Wilayah (provinsi/kota/kecamatan/kelurahan/kode pos) **bukan** parameter — selalu dari `PICKUP_AUTOFILL`.
- Galat: `400` id bukan ObjectId; `422 ValidationError` untuk alamat bukan milik akun, nomor PIC invalid/null,
  `PICKUP_AUTOFILL` kosong/tidak ditemukan, `SHIPPER_AUTOFILL` tidak ditemukan.

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
| `address_id` | String | `_id` alamat pickup milik akun (bukan milik akun → `404 address not found`) |
| `date` | String \| Number | **`MM-DD-YYYY`** (contoh `"11-27-2026"` = 27 Nov 2026) **atau** Unix ms sebagai *number* (`1794787200000`). Timestamp sebagai string ditolak |
| `time` | String | Selalu **dua digit**: `09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00, 19:00, 20:00`. **`9:00` ditolak** |

> ⚠️ **Batas 90 menit** dicek saat `POST /order`, **bukan** di sini: Add Time menerima tanggal lampau sekalipun.
> **Setiap panggilan membuat jadwal baru** (meski address/date/time sama) — buat sekali, simpan & pakai ulang `_id`.
> Field hilang dilaporkan satu per satu (urutan `address_id`, `time`, `date`). *(Versi ≤ 0.4.0 repo ini: slot `9:00`–`18:00` — usang.)*

### 4.2 List Jadwal Pickup — `GET /time`

```bash
curl -G '{BASE_URL}/api/public/{API_KEY}/time' \
  --data-urlencode 'address=62e27d67ecf5ae2893bc070a' \
  --data-urlencode 'courier=JNE'
```

- Kedua parameter **opsional**. Tanpa parameter → semua jadwal **mendatang** untuk semua alamat (yang sudah lewat tidak pernah muncul).
  Hasil tidak menyebut alamatnya; kirim `address` untuk satu alamat. Tanpa pagination, tanpa urutan (urutkan sendiri by `date`).
- `courier` (case-sensitive) menyembunyikan slot yang tak bisa dipakai: `JNE` tanpa Minggu & tanpa `19:00`/`20:00`;
  `anteraja` tanpa Minggu; `iDexpress` tanpa `20:00` dan hanya > 90 menit dari sekarang; nilai lain tanpa filter.
- ⚠️ `date` di respons = **Unix ms dengan jam Jakarta ditulis seolah UTC** (`1796043600000` = 2026-11-30 13:00 bila dibaca UTC). Baca dengan `getUTC*()`.
- Ambil `_id` sebagai `pickup.time_id` saat membuat shipment.

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
| `courier` | String | `JNE` | `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, `spx`, atau `all`. **Case-sensitive**, hanya sekali (`Sap` ✅, `SAP`/`sap` ❌ → `400 Invalid courier`). `spx` tunggal → 200 (sandbox 2026-11-19). `Ninja`, atau `spx` saat SPX dimatikan → `400 COURIER_DISABLED` |
| `weight` | Number | 1 | kg, positif; desimal boleh (`0.5`) |
| `COD_AMOUNT` | Number | — | *(opsional)* Nilai barang + ongkir. **Hanya untuk menghitung `codFee`**; ongkir tetap `price` |
| `isDangerousGoods`| Boolean | false | `true`/`1` → tarif & cakupan DG. **Hanya `SiCepat` dan `iDexpress`** membawa DG; kurir lain `isDangerousGoodsSupported:false` |

> ⚠️ **Penting:**
> 1. Respon `courier=all` berbentuk **Map Objek** `Record<string, CourierRate>`, bukan array. Docs v2: **14 key**
>    `JNE`, `JNECargo`, `SiCepat`, `SiCepatCargo`, `SAP`, `SAPLite`, `SapCargo`, `iDexpress`, `JT`, `lion`,
>    `iDexpressCargo`, `anteraja`, `spx`, `pos` — **plus `JTEco`** bila rute punya tarif J&T ECO dan request bukan DG.
>    `JTEco` bukan nilai `courier`: pesan dengan `eco: true` pada order `JT` (§8.1). Pemetaan key → nama shipment: [02](02-couriers-and-rules.md) §1.1.
> 2. Field respons (docs v2): `price` (sebelum diskon), `currency`, `discountPercent`/`discount`, `discountExtraPercent`/`discountExtra`,
>    `codFee`, `estimatedPrice` (= `price` + `codFee`), **`estimatedSpecialPrice` = yang Anda bayar**, `estimate_delivery` (kadang `-`),
>    `estimatedDate` (perkiraan umum), `unsupported`, `unsupported_cod`, `isDangerousGoodsSupported` (bila DG), `pickupSchedule` (hanya `spx`),
>    field `cargo…` (0 bila bukan cargo). Tiap kurir hanya mengirim field yang relevan — cek keberadaan sebelum membaca.
> 3. Evaluasi flag ketersediaan:
>    - `unsupported: true` → kurir tidak melayani rute ini sama sekali (COD maupun non-COD).
>    - `unsupported_cod: true` → bisa kirim non-COD, **tidak** COD.
>    - `unsupportedOriginSpx: true` (entri `spx`, **tidak ada di docs resmi**, teramati live 2026-09-25) → perlakukan seperti `unsupported: true`.
>    - `unsupportedPickup` (entri `spx`, tidak ada di docs resmi) — arti belum dipastikan **[verifikasi]**.
> 4. Pada DG request, `isDangerousGoodsSupported` = kapabilitas kurir, `unsupported` = cakupan tujuan — cek keduanya.
> 5. Batas kurir (COD maks, berat, nilai barang non-COD) di [02 §3](02-couriers-and-rules.md). Estimasi **hanya menegakkan sebagian**:
>    `anteraja`/`pos`/`spx` > 50 kg → `unsupported:true` & `price` 0 (sandbox: `pos` tetap memberi harga); `spx` dengan COD di atas
>    maksimum juga. Batas lain baru ditolak saat create order.

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

### 5.2 Cek Ongkir Public (Diskon Dasar 20%) — `GET /api/order/allEstimatePublic` (Tanpa Key)
```bash
curl -G '{BASE_URL}/api/order/allEstimatePublic' \
  --data-urlencode 'origin_id=5fc62f5df8f44b34aa4c0d8c' \
  --data-urlencode 'destination_id=5fc64714f8f44b34aa4cdd60' \
  --data-urlencode 'weight=1' \
  --data-urlencode 'withCourierServices=true'
```

- Tanpa key, tanpa permission (path **tanpa** `/api/public/{key}`). Estimasi di balik halaman publik *Cek Ongkos Kirim*.
- **15 key**: 14 key §5.1 **+ `iDlite`** (tarif tambahan di samping `iDexpress`; bukan nilai `courier`). `withCourierServices=true`
  menambah **`JTEco`**. Dicek sandbox 2026-11-19: 200 dengan 15 key, dan 16 key (+`JTEco`) dengan `withCourierServices=true`.
  *(Catatan lama "404 Not Found" 2026-09-25 berasal dari path yang salah — path resmi di atas berfungsi.)*
- Diskon = **diskon dasar 20%** akun baru (tidak tergantung volume); kurir tertentu bisa beda karena harga flat/lite atau `discountExtraPercent`.
- `unsupported` bisa `null` untuk `JNE`, `JNECargo`, `SapCargo` (tidak melaporkan). Tidak memeriksa batas COD.
- Hanya memeriksa **format** id: id valid yang tidak cocok alamat tetap mengembalikan tarif — ambil id dari `/address/search`.
- Galat: `400 "from or to is empty"`, `400 "origin_id is invalid"` (atau `destination_id`).

### 5.3 Cek Ongkir 3PL (Tarif Mentah Tanpa Diskon) — `GET /api/order/allEstimate3PL` (Tanpa Key)
```bash
curl -G '{BASE_URL}/api/order/allEstimate3PL' \
  --data-urlencode 'origin_id=5fc62f5df8f44b34aa4c0d8c' \
  --data-urlencode 'destination_id=5fc64714f8f44b34aa4cdd60' \
  --data-urlencode 'weight=1'
```

- Harga standar kurir **tanpa diskon dan tanpa harga flat**, untuk partner logistik/integrator. Tanpa key.
- 15 key seperti §5.2 (+ `JTEco` bila rute punya tarif ECO dan bukan DG). Entri ringkas: `price` (0 bila tidak bisa), `estimatedDate`,
  `unsupported`, `unsupported_cod` (**`null` = kurir tidak menjawab, bukan ya/tidak**), `isDangerousGoodsSupported` (bila DG),
  `minimumWeightCargo` (entri cargo), `isFlat` (hanya `anteraja`).
- Tidak ada `COD_AMOUNT` (diabaikan bila dikirim) dan tidak ada `codFee`. Galat sama dengan §5.2.

### 5.4 Skor Performa Kurir — `POST /order/getPerformancePublic`
```bash
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order/getPerformancePublic' \
  -H 'Content-Type: application/json' \
  -d '{ "city": "BANDUNG", "allEstimateData": { ...data dari estimate courier=all atau allEstimatePublic... } }'
```

- Permission `Check shipping fee`; **whitelist di produksi** (terbuka di sandbox, skor dari data non-produksi).
- `city` = `CITY_NAME` dari `/address/search`, **persis dan case-sensitive**. Kota tidak cocok/hilang → semua skor 0, `bestCourier` `JNE`.
- `allEstimateData` = objek `data` utuh dari `estimate?courier=all` atau `allEstimatePublic` (wajib; hilang → `400`).
- Respons: `couriers[]` (`key`, `score`; lebih tinggi lebih baik, 0 = tanpa skor; yang terbaik dinormalkan ke 100),
  **`bestCourier`** (skor tertinggi yang bisa melayani rute; `JNE` bila tidak ada), `recommendedDGCourier` (terbaik di antara
  kurir `isDangerousGoodsSupported`; `iDexpress` bila tidak ada), `recommended` (**selalu `JNE`** — pakai `bestCourier`).
- Kurir `unsupported` atau `unsupported_cod:true` tidak bisa jadi `bestCourier`. `anteraja`, `pos`, `spx` selalu skor 0.
- Galat: `405` bila bukan POST, `500` bila body bukan JSON.

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
| `keyword` | String | Potongan nomor invoice, `ORDER_ID`, `cnote_no`, deskripsi item, atau nominal persis. Teks polos (`(` → `400`) |
| `ids` | String | `inv_number` dipisah koma |
| `page` / `size` | Number | Default 1 / 50; **keduanya maks 100** (`size` > 100 → `400`). `page` diabaikan bila `cursor` dikirim |
| `cursor` | String | `nextCursor` dari respons sebelumnya — pakai untuk daftar panjang (biaya sama di kedalaman berapa pun) |
| `dateRange` | String | JSON `{"startDate":"...","endDate":"..."}` — **keduanya wajib** |
| `invoiceFilter` | String | `all` (default), `typePayment`, `typeRefund`, `typeAddBalance`, `typeWithdraw`, `typeReconciliation`. Tipe tak dikenal → daftar kosong |

Respons: `data[]` (terbaru dulu; tidak ada parameter sort), `count` (jumlah yang cocok filter), **`balance`** (saldo rupiah, tidak
terpengaruh filter), `nextCursor` (kosong di halaman terakhir). Tiap invoice: `inv_number`, `type`, `status`
(`statusCleared`, `statusPending`, `statusProcessing`, `statusFailed`, `statusExpired`), `courier` (`system` untuk top up), `amount`,
`total`, `description`, `subItems[]` (order: `description` = ORDER_ID, `cnote_no`, `amount`, `COD_AMOUNT`, `COD_FEE`, …),
`balanceAmount` (saldo setelah invoice; tidak selalu ada), `expiration_date` (hanya withdraw). `typeReconciliation` = penyelesaian
otomatis uang COD order terkirim ke saldo. *(Versi lama repo ini menulis `typeAddSaldo`; nama resmi `typeAddBalance`.)*

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
- Fitur Dropshipper harus **diaktifkan lewat Seller Web** (kalau belum → `403 "Dropshipper Feature is not enabled…"`).
- **Idempoten exact-match:** nama + no. HP persis sama → record lama dikembalikan. `Toko Partner` vs `toko partner`, atau
  `0812…` vs `+62812…`, dianggap **berbeda**. Spasi depan/belakang dibuang. Kirim `phone` sebagai **string** (number → `500`).
- Galat: `400 "Missing fields: name, phone"`, `400 "Invalid Dropshipper phone number"`, `400 "Invalid Dropshipper name"` (spasi saja).

### 7.2 Cari Master Dropshipper — `GET /dropshippers`

```bash
curl -G '{BASE_URL}/api/public/{API_KEY}/dropshippers' \
  --data-urlencode 'search=Toko' \
  --data-urlencode 'page=1' \
  --data-urlencode 'perPage=20'
```

- `search`: prefix nama atau nomor HP (case-insensitive). Encode `+` sebagai `%2B`. Karakter seperti `(`/`[` → `500`.
  Pencarian beberapa kata juga mengembalikan nama yang diawali kata pertama.
- `page` default 1; `perPage` default 20, **maks 100** (lebih → `400`). Tanpa parameter → 20 pertama diurutkan nama.
- Tanpa total: halaman dengan jumlah < `perPage` adalah halaman terakhir. Respons membawa `pagination { page, perPage }`.

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
1. **`courier`**: `"JNE"`, `"SiCepat"`, `"Sap"`, `"iDexpress"`, `"JT"`, `"lion"`, `"anteraja"`, `"pos"`, `"spx"` (case-sensitive).
   - `"spx"`: sandbox hanya area **Jakarta** (di luar itu order dibuat lalu `status:"error"`); `time_id` harus di dalam slot SPX hari itu
     (`pickupSchedule` di estimasi); `dropOff` hanya bila SPX Drop Off aktif. Create-order SPX belum teramati live di repo ini **[verifikasi]**.
   - `Ninja` → `400 "Ninja Xpress is no longer available for new shipments"`.
2. **`pickup`**: `type` (`scheduledPickup`/`dropOff`; `dropOff` untuk `JNE`/`spx` hanya bila Drop Off aktif, `anteraja` tidak mendukung
   `dropOff`), `address_id` wajib; `time_id` & `volume` (`volumeMotor`/`volumeMobil`/`volumeTruck`) wajib untuk `scheduledPickup`.
   Pickup harus **≥ 90 menit** dari sekarang; kurir tertentu tidak pickup hari Minggu (mis. `anteraja`).
3. **`orders[].COD` vs `orders[].goodsValue`**: non-COD → `goodsValue` (wajib bila `COD` kosong, harus number); COD → `COD`
   (nilai barang + ongkir + biaya COD), **≥ Rp1.000** dan ≤ batas COD kurir. Bila keduanya dikirim, `COD` yang dipakai.
4. **`orders[].customerPhone`**: 10–15 digit (`62`/`+62` ikut dihitung); spasi & tanda hubung diterima; ekstensi `x12` diterima tapi digitnya tidak dihitung.
5. **`orders[].weight`**: kg positif (negatif → `400`). `JT` ≤ 50 kg; `anteraja`/`pos`/`spx` 1–50 kg.
6. **`orders[].eco`** (baru, docs v2): hanya `courier: "JT"`. `true` → **J&T ECO** (`SERVICE_CODE: "ECO"`); kosong/`false`/`null` → REG.
   Per order dalam satu batch. Tidak bisa digabung `cargo`/`isDangerousGoods`. Rute tanpa ECO → order masuk `ordersClosedDestination`
   (**tidak** dialihkan ke REG). Ketersediaan = entri `JTEco` di estimasi.
7. **`orders[].isDangerousGoods`**: JSON Boolean. Hanya `SiCepat` (layanan `HALU`) dan `iDexpress` (Regular). Cek estimasi dulu
   (`isDangerousGoodsSupported:true` dan `unsupported:false`). Galat: `Dangerous goods cannot be combined with cargo service`,
   `…not supported by courier {courier}`, `…not available for destination of orders[{index}]`.
8. **`orders[].cargo`**: `JNE`, `SiCepat`, `Sap`, `iDexpress`.
9. **`orders[].dropShipper`**: `{ id, name, phone }` persis sama dengan master. Divalidasi untuk seluruh batch sebelum order dibuat;
   satu invalid → seluruh batch ditolak (`400`; fitur nonaktif → `403`). Create order tidak pernah membuat dropshipper.
10. **`orders[].customProducts`**: item `{ name (wajib), qty (wajib), variant?, price?, weight? (default 1) }`; alias `quantity`/`orderQuantity`
    dan `harga`/`regularPrice`. `orders.weight` **harus = Σ(qty × weight)** dan `orders.quantity` **= Σ(qty)**. Produk tercetak di label;
    `customProductOrderIds` baru terisi saat dibaca lewat `GET /order`.
11. **Field milik sistem dilarang** — `price`, `estimatedPrice`, `estimatedSpecialPrice`, `isFlat`, `discount`, `discountPercent`,
    `discountExtra`, `discountExtraPercent`, `allEstimateData`, `iDlite`, `iDliteDiscount` → `400 "Fields not allowed in public API request: …"`,
    **meski bernilai `0`, `null` atau `""`**, di mana pun (body, `pickup`, atau order).
12. Opsional lain: `assignee` (`_id` dari `/my-users`), `destinationMark`, `deliveryInstruction`, `dontIncludeSubdistrict`.

**Membaca hasil (docs v2):** HTTP 200 + `success:true` berarti batch **diproses**, bukan semua order terkirim. Periksa tiap order:
- `status: "active"` + `cnote_no` → dibuat dan punya resi.
- `isPaid: false` → saldo kurang (§8.3), belum ada resi.
- `status: "error"` + `error` → kurir menolak (batch tetap dibuat): hapus batch atau perbaiki dan kirim ulang.
- Order di **`ordersClosedDestination`** → tujuan tidak dilayani; **tidak dibuat** dan tidak ada di `data`.

Field respons per order yang berguna: `_id`, `ORDER_ID`, `cnote_no`, `isPaid`, `status`, `error`, `price`, `COD_AMOUNT`, `COD_FEE`,
`estimatedPrice`, `estimatedSpecialPrice`, `discount*`, `SERVICE_CODE` (`REG`/`ECO`), `statusCategory`, `GOODS_*`, `WEIGHT`, `QTY`,
`assignee`, `cargo`, `isDangerousGoods`, `address_id`, `time_id`, `PICKUP_*`, `RECEIVER_*`, `dropShipperId`/`dropShipper`.
Top level: `batch` (nomor), `batch_id` (`_id` → pay-unpaid & delete batch), `errors` (kosong bila batch dibuat), `ordersClosedDestination`.

### 8.1a Idempotency Key (opsional, sangat disarankan)
Request create order bisa *timeout* di sisi Anda padahal Mengantar masih membuat batch-nya; retry biasa akan membuat order **dua kali**. Kirim header `idempotencyKey` berisi referensi milik Anda (mis. nomor invoice), dan kirim **nilai & body yang sama persis** pada setiap retry.

- 1–50 karakter (spasi depan/belakang diabaikan), diingat **24 jam per akun**; hanya dibaca dari header, diabaikan pada request `validate`.
- Sama kunci + sama body (urutan field JSON tidak berpengaruh) → respons pertama di-*replay* dengan header `Idempotent-Replayed: true` dan field `"idempotentReplayed": true`. Replay adalah **salinan**, bukan status terkini; pakai `GET /order`.
- Respons pertama 5xx juga di-replay (bisa saja sebagian batch sudah dibuat), tidak dijalankan ulang. 4xx sebelum order dibuat **melepas** kunci: perbaiki body, kirim lagi dengan kunci yang sama.
- Menghapus batch/order **tidak** melepas kunci: untuk membuat ulang, pakai kunci baru.

| HTTP | `code` | Tindakan |
|------|--------|----------|
| 400 | `IDEMPOTENCY_KEY_INVALID` | Kunci kosong / > 50 karakter. Tidak ada batch dibuat. |
| 409 | `IDEMPOTENCY_REQUEST_IN_PROGRESS` | Request pertama masih diproses: tunggu `Retry-After` detik, retry dengan kunci sama. |
| 409 | `IDEMPOTENCY_REQUEST_UNRESOLVED` | Request pertama tak pernah selesai: cek `GET /order`, kirim order yang belum ada dengan **kunci baru**. |
| 422 | `IDEMPOTENCY_KEY_REUSED` | Kunci sudah dipakai untuk body lain. |
| 503 | `IDEMPOTENCY_UNAVAILABLE` | Kunci tak bisa dicek, tidak ada yang dibuat: retry dengan kunci sama. |

Client contoh: `client.createOrder(payload, { idempotencyKey: "INV-2026-0001" })`; error membawa `code`, `retryAfter`, dan `idempotentReplayed`.

### 8.2 Konkurensi Batch (JT Premium & SiCepat)
Untuk kurir dengan generate resi terpusat di server (**JT Premium & SiCepat**):
- **Jangan pernah mengirim `POST /order` secara paralel** dari akun yang sama.
- Kirim order dalam 1 batch array. Bila terdeteksi ada proses yang sedang berjalan, API akan membalas dengan **HTTP `409 Conflict`**.

### 8.2a Galat Create Order (docs v2)
Kebanyakan galat `400` dengan `success:false`, `message`, dan `courier`. Validasi order → `message: "Error in orders"` dengan
`errors` (EN) dan `errorsFront` (ID), satu entri per masalah. Contoh: `courier is required`, `Invalid courier`,
`orders[0].weight must not be negative`, `Fields not allowed in public API request: price`, `pickup.address_id is required`,
`Pickup address not found`, COD di bawah Rp1.000 / di atas batas kurir, kurir tidak pickup hari itu, pickup < 90 menit,
`orders are empty`, berat melebihi batas, `orders[0].isDangerousGoods must be a boolean`, `orders[0].eco is only available for courier JT`,
`Invalid dropshipper data`. Key/izin/IP → `403 Not allowed`. Pesan mengikuti bahasa akun — cocokkan **status + field**, bukan teks.

### 8.3 Order Unpaid (Saldo Kurang)
Jika saldo akun tidak mencukupi untuk order Non-COD, API **tidak melempar error**, melainkan membuat order dengan status `isPaid: false` dan `cnote_no: null`.
- Solusi: Top-up saldo, lalu jalankan `POST /order/pay-unpaid` memakai `batch_id` yang diterima. Resi akan langsung diterbitkan tanpa harus input ulang data pelanggan.
- Order COD tidak ditagih saat dibuat. Sandbox: top up lewat **Top Up Saldo** di aplikasi + Midtrans sandbox simulator.

---

## 9. Tracking & Manajemen Order

### 9.1 Bayar Unpaid — `POST /order/pay-unpaid`
Body `{ "batch_id": "<_id batch>", "courier": "JT" }`. `courier` **opsional hanya untuk `JNE`** (default); kurir lain wajib —
tidak cocok → `400 batch not found`. Total semua order unpaid batch ditagih sekaligus; saldo kurang → **tidak ada yang dibayar**
(`400 balance is not enough`); order yang sudah dibayar dilewati.
- **Respons beda per kurir:** `JNE`/`SiCepat`/`Sap`/`iDexpress`/`JT` → `data` = jumlah order dibayar (number) dan `cnote_no` (array) di
  top level; `lion`/`anteraja`/`pos`/`spx` → `data` = `{ cnote_no: [...], count }`. Client: `paidResult()`.
- Batch tanpa yang perlu dibayar: kelompok pertama `200` `data: 0`; kelompok kedua `400 "no unpaid orders in this batch"`.
- Saldo di `/invoices` bisa butuh beberapa detik untuk menampilkan pembayaran. Unpaid `Ninja` tidak bisa dibayar lagi (hubungi support).

### 9.2 List & Lacak Order — `GET /order`
- **Satu order:** `tracking_id={cnote_no}` atau `order_id={ORDER_ID}` → ada **`history`** (juga mencari arsip). `history[]`:
  `date` (`DD-MM-YYYY HH:mm` WIB), `desc` (teks kurir), `code` & `location` (JNE), `proofUrl` (JNE, entri delivered).
  **`proofHistory`** (foto/video bukti, `status`, `date` ISO) **hanya terisi pada lookup `order_id`** — kosong untuk `tracking_id` dan list.
  `order_id` berulang/array → `400 Invalid order_id`.
- **List:** `page` (≤ 100), `size` (default 50, ≤ 100; lebih → 400), **`cursor`** (`nextCursor` sebelumnya; `page` diabaikan), `courier`
  (nilai persis — nilai lain **tidak ditolak** dan bisa memberi daftar salah; `Ninja` membaca order lama), `cod` (`COD`/`NON_COD`),
  `status` (kode dipisah koma atau objek JSON, mis. `DELIVERED_PENDING,RTS`), `dateRange` (JSON, URL-encoded), `batch` (**nomor** batch,
  bukan `_id`), `keyword` (ORDER_ID, resi, nama penerima — **dibaca sebagai regex**, escape `[ ( +`).
- **Batas pagination:** tanpa `courier`, `page × size` ≤ **1.500**; batas sama berlaku untuk satu kurir bila `dateRange` dimulai > 6 bulan lalu.
  Lebih jauh → pakai `cursor` (atau sebutkan `courier`). Tanpa `dateRange` daftar mencakup order yang belum diarsip (≈ 6 bulan terakhir).
- `dateRange` dibaca **per hari WIB**; `endDate` selalu sampai akhir harinya; batas awal tidak presisi (mulai sehari lebih awal lalu
  filter `createdAt` sendiri bila perlu persis).
- Respons: `data[]` (terbaru dulu) + **`nextCursor`** (string kosong di halaman terakhir). Field order penting: `ORDER_ID`, `cnote_no`,
  `courier`, `SERVICE_CODE` (`REG`/`ECO`), `batch`, `status` (teks status kurir; `active` sebelum ada update; `error`), `lastStatusChange`,
  `isPaid`, `isArchived`, `price`, `estimatedPrice`, `COD_AMOUNT`, `GOODS_*`, `WEIGHT`, `SHIPPER_*`, `RECEIVER_*`, `receiverScore`,
  `ticketStatus`, `printedDates`, `isBreach`, `dropShipper*`. Status sederhana: **DELIVERED**, **RTS**, selain itu **ON GOING**.
- Parameter lama dari plugin (`category`, `ticketFilter`, `receiverFilter`, `no_update_after_*`, `reseller`) **tidak ada di docs v2** — jangan diandalkan.

### 9.3 Hapus Order — `DELETE /order`
Body `{ "courier": "JT", "ids": ["<_id>", ...] }` atau `{ "courier": "JT", "orderIds": ["<ORDER_ID>", ...] }` (bila keduanya, `orderIds` dipakai).
- ⚠️ **Cek `deletedCount`, bukan `success`**: `200 success:true` bisa menghapus 0 atau sebagian. `deletedOrderIds` = yang benar-benar terhapus.
- Hanya order berstatus `active`, `error`, `PENDING PICKUP`, `PICKUP FAILED`, `PICKUP_FAILED_API` (atau kosong); setelah pickup tidak bisa.
- `courier` **wajib selain JNE**: tanpa itu API mencari di order JNE dan menjawab `"Orders already deleted"` tanpa menghapus apa pun.
- Field `ids` (jamak) — `id` tidak diterima (kebalikan dari Delete batch).
- Saldo order berbayar dikembalikan; order `error` tidak pernah ditagih. `lion`/`anteraja`/`pos`/`spx` menambah `errorMessages`,
  `ordersCount`, `totalBalanceRefund`. **Anteraja** hanya ≥ 5 menit setelah dibuat. Order hasil simulasi tidak bisa dihapus.
- Galat: `400 Invalid courier`, `400 ids array is required`, `400 ids array is invalid`; tidak ada yang cocok → JNE/SiCepat/Sap/iDexpress/JT/Ninja
  **`200 {"success":false,"message":"Orders already deleted"}`**, lion/anteraja/pos/spx `400 "There is no order to delete"`.

### 9.4 Batch — `GET /batch` & `DELETE /batch`
- **List:** terbaru dulu; `page` (≥ 1, ≤ 100), `size` (≤ 100), **tanpa cursor**; `courier`, `dateRange` (kedua batas eksklusif, UTC),
  `batchFilter` (`unpaid`, `error`, `active`, `delivered`, `undelivered`, `rts`, `reconciled` — counter > 0), `keyword` (nomor batch, teks polos),
  `address_id`. Respons: `count` total + `data[]` dengan `_id` (→ pay-unpaid & delete), `id` (nomor batch → `batch` di GET /order; bisa
  bersufiks `-1`), counter (`orders`, `error`, `unpaid`, `delivered`, `active`, `undelivered`, `rts`, `reconciled`), `totalToPay`,
  **`totalToPaySpecial`** (yang ditagih pay-unpaid), `address`, `isDraft`, `orderData[]` (`orderId`, `cnote_no`, `status`, `SPECIAL_INS`).
- **Hapus:** body `{ "courier": "JT", "id": "<_id atau nomor batch>" }` (nilai tunggal). ⚠️ Cek **`deletedCount`/`unDeletedCount`/`totalCount`**,
  bukan `success`. Hapus dua kali → `200` `deletedCount` 0. Draft → `isBatchDraft: true`. `courier` wajib selain JNE
  (tanpa itu `400 batch not found`). Kurir lain milik batch (lion/anteraja/pos/spx) → `404 Batch not found`.
- **Simulasi Status (sandbox saja):** `POST /order/simulation` body `{ "courier": "JNE", "orderId": "...", "statusCategory": "DELIVERED" }` (tepat satu dari `orderId`/`trackingId`, tepat satu dari `statusCategory`/`status`; nilai `ON DELIVERY` / `DELIVERED` / `RTS`). Mengirim satu webhook bila Webhook URL terpasang, sehingga alur buat order → simulasi → baca order bisa diuji tanpa kurir sungguhan. Butuh permission key **Check order status**. Error: `401` key/permission, `404` bukan sandbox / order tidak ditemukan / milik akun lain, `409` order sudah dihapus, `422` kurir/identifier/target tidak valid (dengan `supportedValues` untuk target). Produksi menjawab 404; Ninja tidak didukung.
### 9.5 Skor Penerima — `GET /getReceiverScoreByNumberUser?search={phone}`
- Riwayat penerima **lintas semua seller Mengantar**, per kurir, plus `summary`. Cukup key aktif + IP. **Produksi:** whitelist (`403`)
  dan **batas harian** sesuai volume order aktif (`429` sampai tengah malam WIB). **Sandbox:** terbuka, **data contoh** deterministik
  (nomor berakhiran `0` → bentuk "tanpa kurir").
- `search`: satu nomor; `08…`, `8…`, `62…`, `+62…` menemukan record yang sama (format tidak divalidasi). Hilang/kosong/daftar → `422`.
- Per kurir (`JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, `spx`; `{}` = tanpa data): `total`, `delivered`, `rts`,
  `undelivered` (hanya COD), `inProgress`, `value` (rupiah), `rate` (0–10 = 10 × delivered ÷ total).
- `summary.average_number` (rata-rata `rate` kurir yang punya transaksi, skala **0–10**, `null` bila tidak ada) dan `summary.average_score`
  (`A` ≥ 9 … `E-` < 1; diawali **`≈`** bila total transaksi < 4). Nomor tanpa transaksi tetap `200`, bukan 404.

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
- Hanya menerima **satu `orderId` per request** (`ORDER_ID`, bukan `_id`; array atau daftar dipisah koma/titik koma/spasi ditolak).
  Untuk banyak order: satu request per order.
- `courier` wajib (**case-insensitive** di sini), `format` wajib.
- Respons: `{ "success": true, "data": { "labelGenerationId": "6af6…", "status": "PENDING" } }` — **tidak pernah** ada `downloadUrl`,
  juga saat job aktif yang sama (order + format) dipakai ulang. Docs v2 tidak menyebut kode status; versi lama repo ini menulis 202 — terima 2xx.
- Order belum dibayar tetap diterima, tetapi label-nya berakhir `FAILED`.

**Daftar Format Label:**
| Format | Kurir yang Didukung |
|--------|---------------------|
| `normal-1`, `normal-2`, `normal-4`, `normal-6` | Semua kurir |
| `thermal-10x10`, `thermal-10x15`, `thermal-8x6` | Semua kurir |
| `thermal-new-10x10`, `thermal-new-10x15` | **Khusus order J&T (JT) atau SPX Express (`spx`)** |

Galat request: `400` (`orderId is required…`, `Only one orderId is allowed per request…`, `courier is required…`, `format is required…`,
`Invalid format`, `Format 'thermal-new-10x15' is only available for JT or SPX orders`), `404 Order not found` (atau bukan kurir itu),
`403 Order does not belong to this account`, `403 Not allowed`, `429 Print limit exceeded…`. Batas **8 aksi Print / 60 detik** dibagi
antara Seller Web dan Public API untuk akun induk yang sama.

### 10.2 Polling Status Label — `GET /label-generation/{labelGenerationId}`
```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/label-generation/66d84347d792a71058fd6c10'
```
- Endpoint ini read-only dan **tidak memakan kuota 8 print/menit**. Polling beberapa detik sekali; jangan kirim Request baru hanya untuk cek progres.
  Di sandbox label siap ± **25 detik**.
  - `PENDING` (antre/menunggu retry) / `PROCESSING`: polling lagi.
  - `COMPLETED`: ada `format` dan `downloadUrl` (berlaku **15 menit**; tiap poll memberi link baru). Unduh segera.
  - `FAILED`: baca `errorMessage`, perbaiki penyebab, lalu Request baru bila masuk akal. ⚠️ `FAILED` tetap `200` + `success:true` — kegagalan ada di `data.status`.
- `labelGenerationId` salah format / tidak ada / bukan milik akun → `404 Data not found`.

---

## 11. Arsitektur Webhook Resmi Mengantar

Mengantar kini menyediakan webhook berbasis push untuk memperbarui status pesanan secara real-time tanpa perlu polling `GET /order`.

### 11.1 Pendaftaran URL Webhook
Konfigurasikan Webhook URL Anda di:
**Dashboard Mengantar → Settings (Pengaturan) → Account (Akun) → Integrasi Public API**.
- Membutuhkan kode verifikasi saat menyimpan; **`Webhook Secret`** dibuat saat pertama kali disimpan.
- URL wajib HTTPS, tidak boleh menunjuk alamat internal, maks 512 karakter.
- **Produksi:** webhook diaktifkan per akun selama rollout bertahap (bagian Webhook baru muncul setelah akun diaktifkan).
  **Sandbox:** aktif untuk semua akun; uji status dengan `POST /order/simulation` (§9).

### 11.2 Payload yang Dikirimkan Mengantar
Mengantar mengirim `POST` dengan body JSON setiap kali status order berubah. Body nyata **selalu** membawa `service_code`
(mis. `REG`, atau `ECO` untuk J&T ECO; `null` bila order tanpa service code) — contoh di bawah menghilangkannya agar walkthrough
signature ringkas; signature tetap mencakup seluruh raw body yang Anda terima.
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

Kiriman dari **sandbox** membawa satu header tambahan, `x-environment: sandbox`; kiriman produksi tidak membawa header
`x-environment` sama sekali. Header ini **tidak** ikut ditandatangani. Tolak `x-environment: sandbox` di receiver produksi,
dan tetap gunakan Webhook URL terpisah per lingkungan.

### 11.3 Status Category Resmi
- **Yang paling sering:** `PENDING PICKUP`, `PICKED UP`, `ON DELIVERY`, `DELIVERED`, `UNDELIVERED`, `PICKUP FAILED`, `RTS`.
- **Dari Mengantar (tidak ada di sheet kurir):** `ACTIVE/WAITING NEXT PROCESS`, `ERROR`.
- Daftar **open-ended** dan beda per kurir ([Order Status Reference Sheet](https://docs.google.com/spreadsheets/d/1Z9MV8PEsqBCp7nNUyPdhypYSneVnzDR8pw3JDf6nQSw/edit?usp=sharing)) — selalu sediakan *default branch*.
- ⚠️ **Penanganan Pembatalan:** Tangani kedua ejaan pembatalan: `CANCELED` dan `CANCELLED`.
- Status mentah kurir sengaja **tidak** dikirim.

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
4. Gunakan `x-timestamp` untuk mencegah race condition dari event yang datang tidak berurutan karena retry; status yang sama bisa datang lebih dari sekali.
5. Redirect tidak diikuti. Setelah 3 retry gagal, update **tidak dikirim ulang**; selama di-*pause* update juga tidak dikirim ulang —
   rekonsiliasi lewat `GET /order`. Pause hanya memengaruhi webhook; API key tetap berfungsi.
6. Mengantar tidak mengirim dari IP tetap: **IP allowlist tidak mungkin**, secret adalah satu-satunya pembeda. Verifikasi bersifat
   opsional tapi sangat disarankan; tanpa verifikasi, minimal pakai path URL panjang yang tak bisa ditebak.
7. **Regenerate API key juga mengganti Webhook Secret** (URL tetap). Webhook Secret juga bisa di-regenerate sendiri tanpa mengubah key.

---

## 12. Kode Error Resmi

Docs v2 **tidak** memakai kode `X000`–`X003` (catatan ≤ 0.4.0 repo ini; halaman `/docs/v1` pun tidak lagi memuatnya).
Galat dibedakan lewat **HTTP status + `message`/`field`/`code`**:

| Kode | Arti | Tindakan |
|------|------|----------|
| `403` `Not allowed` | Key tidak dikenal/nonaktif, tanpa permission, IP di luar allowlist, atau endpoint whitelist | Konfigurasi — jangan retry; periksa key, permission, IP (CS) |
| `400` + `field` / `message` | Validasi (param wajib hilang, format salah) | Perbaiki payload, jangan retry tanpa perubahan |
| `422` | Validasi pada update alamat, skor penerima, simulasi, `IDEMPOTENCY_KEY_REUSED` | Perbaiki input |
| `409 Conflict` | Konkurensi batch JT Premium / SiCepat | Antrekan request, gabungkan order ke 1 batch array |
| `400`/`409`/`422`/`503` `IDEMPOTENCY_*` | Header `idempotencyKey` pada `POST /order` | Lihat §8.1a |
| `400` `COURIER_DISABLED` | Kurir dinonaktifkan (mis. `courier=Ninja`) | Hapus kurir dari opsi |
| `400` `Invalid courier` | Nilai `courier` di estimasi tidak dikenali (case-sensitive; termasuk semua ejaan SPX) — teramati live 2026-09-25 | Pakai nama shipment persis; SPX ambil dari `courier=all` |
| `429 Too Many Requests` | Limit cetak label (8 aksi/60 detik) atau batas harian skor penerima (produksi) | Kurangi laju; skor penerima reset tengah malam WIB |
| `500` `InternalError` | Body bukan JSON (performance, dropshipper) atau input non-string | Kirim JSON valid & tipe yang benar |

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
