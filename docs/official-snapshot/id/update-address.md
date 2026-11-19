# Update address

`PUT {BASE_URL}/api/public/{API_KEY}/address/{id}`

Memperbarui satu alamat pickup yang tersimpan berdasarkan ID. Kirim hanya field yang ingin kamu ubah; field lainnya tetap seperti semula. Untuk memindahkan alamat ke wilayah lain, kirim `PICKUP_AUTOFILL` baru dari [Search address data](#search-address-data).

Permission required: Create order
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X PUT '{BASE_URL}/api/public/{API_KEY}/address/6af555fc8109274a92d72fb3' \
-H 'Content-Type: application/json' \
-d '{
  "PICKUP_NAME": "Gudang Utama 2",
  "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 14"
}'
```

## Contoh response

```json
{
    "success": true,
    "data": {
        "RETURN_COUNTRY": "INDONESIA",
        "isReturnDifferentFromPickup": false,
        "_id": "6af555fc8109274a92d72fb3",
        "PICKUP_NAME": "Gudang Utama 2",
        "PICKUP_PIC": "Budi",
        "PICKUP_PIC_PHONE": "081234567890",
        "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 14",
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
        "updatedAt": "2026-11-12T08:53:57.846Z",
        "__v": 0
    },
    "message": "Request successful"
}
```

## Url parameters

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| id | String | `_id` alamat yang akan diperbarui. Harus milik akunmu. |

## Body parameters

Semua field opsional. Request dengan body kosong berhasil dan tidak mengubah apa pun. Hanya field di tabel ini yang disimpan: field lain di body diabaikan.

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| PICKUP_NAME | String | Nama seller atau toko. |
| PICKUP_PIC | String | Nama kontak person (PIC). |
| PICKUP_PIC_PHONE | String | Nomor telepon. Spasi, tanda hubung, dan tanda kurung boleh dipakai. Nomor yang tidak valid, atau `null`, ditolak. |
| PICKUP_ADDRESS | String | Teks alamat jalan. |
| PICKUP_AUTOFILL | String | `_id` alamat dari [Search address data](#search-address-data). Dipakai untuk mengganti provinsi, kota, kecamatan, kelurahan, dan kode pos. Tidak boleh kosong. |
| pinpointData | Object \| null | Geolokasi pickup. Wajib kalau alamat dipakai untuk pickup terjadwal Pos Indonesia (`pos`). Kirim `pinpointData.lat` dan `pinpointData.lng` sebagai angka. Latitude harus antara -90 dan 90, longitude harus antara -180 dan 180. |
| SHIPPER_ADDR1 | String | Teks alamat retur, kalau berbeda dari alamat pickup. |
| SHIPPER_AUTOFILL | String | `_id` wilayah alamat retur dari [Search address data](#search-address-data). |
| SHIPPER_CONTACT | String | Nama seller atau toko untuk alamat retur. |
| SHIPPER_PHONE | String | Nomor telepon untuk alamat retur. |

> [!NOTE]
> **Ubah wilayah lewat `PICKUP_AUTOFILL`.** Provinsi, kota, kecamatan, kelurahan, dan kode pos sebuah alamat selalu berasal dari `PICKUP_AUTOFILL`, jadi bukan body parameter. Kirim `PICKUP_AUTOFILL` baru untuk mengubah semuanya sekaligus.

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| _id | String | ID alamat. |
| user_id | String | ID akunmu. |
| pinpointData | Object | Geolokasi pickup yang tersimpan, berisi `lat` dan `lng`. Hanya ada kalau pernah disimpan. |
| PICKUP_DISTRICT | String | Kecamatan, diisi dari `PICKUP_AUTOFILL`. |
| PICKUP_SUBDISTRICT | String | Kelurahan, diisi dari `PICKUP_AUTOFILL`. |
| PICKUP_REGION | String | Provinsi, diisi dari `PICKUP_AUTOFILL`. |
| PICKUP_CITY | String | Kota atau kabupaten, diisi dari `PICKUP_AUTOFILL`. |
| PICKUP_ZIP | String | Kode pos, diisi dari `PICKUP_AUTOFILL`. |
| PICKUP_FULL_AUTOFILL | String | Wilayah dalam satu baris: provinsi, kota, kecamatan, kelurahan. |
| updatedAt | String | Waktu alamat terakhir diubah (ISO 8601). |

`data` berisi seluruh alamat setelah perubahan. Field lainnya berisi data internal yang dipakai Mengantar untuk mengarahkan pickup, seperti kode kurir. Data yang kamu kirim dikembalikan apa adanya. Jangan bergantung pada field lainnya.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| `id` bukan ID alamat yang valid | 400 | `{ "name": "BadRequestError", "message": "Invalid address object id", "success": false }` |
| `id` bukan alamat tersimpan milikmu | 422 | `{ "name": "ValidationError", "message": "address not found", "success": false }` |
| `PICKUP_PIC_PHONE` bukan nomor telepon yang valid, atau `null` | 422 | `{ "name": "ValidationError", "message": "PIC phone number is invalid", "success": false }` |
| `PICKUP_AUTOFILL` kosong | 422 | `{ "name": "ValidationError", "message": "PICKUP_AUTOFILL is a required field", "success": false }` |
| `PICKUP_AUTOFILL` tidak cocok dengan data alamat mana pun | 422 | `{ "name": "ValidationError", "message": "address not found", "success": false }` |
| `SHIPPER_AUTOFILL` tidak cocok dengan data alamat mana pun | 422 | `{ "name": "ValidationError", "message": "shipper address not found", "success": false }` |
| API key tidak valid atau nonaktif, tidak punya hak akses `Create order`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
