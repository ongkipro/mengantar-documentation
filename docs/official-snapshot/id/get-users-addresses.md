# Get user's addresses

`GET {BASE_URL}/api/public/{API_KEY}/address`

Mengembalikan alamat pickup yang tersimpan di akunmu. Pakai untuk mencari `_id` alamat yang sudah tersimpan. `_id` itu adalah `pickup.address_id` di [Create order](#create-order), sekaligus ID untuk [memperbarui](#update-address) atau [menghapus](#delete-address) alamat. Untuk menyimpan alamat baru, pakai [Add user's address](#add-users-address).

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Create order`. Tanpa itu, request ditolak dengan 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/address'
```

## Contoh response

```json
{
    "success": true,
    "data": [
        {
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
        }
    ],
    "nowDate": "11-12-2026",
    "now": "15"
}
```

## Pencarian dan paging

Tambahkan `keyword` untuk mencari alamat berdasarkan nama toko, dan `page` bersama `size` untuk membacanya per halaman. Contoh ini mengembalikan halaman pertama berisi 20 alamat yang namanya mengandung `gudang`.

### Contoh request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/address?keyword=gudang&page=1&size=20'
```

### Contoh response

```json
{
    "success": true,
    "data": [
        {
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
        }
    ],
    "nowDate": "11-12-2026",
    "now": "15"
}
```

## Query parameter

Semua parameter opsional. Tanpa parameter apa pun, panggilan mengembalikan semua alamat di akunmu.

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| keyword | String | Hanya mengembalikan alamat yang `PICKUP_NAME`-nya mengandung teks ini. Huruf besar atau kecil tidak berpengaruh. Pakai satu kata, karena spasi dan tanda baca dibuang dari keyword tapi tidak dari nama, jadi `Toko Jawa` tidak menemukan apa pun walau ada `Toko Jawa Barat`. |
| page | Number | Nomor halaman, mulai dari 1. Hanya berfungsi bersama `size`. |
| size | Number | Jumlah alamat per halaman, paling banyak 100. Hanya berfungsi bersama `page`. |
| fields | String | Nama field yang dikembalikan, dipisah koma tanpa spasi, misalnya `_id,PICKUP_NAME`. `_id` selalu disertakan. |

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| data | Array | Daftar alamat. Array kosong kalau kamu belum punya alamat, atau tidak ada yang cocok. |
| nowDate | String | Tanggal hari ini dalam waktu Jakarta, berformat `MM-DD-YYYY`. |
| now | String | Jam saat ini dalam waktu Jakarta, dari `00` sampai `23`. |
| _id | String | ID alamat. Pakai sebagai `pickup.address_id` di Create order, dan sebagai `id` di Update address dan Delete user's address. |
| PICKUP_NAME | String | Nama seller atau toko. |
| PICKUP_PIC | String | Nama kontak person (PIC). |
| PICKUP_PIC_PHONE | String | Nomor telepon. |
| PICKUP_ADDRESS | String | Teks alamat jalan. |
| PICKUP_AUTOFILL | String | `_id` data alamat yang menjadi sumber wilayahnya. |
| pinpointData | Object | Geolokasi pickup, berisi `lat` dan `lng`. Hanya ada kalau pernah disimpan. |
| PICKUP_DISTRICT | String | Kecamatan. |
| PICKUP_SUBDISTRICT | String | Kelurahan. |
| PICKUP_REGION | String | Provinsi. |
| PICKUP_CITY | String | Kota atau kabupaten. |
| PICKUP_ZIP | String | Kode pos. |
| PICKUP_FULL_AUTOFILL | String | Wilayah dalam satu baris: provinsi, kota, kecamatan, kelurahan. |
| createdAt | String | Waktu alamat ditambahkan (ISO 8601). |
| updatedAt | String | Waktu alamat terakhir diubah (ISO 8601). |

Field lainnya di tiap alamat berisi data internal yang dipakai Mengantar untuk mengarahkan pickup, seperti kode kurir. Jangan bergantung padanya.

## Batasan

- Response tidak berisi total jumlah. Untuk membaca semuanya per halaman, minta `page` berikutnya terus sampai ada halaman yang mengembalikan alamat lebih sedikit dari `size`.
- `page` dan `size` diabaikan kalau tidak dikirim berdua. Panggilan dengan salah satunya saja mengembalikan semua alamat.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| API key tidak valid atau nonaktif, tidak punya hak akses `Create order`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
