# Referensi: Glosarium, Field & Opsi

Lampiran referensi cepat: arti istilah, field mana wajib/opsional, nilai enum, dan opsi konfigurasi.

## 1. Glosarium istilah

| Istilah | Arti |
|---------|------|
| **API key** | Token akun Mengantar; ditaruh di path URL `/api/public/{API_KEY}/...`. Rahasia — server-only. |
| **origin_id** (estimate) | ID **wilayah** asal (kecamatan) — same namespace dgn `destination_id`. Sumber: `GET /address/search` → `_id`, atau `PICKUP_AUTOFILL` dari alamat pickup. ⚠️ **BUKAN** `_id` objek alamat pickup. *(live-verified 2026-07-03)* |
| **destination_id** (estimate) | ID **wilayah** tujuan (kecamatan/kelurahan). Sumber: `GET /address/search` → `_id`. Dipakai juga sbg `customerAddressDataId`. |
| **pickup address _id** | `_id` objek alamat pickup dari `GET /address`. Dipakai utk `pickup.address_id` (create order) & `GET /time?address=`. Beda dari origin_id estimate. |
| **courier (shipment)** | Nama kurir untuk `POST /order` — 9 nilai resmi docs v2 (`JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, `spx`), case-sensitive. *(Ninja discontinued per 1 Sept 2026)*. |
| **courier key (estimasi)** | Key map respon estimasi `all`, casing berbeda dari nama shipment: `JNE`, `JNECargo`, `SiCepat`, `SiCepatCargo`, `SAP`, `SAPLite`, `SapCargo`, `iDexpress`, `iDexpressCargo`, `JT`, `lion`, `anteraja`, `spx`, `pos` (+ `JTEco` bila ada; publik/3PL + `iDlite`). Pemetaan: [02](02-couriers-and-rules.md) §1.1. |
| **J&T ECO** | Layanan ekonomis J&T: entri `JTEco` di estimasi, dipesan dengan `courier: "JT"` + `orders[].eco: true` (`SERVICE_CODE` `ECO`). |
| **cnote_no** | Nomor resi / consignment note. Field utama tracking dari response create/track. |
| **ORDER_ID** | ID order internal Mengantar (per shipment). Dipakai untuk polling tracking. |
| **STT Number** | Surat Tanda Terima — referensi dokumen pengiriman (muncul di data export). |
| **batch / batch_id** | Pengelompokan order dari satu `POST /order`. `batch_id` = `_id` (pay-unpaid, delete batch); `batch` = nomor batch (filter `GET /order`). |
| **pickup time (time_id)** | ID slot jadwal penjemputan dari `GET /time`. |
| **volume** | Estimasi volume kendaraan jemput: `volumeMotor` / `volumeMobil` / `volumeTruck`. |
| **kelurahan / kecamatan** | Subdistrict / district — bagian alamat Indonesia (di API: `SUBDISTRICT_NAME` / `DISTRICT_NAME`). |
| **COD** | Cash on Delivery — penerima bayar saat barang sampai; nilai tagih dikirim di field `COD`. |
| **3PL** | Third-Party Logistics — varian endpoint estimasi (`/api/order/allEstimate3PL`) — harga standar tanpa promo. |
| **service type** | Kategori layanan kurir: `regular` / `cargo` / `lite` (menentukan batas berat). |
| **assignee** | User tim dari `GET /my-users` (`_id`); dipasang di `orders.assignee`. |
| **receiver score** | Skor riwayat penerima per kurir (`GET /getReceiverScoreByNumberUser`) — deteksi risiko RTS. |
| **courier score** | Skor performa kurir untuk kota (`POST /order/getPerformancePublic`) → pakai `bestCourier` (`recommended` selalu `JNE`). |
| **cursor / nextCursor** | Pagination tepat di kedalaman berapa pun untuk `GET /order` dan `GET /invoices`; `nextCursor` kosong = halaman terakhir. |
| **Not allowed** | Penolakan seragam `403` untuk key invalid/nonaktif, tanpa permission, IP di luar allowlist, atau endpoint whitelist. |
| **unpaid order** | Order dibuat saat saldo kurang (`cnote_no` kosong); dibayar via `POST /order/pay-unpaid`. |
| **RTS** | Return to Sender — paket dikembalikan ke pengirim. |

## 2. Matriks field `POST /order`

### Tingkat atas

| Field | Wajib | Catatan |
|-------|:-----:|---------|
| `courier` | ✅ | Nama shipment resmi: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, `spx` (case-sensitive). *(Ninja → 400)*. |
| *(header)* `idempotencyKey` | — | Opsional, 1–50 karakter; kunci & body sama persis saat retry. Lihat [01 §8.1a](01-api-reference.md). |
| `pickup` | ✅ | Objek; minimal `type` + `address_id`. |
| `orders` | ✅ | Array, ≥ 1 item. |
| *(dilarang)* | ❌ | `price`, `estimatedPrice`, `estimatedSpecialPrice`, `isFlat`, `discount*`, `allEstimateData`, `iDlite`, `iDliteDiscount` → `400` meski `0`/`null`/`""`. |

### `pickup`

| Field | Wajib | Catatan |
|-------|:-----:|---------|
| `type` | ✅ | `scheduledPickup` atau `dropOff`. |
| `address_id` | ✅ | `_id` alamat pickup dari `GET /address`; berbeda dari `origin_id` estimasi ongkir. |
| `time_id` | ⚠️ | Wajib bila `type=scheduledPickup`; ≥ 90 menit dari sekarang; `spx` harus di dalam slot SPX. |
| `volume` | ⚠️ | Wajib bila `type=scheduledPickup`; `volumeMotor`, `volumeMobil`, atau `volumeTruck`. |

### Item `orders[]`

| Field | Wajib | Catatan |
|-------|:-----:|---------|
| `customerAddressDataId` | ✅ | `destination_id`. |
| `customerAddress` | ✅ | Teks alamat jalan. *(Plugin memvalidasi panjang minimum — aturan aplikasi, bukan API.)* |
| `customerName` | ✅ | — |
| `customerPhone` | ✅ | **10–15 digit** (`62`/`+62` ikut dihitung); spasi & tanda hubung diterima. |
| `weight` | ✅ | kg positif; `JT` ≤ 50; `anteraja`/`pos`/`spx` 1–50; = Σ(qty×weight) bila `customProducts`. |
| `quantity` | ✅ | = Σ(qty) bila `customProducts`. |
| `parcelContent` | ✅ | Deskripsi isi. |
| `goodsValue` | ⚠️ | Wajib bila `COD` kosong (number). |
| `COD` | ⚠️ | COD: ≥ Rp1.000 (`lion` ≥ Rp10.000), ≤ maks kurir. Bila `COD` dan `goodsValue` dikirim, `COD` dipakai. |
| `eco` | ⬜ | Hanya `JT`: `true` → J&T ECO. Tidak dengan `cargo`/`isDangerousGoods`. |
| `isDangerousGoods` | ⬜ | JSON Boolean; hanya `SiCepat` & `iDexpress`. |
| `cargo` | ⬜ | `JNE`, `SiCepat`, `Sap`, `iDexpress`. |
| `dropShipper` | ⬜ | `{id, name, phone}` persis sama dengan master dropshipper. |
| `assignee` | ⬜ | `_id` dari `GET /my-users`. |
| `destinationMark` / `deliveryInstruction` / `dontIncludeSubdistrict` | ⬜ | Opsional. |
| `customProducts` | ⬜ | Array `{name, qty, variant?, price?, weight?}` (`name` & `qty` wajib). |

## 3. Nilai enum

| Konsep | Nilai sah |
|--------|-----------|
| Courier (shipment) | `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, `spx` *(Ninja discontinued per 1 Sept 2026)* |
| Courier (estimate) param | Nama shipment persis (case-sensitive, sekali) plus `all` (**default `JNE`**). `spx` tunggal → 200 (sandbox 2026-11-19) |
| Pickup type | `scheduledPickup`, `dropOff` |
| Volume | `volumeMotor`, `volumeMobil`, `volumeTruck` |
| Pickup `time` (slot) | `09:00`, `10:00`, `11:00`, `12:00`, `13:00`, `14:00`, `15:00`, `16:00`, `17:00`, `18:00`, `19:00`, `20:00` (dua digit; `9:00` ditolak) |
| Pickup `date` format | **`MM-DD-YYYY`** (contoh `11-27-2026`) atau Unix ms sebagai number |
| `SERVICE_CODE` | `REG`, `ECO` (J&T ECO), lainnya per kurir; `null`/absen bila tidak ada |
| Service type [plugin] | `regular` (≤50kg), `cargo` (≤100kg), `lite` (≤0.5kg) |
| Status shipment (sederhana) | `DELIVERED`, `RTS`, selain itu `ON GOING` |
| Status order (respons create) | `active`, `error` |
| Status yang masih bisa dihapus | `active`, `error`, `PENDING PICKUP`, `PICKUP FAILED`, `PICKUP_FAILED_API` (atau kosong) |
| Status app [plugin] | `created`, `error`, `partial_error`, `pending_pickup_time`, `active` |
| payment_status / isPaid | `paid`/`true`, `unpaid`/`false` |
| Estimasi mode | `normal` (`/order/estimate`), `3pl`, `public` |
| `cod` filter (list order) | `COD`, `NON_COD` |
| `batchFilter` (list batch) | `unpaid`, `error`, `active`, `delivered`, `undelivered`, `rts`, `reconciled` |
| `invoiceFilter` | `all`, `typePayment`, `typeRefund`, `typeAddBalance`, `typeWithdraw`, `typeReconciliation` |
| Invoice `status` | `statusCleared`, `statusPending`, `statusProcessing`, `statusFailed`, `statusExpired` |
| `category` / `ticketFilter` / `receiverFilter` (list order) [plugin] | Tidak ada di docs v2 — jangan diandalkan |
| Label Generation Status | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| Label Generation Format | `normal-1`, `normal-2`, `normal-4`, `normal-6`, `thermal-10x10`, `thermal-10x15`, `thermal-8x6`; `thermal-new-10x10`, `thermal-new-10x15` khusus JT / SPX |
| Label Generation Request | Satu `orderId` per request; tidak ada field `type` |
| Galat (docs v2) | `403 Not allowed` (key/permission/IP/whitelist), `400` + `field`/`message` (validasi), `409` (konkurensi batch JT/SiCepat), `429` (cetak label 8/menit; skor penerima harian), `code`: `COURIER_DISABLED`, `IDEMPOTENCY_KEY_INVALID` / `IDEMPOTENCY_REQUEST_IN_PROGRESS` / `IDEMPOTENCY_REQUEST_UNRESOLVED` / `IDEMPOTENCY_KEY_REUSED` / `IDEMPOTENCY_UNAVAILABLE` ([01 §8.1a](01-api-reference.md)). *(`X000`–`X003` dari versi ≤ 0.4.0 tidak ada di docs v2.)* |

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
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
