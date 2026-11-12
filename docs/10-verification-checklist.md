# Checklist Verifikasi (saat API key tersedia)

Hal-hal yang harus dikonfirmasi dengan akun/sandbox. Jalankan cURL di
[09-curl-examples.md](09-curl-examples.md), tempel response apa adanya, lalu perbarui
[01-api-reference.md](01-api-reference.md) / [03-data-model.md](03-data-model.md).

> Cara pakai: centang `[x]` bila sudah diverifikasi, isi blok "Hasil" dengan JSON nyata (redaksi data pribadi).

## 0. Sudah dikonfirmasi via docs resmi ✅

Dicocokkan dengan `https://api-public.mengantar.com/docs/` — **tidak perlu** diverifikasi ulang (kecuali ingin cek nilai nyata):

- ✅ Daftar endpoint (25) + method + parameter — lihat [01](01-api-reference.md) §2.
- ✅ Kode error resmi: `X000`, `X001`, `X002`, `X003`, `409 Conflict` (konkurensi batch JT/SiCepat), `429 Too Many Requests`.
- ✅ `POST /time`: `date` = **`mm-dd-yyyy`**, `time` = slot `9:00`–`18:00`.
- ✅ `courier` param estimate default = `JNE`; nilai `all` → map per kurir.
- ✅ `COD_AMOUNT` (huruf besar) = Nilai Barang + Ongkir; matriks `unsupported`/`unsupported_cod`.
- ✅ `customProducts` hanya JNE/SiCepat/Sap/JNT; aturan Σweight & Σqty.
- ✅ Saldo kurang → order unpaid → `POST /order/pay-unpaid`.
- ✅ Webhook resmi didukung penuh: verifikasi signature HMAC-SHA256 (`x-timestamp`, `x-signature`) over `${timestamp}.${raw_body}`.
- ✅ Ninja Xpress discontinued per 1 September 2026 (`courier=Ninja` → `400 COURIER_DISABLED`); POS Indonesia aktif.
  SPX kini **tercantum** di docs resmi (cek 2026-11-11); temuan live §0d (2026-09-25) belum dicek ulang.
- ✅ Modul Dropshipper (`POST /dropshippers`, `GET /dropshippers`) & Update/Delete Pickup Address.
- ✅ Async Label Generation (`POST /label-generation`, `GET /label-generation/{id}`) dengan rate-limit 8/menit.

**Masih perlu akun asli:** stabilitas `destination_id` lintas waktu, perilaku create-order nyata di akun sandbox Anda.

## 0b. Diverifikasi LIVE ✅ (2026-07-03, akun produksi read-only)

Smoke-test `make smoke` dengan key `API-…` nyata:

- ✅ **Base URL produksi** `https://api-public.mengantar.com` — **bekerja** (bukan lagi asumsi plugin).
- ✅ Format key: `API-XXXXXXXXXXXXXXXX`. Key valid → estimate dummy `success:true`.
- ✅ **`estimate.origin_id`/`destination_id` = `_id` WILAYAH** (dari `/address/search`), **bukan** `_id` alamat
  pickup. Memakai pickup `_id` → `success:false`. Origin asal = `PICKUP_AUTOFILL` alamat pickup.
- ✅ `estimate?courier=all` mengembalikan **~14–15 key kurir** (JNE, JNECargo, JT, Ninja, SAP, SAPLite,
  SapCargo, SiCepat, SiCepatCargo, anteraja, iDexpress, iDexpressCargo, lion, paxel, pos). *(Set per 2026-09-25: lihat §0d.)*
- ✅ `/address/search`, `/address`, `/invoices` (ada `count` & `balance`), `/my-users` (`_id,name,email,…`),
  `/batch`, `/order` (list) — semua `success:true`. Order record punya `FULL_RECEIVER_ADDRESS`.
- ✅ `/time?address=<pickup _id>` `success:true` (pakai `_id` objek alamat pickup, bukan wilayah).

**Belum diuji (butuh tulis/sandbox):** `POST /order` nyata, `pay-unpaid`, `DELETE /order|batch`,
`DELETE /time` (plugin-only), konkurensi `409`.

## 0c. Re-verifikasi LIVE ✅ (2026-07-19, produksi — integrasi Formalin)

Dikonfirmasi ulang langsung terhadap API produksi saat membangun integrasi live:

