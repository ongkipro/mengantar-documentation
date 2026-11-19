# Add user's address

`POST {BASE_URL}/api/public/{API_KEY}/address`

Menyimpan alamat pickup ke akunmu. Wilayahnya (provinsi, kota, kecamatan, kelurahan, dan kode pos) tidak diketik. Cari lewat [Search address data](#search-address-data), lalu kirim `_id` hasilnya sebagai `PICKUP_AUTOFILL`. Untuk mengubah alamat yang sudah tersimpan, pakai [Update address](#update-address).

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Create order`. Tanpa itu, request ditolak dengan 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl \
-X POST '{BASE_URL}/api/public/{API_KEY}/address' \
-H 'Content-Type: application/json' \
-d '{
  "PICKUP_NAME": "Gudang Utama",
  "PICKUP_PIC": "Budi",
  "PICKUP_PIC_PHONE": "081234567890",
  "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
  "PICKUP_AUTOFILL": "5fc62de8f8f44b34aa4bdc49",
  "pinpointData": {
    "lat": -6.9456,
    "lng": 107.5703
  }
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
}
```

## Body parameters

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| PICKUP_NAME | String | Wajib saat menambah. Nama seller atau toko. |
| PICKUP_PIC | String | Wajib saat menambah. Nama kontak person (PIC). |
| PICKUP_PIC_PHONE | String | Wajib saat menambah. Nomor telepon. Spasi, tanda hubung, dan tanda kurung boleh dipakai, misalnya `0812-3456-7890`. Nomor yang tidak valid ditolak. |
| PICKUP_ADDRESS | String | Wajib saat menambah. Teks alamat jalan. |
| PICKUP_AUTOFILL | String | Wajib saat menambah. `_id` alamat dari [Search address data](#search-address-data). Dipakai untuk mengisi provinsi, kota, kecamatan, kelurahan, dan kode pos. |
| pinpointData | Object \| null | Opsional. Geolokasi pickup. Wajib kalau alamat dipakai untuk pickup terjadwal Pos Indonesia (`pos`). Kirim `pinpointData.lat` dan `pinpointData.lng` sebagai angka. Latitude harus antara -90 dan 90, longitude harus antara -180 dan 180. Kirim `null` atau lewati field ini kalau tidak ada pinpoint. |
| SHIPPER_ADDR1 | String | Opsional. Teks alamat retur, kalau berbeda dari alamat pickup. |
| SHIPPER_AUTOFILL | String | Opsional. `_id` wilayah alamat retur dari [Search address data](#search-address-data). |
| SHIPPER_CONTACT | String | Opsional. Nama seller atau toko untuk alamat retur. |
| SHIPPER_PHONE | String | Opsional. Nomor telepon untuk alamat retur. |

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| _id | String | ID alamat. Pakai sebagai `pickup.address_id` di Create order, dan sebagai `id` di Update address dan Delete user's address. |
| user_id | String | ID akunmu. |
| pinpointData | Object | Geolokasi pickup yang tersimpan, berisi `lat` dan `lng`. Hanya ada kalau kamu mengirimnya. |
| PICKUP_DISTRICT | String | Kecamatan, diisi dari `PICKUP_AUTOFILL`. |
| PICKUP_SUBDISTRICT | String | Kelurahan, diisi dari `PICKUP_AUTOFILL`. |
| PICKUP_REGION | String | Provinsi, diisi dari `PICKUP_AUTOFILL`. |
| PICKUP_CITY | String | Kota atau kabupaten, diisi dari `PICKUP_AUTOFILL`. |
| PICKUP_ZIP | String | Kode pos, diisi dari `PICKUP_AUTOFILL`. |
| PICKUP_FULL_AUTOFILL | String | Wilayah dalam satu baris: provinsi, kota, kecamatan, kelurahan. |
| createdAt | String | Waktu alamat ditambahkan (ISO 8601). |
| updatedAt | String | Waktu alamat terakhir diubah (ISO 8601). |

Field lainnya berisi data internal yang dipakai Mengantar untuk mengarahkan pickup, seperti kode kurir. Data yang kamu kirim dikembalikan apa adanya. Jangan bergantung pada field lainnya.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| Ada field wajib yang tidak dikirim | 400 | `{ "success": false, "field": "PICKUP_NAME", "message": "PICKUP_NAME is required" }` |
| `PICKUP_PIC_PHONE` bukan nomor telepon yang valid | 400 | `{ "success": false, "field": "PICKUP_PIC_PHONE", "message": "PICKUP_PIC_PHONE is invalid" }` |
| `PICKUP_AUTOFILL` tidak cocok dengan data alamat mana pun | 400 | `{ "success": false, "field": "PICKUP_AUTOFILL", "message": "address not found" }` |
| `SHIPPER_AUTOFILL` tidak cocok dengan data alamat mana pun | 400 | `{ "success": false, "field": "SHIPPER_AUTOFILL", "message": "return address not found" }` |
| `pinpointData` di luar rentang, misalnya latitude 999 | 400 | `{ "success": false, "field": "pinpointData.lat", "message": "pinpointData.lat must be less than or equal to 90" }` |
| API key tidak valid atau nonaktif, tidak punya hak akses `Create order`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
