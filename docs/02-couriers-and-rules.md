# Kurir, Batasan & Aturan Bisnis

Sumber: Dokumentasi resmi Mengantar API (2026) & analisis implementasi live.

---

## 1. Kurir yang Didukung & Pemetaan

Ada **tiga "ruang nama" kurir** yang berbeda dalam ekosistem Mengantar:

1. **Key Estimasi** — Key yang muncul di respon `/order/estimate?courier=all` (`response.data[KEY]`). Casing **campuran**
   dan berbeda dari nama shipment (mis. `SAP` vs `Sap`, `SAPLite`, `SapCargo`, `spx`). Plugin WooCommerce mencocokkan
   key dalam bentuk lowercase **[plugin]** — cocokkan key secara **case-insensitive** agar tahan perubahan casing.
2. **Nama Shipment** — Nilai string persis yang dikirimkan pada field `courier` di `POST /order`.
   **9 nilai resmi** (docs resmi, cek 2026-11-11): `"JNE"`, `"SiCepat"`, `"Sap"`, `"iDexpress"`, `"JT"`, `"lion"`, `"anteraja"`,
   `"pos"`, `"spx"`. Untuk `spx` create-order **belum teramati** live (lihat §1.2).
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
| `spx` | SPX Express (Shopee Express) | `spx` ⚠️ *ada di docs resmi; create-order belum teramati live* | Aktif di estimasi (live 2026-09-25) |
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
   - **Docs resmi (cek 2026-11-11)** kini mencantumkan `spx` di estimate, create order, pay-unpaid, delete dan simulasi,
     dengan batas: berat ≤ 50 kg, COD ≤ Rp5.000.000, nilai barang non-COD ≤ Rp10.000.000; `dropOff` hanya bila SPX Drop Off
     aktif di akun; slot pickup divalidasi ke jadwal live SPX. Create-order SPX **belum teramati** live **[verifikasi]**:
     uji satu order dulu. Hasil live 2026-09-25 (estimasi single-courier `400 Invalid courier`) belum dicek ulang
     setelah SPX masuk docs — tetap ambil tarif dari `courier=all` sampai terbukti lain.

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
  | `JT` | — | **[verifikasi]** Docs resmi tidak konsisten: deskripsi field Create Order menyebut `JT`, tabel DG Create Order hanya `SiCepat` & `iDexpress` |
  *(Estimasi menyebut SiCepat, SAP, IDExpress & J&T sebagai DG-capable, tetapi hanya `SiCepat` dan `iDexpress` konsisten di Create Order.
  Jangan tawarkan DG untuk `Sap` atau `JT` sebelum satu `POST /order` DG berhasil di sandbox: flag estimasi bisa lolos lalu order gagal
  `Dangerous goods service is not supported by courier …`. Cek ulang docs 2026-11-11.)*

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
| SPX (`spx`) | ? | 5.000.000 | Docs resmi (2026-11-11): COD ≤ Rp5.000.000, non-COD nilai barang ≤ Rp10.000.000, berat ≤ 50 kg; minimum COD belum diketahui **[verifikasi]** |

> ⚠️ Selalu evaluasi flag respon estimasi:
> - `unsupported: true` → Kurir tidak melayani wilayah tersebut.
> - `unsupported_cod: true` → Kurir dapat mengantar, tetapi **COD dilarang** di wilayah/layanan tersebut.
> - `unsupportedOriginSpx: true` (hanya entri `spx`) → origin tidak dilayani SPX; perlakukan seperti `unsupported: true`.

### 3.3 Kelayakan COD Pos Indonesia (per akun)

Docs resmi: COD `pos` hanya tersedia bila **delivered rate akun ≥ 82%**. Rate dihitung dari order **semua kurir**
yang dibuat dalam jendela bergulir **21–60 hari**. Non-COD `pos` **tidak** terpengaruh.

Kelayakan ini dicek saat `POST /order` COD dengan `courier: "pos"`, bukan dari flag estimasi — `unsupported_cod:false`
di estimasi **tidak** menjamin order COD POS diterima.

| `status` | HTTP | COD POS | `deliveredRate` berisi |
|----------|------|---------|------------------------|
| `eligible` | 200 | ✅ Tersedia | — (periode terakhir ≥ 82%) |
| `warning` | 200 | ✅ Masih tersedia | Rate aktual (periode terakhir < 82%, tapi tidak ketiga periode terakhir) |
| `new_seller` | **403** | ❌ Diblokir | `0` — akun belum punya riwayat kirim |
| `insufficient` | **403** | ❌ Diblokir | Rate keseluruhan akun — data belum cukup (belum ada periode, periode < 21 hari, atau kosong); bukan masalah performa |
| `blocked` | **403** | ❌ Diblokir | Rate aktual — **tiga periode evaluasi terakhir** semuanya < 82% |

Contoh body 403 (docs resmi):

