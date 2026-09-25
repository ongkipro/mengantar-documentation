# Kurir, Batasan & Aturan Bisnis

Sumber: Dokumentasi resmi Mengantar API (2026) & analisis implementasi live.

---

## 1. Kurir yang Didukung & Pemetaan

Ada **tiga "ruang nama" kurir** yang berbeda dalam ekosistem Mengantar:

1. **Key Estimasi** — Key yang muncul di respon `/order/estimate?courier=all` (`response.data[KEY]`). Casing **campuran**
   dan berbeda dari nama shipment (mis. `SAP` vs `Sap`, `SAPLite`, `SapCargo`, `spx`). Plugin WooCommerce mencocokkan
   key dalam bentuk lowercase **[plugin]** — cocokkan key secara **case-insensitive** agar tahan perubahan casing.
2. **Nama Shipment** — Nilai string persis yang dikirimkan pada field `courier` di `POST /order`.
   **8 nilai resmi** (docs resmi): `"JNE"`, `"SiCepat"`, `"Sap"`, `"iDexpress"`, `"JT"`, `"lion"`, `"anteraja"`, `"pos"`,
   plus **`"spx"`** — dikonfirmasi support Mengantar, **belum** ada di docs resmi dan **belum teramati** di create-order live (lihat §1.2).
3. **Label Tampilan** — Nama ramah yang ditampilkan kepada pembeli di halaman checkout web/storefront.

### 1.1 Tabel Pemetaan Kurir Lengkap

Kolom *Key Estimasi* memakai casing persis dari respon live `GET /order/estimate?courier=all` (produksi, 2026-09-25).
Set key bisa berbeda per akun/rute — selalu iterasi `Object.entries(data)`, jangan hardcode.

| Key Estimasi (live) | Label Tampilan | Nama Shipment (`POST /order`) | Status & Tipe Layanan |
|---------------------|----------------|------------------------------|------------------------|
| `JNE` | JNE Express | `JNE` | Aktif (Regular) |
| `JNECargo` | JNE Trucking (JTR) | `JNE` + `cargo: true` | Aktif (Cargo) |
| `SiCepat` | SiCepat Ekspres | `SiCepat` | Aktif (Regular) |
| `SiCepatCargo` | SiCepat Cargo Kilat (Gokil) | `SiCepat` + `cargo: true` | Aktif (Cargo) |
| `SAP` | SAP Express | `Sap` | Aktif (Regular) |
| `SAPLite` | SAP Lite | `Sap` | Aktif (Lite) |
| `SapCargo` | SAP Cargo | `Sap` + `cargo: true` | Aktif (Cargo) |
| `iDexpress` | IDExpress | `iDexpress` | Aktif (Regular) |
| `iDexpressCargo` | IDExpress IDTruck | `iDexpress` + `cargo: true` | Aktif (Cargo) |
| `JT` | J&T Express | `JT` | Aktif (Regular) |
| `lion` | Lion Parcel | `lion` | Aktif (Regular) |
| `anteraja` | Anteraja | `anteraja` | Aktif (Regular) |
| `pos` | POS Indonesia | `pos` | **Aktif Resmi** (Regular) |
| `spx` | SPX Express (Shopee Express) | `spx` ⚠️ *dikonfirmasi support, belum teramati* | Aktif di estimasi (live 2026-09-25) |
| — *(dihilangkan dari `all`)* | Ninja Xpress | — | ❌ **Discontinued per 1 Sept 2026** |

> Key dari versi lama repo ini / plugin (`idlite`/`idl`, `paxel`, `wahana`) **tidak muncul** di respon
> `courier=all` 2026-09-25. Jika muncul di akunmu, perlakukan sebagai kurir tak dikenal sampai terverifikasi.

### 1.2 Catatan Khusus Ninja & SPX

1. **Ninja Discontinued:** Mulai **1 September 2026**, kurir Ninja resmi dihapus dari API publik Mengantar.
   Estimasi `courier=Ninja` → HTTP `400` `{"success":false,"message":"Courier is not available","code":"COURIER_DISABLED"}`;
   dengan `courier=all`, `Ninja`/`NinjaCargo` dihilangkan. Order/batch Ninja lama tetap bisa dibaca (docs resmi).
