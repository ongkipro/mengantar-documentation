# Katalog Error & Penanganan

Daftar kondisi error yang ditemui plugin, dibagi: **(A) error dari API Mengantar**,
**(B) validasi pra-kirim (sisi plugin)**, dan **(C) error operasional**. `%d`/`%s` = placeholder.

> Sumber: terjemahan string plugin (`languages/*.po`) + jalur kode. Pesan dari server Mengantar
> sendiri (isi `message`/`errorsFront`) baru bisa dikatalogkan penuh setelah diuji dengan key asli
> — lihat [10-verification-checklist.md](10-verification-checklist.md).

## A. Error dari API Mengantar

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

## B. Validasi pra-kirim (dicegah sebelum memanggil API)

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

## C. Error operasional & admin

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

## D. Pola penanganan yang disarankan (app sendiri)

```
1. Network/timeout/5xx/JSON-invalid  → retry dengan backoff (idempoten via order_id).
2. success:false + key invalid       → fatal config error, stop, alert admin.
3. success:false + pickup time error → state "pending_pickup_time", jangan retry buta.
4. Validasi pra-kirim gagal          → tolak di UI/sebelum API, tampilkan pesan spesifik.
5. created tapi cnote_no kosong       → state "pending_tracking", poll /order?order_id= (backoff).
```

Selalu simpan `message` + `errors` mentah untuk audit, tapi **redaksi API key** dari log.