- ✅ **Base URL produksi** `https://api-public.mengantar.com` — masih bekerja live (bukan asumsi plugin).
- ✅ `GET /order/estimate?courier=all` → `data` adalah **objek/map di-key nama kurir** (`JNE`, `SAPLite`,
  `iDexpress`, dst), **bukan array**. Tiap value = `{ price, estimatedPrice, estimatedSpecialPrice,
  unsupported, unsupported_cod, … }`. Contoh Jakarta→Bandung 1 kg: `SAPLite.estimatedSpecialPrice` ≈ 8050,
  `iDexpress.estimatedPrice` ≈ 10000, `JNE.estimatedPrice` 12000.
- ✅ **Tidak ada field ETD/durasi** di response `/order/estimate` — hanya harga; label estimasi waktu antar
  harus disediakan konsumen. (`estimatedDate`/`estimate_delivery` hanya ada di `/allEstimate*`.)
  *(Diperbarui 2026-09-25: entri `spx` membawa `estimate_delivery` & `estimatedDate` — lihat §0d.)*
- ✅ `estimatedSpecialPrice` = harga diskon (berbasis volume akun); `estimatedPrice` = harga standar/akhir.
- ✅ `GET /address/search` record memuat `_id`, `COUNTRY_NAME`, `PROVINCE_NAME`, `CITY_NAME`,
  `DISTRICT_NAME`, `SUBDISTRICT_NAME`, `ZIP_CODE`, `DESTINATION_CODE`.
- ✅ Aturan dua "origin" ID di-affirm ulang: `estimate.origin_id`/`destination_id` = `_id` WILAYAH dari
  `/address/search`, **bukan** `_id` objek alamat pickup.

## 0d. Re-verifikasi LIVE ✅ (2026-09-25, produksi, read-only — tanpa order dibuat)

- ✅ `GET /order/estimate?courier=all&weight=1` (dengan & tanpa `COD_AMOUNT=100000`) mengembalikan key:
  `JNE`, `JNECargo`, `SiCepat`, `SiCepatCargo`, `SAP`, `SAPLite`, `SapCargo`, `iDexpress`, `JT`, `lion`,
  `iDexpressCargo`, `anteraja`, **`spx`**, `pos`. Tidak ada key Ninja (konsisten dengan discontinued 1 Sept 2026);
  `paxel` juga tidak muncul.
- ✅ Entri **`spx`** (Jakarta → Jakarta Selatan): `price` 13700, `estimate_delivery` `"1 - 3 days"`, `estimatedDate`
  `"2-4 hari"`, `codFee` 3329, `unsupported_cod:false`, plus field baru `unsupportedOriginSpx`, `unsupportedPickup`,
  `pickupSchedule`. Rute jauh (area Jayapura): `price` 34000, `"3 - 4 days"`, COD didukung. Contoh JSON: [01](01-api-reference.md) §5.1.
- ✅ Estimasi single-courier **case-sensitive** terhadap nama shipment: `JT`, `Sap` → 200; `SAP`, `sap`, `jt` →
  `400 {"success":false,"message":"Invalid courier"}`. Semua 16 ejaan SPX yang dicoba → `400 Invalid courier`
  (daftar: [02](02-couriers-and-rules.md) §1.2).
- ⚠️ `…/order/allEstimatePublic` dengan parameter yang sama → `404 {"success":false,"message":"Not Found"}` pada akun
  ini. Belum dipastikan global.
- ℹ️ Support Mengantar mengonfirmasi `POST /order` dengan `courier: "spx"` didukung, dan docs resmi kini mencantumkannya (cek 2026-11-11) — **belum teramati** live.

**Masih terbuka (SPX):**
- [ ] `POST /order` dengan `courier: "spx"` — respon nyata, `cnote_no`, status awal.
- [ ] Arti `unsupportedPickup` dan hubungan `pickupSchedule` dengan `pickup.time_id` / `POST /time`.
- [ ] Minimum COD SPX, dukungan `cargo`, `isDangerousGoods`, `customProducts` untuk SPX (batas maksimum dan format label `thermal-new-*` untuk SPX sudah ada di docs resmi 2026-11-11).
- [ ] Ulangi estimasi single-courier `courier=spx`: docs resmi kini mencantumkannya, live 2026-09-25 menjawab `400 Invalid courier`.
- [ ] Nilai `courier` SPX di tracking/webhook/list order (`spx`?).
- [ ] Path `allEstimatePublic` yang dipakai saat `404` — ulangi dengan path resmi tanpa key (`/api/order/allEstimatePublic`).

## 1. Kredensial & lingkungan
- [ ] Dapatkan **API key produksi**.
- [ ] Dapatkan **sandbox key** + konfirmasi host `https://sandbox.mengantar.com` aktif.
- [ ] Konfirmasi ID origin/destination sandbox untuk testing (atau buat sendiri).
- [ ] Perilaku saat key salah: `success:false`? HTTP berapa? (401/200?)

