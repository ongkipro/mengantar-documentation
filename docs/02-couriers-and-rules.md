# Kurir, Batasan & Aturan Bisnis

Sumber: docs resmi Mengantar v2.0.0 (disinkronkan 2026-11-19; [snapshot](official-snapshot/README.md)) & pengamatan live.
Bila docs resmi dan catatan lama berbeda, docs resmi menang; catatan lama ditandai.

---

## 1. Kurir yang Didukung & Pemetaan

Ada **tiga "ruang nama" kurir** yang berbeda dalam ekosistem Mengantar:

1. **Key Estimasi** — Key yang muncul di respon `/order/estimate?courier=all` (`response.data[KEY]`). Casing **campuran**
   dan berbeda dari nama shipment (mis. `SAP` vs `Sap`, `SAPLite`, `SapCargo`, `JTEco`, `iDlite`). Plugin WooCommerce mencocokkan
   key dalam bentuk lowercase **[plugin]** — cocokkan key secara **case-insensitive** agar tahan perubahan casing.
2. **Nama Shipment** — Nilai string persis yang dikirimkan pada field `courier` di `POST /order` (case-sensitive).
   **9 nilai resmi** (docs v2): `"JNE"`, `"SiCepat"`, `"Sap"`, `"iDexpress"`, `"JT"`, `"lion"`, `"anteraja"`, `"pos"`, `"spx"`.
   Layanan seperti J&T ECO bukan nilai `courier` melainkan flag order (`eco: true` pada `JT`).
3. **Label Tampilan** — Nama ramah yang ditampilkan kepada pembeli di halaman checkout web/storefront.

### 1.1 Tabel Pemetaan Kurir Lengkap

Kolom *Key Estimasi* memakai casing persis dari docs v2 (dan respon live). `estimate?courier=all` = 14 key + `JTEco` bila ada;
`allEstimatePublic` / `allEstimate3PL` = 15 key (tambah `iDlite`) + `JTEco` (public: dengan `withCourierServices=true`).
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
| `iDlite` | IDLite | — *(tidak ada nilai `courier`)* | Hanya di estimasi publik/3PL; tidak bisa dipesan via Create order |
| `JT` | J&T Express | `JT` | Aktif (Regular, `SERVICE_CODE` `REG`) |
| `JTEco` | J&T ECO | `JT` + `eco: true` | Hanya rute dengan tarif ECO & bukan DG; `SERVICE_CODE` `ECO` |
| `lion` | Lion Parcel | `lion` | Aktif (Regular) |
| `anteraja` | Anteraja | `anteraja` | Aktif (Regular) |
| `pos` | POS Indonesia | `pos` | **Aktif Resmi** (Regular) |
| `spx` | SPX Express (Shopee Express) | `spx` | Aktif (estimasi single & `all`; create-order belum teramati live di repo ini) |
| — *(dihilangkan dari `all`)* | Ninja Xpress | — | ❌ **Discontinued per 1 Sept 2026** |

> Key lama dari plugin (`paxel`, `wahana`) tidak ada di docs v2. `iDlite` hanya muncul di estimasi publik/3PL.
> Key lain yang muncul di akunmu: perlakukan sebagai kurir tak dikenal sampai terverifikasi.

### 1.2 Catatan Khusus Ninja & SPX

1. **Ninja Discontinued:** Mulai **1 September 2026**, kurir Ninja resmi dihapus dari API publik Mengantar.
   Estimasi `courier=Ninja` → HTTP `400` `{"success":false,"message":"Courier is not available","code":"COURIER_DISABLED"}`;
   dengan `courier=all`, `Ninja`/`NinjaCargo` dihilangkan. Order/batch Ninja lama tetap bisa dibaca (docs resmi).