2. **SPX Express (Shopee Express) — tersedia di estimasi `all`** (live, produksi, 2026-09-25; read-only, tanpa order dibuat):
   - `courier=all` (dengan/tanpa `COD_AMOUNT`) mengembalikan key **`spx`**. Contoh Jakarta → Jakarta Selatan 1 kg:
     `price` 13700, `estimate_delivery` `"1 - 3 days"`, `estimatedDate` `"2-4 hari"`, `unsupported_cod: false`.
     Rute jauh (area Jayapura): `price` 34000, `"3 - 4 days"`, COD didukung.
   - Entri `spx` membawa **field tambahan** yang belum ada di docs resmi: `unsupportedOriginSpx`, `unsupportedPickup`,
     dan `pickupSchedule` (map `tanggal → [{ timeRangeId, start, end, timeEpoch }]`) — lihat
     [01-api-reference.md](01-api-reference.md) §5.1.
   - **`unsupportedOriginSpx: true` → perlakukan sama dengan `unsupported: true`** (origin tidak bisa dilayani SPX).
     Arti `unsupportedPickup` **belum dipastikan** **[verifikasi]** — teramati `false`; jangan tawarkan pickup SPX bila `true`.
   - **Kontradiksi estimasi single-courier:** `courier=<nama>` divalidasi *case-sensitive* terhadap **nama shipment**
     (`JT`, `Sap` → 200; `SAP`, `sap`, `jt` → 400 `Invalid courier`). **Semua** ejaan SPX yang dicoba (`spx`, `SPX`, `Spx`,
     `SPX Express`, `Shopee Express`, `ShopeeExpress`, `SPXExpress`, `shopee`, `Shopee`, `SPXID`, `spxid`, `ShopeeXpress`,
     `Shopee Xpress`, `SPX_EXPRESS`, `spx_express`, `spxexpress`) → `400 {"success":false,"message":"Invalid courier"}`.
     Jadi: **ambil tarif SPX hanya dari `courier=all`**.
   - **Create order:** support Mengantar mengonfirmasi SPX bisa dipakai di `POST /order` dengan `courier: "spx"`,
     tetapi **belum ada di docs resmi dan belum teramati** di create-order live **[verifikasi]**. Uji dulu dengan satu
     order sebelum mengaktifkan SPX di produksi. Batas COD, cargo, DG, dan `customProducts` untuk SPX belum diketahui.

---

## 2. Layanan Khusus: Dangerous Goods (DG) & Cargo

### 2.1 Dangerous Goods (Barang Berbahaya / Cairan / Aerosol / Baterai)
Untuk produk yang membutuhkan perlakuan khusus (Dangerous Goods):
- **Cek Ongkir:** Kirim query `isDangerousGoods=true` pada endpoint `/order/estimate`, `/allEstimatePublic`, atau `/allEstimate3PL`.
- **Create Order:** Set field `isDangerousGoods: true` (JSON Boolean) pada masing-masing item di `orders[]`.
- **Pemetaan Service Kurir DG:**
  | Kurir | Layanan Otomatis | Keterangan |
  |-------|------------------|------------|
  | `SiCepat` | `HALU` | Otomatis dialihkan ke armada SiCepat HALU |
  | `iDexpress` | `Regular service` | Dikirim via armada reguler berizin DG |
  | `JT` | `Regular DG` | Didukung resmi untuk pengiriman DG |
  *(Kurir lain belum mendukung bendera Dangerous Goods via public API).*

### 2.2 Pengiriman Kargo (`orders[].cargo`)
Untuk paket berukuran besar / grosir:
- Set field `cargo: true` pada `orders[]`.
- Kurir yang mendukung opsi cargo: **`JNE` (JTR), `SiCepat` (Gokil), `Sap` (SAP Cargo), `iDexpress` (IDTruck)**.

---

## 3. Batas Berat & Aturan COD (Cash on Delivery)

### 3.1 Batas Berat Layanan
- **Regular:** Maksimal 50 kg.
- **Cargo:** Maksimal 100 kg.
- **Lite:** Maksimal 0.5 kg (SAPLite, IDLite).
- Berat minimum yang dikirim ke API: **1 kg** (di-clamp `Math.max(1, weight)`).