```
Hasil:

```

## 2. Schema response (rekam JSON nyata)
- [ ] `GET /` (ping) — bentuk response.
- [ ] `GET /address/search` — semua field item (`id` vs `_id`, `*_NAME`, `zip`, dll) + tipe.
- [ ] `GET /address` — semua field alamat pickup.
- [ ] `GET /order/estimate` (single & `all`) — field per kurir lengkap (`price`, `estimatedSpecialPrice`, `estimate_delivery`, `estimatedDate`, `unsupported`, `unsupported_cod`, `discount`, `origin_data`, dll).
- [ ] `POST /order` — bentuk lengkap `data[]` (`ORDER_ID`, `cnote_no`, `status`, `statusCategory`, `isPaid`, `error`) + `batch`/`batch_id`/`errors[]`.
- [ ] `GET /order?order_id=` & `?tracking_id=` — field tracking + struktur `history[]`.
- [ ] `GET /time` — field slot (`time_id`?, `date`, `time`, label).
- [ ] `GET /invoices` — struktur lengkap.

```
Hasil (per endpoint):

```

## 3. Perilaku HTTP & error
- [ ] Status code untuk sukses (selalu 200?) dan untuk error (4xx/5xx?).
- [ ] Isi nyata `message`, `errors`, `errorsFront` saat gagal (mis. kurir unsupported, COD over limit).
- [ ] Pesan/format error spesifik "pickup time rejected" (untuk deteksi pending).
- [ ] Rekam body **403 COD POS** asli (`new_seller`/`insufficient`/`blocked`) dan pastikan field `status`, `deliveredRate`, `minimumDeliveredRate` sesuai docs resmi; cek juga apakah blokir berlaku setelah "masa tenggang 3 hari" atau "tiga periode evaluasi" (docs resmi menyebut keduanya).
- [ ] Apakah ada **rate limit**/kuota? Header (`X-RateLimit-*`)? Respon saat terlampaui?

```
Hasil:

```

## 4. Aturan & enum yang perlu dikonfirmasi
- [ ] Nilai `type` pickup yang diterima server: `scheduledPickup` vs `scheduled`? `dropOff` vs `dropoff`?
- [ ] Nilai `volume` yang valid (`volumeMotor/Mobil/Truck`) — apakah memengaruhi harga/validasi?
- [ ] Format `customerPhone` yang diterima (awalan `0` / `62` / `+62`?). Plugin: digit, maks 15.
- [ ] Panjang alamat minimum sebenarnya (plugin pakai konstanta 10; ada jejak 15 di Blocks).
- [ ] Field `assignee`: format nilai & efeknya.
- [ ] Apakah `goodsValue` & `COD` benar-benar mutually exclusive di server?
- [ ] Daftar courier key yang benar-benar dikembalikan untuk akunmu (vs whitelist plugin).

```
Hasil:

```

## 5. Webhook vs polling
- [x] Mengantar menyediakan **webhook** status (docs resmi) — HMAC-SHA256, lihat [01](01-api-reference.md) §11.
- [ ] Terima satu event webhook nyata di produksi dan cocokkan payload dengan [03](03-data-model.md).
- [ ] Pastikan polling (`/order?order_id=`) + backoff tetap memadai sebagai fallback/rekonsiliasi.

```
Hasil:

```

## 6. Alamat & wilayah
- [ ] Apakah `destination_id` stabil lintas waktu (boleh disimpan) atau bisa berubah?
- [ ] Variasi nama provinsi/kota yang muncul untuk wilayah yang kamu layani (lengkapi tabel alias di [03-data-model.md](03-data-model.md) §6).
- [ ] Apakah `/address/search` mendukung pencarian by kodepos / kombinasi?

```
Hasil:

```

## 7. Operasional
- [ ] Konfirmasi endpoint estimasi mana yang dipakai untuk akunmu: `/order/estimate` vs `allEstimate3PL` vs `allEstimatePublic` (perbedaan hasil/akses).
- [ ] TTL caching aman (plugin pakai 5–10 menit) — apakah harga sering berubah?
- [ ] Halaman tracking publik Mengantar: format URL untuk ditautkan ke customer.

```
Hasil:

```

---

### Setelah verifikasi
Perbarui dokumen ini → pindahkan temuan ke `01`/`03`, dan tandai versi: "Diverifikasi dengan
akun X pada tanggal Y (mode sandbox/produksi)". Hapus catatan "tebakan/perlu verifikasi" yang sudah terbukti.

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
