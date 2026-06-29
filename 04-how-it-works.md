# Cara Kerja: Arsitektur & Alur

Dokumen ini menjelaskan **bagaimana plugin mengorkestrasi API Mengantar** dari ujung ke ujung —
supaya kamu bisa meniru alurnya di Astro/Next.js tanpa WordPress.

## 1. Peta tinggi

```
                 ┌──────────────────────────────────────────────┐
                 │                Mengantar API                  │
                 │  /address/search  /order/estimate  /order ... │
                 └───────▲───────────────▲──────────────▲────────┘
                         │               │              │
          (autocomplete) │      (rates)  │   (create)   │ (tracking poll)
                         │               │              │
   ┌─────────────────────┴───────────────┴──────────────┴───────────────┐
   │                         Lapisan server (plugin)                     │
   │  Checkout → Origin Optimizer → Rate → simpan meta                  │
   │  Order "processing" → Auto-Shipment (queue) → create_order         │
   │  Setelah create → Auto-Tracking (cron, backoff) → update resi      │
   └─────────────────────────────────────────────────────────────────────┘
```

Prinsip kunci: **API key tak pernah ke browser**; semua panggilan API lewat server, dengan
caching GET dan redaksi key di log.

## 2. Alur A — Checkout & estimasi ongkir

Urutan saat customer mengisi checkout:

1. **Pilih wilayah tujuan.** Field district kustom (`woo-mengantar/location`) memanggil
   `/address/search` (via AJAX proxy) → simpan `destination_id` ke sesi (`custom_destination_id`).
   Nama provinsi dari API dinormalisasi ke kode WC (lihat [03-data-model.md](03-data-model.md) §6).
2. **Split keranjang per origin.** `WM_Origin_Optimizer` menentukan origin tiap produk:
   - Kumpulkan origin kandidat tiap produk (meta produk → fallback origin global).
   - Bila multi-origin: buat kombinasi (maks 100), ambil rate tiap origin, pilih **kombinasi termurah**
     (`WM_Shipping_Cost_Calculator`). Hasil disimpan di sesi.
3. **Hitung berat** (aktual, atau volumetrik `P×L×T/divisor` bila diaktifkan; pakai yang lebih besar).
4. **Estimasi ongkir.** Untuk tiap paket: `check_shipping_fee({origin_id, destination_id, courier, weight, cod_amount})`.
   - `courier=all` + opsi 3PL → endpoint `/api/order/allEstimate3PL`, selain itu `/order/estimate`.
   - `cod_amount` hanya dikirim bila metode bayar COD.
5. **Filter & tampilkan rate.** Buang kurir `unsupported`, `price<=0`, di luar whitelist,
   atau melanggar batas berat/COD. Pakai `estimatedSpecialPrice ?? price`. Tambah fee COD bila perlu.
6. **Simpan meta** ke shipping line (origin_id, destination_id, kelurahan, kecamatan, package_items)
   agar siap dipakai membuat shipment.

> Rate & lookup alamat di-cache (5–10 menit) agar checkout tidak memanggil API berulang.

## 3. Alur B — Order → buat shipment

Pembuatan shipment **tidak terjadi saat checkout**, melainkan saat order berubah status:

1. **Trigger.** Hook `woocommerce_order_status_processing` / `order_status_changed`. Plugin cek
   `can_auto_create()`: auto-create aktif? status termasuk pemicu? bukan COD yang di-skip?
   belum ada shipment? metode pengiriman cocok whitelist?
2. **Antre (queue), bukan langsung.** Pakai Action Scheduler: `as_schedule_single_action(now + delay,
   'wm_auto_create_shipment', {order_id})`, delay default **60 detik**, dengan pencegahan duplikat.
   → Andal terhadap lonjakan & retry; tidak memblokir request checkout.
3. **Eksekusi.** Worker memanggil `WM_Shipment_Handler::create_shipment($order)`:
   - Bangun item `orders[]` dari line item + meta + provenance.
   - **Group** item menjadi shipment berdasar `courier|pickup_type|origin|time_id`, dedup item identik.
   - Tentukan `pickup` (type, address_id, time_id, volume). Bila `scheduledPickup` butuh `time_id`:
     pilih jadwal yang ada (`/time`), atau auto-buat (`POST /time`), atau tandai `pending_pickup_time`.
   - Panggil `POST /order` per group. `courier` dipetakan ke nama shipment resmi.
4. **Simpan hasil.** Dari response (`data[]`): ambil `ORDER_ID`, `cnote_no`, `status`, `payment_status`,
   `error`, plus `batch`/`batch_id`. Tulis ke array `_wm_mengantar_shipments` + meta ringkas + catatan order.
5. **Jadwalkan tracking** bila resi belum ada (lihat Alur D).