### 3.2 Batas Nilai COD per Kurir
| Kurir | Min COD (IDR) | Max COD (IDR) | Catatan Khusus |
|-------|--------------:|--------------:|----------------|
| JNE | 1.000 | 5.000.000 | Mendukung COD Nasional |
| iDexpress | 1.000 | 5.000.000 | Mendukung COD Nasional |
| Lion Parcel | 10.000 | 5.000.000 | Min COD Rp 10.000 |
| SiCepat | 1.000 | 2.500.000 | Max COD Rp 2.500.000 |
| J&T (JT) | 1.000 | 2.000.000 | Max COD Rp 2.000.000 |
| AnterAja | 1.000 | 2.000.000 | Max COD Rp 2.000.000 |
| POS | 1.000 | 2.000.000 | Mengikuti coverage POS |
| SAP Cargo | — | — | ❌ **Tidak mendukung COD** |
| SPX (`spx`) | ? | ? | COD teramati didukung di estimasi (2026-09-25); batas belum diketahui **[verifikasi]** |

> ⚠️ Selalu evaluasi flag respon estimasi:
> - `unsupported: true` → Kurir tidak melayani wilayah tersebut.
> - `unsupported_cod: true` → Kurir dapat mengantar, tetapi **COD dilarang** di wilayah/layanan tersebut.
> - `unsupportedOriginSpx: true` (hanya entri `spx`) → origin tidak dilayani SPX; perlakukan seperti `unsupported: true`.

---

## 4. Konkurensi Batch (JT Premium & SiCepat)

Untuk kurir yang nomor resinya (`cnote_no`) di-generate berurutan di sisi server Mengantar:
- **Kurir terdampak:** **`JT Premium`** dan **`SiCepat`**. *(Ninja sudah discontinued)*.
- **Aturan Arsitektur:** **Hanya satu proses pembuatan batch order yang diizinkan berjalan dalam satu waktu per akun**.
- Jangan pernah menjalankan `POST /order` secara paralel/multithreaded untuk kurir-kurir ini.
- Gabungkan pesanan ke dalam satu array batch (`orders: [...]`). Jika sistem Anda mengirim request kedua sebelum request pertama tuntas, API akan mengembalikan **HTTP `409 Conflict`**:
  ```json
  { "success": false, "message": "Sedang ada proses pembuatan order... Mohon gabungkan semua order dalam 1 batch..." }
  ```

---

## 5. Invariant Data `customProducts`

Field `orders.customProducts[]` (didukung kurir `JNE`, `SiCepat`, `Sap`, `JNT`):
- Alias field yang diterima sistem:
  - Jumlah: `qty` / `quantity` / `orderQuantity`
  - Harga: `price` / `harga` / `regularPrice`
  - Berat: Default 1 kg jika tidak diisi.
- **Validasi Wajib Sistem:**
  - `orders.weight` harus sama persis dengan $\sum (\text{qty} \times \text{weight})$.
  - `orders.quantity` harus sama persis dengan $\sum (\text{qty})$.
  Jika terjadi selisih, request pembuatan order akan gagal validasi.

---

## 6. Jebakan Lingkungan Sandbox (Sandbox Traps)

Lingkungan Sandbox Mengantar (`https://sandbox.mengantar.com`) memiliki pembatasan khusus dari mitra ekspedisi:
1. **JNE Sandbox:** Origin *wajib* berlokasi di **Jakarta** (destination bebas). Origin luar Jakarta akan memicu error: `Content not confirm our security Policy`.
2. **SAP Sandbox:** Hanya mendukung rute **Jakarta → Jakarta** dan memblokir seluruh order COD. Rute lain memicu: `Service tidak ditemukan dalam kontrak`.
3. **Webhook Sandbox:** Notifikasi Webhook **belum aktif di sandbox** karena status order sandbox bersifat statis (tidak bergerak dari kurir nyata). Pengujian webhook disarankan menggunakan *Official Test Vector* atau di lingkungan staging produksi.

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
