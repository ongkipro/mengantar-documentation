# Katalog Error & Penanganan

Dibagi: **(A) kode error resmi API**, **(B) error API terkait perilaku**, **(C) validasi pra-kirim
(sisi plugin)**, dan **(D) error operasional**. `%d`/`%s` = placeholder.

> Sumber: **(A)** docs resmi `app.mengantar.com/docs`; **(B–D)** terjemahan string plugin
> (`languages/*.po`) + jalur kode. Isi `message`/`errorsFront` dari server baru bisa dikatalogkan
> penuh setelah diuji dengan key asli — lihat [10-verification-checklist.md](10-verification-checklist.md).

## A. Kode error resmi API

Docs resmi mendefinisikan kode berikut (biasanya di body `message`/`errors` saat `success:false`):

| Kode | Arti | Penanganan |
|------|------|------------|
| `X000` | Ada parameter wajib yang tidak dikirim | Perbaiki payload; validasi param wajib sebelum kirim. |
| `X001` | `secret_key` tidak dikenal / tidak valid / **kadaluarsa** | Fatal config — stop, minta perbarui API key. |
| `X002` | `secret_key` tidak valid untuk **domain** ini | Pakai key Developer/Universal (bebas domain) atau daftarkan domain. |
| `X003` | User `token` tidak dikenal / tidak valid / kadaluarsa | Refresh/perbaiki user token. |
| `409 Conflict` | Konkurensi batch **JT Premium / Ninja / SiCepat** — ada proses batch berjalan | Jangan kirim batch paralel; gabungkan ke 1 batch, atau antre & retry setelah batch sebelumnya selesai. |

> `409` bukan kode `X*` — ia HTTP status dengan `success:false` + `message` (lihat [01](01-api-reference.md) §7.6).

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
1. Network/timeout/5xx/JSON-invalid   → retry dengan backoff (idempoten via order_id).
2. success:false + X001/X002/X003     → fatal config error (key/domain/token), stop, alert admin.
3. success:false + X000               → parameter wajib hilang; perbaiki payload, jangan retry buta.
4. 409 Conflict (JT/Ninja/SiCepat)    → antre; jangan kirim batch paralel, gabung ke 1 batch lalu retry.
5. success:false + pickup time error  → state "pending_pickup_time", jangan retry buta.
6. Validasi pra-kirim gagal           → tolak di UI/sebelum API, tampilkan pesan spesifik.
7. created tapi cnote_no kosong        → state "pending_tracking", poll /order?order_id= (backoff).
8. saldo tidak cukup (unpaid=true)    → panggil /order/pay-unpaid setelah top-up saldo.
```

Selalu simpan `message` + `errors` mentah untuk audit, tapi **redaksi API key** dari log.

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