```json
{ "success": false, "message": "Pos Indonesia COD is not available for this account",
  "status": "blocked", "deliveredRate": 70, "minimumDeliveredRate": 82 }
```

Ketiga status 403 memakai `message` yang sama — bedakan lewat field `status`.

> ⚠️ Docs resmi menjelaskan ambang blokir dengan dua kalimat berbeda: di bagian estimasi "masa tenggang tiga hari
> sebelum COD POS diblokir", di bagian kurir "diblokir setelah tiga periode evaluasi terakhir di bawah ambang".
> Tabel di atas mengikuti versi status yang lebih rinci. **[verifikasi]** mana yang berlaku.

#### Pola penanganan yang disarankan

1. **Kenali persis.** Perlakukan sebagai blokir COD POS hanya bila HTTP **403** *dan* `status` salah satu dari
   `new_seller`/`insufficient`/`blocked`. 403 lain tetap error biasa — jangan ubah kebijakan kurir karenanya.
   Client contoh menyediakan `posCodIneligibility(error)` ([examples](../examples/README.md)).
2. **Jangan retry.** Status baru berubah setelah periode evaluasi berikutnya; retry hanya menghasilkan 403 yang sama.
3. **Simpan alasan di order.** Order tetap *pending* (belum ada resi), dengan pesan yang menyebut status dan
   `deliveredRate` vs `minimumDeliveredRate`, agar operator tahu kenapa gagal dan apa langkahnya
   (ganti kurir atau jadikan non-COD, lalu kirim ulang).
4. **Berhenti menawarkan COD POS.** Karena estimasi tetap melaporkan `unsupported_cod:false`, filter checkout
   tidak akan tahu sendiri. Matikan COD untuk `pos` di kebijakan kurir aplikasi Anda saat blokir pertama terdeteksi,
   supaya pembeli berikutnya tidak membuat order COD POS yang pasti gagal. POS **non-COD tetap ditawarkan**.
5. **Aktifkan kembali secara manual.** Tidak ada endpoint untuk mengecek status kelayakan sebelum order, jadi
   operator yang menyalakan lagi COD POS setelah delivered rate pulih; order COD POS berikutnya menjadi pengujiannya.

Contoh (TypeScript, client contoh):

```ts
import { MengantarError, posCodIneligibility } from "./mengantar-client";

try {
  await client.createOrder(payload); // courier: "pos", order COD
} catch (e) {
  const pos = posCodIneligibility(e);
  if (pos) {
    await disableCodForCourier("pos");               // kebijakan kurir aplikasi Anda
    await markOrderPending(orderId,
      `COD Pos diblokir (${pos.status}, delivered rate ${pos.deliveredRate}% < ${pos.minimumDeliveredRate}%)`);
  } else if (e instanceof MengantarError) {
    // penanganan umum — lihat 08 §E
  }
}
``` POS juga butuh `pinpointData.lat`/`lng` valid pada alamat pickup untuk pickup terjadwal.

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

Lingkungan Sandbox Mengantar (`https://sandbox.mengantar.com`) memiliki pembatasan khusus dari mitra ekspedisi. Catatan
sandbox di docs resmi **hanya tampil di host sandbox** (`sandbox.mengantar.com/docs/`; di host produksi disembunyikan) — dicek 2026-11-11:
1. **JNE Sandbox:** Origin *wajib* berlokasi di **Jakarta** (destination bebas). Origin luar Jakarta akan memicu error: `Content not confirm our security Policy`.
2. **SAP Sandbox:** Hanya mendukung rute **Jakarta → Jakarta** dan memblokir seluruh order COD. Rute lain memicu: `Service tidak ditemukan dalam kontrak`.
3. **SPX Sandbox:** Hanya menerima origin **Jakarta**, dan sebagian destinasi yang didukung di produksi ditolak.
4. **Saldo sandbox:** pakai fitur **Top Up Saldo** di aplikasi sandbox, lalu bayar lewat Midtrans sandbox simulator (`https://simulator.sandbox.midtrans.com/`).
5. **Webhook Sandbox:** **aktif untuk semua akun** tanpa perlu diaktifkan (di produksi diaktifkan per akun). Kiriman sandbox membawa header `x-environment: sandbox` (tidak ikut ditandatangani) — tolak di receiver produksi, dan pakai URL terpisah per lingkungan.
6. **Simulasi status:** `POST /order/simulation` (sandbox saja) menggerakkan order ke `ON DELIVERY` / `DELIVERED` / `RTS` dan mengirim satu webhook, jadi alur end-to-end bisa diuji tanpa kurir sungguhan. Lihat [01 §9](01-api-reference.md).
7. **Endpoint whitelist terbuka di sandbox:** skor performa kurir dan skor penerima (`getReceiverScoreByNumberUser` memberi data contoh deterministik; nomor berakhiran `0` → bentuk "no valid courier").

*(Riwayat: versi ≤ 0.3.3 repo ini menyatakan webhook belum aktif di sandbox — sudah tidak berlaku.)*

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
