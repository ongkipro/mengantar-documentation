# Add Time

`POST {BASE_URL}/api/public/{API_KEY}/time`

Menambah waktu pickup untuk salah satu alamatmu yang tersimpan. Pakai `_id` di response sebagai `pickup.time_id` di [Create order](#create-order) kalau tipe pickup-nya `scheduledPickup`. Untuk melihat waktu pickup yang sudah kamu tambah, pakai [Get Time](#get-time).

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Create order`. Tanpa itu, request ditolak dengan 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl \
-X POST '{BASE_URL}/api/public/{API_KEY}/time' \
-H 'Content-Type: application/json' \
-d '{
  "address_id": "6af555fc8109274a92d72fb3",
  "date": "11-30-2026",
  "time": "13:00"
}'
```

## Contoh response

```json
{
    "success": true,
    "data": {
        "isSunday": false,
        "_id": "6af583fb9708e74dced0799e",
        "date": "2026-11-30T00:00:00.000Z",
        "time": "13:00",
        "address": {
            "RETURN_COUNTRY": "INDONESIA",
            "isReturnDifferentFromPickup": false,
            "_id": "6af555fc8109274a92d72fb3",
            "PICKUP_NAME": "Gudang Utama",
            "PICKUP_PIC": "Budi",
            "PICKUP_PIC_PHONE": "081234567890",
            "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
            "PICKUP_AUTOFILL": "5fc62de8f8f44b34aa4bdc49",
            "pinpointData": {
                "lat": -6.9456,
                "lng": 107.5703
            },
            "user_id": "6af1a2b3c4d5e6f708192a3b",
            "PICKUP_DISTRICT": "BABAKAN CIPARAY",
            "PICKUP_SUBDISTRICT": "MARGASUKA",
            "PICKUP_REGION": "JAWA BARAT",
            "PICKUP_CITY": "BANDUNG",
            "PICKUP_CITY_SI": "Kota Bandung",
            "PICKUP_ZIP": "40225",
            "PICKUP_DESTINATION_CODE": "BDO10044",
            "PICKUP_DESTINATION_CODE_SI": "BDO10044",
            "PICKUP_ORIGIN_CODE": "BDO10000",
            "PICKUP_ORIGIN_CODE_SI": "BDO",
            "PICKUP_SAP_CODE": "JB0306",
            "PICKUP_FULL_AUTOFILL": "JAWA BARAT, BANDUNG, BABAKAN CIPARAY, MARGASUKA",
            "createdAt": "2026-11-12T06:00:28.177Z",
            "updatedAt": "2026-11-12T06:00:28.177Z",
            "__v": 0
        },
        "user_id": "6af1a2b3c4d5e6f708192a3b",
        "createdAt": "2026-11-12T09:16:43.903Z",
        "updatedAt": "2026-11-12T09:16:43.903Z",
        "__v": 0
    }
}
```

## Body parameters

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| address_id | String | Wajib. `_id` salah satu alamatmu yang tersimpan, dari [Get user's addresses](#get-users-addresses) atau [Add user's address](#add-users-address). |
| date | String \| Number | Wajib. Tanggal pickup, bisa berupa teks berformat `MM-DD-YYYY`, misalnya `"11-30-2026"`, atau Unix timestamp dalam milidetik yang dikirim sebagai angka, misalnya `1794787200000` (tengah malam UTC tanggal `2026-11-16`). Timestamp yang dikirim sebagai teks, seperti `"1794787200000"`, ditolak. |
| time | String | Wajib. Jam pickup, selalu dua digit: `09:00`, `10:00`, `11:00`, `12:00`, `13:00`, `14:00`, `15:00`, `16:00`, `17:00`, `18:00`, `19:00`, atau `20:00`. `9:00` ditolak. |

> [!WARNING]
> **Catatan:** Pickup yang dipakai untuk order harus paling cepat **90 menit** dari sekarang. Menambah waktu tidak mengecek ini. Pengecekannya terjadi saat waktu dipakai di Create order, yang menolak waktu pickup yang terlalu dekat dengan `invalid pickup time`.

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| _id | String | ID waktu pickup. Pakai sebagai `pickup.time_id` di Create order. |
| date | String | Tanggal pickup (ISO 8601, tengah malam UTC dari tanggal yang kamu kirim). |
| time | String | Jam pickup, misalnya `13:00`. |
| isSunday | Boolean | `true` kalau tanggalnya hari Minggu menurut waktu Jakarta. |
| address | Object | Salinan alamat seperti kondisinya saat waktu ditambahkan. |
| user_id | String | ID akunmu. |
| createdAt | String | Waktu pickup ditambahkan (ISO 8601). |
| updatedAt | String | Waktu pickup terakhir diubah (ISO 8601). |

## Batasan

- Setiap panggilan membuat waktu pickup baru, walau `address_id`, `date`, dan `time` yang sama sudah ada. Masing-masing punya `_id` sendiri. Tambahkan waktu sekali saja, lalu pakai ulang `_id`-nya.
- Tanggal yang sudah lewat diterima dan disimpan, tapi tidak lagi muncul di [Get Time](#get-time) setelah jamnya terlewat.
- Field yang kurang dilaporkan satu per satu, dengan urutan: `address_id`, lalu `time`, lalu `date`.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| `address_id`, `time`, atau `date` tidak dikirim | 400 | `{ "success": false, "field": "time", "message": "time is required" }` |
| `time` bukan salah satu jam yang diizinkan | 400 | `{ "success": false, "message": "Time allowed 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00, 19:00, 20:00" }` |
| `address_id` bukan salah satu alamat tersimpan milikmu | 404 | `{ "success": false, "message": "address not found" }` |
| `address_id` atau `date` tidak valid, misalnya `abc` | 400 | `{ "success": false, "message": "Error on add time", "error": { ... } }` |
| API key tidak valid atau nonaktif, tidak punya hak akses `Create order`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
