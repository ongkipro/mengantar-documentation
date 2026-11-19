# Katalog Error & Penanganan

Dibagi: **(A) kode error resmi API**, **(B) error API terkait perilaku**, **(C) validasi pra-kirim
(sisi plugin)**, dan **(D) error operasional**. `%d`/`%s` = placeholder.

> Sumber: **(A)** docs resmi `app.mengantar.com/docs`; **(B–D)** terjemahan string plugin
> (`languages/*.po`) + jalur kode. Isi `message`/`errorsFront` dari server baru bisa dikatalogkan
> penuh setelah diuji dengan key asli — lihat [10-verification-checklist.md](10-verification-checklist.md).

## A. Kode error resmi API

Docs resmi v2 (2026-11-19) membedakan galat lewat **HTTP status + `message`/`field`/`code`**. Kode `X000`–`X003`
yang dicatat repo ini sampai 0.4.0 **tidak ada** di docs v2 maupun di halaman `/docs/v1` saat ini.

| Status / kode | Arti | Penanganan |
|---------------|------|------------|
| `403 {"message":"Not allowed"}` | Key tidak dikenal/nonaktif, key tanpa permission endpoint, IP di luar allowlist key, atau endpoint whitelist (dicek live sandbox 2026-11-19) | Fatal config — stop, periksa key (sandbox ≠ produksi), permission, IP (minta whitelist ke CS). Client: `isNotAllowed(e)`. |
| `400` + `field` / `message` | Validasi: param wajib hilang, format salah, nilai di luar batas | Perbaiki payload; jangan retry tanpa perubahan. Cocokkan `field`/status, bukan teks (pesan bisa ID/EN). |
| `422` | Validasi `PUT /address/{id}`, skor penerima (`search`), simulasi, `IDEMPOTENCY_KEY_REUSED` | Perbaiki input. |
| `200` + `success:false` | `DELETE /order` tanpa order yang cocok (`"Orders already deleted"`, JNE/SiCepat/Sap/iDexpress/JT) | Cek `courier` (wajib selain JNE) dan id. |
| `405` | Method salah (mis. `GET` ke `getPerformancePublic`) | Pakai method yang benar. |
| `500 InternalError` | Body bukan JSON, atau tipe salah (mis. `phone` dropshipper berupa number; `search` dropshipper berisi `(`) | Kirim JSON valid & string. |
| `409 Conflict` | Konkurensi batch **JT Premium / SiCepat** — ada proses batch berjalan | Jangan kirim batch paralel; gabungkan ke 1 batch, atau antre & retry setelah batch sebelumnya selesai. *(Ninja discontinued)* |
| `429 Too Many Requests` | Batas cetak label (8 aksi Print / 60 detik, dibagi dengan Seller Web) atau batas harian skor penerima (produksi) | Queue/rate-limiter; label tunggu 60 detik, skor penerima tunggu tengah malam WIB. |

### A1a. Idempotency (`POST /order` dengan header `idempotencyKey`)

| HTTP | `code` | Retry? |
|------|--------|--------|
| 400 | `IDEMPOTENCY_KEY_INVALID` | Tidak — perbaiki kunci (1–50 karakter). |
| 409 | `IDEMPOTENCY_REQUEST_IN_PROGRESS` | Ya, setelah `Retry-After`, **kunci sama**. |
| 409 | `IDEMPOTENCY_REQUEST_UNRESOLVED` | Jangan ulang buta — cek `GET /order`, kirim yang kurang dengan **kunci baru**. |
| 422 | `IDEMPOTENCY_KEY_REUSED` | Tidak — body berbeda untuk kunci lama. |
| 503 | `IDEMPOTENCY_UNAVAILABLE` | Ya, **kunci sama** (tidak ada yang dibuat). |

Bedakan 409 idempotency dari 409 konkurensi batch lewat field `code`; 409 konkurensi tidak membawa `code`. Detail: [01 §8.1a](01-api-reference.md).

### A2. Error validasi kurir (HTTP `400`)

