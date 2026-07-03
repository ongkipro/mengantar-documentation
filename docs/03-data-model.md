# Data Model & Kamus Data

Dua lapis: **(A) objek order dari API Mengantar** (docs resmi — dipakai bila kamu membangun DB sendiri),
dan **(B) cara plugin WooCommerce menyimpannya** (`[plugin]` — referensi porting). Untuk skema DB baru
(Supabase/Postgres) di storefront Astro/Next.js, mulai dari **§0** (objek API), bukan meta plugin.

## 0. Objek order dari API (docs resmi)

Bentuk satu order pada response `POST /order` (per elemen `data[]`) dan `GET /order` — **inilah field
sebenarnya** yang dikembalikan Mengantar. Dikelompokkan agar mudah dipetakan ke kolom DB:

| Grup | Field API |
|------|-----------|
| **Identitas** | `_id`, `ORDER_ID`, `cnote_no` (resi), `batch`, `batch_id`, `MERCHANT_ID`, `user_id` |
| **Status** | `status`, `statusCategory`, `isPaid`, `isDraft`, `isDeleted`, `isArchived`, `lastStatusChange`, `history[]` |
| **Kurir/layanan** | `courier`*, `plan`, `SERVICE_CODE`, `PICKUP_SERVICE`, `PICKUP_VEHICLE`, `TYPE` (`PICKUP`/…), `zone`, `branch`, `branchOrigin` |
| **Pickup (origin)** | `PICKUP_NAME`, `PICKUP_PIC`, `PICKUP_PIC_PHONE`, `PICKUP_ADDRESS`, `PICKUP_DISTRICT`, `PICKUP_CITY`, `PICKUP_REGION`, `address_id`, `time_id` |
| **Pengirim (shipper)** | `SHIPPER_NAME`, `SHIPPER_ADDR1`, `SHIPPER_CITY`, `SHIPPER_ZIP`, `SHIPPER_REGION`, `SHIPPER_COUNTRY`, `SHIPPER_CONTACT`, `SHIPPER_PHONE` |
| **Penerima (receiver)** | `RECEIVER_NAME`, `RECEIVER_ADDR1`..`ADDR3`, `FULL_RECEIVER_ADDRESS`, `RECEIVER_SUBDISTRICT`, `RECEIVER_DISTRICT`, `RECEIVER_CITY`, `RECEIVER_ZIP`, `RECEIVER_REGION`, `RECEIVER_COUNTRY`, `RECEIVER_CONTACT`, `RECEIVER_PHONE`, `receiver_id` |
| **Wilayah (kode)** | `ORIGIN_CODE`, `DESTINATION_CODE` |
| **Paket** | `WEIGHT`, `QTY`, `GOODS_DESC`, `GOODS_AMOUNT` (nilai barang), `INSURANCE_FLAG`, `insuranceamount`, `SPECIAL_INS` (instruksi), `customProductOrderIds[]` |
| **COD & harga** | `COD_AMOUNT`, `COD_FLAG`, `COD_FEE`, `price`, `estimatedPrice`, `estimatedSpecialPrice`, `discount` |
| **Skor penerima** | `receiverScore` `{delivered, rts, undelivered, rate}` |
| **Data kurir** | `sapData` `{origin_branch_code, destination_branch_code, tlc_branch_code, label}` (khusus SAP) |
| **Waktu** | `createdDate`, `createdAt`, `updatedAt` |

\* `courier` di response = nama shipment (mis. `JNE`). Lihat [02-couriers-and-rules.md](02-couriers-and-rules.md).

### Skema DB minimal yang disarankan (Postgres/Supabase)

Simpan **field mentah penting + JSON blob** untuk audit. Contoh tabel `shipments`:

```sql
create table shipments (
  id               uuid primary key default gen_random_uuid(),
  app_order_id     text not null,                 -- id order di app-mu
  mgt_order_id     text unique,                   -- ORDER_ID dari Mengantar
  cnote_no         text,                          -- resi (null bila unpaid/pending)
  batch_id         text,
  courier          text not null,                 -- JNE | SiCepat | Sap | ...
  status           text,                          -- mentah dari API
  status_simple    text,                          -- DELIVERED | RTS | ON_GOING (turunan)
  is_paid          boolean default false,
  cod_amount       integer,                       -- 0 = non-COD
  price            integer,
  origin_id        text,                          -- address_id (pickup)
  destination_id   text,                          -- customerAddressDataId
  receiver_name    text,
  receiver_phone   text,
  receiver_city    text,
  weight_kg        numeric,
  raw              jsonb,                          -- simpan objek API penuh utk audit
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index on shipments (app_order_id);
create index on shipments (mgt_order_id);
create index on shipments (status_simple);
```