2. **SPX Express (Shopee Express).** Docs v2: estimasi single (`courier=spx`) dan `all`, create order, pay-unpaid, delete, simulasi.
   **Dicek ulang sandbox 2026-11-19: `courier=spx` → 200** dengan `pickupSchedule` — temuan `400 Invalid courier` di bawah sudah usang.
   Batas: berat 1–50 kg, COD ≤ Rp5.000.000, nilai barang non-COD Rp1.000–Rp10.000.000, berat < 1 kg ditagih 1 kg. `dropOff` hanya bila
   SPX Drop Off aktif; `time_id` harus di dalam slot `pickupSchedule` hari itu (di luar slot → 400 dengan daftar slot yang buka).
   Sandbox SPX hanya Jakarta (lihat §6).

   *Riwayat pengamatan live (produksi, 2026-09-25; read-only, tanpa order dibuat):*
   - `courier=all` (dengan/tanpa `COD_AMOUNT`) mengembalikan key **`spx`**. Contoh Jakarta → Jakarta Selatan 1 kg:
     `price` 13700, `estimate_delivery` `"1 - 3 days"`, `estimatedDate` `"2-4 hari"`, `unsupported_cod: false`.
     Rute jauh (area Jayapura): `price` 34000, `"3 - 4 days"`, COD didukung.
   - Entri `spx` membawa **field tambahan** yang belum ada di docs resmi: `unsupportedOriginSpx`, `unsupportedPickup`,
     dan `pickupSchedule` (map `tanggal → [{ timeRangeId, start, end, timeEpoch }]`) — lihat
     [01-api-reference.md](01-api-reference.md) §5.1.
   - **`unsupportedOriginSpx: true` → perlakukan sama dengan `unsupported: true`** (origin tidak bisa dilayani SPX).
     Arti `unsupportedPickup` **belum dipastikan** **[verifikasi]** — teramati `false`; jangan tawarkan pickup SPX bila `true`.
   - *(Usang)* Saat itu `courier=spx` dan semua ejaan SPX lain → `400 Invalid courier`. Dicek ulang 2026-11-19 di sandbox: `spx` → 200.
     Ejaan lain (`SPX`, `Spx`, …) tidak dicek ulang; karena validasinya case-sensitive (`SAP` → 400 masih teramati 2026-11-19), anggap ditolak.
   - Create-order SPX **belum teramati** live di repo ini **[verifikasi]**: uji satu order dulu.

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
  *(Docs v2 konsisten di semua halaman: **hanya `SiCepat` dan `iDexpress`** membawa DG; kurir lain mengembalikan
  `isDangerousGoodsSupported: false`. Catatan lama repo ini tentang `Sap`/`JT` sebagai DG-capable sudah tidak berlaku.)*
- DG tidak bisa digabung dengan `cargo` atau `eco`. Galat create order: `Dangerous goods cannot be combined with cargo service`,
  `Dangerous goods service is not supported by courier {courier}`, `Dangerous goods service is not available for destination of orders[{index}]`.

### 2.2 Pengiriman Kargo (`orders[].cargo`)
Untuk paket berukuran besar / grosir:
- Set field `cargo: true` pada `orders[]`.
- Kurir yang mendukung opsi cargo: **`JNE` (JTR), `SiCepat` (Gokil), `Sap` (SAP Cargo), `iDexpress` (IDTruck)**.

---

## 3. Batas Berat & Aturan COD (Cash on Delivery)

### 3.1 Batas Berat Layanan
Docs v2 (tabel *Courier limits* di Check Shipping Fee + Create order):
- `JT` menolak > **50 kg**; `anteraja`, `pos`, `spx` menerima **1–50 kg** (berat < 1 kg ditagih 1 kg). Kurir lain: tanpa batas berat sendiri di docs.
- Berat harus positif (negatif → `400`); desimal boleh di estimasi.
- Cargo: entri cargo membawa `minimumWeightCargo` (mis. 10 kg) di 3PL.
- *(Catatan lama [plugin]: regular ≤ 50 kg, cargo ≤ 100 kg, lite ≤ 0.5 kg, clamp minimum 1 kg — tidak ada di docs v2; pakai sebagai validasi aplikasi bila perlu.)*

### 3.2 Batas Nilai COD per Kurir
Sumber: tabel *Courier limits* docs v2 (Check Shipping Fee). Minimum COD **Rp1.000**, kecuali `lion` **Rp10.000**.

| Kurir | Max COD (IDR) | Berat | Nilai barang non-COD |
|-------|--------------:|-------|----------------------|
| `JNE` | 5.000.000 | — | — |
| `SiCepat` | 5.000.000 | — | — |
| `Sap` | 2.000.000 | — | — |
| `iDexpress` | 5.000.000 | — | — |
| `JT` | 5.000.000 | ≤ 50 kg (create order) | — |
| `lion` | 5.000.000 (min 10.000) | — | — |
| `anteraja` | 2.000.000 | 1–50 kg | Rp1.000–Rp10.000.000 |
| `pos` | 2.000.000 | 1–50 kg | Rp1.000–Rp10.000.000 |
| `spx` | 5.000.000 | 1–50 kg | Rp1.000–Rp10.000.000 |

