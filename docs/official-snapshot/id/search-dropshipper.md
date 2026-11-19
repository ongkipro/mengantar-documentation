# Search Dropshipper

`GET {BASE_URL}/api/public/{API_KEY}/dropshippers`

Menampilkan dropshipper yang tersimpan di akunmu, bisa difilter berdasarkan awal nama atau nomor telepon. Pakai `id` salah satu hasilnya sebagai `dropShipper.id` di [Create order](#create-order), atau [tambahkan dropshipper](#add-dropshipper) dulu kalau belum tersimpan.

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Create order`, dan fitur Dropshipper harus aktif di akunmu lewat Seller Web. Tanpa API key yang valid, request ditolak dengan 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox dan production

## Contoh request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/dropshippers?search=Toko&page=1&perPage=20'
```

## Contoh response

```json
{
  "success": true,
  "data": [
    {
      "id": "66ab1234567890abcdef1234",
      "name": "Toko Partner",
      "phone": "081234567890"
    },
    {
      "id": "66ab1234567890abcdef1235",
      "name": "Toko Sahabat",
      "phone": "081298765432"
    }
  ],
  "pagination": { "page": 1, "perPage": 20 }
}
```

## Query parameter

Semua parameter opsional. Tanpa parameter, kamu mendapat 20 dropshipper pertama, diurutkan berdasarkan nama.

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| search | String | Awal sebuah nama atau nomor telepon. Huruf besar dan kecil tidak dibedakan. Kirim teks biasa: karakter seperti `(` dan `[` membuat request gagal dengan 500. Untuk mencari nomor yang diawali `+`, tulis sebagai `%2B`, karena `+` biasa menjadi spasi. |
| page | Number | Nomor halaman. Bawaan `1`. Nilai yang bukan angka positif memakai `1`. |
| perPage | Number | Jumlah data per halaman. Bawaan `20`, maksimum `100`. Nilai lebih besar ditolak dengan 400. Nilai yang bukan angka positif memakai `20`. |

Pada pencarian beberapa kata, seperti `Toko Partner`, hasilnya juga memuat nama yang diawali kata pertama, yaitu `Toko`. Hasil yang paling cocok tampil lebih dulu di halaman itu.

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| data | Array | Dropshipper di halaman ini. Array kosong kalau tidak ada yang cocok. |
| id | String | ID dropshipper. Kirim sebagai `dropShipper.id` di Create order. |
| name | String | Nama yang tersimpan. |
| phone | String | Nomor telepon yang tersimpan. |
| pagination | Object | `page` dan `perPage` yang dipakai. |

Response tidak memuat total. Kalau satu halaman mengembalikan data lebih sedikit dari `perPage`, itu halaman terakhir.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| `perPage` di atas 100 | 400 | `{ "success": false, "message": "perPage cannot be greater than 100" }` |
| API key tidak valid atau nonaktif, tidak punya hak akses `Create order`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
| Fitur Dropshipper belum aktif di akun | 403 | `{ "success": false, "message": "Dropshipper Feature is not enabled. Enable it through Seller Web." }` |
| `search` berisi karakter seperti `(` atau `[` | 500 | `{ "success": false, "message": "Invalid regular expression: /^(/: Unterminated group" }` |