> **Aturan turunan `status_simple`:** map `status` API → `DELIVERED` / `RTS` / selain itu `ON_GOING`
> (lihat [01-api-reference.md](01-api-reference.md) §9.2). Tetap simpan `status` mentah + `raw` untuk detail.

---

## 1. Entri shipment (struktur inti) — [plugin]

Plugin menyimpan **array** shipment per order di meta `_wm_mengantar_shipments`. Satu order
bisa punya banyak shipment (multi-origin / multi-kurir / split paket). Bentuk satu entri:

```jsonc
{
  "courier": "JNE",                 // nama shipment (hasil map_courier_name_for_shipment)
  "order_id": "MGT-0001",           // ORDER_ID dari response Mengantar
  "tracking": "JNE0012345678",      // cnote_no (resi); null bila belum tersedia
  "status": "created",              // created | error | partial_error | pending_pickup_time
  "payment_status": "paid",         // paid | unpaid
  "error": "",                      // pesan error bila gagal
  "batch": "BATCH-XYZ",             // batch dari response
  "batch_id": "665f...",            // batch_id dari response
  "provenance": { /* lihat §2 */ }
}
```

### Status shipment

| Status | Arti |
|--------|------|
| `created` | Berhasil dibuat, ada `order_id` (dan biasanya `tracking`) |
| `error` | Gagal dibuat (lihat `error`) |
| `partial_error` | Sebagian item dalam batch gagal |
| `pending_pickup_time` | Dibuat tertunda; menunggu `time_id` dipilih lalu di-resume |

## 2. Provenance (jejak asal — untuk resume & audit)

Disimpan agar shipment yang `pending_pickup_time` bisa dibangun ulang tanpa membaca cart lagi.
Ini efektif adalah **snapshot semua input yang dibutuhkan `POST /order`**:

```jsonc
"provenance": {
  "shipping_item_ids": [12],
  "product_ids": [101, 102],
  "product_skus": ["SKU-A", "SKU-B"],
  "custom_products": [ /* name, qty, price, weight, variant */ ],
  "origin_address_id": "ORIGIN_ID",
  "destination_id": "DEST_ID",
  "customer_address_id": "DEST_ID",
  "customer_address": "Jl. ...",
  "customer_name": "Siti",
  "customer_phone": "0811...",
  "pickup_type": "scheduledPickup",
  "volume": "volumeMobil",
  "selected_time_id": "TIME_ID",   // diisi sebelum resume
  "is_cod": true,
  "weight": 2,
  "quantity": 1,
  "parcel_content": "Kaos katun",
  "cod_value": 165000,
  "goods_value": 150000
}
```

> Pelajaran desain: simpan cukup data untuk **membangun ulang request create-order** tanpa
> bergantung pada keranjang/sesi. Ini yang membuat retry & "pending pickup" aman.

## 3. Meta order (WooCommerce → konsep tabel `orders`/`order_meta`)

| Meta key | Isi |
|----------|-----|
| `_wm_mengantar_shipments` | Array entri shipment (sumber kebenaran utama) |
| `_wm_mengantar_order_id` | ORDER_ID shipment pertama (ringkas) |
| `_wm_mengantar_batch` / `_wm_mengantar_batch_id` | Batch terakhir |
| `_wm_mengantar_status` | Status ringkas |
| `_wm_mengantar_courier` | Kurir ringkas |
| `_wm_mengantar_error` | Error terakhir |
| `_wm_mengantar_poll_attempts` | Counter polling auto-tracking |
| `_wm_destination_address_id` | `destination_id` hasil pilihan district di checkout |
| `_wm_destination_address` | Alamat tujuan terformat (disimpan saat checkout) |
| `_wm_auto_shipment_scheduled` | Timestamp penjadwalan auto-shipment |
| `_wm_auto_shipment_status` | `processing` / `success` / `failed` / `error` |
| `_wm_auto_shipment_attempt` | Timestamp percobaan terakhir |
| `_wm_auto_shipment_error` | Error auto-shipment terakhir |
| `_wm_tracking_number` | (deprecated — resi lama, kini di array shipments) |

## 4. Meta produk (→ konsep tabel `products`)