> ⚠️ **Koreksi 0.5.0:** versi lama repo ini menulis SiCepat ≤ 2,5 jt dan J&T ≤ 2 jt — docs v2 menyatakan **5 jt** untuk keduanya,
> dan `Sap` ≤ 2 jt. Baris lama "SAP Cargo tidak mendukung COD" berasal dari plugin **[plugin]** dan tidak ada di docs v2.
> Estimasi hanya menegakkan sebagian batas (`anteraja`/`pos`/`spx` > 50 kg dan `spx` COD di atas maks → `unsupported:true`, `price` 0);
> **Create order menolak COD di atas maksimum kurir**.

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

> ⚠️ Docs v2 masih menjelaskan ambang blokir dengan dua kalimat berbeda: Check Shipping Fee "masa tenggang tiga hari
> sebelum COD POS diblokir", Create order "diblokir setelah tiga periode evaluasi terakhir di bawah ambang".
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

Field `orders.customProducts[]` (docs v2 tidak membatasi kurir; produk tercetak di tabel produk label). Item: `name` dan `qty` **wajib**,
`variant`, `price`, `weight` opsional. *(Catatan lama "hanya JNE, SiCepat, Sap, JNT" berasal dari plugin **[plugin]**.)*
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

Lingkungan Sandbox Mengantar (`https://sandbox.mengantar.com`) memiliki pembatasan khusus dari mitra ekspedisi. Docs v2 (2026-11-19)
menampilkan catatan sandbox yang **sama di host produksi dan sandbox** (Markdown per halaman, blok `[!SANDBOX]`).
Key sandbox dan produksi **terpisah**: key produksi di host sandbox → `403 Not allowed` (teramati 2026-11-19).
1. **JNE Sandbox [arsip ≤ 0.4.0]:** Origin *wajib* **Jakarta** (`Content not confirm our security Policy`). Tidak lagi tercantum di docs v2 — perlakukan sebagai belum diverifikasi ulang.
2. **SAP Sandbox [arsip ≤ 0.4.0]:** Hanya **Jakarta → Jakarta**, tanpa COD (`Service tidak ditemukan dalam kontrak`). Tidak lagi tercantum di docs v2.
3. **SPX Sandbox (docs v2):** pickup **dan** tujuan harus area **Jakarta**. Di luar itu order **tetap dibuat (200)** lalu `status:"error"` dengan
   pesan SPX, mis. `station not FIRST_MILE_HUB or DC or AM_HUB…` (pickup) atau `buyer address not support delivery` (tujuan). Tidak terjadi di produksi.
4. **Saldo sandbox:** pakai fitur **Top Up Saldo** di aplikasi sandbox, lalu bayar lewat Midtrans sandbox simulator (`https://simulator.sandbox.midtrans.com/`).
5. **Webhook Sandbox:** **aktif untuk semua akun** tanpa perlu diaktifkan (di produksi diaktifkan per akun). Kiriman sandbox membawa header `x-environment: sandbox` (tidak ikut ditandatangani) — tolak di receiver produksi, dan pakai URL terpisah per lingkungan.
6. **Simulasi status:** `POST /order/simulation` (sandbox saja) menggerakkan order ke `ON DELIVERY` / `DELIVERED` / `RTS` dan mengirim satu webhook, jadi alur end-to-end bisa diuji tanpa kurir sungguhan. Lihat [01 §9](01-api-reference.md).
7. **Endpoint whitelist terbuka di sandbox:** skor performa kurir dan skor penerima (`getReceiverScoreByNumberUser` memberi data contoh deterministik; nomor berakhiran `0` → bentuk "no valid courier"). Batas harian skor penerima juga tidak berlaku di sandbox.
8. **Order hasil simulasi tidak bisa dihapus** (`deletedCount` 0) — simulasikan hanya order yang ingin disimpan.
9. Estimasi `pos` di sandbox tetap memberi harga untuk berat > 50 kg (produksi: `unsupported`). Skor performa kurir sandbox dari data non-produksi.

*(Riwayat: versi ≤ 0.3.3 repo ini menyatakan webhook belum aktif di sandbox — sudah tidak berlaku.)*

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
