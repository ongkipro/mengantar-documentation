# Mengantar API - Dokumentasi Integrasi

Dokumentasi ini hasil **membedah plugin WooCommerce "Woo Mengantar" v1.0.32** secara menyeluruh
(API client, shipment handler, rate engine, automation, hooks, admin, import/export), disusun ulang
sebagai referensi netral agar bisa dipakai membangun storefront/backend sendiri dengan **Astro**
atau **Next.js** — tanpa WordPress.

Mengantar.com adalah agregator ongkir & pembuatan shipment multi-kurir Indonesia
(JNE, SiCepat, J&T, AnterAja, Ninja, Lion Parcel, ID Express, SAP, dll).

> Status: **belum** ada akun/API key Mengantar. Dokumen ini fokus pada *cara kerja* & *jalur API*.
> Begitu key tersedia, verifikasi struktur response (terutama create-order & tracking) di mode sandbox.

## Daftar Isi (urutan baca disarankan)

| File | Isi |
|------|-----|
| [01-api-reference.md](01-api-reference.md) | Referensi REST lengkap: base URL, auth, **semua endpoint**, query, request & response (akurat), cek koneksi, caching |
| [02-couriers-and-rules.md](02-couriers-and-rules.md) | Kurir (3 ruang-nama + tabel pemetaan lengkap), batas berat/COD, rumus fee COD, volumetrik, pickup, sandbox |
| [03-data-model.md](03-data-model.md) | Kamus data: struktur entri shipment, provenance, meta order/produk, normalisasi wilayah, kolom import/export |
| [04-how-it-works.md](04-how-it-works.md) | Arsitektur & alur: checkout→rate, order→shipment (queue), origin optimizer, polling tracking, endpoint internal, keamanan |
| [05-integration-astro.md](05-integration-astro.md) | Pola integrasi Astro (client server-only + endpoints + komponen) |
| [06-integration-nextjs.md](06-integration-nextjs.md) | Pola integrasi Next.js (App Router: Route Handlers / Server Actions) |

## Ringkasan cepat

- **Base URL produksi:** `https://api-public.mengantar.com`
- **Base URL sandbox:** `https://sandbox.mengantar.com`
- **Autentikasi:** API key di **path URL**, bukan header:
  `{BASE_URL}/api/public/{API_KEY}/{endpoint}` → **wajib di-proxy lewat server**, jangan dari browser.
- **Format response:** JSON, selalu ada flag `success` (boolean). Error:
  `{ "success": false, "message": "...", "errors": ..., "errorsFront": "...", "courier": "..." }`
- **Endpoint inti:** `/address/search`, `/address`, `/order/estimate` (+ `allEstimate3PL`/`allEstimatePublic`),
  `/order` (POST create), `/order?tracking_id=` / `?order_id=`, `/time` (jadwal pickup), `/invoices`.

### Alur inti

1. Cari wilayah tujuan → `destination_id` (`/address/search`)
2. Estimasi ongkir per kurir (`/order/estimate?courier=all`)
3. (Bila dijemput) pilih jadwal pickup → `time_id` (`/time`)
4. Buat shipment (`POST /order`) → ambil **`cnote_no`** (resi) + **`ORDER_ID`**
5. Lacak status (`/order?order_id=`/`?tracking_id=`), polling dengan backoff bila resi belum keluar

### Catatan penting hasil pembedahan

- Tracking number = field **`cnote_no`** (bukan `tracking_id`); response create `data` berupa **array**.
- Nilai `courier` untuk create order memakai **8 nama resmi** (`JNE`, `SiCepat`, `Sap`, `iDexpress`,
  `JT`, `Ninja`, `lion`, `anteraja`) — beda dari key estimasi yang punya banyak varian.
- Nilai `COD` per item = nilai barang + porsi ongkir + porsi fee COD (proporsional).
- Nama wilayah dari API **tidak standar** → wajib dinormalisasi (lihat 03 §6).
- Tidak ada endpoint validasi key khusus — plugin memakai estimate dummy (lihat 01 §10).

> ⚠️ API ini tidak punya dokumentasi publik resmi. Semua di sini diturunkan dari kode plugin.
> Field yang dipakai plugin sudah dikonfirmasi dari kode; field lain mungkin ada tapi tak terpakai.
> Verifikasi dengan akun + sandbox sebelum produksi.
