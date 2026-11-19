# Get Time

`GET {BASE_URL}/api/public/{API_KEY}/time`

Menampilkan daftar waktu pickup mendatang yang kamu tambahkan lewat [Add Time](#add-time). Pakai `_id` salah satunya sebagai `pickup.time_id` di [Create order](#create-order) kalau tipe pickup-nya `scheduledPickup`.

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Create order`. Tanpa itu, request ditolak dengan 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/time'
```

## Contoh response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af583fb9708e74dced0799e",
            "date": 1796043600000,
            "time": "13:00"
        },
        {
            "_id": "6af583fc9708e74dced079b0",
            "date": 1796115600000,
            "time": "09:00"
        },
        {
            "_id": "6af583fc9708e74dced079bb",
            "date": 1795982400000,
            "time": "20:00"
        }
    ]
}
```

## Filter berdasarkan alamat dan kurir

Tambahkan `address` untuk mendapat waktu satu alamat, dan `courier` untuk menyembunyikan waktu yang tidak bisa dipakai kurir itu. Pada contoh ini `JNE` menyembunyikan slot Minggu `20:00` dari daftar di atas.

### Contoh request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/time?address=6af555fc8109274a92d72fb3&courier=JNE'
```

### Contoh response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af583fb9708e74dced0799e",
            "date": 1796043600000,
            "time": "13:00"
        },
        {
            "_id": "6af583fc9708e74dced079b0",
            "date": 1796115600000,
            "time": "09:00"
        }
    ]
}
```

## Query parameter

Kedua parameter opsional. Tanpa parameter, panggilan mengembalikan semua waktu pickup mendatangmu, untuk semua alamat.

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| address | String | `_id` alamat yang tersimpan. Hanya mengembalikan waktu yang ditambahkan untuk alamat itu. Alamat yang tidak ada, atau belum punya waktu, mengembalikan daftar kosong. |
| courier | String | Menyembunyikan waktu yang tidak bisa dipakai kurir ini. Huruf besar dan kecil dibedakan. Lihat aturannya di bawah. |

Waktu yang sudah lewat tidak pernah dikembalikan. Aturan `courier`:

- `JNE`: tidak ada pickup hari Minggu, dan tidak ada `19:00` atau `20:00`.
- `anteraja`: tidak ada pickup hari Minggu.
- `iDexpress`: tidak ada `20:00`, dan hanya waktu yang lebih dari 90 menit dari sekarang.
- Nilai lain, atau tanpa nilai: tidak ada filter tambahan.

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| data | Array | Daftar waktu pickup, urut sesuai waktu ditambahkan. Array kosong kalau tidak ada yang cocok. |
| _id | String | ID waktu pickup. Pakai sebagai `pickup.time_id` di Create order. |
| date | Number | Tanggal dan jam pickup sebagai Unix timestamp dalam milidetik. Tanggal dan jam Jakarta ditulis seolah-olah UTC, jadi `1796043600000` adalah `2026-11-30 13:00` kalau dibaca dalam UTC. Baca dalam UTC, bukan zona waktumu sendiri. |
| time | String | Jam pickup, misalnya `13:00`. |

## Batasan

- Hasilnya tidak menyebut waktu itu milik alamat yang mana. Untuk mendapat waktu satu alamat, kirim `address`.
- Daftar tidak punya pagination dan tidak diurutkan. Urutkan sendiri berdasarkan `date` kalau perlu.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| API key tidak valid atau nonaktif, tidak punya hak akses `Create order`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