### Pending pickup time (kasus khusus)
Bila create gagal karena jadwal pickup (`is_pickup_time_api_error`), shipment **tidak** dianggap
gagal permanen — disimpan `pending_pickup_time` lengkap dengan provenance. Admin memilih/menambah
jadwal lalu **resume**: bangun ulang request dari provenance + `selected_time_id`, panggil `POST /order` lagi.

## 4. Alur C — Pemilihan kombinasi origin termurah (multi-gudang)

Untuk produk dari beberapa gudang, plugin meminimalkan total ongkir:

```
product_origins = { produk → [origin kandidat] }
kombinasi       = produk silang origin (maks 100)
rates           = untuk tiap origin unik → check_shipping_fee(all)
biaya(kombinasi)= Σ (per origin: rate kurir terpilih, atau termurah)
pilih kombinasi dengan biaya minimum  →  { produk → origin }
```

Logika skoringnya **murni** (tanpa efek samping) sehingga mudah diuji & diport. Rate per origin di-cache.

## 5. Alur D — Auto-tracking (polling resi)

Saat shipment dibuat tapi `cnote_no` belum tersedia (mis. pembayaran belum lunas):

1. `schedule_first_poll(order_id, mengantar_order_id)` → cron tunggal **+15 menit**.
2. Tiap poll memanggil `GET /order?order_id=...`. Bila `cnote_no` muncul → simpan resi, update status,
   tambah catatan order, selesai.
3. Bila belum → reschedule dengan **exponential backoff**: 15m → 1j → 4j → 12j → 24j.
   Berhenti setelah **5 percobaan** (`_wm_mengantar_poll_attempts`).
4. Bisa dimatikan via opsi `wm_enable_auto_tracking`.

> Pola yang bisa ditiru: state `pending_tracking`, job berkala dengan backoff & batas percobaan,
> idempoten (aman dijalankan berulang).

## 6. Endpoint internal (AJAX) — peta orkestrasi

Plugin mengekspos endpoint AJAX (WordPress) yang **mem-proxy** ke API Mengantar. Di arsitektur
Astro/Next, ini setara dengan server-endpoint/route-handler milikmu. Yang penting bukan namanya,
tapi **operasi API di baliknya**:

| Operasi (UI) | Endpoint Mengantar di balik layar |
|--------------|-----------------------------------|
| Autocomplete alamat tujuan (checkout) | `GET /address/search` |
| Set tujuan ke sesi | (simpan `destination_id` lokal) |
| Validasi API key / system status | `GET /order/estimate` (ID dummy) |
| Kelola alamat pickup (list/create/update) | `GET/POST /address` |
| Kelola jadwal pickup (list/add/delete) | `GET/POST/DELETE /time` |
| Cek harga manual (admin tool) | `check_shipping_fee` (+ dimensi P/L/T, mode) |
| Buat / retry shipment | `POST /order` |
| Refresh status tracking | `GET /order?order_id=` / `?tracking_id=` |

Operasi tulis di admin dijaga `nonce` (anti-CSRF) + cek hak akses (`manage_woocommerce` /
`edit_shop_order`). Di build sendiri: lindungi route proxy dengan auth + CSRF setara.

## 7. Konfigurasi yang memengaruhi perilaku API

| Opsi | Efek pada jalur API |
|------|---------------------|
| `wm_api_key` / `wm_sandbox_mode` / `wm_sandbox_api_key` | Memilih key & base URL (prod/sandbox) |
| `wm_use_3pl_check_shipping_fee` | `all` estimate → endpoint 3PL |
| `wm_origin_address_origin_id` | Origin default |
| `wm_enable_volumetric` + divisor | Berat yang dikirim ke estimate/create |
| `wm_auto_create_*` | Trigger, delay, skip COD/existing untuk create shipment |
| `wm_enable_auto_tracking` | Aktif/nonaktif polling resi |
| `wm_auto_schedule_*` | Auto-buat jadwal pickup |
| `wm_pickup_type` / `wm_pickup_volume` | Default `pickup` payload |
| `wm_cod_*` | Perhitungan fee & nilai `COD` |
| `wm_enable_district` / `wm_checkout_form_mode` | Field wilayah & tampilan form checkout |

## 8. Keamanan & operasional (yang wajib ditiru)

- **Key di server saja**, tidak pernah di client. URL mengandung key → jangan log mentah; redaksi
  jadi `/api/public/**redacted**`.
- **Caching GET** (5–10 menit) untuk hemat kuota & latensi.
- **Queue + retry** untuk create shipment (jangan blok request user; tahan terhadap error sementara).
- **Idempotensi**: simpan `order_id`/`cnote_no`; jangan buat ulang shipment yang sudah ada (skip-existing).
- **Validasi sebelum kirim**: panjang alamat, batas berat per service, rentang COD per kurir.
- **Normalisasi wilayah**: nama provinsi/kota dari API tidak standar — petakan dulu.

---
<sub>Bagian dari <a href="README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
