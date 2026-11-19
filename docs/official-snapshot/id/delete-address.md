# Delete address

`DELETE {BASE_URL}/api/public/{API_KEY}/address`

Menghapus satu alamat pickup yang tersimpan di akunmu. Hanya alamat milikmu sendiri yang bisa dihapus. Ambil `_id` alamat dari [Get user's addresses](#get-users-addresses) atau [Add user's address](#add-users-address).

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Create order`. Tanpa itu, request ditolak dengan 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/address' \
-H 'Content-Type: application/json' \
-d '{
  "id": "6af555fc8109274a92d72fb3"
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
    }
}
```

## Body parameters

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| id | String | Wajib. `_id` alamat yang akan dihapus. Harus milik akunmu. |

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| data | Object | Alamat seperti kondisinya sesaat sebelum dihapus. |

> [!NOTE]
> **Peringatan:** Aksi ini permanen. Alamat yang sudah dihapus tidak bisa dikembalikan. Pastikan kamu memang ingin menghapus alamat ini sebelum mengirim request.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| `id` tidak dikirim, sudah dihapus, tidak ada, atau milik akun lain | 400 | `{ "success": false, "message": "Something went wrong" }` |
| `id` bukan ID alamat yang valid, misalnya `abc` | 400 | `{ "success": false, "message": "Error on delete address", "error": { ... } }` |
| API key tidak valid atau nonaktif, tidak punya hak akses `Create order`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |

Menghapus alamat yang sama untuk kedua kalinya mengembalikan error pertama, bukan sukses.