| Respon | Kapan | Penanganan |
|--------|-------|------------|
| `400 {"success":false,"message":"Courier is not available","code":"COURIER_DISABLED"}` | `courier=Ninja` di estimasi (Ninja discontinued 1 Sept 2026) — docs resmi | Hapus kurir dari opsi; jangan retry. |
| `400 {"success":false,"message":"Invalid courier"}` | `courier=<nama>` tidak cocok **persis** dengan nama shipment (`SAP`, `sap`, `jt` ditolak; `Sap`, `JT`, `spx` diterima — sandbox 2026-11-19), atau dikirim lebih dari sekali | Pakai nama shipment persis ([02](02-couriers-and-rules.md) §1). Jangan retry. |

### A3. COD Pos Indonesia tidak tersedia untuk akun (HTTP `403`)

| Respon | Kapan | Penanganan |
|--------|-------|------------|
| `403 {"success":false,"message":"Pos Indonesia COD is not available for this account","status":"new_seller\|insufficient\|blocked","deliveredRate":N,"minimumDeliveredRate":82}` | `POST /order` COD dengan `courier:"pos"` saat delivered rate akun di bawah ambang — docs resmi | Bedakan lewat `status`; tawarkan non-COD atau kurir lain; jangan retry. Detail di [02](02-couriers-and-rules.md) §3.3. |

> Tidak ada kode `X*` di docs v2 — `403`, `409`, `429` adalah HTTP status dengan `success:false` + `message` (lihat [01 §12](01-api-reference.md)).

### A4. Respons "sukses" yang tidak berarti berhasil

| Endpoint | Jebakan | Yang dicek |
|----------|---------|------------|
| `POST /order` | `200 success:true` = batch diproses, bukan semua order terkirim | Per order: `status`, `cnote_no`, `isPaid`, `error`; dan `ordersClosedDestination` |
| `DELETE /order` | `200 success:true` bisa menghapus 0/sebagian | `deletedCount`, `deletedOrderIds` |
| `DELETE /batch` | `200 success:true` bahkan bila tidak ada yang terhapus | `deletedCount`, `unDeletedCount`, `totalCount` |
| `GET /label-generation/{id}` | `FAILED` tetap `200 success:true` | `data.status`, `errorMessage` |
| `POST /order/pay-unpaid` | JNE/SiCepat/Sap/iDexpress/JT: tidak ada yang perlu dibayar → `200 data:0` | `data` (jumlah) / `cnote_no`; client `paidResult()` |
| `GET /getReceiverScoreByNumberUser` | Nomor tanpa riwayat tetap `200` | `summary.average_number === null` |

## B. Error dari API Mengantar (perilaku, via plugin)

Dikenali saat response `success === false`. Plugin mengekstrak: `message`, `errors`,
`errorsFront` (pesan ramah-user), dan `courier`.

| Kondisi | Penanganan plugin | Saran app-mu |
|---------|-------------------|--------------|
| `success:false` umum | `WP_Error('wm_api_error', message, {errors, errorsFront, courier})` | Tampilkan `errorsFront` ke user, log `message`+`errors`. |
| API key salah | Indikasi via estimate dummy → "Invalid API Key." | Hentikan, minta perbaiki kredensial. |
| JSON tak valid | `WP_Error('wm_json_error')` | Treat sebagai 5xx; retry dengan backoff. |
| Request gagal (network) | `WP_Error('wm_request_failed', error)` | Retry; jangan tandai order gagal permanen. |
| **Pickup time ditolak** | Shipment → status `pending_pickup_time` (bukan gagal). Pesan: *"…pickup time rejected by API. Shipment is now pending pickup time selection."* | Simpan state pending, minta pilih ulang `time_id`, lalu resume. |
| Kurir diblokir | *"Blocked couriers detected: …"* | Sembunyikan kurir tsb dari opsi. |

## C. Validasi pra-kirim (dicegah sebelum memanggil API)

Plugin memblokir create shipment bila salah satu gagal — replikasikan validasi ini **sebelum**
`POST /order` agar tidak buang kuota & dapat error server.

