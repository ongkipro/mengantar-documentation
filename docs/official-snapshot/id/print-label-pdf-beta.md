# Print Label PDF (BETA)

Membuat label PDF di background, dalam dua langkah dengan dua endpoint. **Request** memulai satu pembuatan label dan mengembalikan id-nya. **Get** mengembalikan hasil pembuatan itu. Request tidak pernah mengembalikan URL unduhan: hanya Get yang mengembalikannya, setelah status `COMPLETED`.

> [!IMPORTANT]
> **Akses terbatas.** Endpoint ini hanya untuk akun yang masuk whitelist. Request dari API key yang akunnya tidak ada di whitelist mendapat `403 Not allowed`. Akses diberikan lewat permintaan: hubungi Customer Service (CS) Mengantar untuk meminta akses.

Permission required: Whitelisted account
Environment: Sandbox dan production

## Minta label

`POST {BASE_URL}/api/public/{API_KEY}/label-generation`

Kirim satu order berbayar yang punya nomor resi. Order harus milik akun pemilik API key. Panggilan ini menerima tepat satu `orderId`: array, atau beberapa id yang dipisah koma, titik koma, atau spasi, ditolak. Simpan `labelGenerationId` dari jawabannya dan pakai di Get. Jawabannya tidak punya `downloadUrl`, bahkan saat request sebelumnya untuk order dan format aktif yang sama dipakai ulang.

### Contoh request

```bash
# Here is a curl example
curl -X POST '{BASE_URL}/api/public/{API_KEY}/label-generation' \
-H 'Content-Type: application/json' \
-d '{
  "orderId": "261113IBBQ4K",
  "courier": "JT",
  "format": "normal-1"
}'
```

### Contoh response

```json
{
    "success": true,
    "data": {
        "labelGenerationId": "6af6e184ce96b86fe958b5a7",
        "status": "PENDING"
    }
}
```

## Ambil status label

`GET {BASE_URL}/api/public/{API_KEY}/label-generation/{labelGenerationId}`

`labelGenerationId` adalah id 24 karakter dari Request. Get hanya membaca: tidak memakai batas Print. Polling dengan jeda yang wajar, beberapa detik, dan jangan kirim Request baru hanya untuk mengecek progres. Di sandbox sebuah label butuh sekitar 25 detik sampai siap.

### Contoh request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/label-generation/6af6e184ce96b86fe958b5a7'
```

### Contoh response

```json
{
    "success": true,
    "data": {
        "labelGenerationId": "6af6e184ce96b86fe958b5a7",
        "status": "COMPLETED",
        "format": "normal-1",
        "downloadUrl": "https://storage.googleapis.com/mengantar-bucket/download/<user-id>/pdf/label-order-261113IBBQ4K-<attempt-id>.pdf?X-Goog-Algorithm=..."
    }
}
```

## Body parameter

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| orderId | String | Wajib. `ORDER_ID` satu order yang ada, belum dihapus, dan milik akun pemilik API key. Ini nomor order, bukan `_id`. |
| courier | String | Wajib. Kurir order, misalnya `JNE`, `JT`, atau `spx`. Huruf besar dan kecil tidak berpengaruh di sini. |
| format | String | Wajib. Layout label, lihat Label formats di bawah. |

## Path parameter

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| labelGenerationId | String | ID pembuatan label yang dikembalikan Request. |

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| success | Boolean | `true` kalau request diproses. |
| data | Object | Pembuatan label. |
| labelGenerationId | String | ID pembuatan label. Pakai di Get. |
| status | String | `PENDING`, `PROCESSING`, `COMPLETED`, atau `FAILED`, lihat Status lifecycle. |
| format | String | Hanya saat `COMPLETED`: layout label yang dibuat. |
| downloadUrl | String | Hanya saat `COMPLETED`: tautan ke PDF. Berlaku 15 menit, dan tiap polling memberi yang baru. |
| errorMessage | String | Hanya saat `FAILED`: alasan label tidak bisa dibuat. |

## Status lifecycle

| Status | Arti | downloadUrl | Langkah berikutnya |
| --- | --- | --- | --- |
| `PENDING` | Dalam antrean, atau menunggu percobaan ulang setelah kegagalan sementara. | Tidak ada | Polling Get. |
| `PROCESSING` | Worker sedang menyiapkan, merender, memeriksa, atau mengunggah PDF. | Tidak ada | Polling Get. |
| `COMPLETED` | PDF sudah diperiksa dan disimpan. | Ada, berlaku 15 menit | Unduh PDF sebelum tautan kedaluwarsa. Polling lagi untuk tautan baru. |
| `FAILED` | Pekerjaan tidak bisa dilanjutkan: pemeriksaan gagal atau semua percobaan habis. | Tidak pernah ada | Baca `errorMessage`, perbaiki penyebabnya, lalu kirim Request baru kalau masuk akal. |

Label yang `FAILED` tetap dijawab 200 dengan `success: true`: kegagalannya ada di `data.status`. Order yang belum dibayar diterima oleh Request, dan labelnya berakhir `FAILED`.

## Label formats

| Format | Ketersediaan |
| --- | --- |
| `normal-1`, `normal-2`, `normal-4`, `normal-6` | Kurir yang didukung. |
| `thermal-10x10`, `thermal-10x15`, `thermal-8x6` | Kurir yang didukung. |
| `thermal-new-10x10`, `thermal-new-10x15` | Hanya order J&T (`JT`) atau SPX Express (`spx`). |

## Beberapa order

Satu request berisi satu order. Untuk mencetak beberapa order, kirim satu Request per order, untuk kurir apa pun, dan simpan `labelGenerationId` tiap request.

## Batas laju

Request adalah aksi Print final. Batasnya **8 aksi Print per 60 detik**, dibagi antara Seller Web dan Public API untuk akun induk yang sama. Request yang valid memakai satu aksi, juga saat ia mengembalikan pembuatan label yang sudah aktif. Get tidak memakai batas ini.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| API key tidak valid atau nonaktif, IP tidak diizinkan, atau akun tidak masuk whitelist | 403 | `{ "success": false, "message": "Not allowed" }` |
| `orderId` kosong atau tidak ada | 400 | `{ "success": false, "message": "orderId is required and must be a non-empty string. Only one orderId is allowed per request" }` |
| Lebih dari satu id order dikirim, atau berupa array | 400 | `{ "success": false, "message": "Only one orderId is allowed per request. Send one orderId as a non-empty string, not an array or a separated list." }` |
| `courier` kosong atau tidak ada | 400 | `{ "success": false, "message": "courier is required and must be a non-empty string" }` |
| `format` kosong atau tidak ada | 400 | `{ "success": false, "message": "format is required and must be a non-empty string" }` |
| `format` tidak dikenal | 400 | `{ "success": false, "message": "Invalid format" }` |
| Format `thermal-new` untuk kurir selain `JT` atau `spx` | 400 | `{ "success": false, "message": "Format 'thermal-new-10x15' is only available for JT or SPX orders" }` |
| Order tidak ada, atau bukan order kurir itu | 404 | `{ "success": false, "message": "Order not found" }` |
| Order milik akun lain | 403 | `{ "success": false, "message": "Order does not belong to this account" }` |
| Get: id pembuatan label salah format, tidak ada, atau bukan milikmu | 404 | `{ "success": false, "message": "Data not found" }` |
| Batas Print tercapai | 429 | `{ "success": false, "message": "Print limit exceeded: maximum 8 Print actions per minute..." }` |
