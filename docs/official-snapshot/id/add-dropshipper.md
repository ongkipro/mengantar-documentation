# Add Dropshipper

`POST {BASE_URL}/api/public/{API_KEY}/dropshippers`

Menyimpan dropshipper di akunmu. Dropshipper adalah nama dan nomor telepon pengirim yang tercetak di pengiriman dan label order dropship. Pakai `id` dari hasilnya sebagai `dropShipper.id` di [Create order](#create-order).

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Create order`, dan fitur Dropshipper harus aktif di akunmu lewat Seller Web. Tanpa API key yang valid, request ditolak dengan 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox dan production

## Contoh request

```bash
curl -X POST '{BASE_URL}/api/public/{API_KEY}/dropshippers' \
-H 'Content-Type: application/json' \
-d '{
  "name": "Toko Partner",
  "phone": "081234567890"
}'
```

## Contoh response

```json
{
  "success": true,
  "data": {
    "id": "66ab1234567890abcdef1234",
    "name": "Toko Partner",
    "phone": "081234567890"
  }
}
```

Request yang berhasil mengembalikan HTTP `201`.

## Body parameter

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| name | String | Wajib. Nama dropshipper. Spasi di awal dan akhir dihapus. |
| phone | String | Wajib. Nomor telepon yang valid, misalnya `081234567890` atau `+6281234567890`. Spasi di awal dan akhir dihapus. Kirim sebagai teks, bukan angka. |

## Duplikat

Kalau kamu sudah menyimpan dropshipper dengan `name` dan `phone` yang sama, request mengembalikan dropshipper yang sudah ada, dengan `id` yang sama, dan tidak membuat data baru. Pencocokannya persis, jadi `Toko Partner` dan `toko partner`, atau `081234567890` dan `+6281234567890`, tersimpan sebagai dua dropshipper berbeda.

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| id | String | ID dropshipper. Kirim sebagai `dropShipper.id` di Create order. |
| name | String | Nama yang tersimpan. |
| phone | String | Nomor telepon yang tersimpan. |

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| `name` atau `phone` tidak ada | 400 | `{ "success": false, "message": "Missing fields: name, phone" }` |
| `phone` bukan nomor telepon yang valid | 400 | `{ "success": false, "message": "Invalid Dropshipper phone number" }` |
| `name` hanya berisi spasi | 400 | `{ "success": false, "message": "Invalid Dropshipper name" }` |
| API key tidak valid atau nonaktif, tidak punya hak akses `Create order`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
| Fitur Dropshipper belum aktif di akun | 403 | `{ "success": false, "message": "Dropshipper Feature is not enabled. Enable it through Seller Web." }` |
| `name` atau `phone` bukan teks, misalnya angka | 500 | `{ "success": false, "message": "reqBody.phone.trim is not a function" }` |
| Body bukan JSON yang valid | 500 | `{ "success": false, "name": "InternalError", "message": "Something went wrong, please try again later." }` |