| Aturan | Pesan |
|--------|-------|
| Alamat tujuan terlalu pendek | *"Mengantar shipment creation blocked: Destination address must be at least %d characters."* |
| No. HP penerima kosong/invalid | *"…blocked: Receiver phone is missing or invalid."* |
| No. HP > 15 digit | *"…blocked: Receiver phone exceeds 15 digits. Please correct the phone number."* |
| Berat > batas service | *"…blocked for package #%s (product line): Weight %.2f kg exceeds the %s limit of %.1f kg."* |
| COD di atas maksimum kurir | *"…blocked for package #%s: COD amount %s exceeds the maximum %s for %s."* |
| COD di bawah minimum kurir | *"…blocked for package #%s: COD amount %s is below the minimum %s for %s."* |
| SAP Cargo + COD | *"…blocked for package #%s: SAP Cargo does not support COD."* |
| Tidak ada paket | *"…blocked: No shipping packages found for this order."* |
| Kurir tak terdeteksi | *"Mengantar shipment creation failed: Could not determine courier from shipping method."* |
| Tujuan belum dipilih (checkout) | *"Destination is required. Please search and select a destination."* |
| Alamat < min (checkout) | *"Address must be at least %d characters."* |

(Batas berat & COD per kurir: lihat [02-couriers-and-rules.md](02-couriers-and-rules.md).)

## D. Error operasional & admin

| Kondisi | Pesan |
|---------|-------|
| Tidak ada resi dari API | *"Shipping order creation failed. No tracking number returned."* |
| Ringkasan create batch | *"Mengantar create shipment summary: %d created, %d failed, %d pending."* |
| Auto-shipment gagal | *"Automatic shipment creation failed: %s"* + email *"[%s] Auto-Shipment Failed for Order #%d"* |
| Resume pending gagal | *"Failed to resume pending shipments."* / *"…API key not configured."* |
| API key belum diset | *"Mengantar API Key is missing. Please configure it…"* |
| Tracking tak ditemukan | *"Tracking information not found."* / *"An error occurred while fetching tracking data."* |
| Pickup time | *"Error adding pickup time."* / *"Error deleting pickup time."* / *"Error scheduling pickup."* |
| Import file salah | *"Invalid file type. Please upload CSV or XLS file."* / *"Error reading XLS/XLSX file: %s"* |
| Permission/keamanan (admin AJAX) | *"Insufficient permissions."* / *"Invalid request, security check failed."* |

## E. Pola penanganan yang disarankan (app sendiri)

```
1. Network/timeout/5xx/JSON-invalid   → retry dengan backoff. POST /order: kirim header idempotencyKey + body sama persis
                                        (§A1a). Replay 5xx (Idempotent-Replayed: true) jangan diulang dengan kunci sama:
                                        cek GET /order, kirim order yang kurang dengan kunci baru.
2. 403 "Not allowed"                  → fatal config error (key salah lingkungan/nonaktif, permission, IP, whitelist), stop, alert admin.
3. 400 + field / message              → validasi; perbaiki payload, jangan retry buta (cocokkan field/status, bukan teks).
3b. 400 Invalid courier / COURIER_DISABLED → nilai courier salah/nonaktif; perbaiki mapping, jangan retry.
3c. 403 + status new_seller/insufficient/blocked (COD pos) → jangan retry; simpan alasan + deliveredRate,
    matikan COD pos di kebijakan kurir, tawarkan non-COD/kurir lain ([02](02-couriers-and-rules.md) §3.3).
4. 409 Conflict tanpa `code` (JT/SiCepat) → antre; jangan kirim batch paralel, gabung ke 1 batch lalu retry (Ninja discontinued).
4a. 409 + code IDEMPOTENCY_REQUEST_IN_PROGRESS → tunggu Retry-After, retry kunci sama.
4b. 409 + code IDEMPOTENCY_REQUEST_UNRESOLVED  → cek GET /order, kirim yang kurang dengan kunci baru.
5. 429 Too Many Requests (Label Gen)  → kurangi kecepatan polling / request pembuatan label (maks 8 aksi/menit).
6. success:false + pickup time error  → state "pending_pickup_time", jangan retry buta.
7. Validasi pra-kirim gagal           → tolak di UI/sebelum API, tampilkan pesan spesifik.
8. created, cnote_no kosong, isPaid bukan false → state "pending_tracking", poll /order?order_id= (backoff).
9. created dengan isPaid=false        → top-up lalu /order/pay-unpaid; jangan create ulang.
```

Selalu simpan `message` + `errors` mentah untuk audit, tapi **redaksi API key** dari log.

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
