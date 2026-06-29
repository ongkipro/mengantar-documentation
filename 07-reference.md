# Referensi: Glosarium, Field & Opsi

Lampiran referensi cepat: arti istilah, field mana wajib/opsional, nilai enum, dan opsi konfigurasi.

## 1. Glosarium istilah

| Istilah | Arti |
|---------|------|
| **API key** | Token akun Mengantar; ditaruh di path URL `/api/public/{API_KEY}/...`. Rahasia — server-only. |
| **origin_id** | ID alamat asal/pengirim (gudang) di akun Mengantar. Sumber: `GET /address` → `_id`. |
| **destination_id** | ID wilayah tujuan (kecamatan/kelurahan). Sumber: `GET /address/search` → `id`. Dipakai sbg `customerAddressDataId`. |
| **courier (estimasi)** | Key kurir di response `/order/estimate` (mis. `jne`, `sicepatcargo`). Banyak varian. |
| **courier (shipment)** | Nama kurir untuk `POST /order` — 8 nilai resmi (`JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `Ninja`, `lion`, `anteraja`). |
| **cnote_no** | Nomor resi / consignment note. Field utama tracking dari response create/track. |
| **ORDER_ID** | ID order internal Mengantar (per shipment). Dipakai untuk polling tracking. |
| **STT Number** | Surat Tanda Terima — referensi dokumen pengiriman (muncul di data export). |
| **batch / batch_id** | Pengelompokan beberapa order yang dibuat sekaligus dalam satu request. |
| **assignee** | Penanda kurir-lapangan/agen penjemput (opsional). |
| **pickup time (time_id)** | ID slot jadwal penjemputan dari `GET /time`. |
| **volume** | Estimasi volume kendaraan jemput: `volumeMotor` / `volumeMobil` / `volumeTruck`. |
| **kelurahan / kecamatan** | Subdistrict / district — bagian alamat Indonesia (di API: `SUBDISTRICT_NAME` / `DISTRICT_NAME`). |
| **COD** | Cash on Delivery — penerima bayar saat barang sampai; nilai tagih dikirim di field `COD`. |
| **3PL** | Third-Party Logistics — varian endpoint estimasi (`/api/order/allEstimate3PL`). |
| **service type** | Kategori layanan kurir: `regular` / `cargo` / `lite` (menentukan batas berat). |

## 2. Matriks field `POST /order`

### Tingkat atas

| Field | Wajib | Catatan |
|-------|:-----:|---------|
| `courier` | ✅ | Nama shipment resmi (8 nilai). |
| `pickup` | ✅ | Objek; minimal `type` + `address_id`. |
| `orders` | ✅ | Array, ≥ 1 item. |
| `assignee` | ⬜ | Hanya dikirim bila terisi. |

### `pickup`

| Field | Wajib | Catatan |
|-------|:-----:|---------|
| `type` | ✅ | `scheduledPickup` atau `dropOff`. |
| `address_id` | ✅ | `origin_id`. |
| `time_id` | ⚠️ | Wajib bila `type=scheduledPickup`. |
| `time_label` | ⬜ | Informasi; format `YYYY-MM-DD [HH:MM-HH:MM]`. |
| `volume` | ⬜ | Default `volumeMobil`. |
| `origin_label` | ⬜ | Informasi. |

### Item `orders[]`

| Field | Wajib | Catatan |
|-------|:-----:|---------|
| `customerAddressDataId` | ✅ | `destination_id`. |
| `customerAddress` | ✅ | Min. 10 karakter. |
| `customerName` | ✅ | — |
| `customerPhone` | ✅ | Digit saja, **maks 15 digit**. |
| `weight` | ✅ | kg, min. 1. |
| `quantity` | ✅ | — |
| `parcelContent` | ✅ | Deskripsi isi. |
| `goodsValue` | ⚠️ | Wajib bila **non-COD** (jangan bersama `COD`). |
| `COD` | ⚠️ | Wajib bila **COD** (jangan bersama `goodsValue`). |
| `customProducts` | ⬜ | Array `{name, qty, price, weight, variant?}`. |

## 3. Nilai enum

| Konsep | Nilai sah |
|--------|-----------|
| Courier (shipment) | `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `Ninja`, `lion`, `anteraja` |
| Pickup type | `scheduledPickup`, `dropOff` |
| Volume | `volumeMotor`, `volumeMobil`, `volumeTruck` |
| Service type | `regular` (≤50kg), `cargo` (≤100kg), `lite` (≤0.5kg) |
| Status shipment (internal) | `created`, `error`, `partial_error`, `pending_pickup_time` |
| payment_status | `paid`, `unpaid` |
| Estimasi mode | `normal` (`/order/estimate`), `3pl`, `public` |

## 4. Opsi konfigurasi (dari konstanta plugin)

Key option WordPress (`wm_*`) + default. Berguna sebagai daftar "pengaturan yang memengaruhi API".

| Option key | Default | Fungsi |
|------------|---------|--------|
| `wm_api_key` | `WooMengantar` | API key produksi |
| `wm_sandbox_mode` | `no` | Aktifkan sandbox |
| `wm_sandbox_api_key` | `''` | API key sandbox |
| `wm_use_3pl_check_shipping_fee` | `yes` | `all` estimate → endpoint 3PL |
| `wm_origin_address_origin_id` | `''` | Origin default |
| `wm_pickup_type` | `scheduledPickup` | Tipe pickup default |
| `wm_pickup_volume` | `volumeMobil` | Volume default |
| `wm_enable_volumetric` | `no` | Berat volumetrik |
| `wm_volumetric_divisor` | `6000` | Pembagi umum |
| `wm_volumetric_divisor_jne` | `4000` | Pembagi JNE/iDexpress |
| `wm_cod_courier_fee_percent` | `3` | Persen fee COD |
| `wm_cod_fee_type` | `product_shipping` | Basis fee (`product_shipping`/`product_only`) |
| `wm_cod_courier_minimal_fee` | `0` | Fee COD minimum |
| `wm_cod_courier_maximal_fee` | `''` | Fee COD maksimum |
| `wm_auto_create_enabled` | `no` | Auto-buat shipment |
| `wm_auto_create_statuses` | `['processing']` | Status pemicu |
| `wm_auto_create_shipping_methods` | `[]` | Filter metode (kosong=semua) |
| `wm_auto_create_delay` | `60` | Delay (detik) sebelum create |
| `wm_auto_create_skip_cod` | `no` | Lewati order COD |
| `wm_auto_create_skip_existing` | `yes` | Lewati order yang sudah ada shipment |
| `wm_auto_create_notify_failures` | `no` | Email admin saat gagal |
| `wm_enable_auto_tracking` | `no` | Polling resi otomatis |
| `wm_auto_schedule_enabled` | `no` | Auto-buat jadwal pickup |
| `wm_auto_schedule_type` | `exact_time` | `exact_time` / berbasis jam |
| `wm_auto_schedule_time` | `15:00` | Jam pickup |
| `wm_auto_schedule_hours` | `2` | Offset jam |
| `wm_enable_district` | `yes` | Field wilayah di checkout |
| `wm_checkout_form_mode` | `hide` | `hide` / `show` / `disable` Province/City/Zip |
| `wm_verbose_rate_label` | `no` | Label rate panjang (origin→tujuan) |
| `wm_disable_prefix` | `no` | Hilangkan prefiks "Mengantar" di judul metode |
| `wm_debug` | `no` | Mode debug |
| `wm_log_api_requests` | `no` | Log request/response API |

> Saat membangun ulang tanpa WordPress, opsi-opsi ini menjadi **konfigurasi app-mu** (env/DB).

---
<sub>Bagian dari <a href="README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
