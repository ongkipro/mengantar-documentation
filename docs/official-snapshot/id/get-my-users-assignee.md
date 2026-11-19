# Get My Users (assignee)

`GET {BASE_URL}/api/public/{API_KEY}/my-users`

Menampilkan anggota tim (sub-user) akunmu. Pakai `_id` salah satunya sebagai `assignee` di [Create order](#create-order) untuk menugaskan order ke anggota tim itu. Kamu mengelola anggota timmu di aplikasi Mengantar, lewat **Pengaturan** → **Manajemen Pengguna** (halaman `/users`), tempat kamu bisa menambah user serta mengubah atau menghapus user yang ada.

`{API_KEY}` wajib berisi API key yang valid dan aktif, dipanggil dari IP yang diizinkan. Tidak butuh hak akses lain. Tanpa itu, request ditolak dengan 403 `Not allowed`.

Permission required: Tidak ada, selain API key aktif yang dipanggil dari IP yang diizinkan
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/my-users'
```

## Contoh response

```json
{
    "success": true,
    "data": [
        {
            "_id": "67d116f5b68d715ee586ab96",
            "name": "Rina",
            "email": "rina@example.com"
        },
        {
            "_id": "67c58e190a9a21d23e220207",
            "name": "Udin",
            "email": "udin@example.com"
        }
    ]
}
```

Request ini tidak punya parameter. Semua anggota timmu dikembalikan sekaligus, tanpa pagination, dan `data` kosong kalau kamu belum punya anggota tim.

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| data | Array | Anggota tim akunmu. |
| _id | String | ID anggota tim. Kirim sebagai `assignee` di Create order. |
| name | String | Nama anggota tim. |
| email | String | Email anggota tim. |

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| API key tidak valid atau nonaktif, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
| Method bukan `GET` | 405 | `{ "success": false, "message": "POST not allowed on this route" }` |