| Meta key | Isi |
|----------|-----|
| `_mengantar_origin` | Array origin (multi-gudang) untuk produk |
| `_mengantar_origin_details` | Cache detail origin (label, autofill, nama, alamat, telepon) |
| `_mengantar_origin_autofill` | District/autofill ID origin |
| `_mengantar_origin_id` / `_mengantar_origin_label` | Origin tunggal (legacy) |
| `_mengantar_cod_override` | `yes`/`no` — pakai aturan COD per produk |
| `_mengantar_cod_fee_type` | `product_shipping` / `product_only` |
| `_mengantar_cod_fee_percent` | Persen fee COD |
| `_mengantar_cod_min_fee` / `_mengantar_cod_max_fee` | Batas fee COD |

Per produk juga bisa override `_mengantar_pickup_type` & volume pickup.

## 5. Meta item pengiriman (shipping line) — disisipkan di checkout

Saat order dibuat, plugin menempel meta ini ke shipping line item (dipakai untuk membuat shipment nanti):

| Meta | Isi |
|------|-----|
| `origin_id` | Origin terpilih (hasil origin optimizer) |
| `destination_id` | Hasil `search_address` |
| `kelurahan` | `SUBDISTRICT_NAME` |
| `kecamatan` | `DISTRICT_NAME` |
| `package_items` | JSON `[{key, product_id, variation_id, quantity}]` |
| `_wm_rate_meta_dump` | Field tambahan dari rate (cadangan) |

## 6. Data tujuan dari API itu "tidak standar" — perlu normalisasi

Field wilayah dari `/address/search` datang dalam beragam kapitalisasi/penamaan:
`DISTRICT_NAME` / `district_name` / `name`, `CITY_NAME` / `city`, `PROVINCE_NAME` / `province`, dst.

Khusus **provinsi**, nama dari API kadang tidak sama dengan label WooCommerce. Plugin punya
peta `PROVINCE_TO_WC_STATE` (di `district-enhancer`) untuk menyelaraskan. Contoh:

| Nama dari API | Kode WC |
|---------------|---------|
| `Nanggroe Aceh Darussalam (Nad)` / `Aceh` | `AC` |
| `DKI Jakarta` / `Jakarta Raya` | `JK` |
| `Daerah Istimewa Yogyakarta` | `YO` |
| `Kepulauan Bangka Belitung` | `BB` |
| `Papua Selatan/Tengah/Pegunungan` (provinsi baru 2022) | fallback `PA` |

> Implikasi untuk build sendiri: **selalu normalisasi** nama wilayah (lowercase, buang teks
> dalam kurung, trim) sebelum dicocokkan, dan siapkan tabel alias provinsi.

## 7. Kamus data shipment lengkap (dari kolom import/export)

Tool import/export plugin mengungkap **field selengkapnya** yang dilacak Mengantar per shipment —
berguna sebagai daftar kolom untuk tabel/laporanmu.

**Identitas & status:** `Order ID`, `Tracking ID`, `STT Number`, `Last Status`, `Last Update`,
`Last POD Status`, `Create Date`.

**Pengirim/penerima:** `Sender Name`, `Sender Phone`, `Resi Forward/Return`, `Assignee`.

**Paket:** `Weight`, `Quantity`, `Goods Description`, `Product Value`, `Harga Jual`, `COD`,
`Delivery Instruction`, `Estimated Delivery Date`, `Origin Code`, `Destination Code`.

**Keuangan:** `Shipping Fee`, `Shipping Discount`, `Shipping Fee Without Discount`,
`COD Fee (Inc VAT)`, `Estimated Pricing`, `Net Income`, `Return Fee`.

**Catatan:** `Remarks 1-3`, `Undelivered Notes/Dates`, `Undelivered Photo URL`.

### Kolom export "siap kirim Mengantar" (format CSV bulk)

Untuk membuat shipment massal via file, kolom minimal per baris:

| Kolom | Sumber |
|-------|--------|
| Nama Penerima | nama shipping |
| Alamat Penerima | alamat shipping baris 1 |
| Nomor Telepon | telepon billing |
| Kode Pos | kodepos shipping |
| Berat | total berat (kg) |
| Harga Barang (NON-COD) | total − ongkir − pajak |
| Nilai COD | total + ongkir + cod_fee (bila COD) |
| Isi Paketan | nama-nama produk |
| Kelurahan | meta `kelurahan` |
| Quantity | jumlah item |
| Instruksi Pengiriman | catatan customer (maks 60 char) |

> Multi-origin → tiap origin jadi baris/paket terpisah.

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
