# Get batches

`GET {BASE_URL}/api/public/{API_KEY}/batch`

Menampilkan batch milikmu, dari yang terbaru. Batch adalah hasil satu panggilan [Create order](#create-order): order-ordernya, satu kurir, dan satu pickup. Pakai `_id` batch sebagai `batch_id` di [Pay unpaid](#pay-unpaid) dan sebagai `id` di [Delete batch](#delete-batch), serta `id` batch (nomor batch) sebagai `batch` di [Get orders](#get-orders).

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Check order status`. Tanpa itu, request ditolak dengan 403 `Not allowed`.

Permission required: Check order status
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/batch?size=1&courier=JT'
```

## Contoh response

```json
{
    "success": true,
    "count": 2065,
    "data": [
        {
            "isDraft": false,
            "isDeleted": false,
            "isArchived": false,
            "orders": 1,
            "error": 0,
            "unpaid": 0,
            "delivered": 0,
            "undelivered": 1,
            "rts": 0,
            "reconciled": 0,
            "active": 1,
            "totalToPay": 0,
            "totalToPaySpecial": 0,
            "printedDates": [],
            "_id": "6af68834ce96b86fe95821d1",
            "address": {
                "PICKUP_NAME": "Gudang Utama",
                "PICKUP_PIC": "Budi",
                "PICKUP_PIC_PHONE": "081234567890",
                "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
                "PICKUP_DISTRICT": "BABAKAN CIPARAY",
                "PICKUP_CITY": "BANDUNG"
            },
            "address_id": "6af555fc8109274a92d72fb3",
            "id": "26111310KDX9LE",
            "orderData": [
                {
                    "orderId": "261113IBBQ4K",
                    "cnote_no": "JJ6000001911",
                    "status": "active",
                    "SPECIAL_INS": null
                }
            ],
            "createdAt": "2026-11-13T03:47:00.448Z",
            "updatedAt": "2026-11-13T03:47:01.102Z",
            "courier": "JT"
        }
    ]
}
```

## Cari batch yang belum dibayar

Kirim `batchFilter=unpaid` untuk menampilkan hanya batch yang masih punya order belum dibayar. `totalToPay` dan `totalToPaySpecial` lalu menunjukkan berapa yang akan ditagih [Pay unpaid](#pay-unpaid) untuk batch itu.

### Contoh request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/batch?size=1&batchFilter=unpaid'
```

### Contoh response

```json
{
    "success": true,
    "count": 156,
    "data": [
        {
            "isDraft": false,
            "isDeleted": false,
            "isArchived": false,
            "orders": 1,
            "error": 0,
            "unpaid": 1,
            "delivered": 0,
            "undelivered": 1,
            "rts": 0,
            "reconciled": 0,
            "active": 1,
            "totalToPay": 82400,
            "totalToPaySpecial": 57680,
            "printedDates": [],
            "_id": "6af68854ce96b86fe95825ef",
            "address": {
                "PICKUP_NAME": "Gudang Utama",
                "PICKUP_PIC": "Budi",
                "PICKUP_PIC_PHONE": "081234567890",
                "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
                "PICKUP_DISTRICT": "BABAKAN CIPARAY",
                "PICKUP_CITY": "BANDUNG"
            },
            "address_id": "6af555fc8109274a92d72fb3",
            "id": "26111310VLRPUZ",
            "orderData": [
                {
                    "orderId": "261113W04TMC",
                    "cnote_no": null,
                    "status": "active",
                    "SPECIAL_INS": null
                }
            ],
            "createdAt": "2026-11-13T03:47:00.448Z",
            "updatedAt": "2026-11-13T03:47:01.102Z",
            "courier": "JT"
        }
    ]
}
```

## Parameter query

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| page | Number | Nomor halaman. Bawaan `1`, maksimum `100`. `0` ditolak dengan 400. |
| size | Number | Jumlah batch per halaman. Bawaan `50`, maksimum `100`; nilai yang lebih besar ditolak dengan 400. Nilai kosong atau bukan angka memakai bawaan. Batch tidak punya cursor: untuk membaca lebih jauh ke belakang, persempit daftar dengan `dateRange` atau filter lain. |
| courier | String | Hanya batch kurir ini: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, atau `spx`. `Ninja` dihentikan per 1 September 2026, tetapi batch lamanya tetap bisa dibaca: batch itu ada di daftar dan bisa difilter dengan `courier=Ninja`. Kirim nilai yang persis sama: nilai lain tidak ditolak dan bisa mengembalikan daftar yang salah. Tanpa `courier`, daftar mencakup semua kurir yang kamu pakai. |
| dateRange | String | Hanya batch yang dibuat dalam rentang ini. String JSON, `{"startDate":"2026-11-12T00:00:00.000Z","endDate":"2026-11-13T23:59:59.999Z"}`, di-encode URL. Kedua batas bersifat eksklusif dan dibaca sebagai UTC. Nilai yang bukan JSON valid ditolak dengan 400. |
| batchFilter | String | Hanya batch yang counter ini di atas `0`: `unpaid`, `error`, `active`, `delivered`, `undelivered`, `rts`, atau `reconciled`. Lihat counter di bawah. |
| keyword | String | Mencari nomor batch. Huruf besar dan kecil tidak dibedakan, dan dicocokkan sebagai teks biasa, bukan regular expression. |
| address_id | String | Hanya batch yang dijemput di alamat ini: `_id` dari [Get user's addresses](#get-users-addresses). |

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| success | Boolean | `true` kalau request diproses. |
| count | Number | Jumlah total batch yang cocok dengan filter-mu, bukan hanya yang ada di halaman ini. |
| data | Array | Batch di halaman ini, dari yang terbaru. Array kosong kalau tidak ada yang cocok. |
| _id | String | `_id` batch. Pakai sebagai `batch_id` di Pay unpaid dan sebagai `id` di Delete batch. |
| id | String | Nomor batch, misalnya `26111310KDX9LE`. Pakai sebagai `batch` di Get orders. Sebagian batch punya akhiran, seperti `26102713FA471O-1`. |
| courier | String | Kurir batch. |
| orders | Number | Jumlah order dalam batch. |
| error | Number | Jumlah order yang ditolak kurir. |
| unpaid | Number | Jumlah order yang belum dibayar, lihat [Pay unpaid](#pay-unpaid). |
| delivered | Number | Jumlah order yang sudah terkirim. |
| active | Number | Jumlah order yang menunggu pickup: `active`, `PENDING PICKUP`, atau `PICKUP FAILED`. |
| undelivered | Number | Jumlah order yang belum terkirim: semua status selain `DELIVERED`. |
| rts | Number | Jumlah order yang dikembalikan ke pengirim. |
| reconciled | Number | Jumlah order yang sudah direkonsiliasi. |
| totalToPay | Number | Ongkos kirim sebelum diskon dari order yang belum dibayar, dalam rupiah. |
| totalToPaySpecial | Number | Yang kamu bayar untuk order yang belum dibayar setelah diskon, dalam rupiah. Ini yang ditagih Pay unpaid. |
| address | Object | Alamat pickup batch sebagaimana tersimpan: `PICKUP_NAME`, `PICKUP_PIC`, `PICKUP_PIC_PHONE`, `PICKUP_ADDRESS`, `PICKUP_DISTRICT`, dan `PICKUP_CITY`. |
| address_id | String | `_id` alamat pickup. |
| isDeleted | Boolean | Selalu `false` di sini: batch yang dihapus tidak ditampilkan. |
| isArchived | Boolean | `true` untuk batch yang sudah dipindah ke arsip. |
| isDraft | Boolean | `true` untuk batch draft yang belum punya order. |
| printedDates | Array | Kapan label batch dicetak. |
| createdAt | String | Kapan batch dibuat, dalam ISO 8601 UTC. |
| updatedAt | String | Kapan batch terakhir berubah, dalam ISO 8601 UTC. |
| orderData | Array | Order di dalam batch. Array kosong kalau batch belum punya order. |
| orderData[].orderId | String | `ORDER_ID` order. |
| orderData[].cnote_no | String | Nomor resi (AWB). `null` kalau order belum punya, misalnya selama belum dibayar. |
| orderData[].status | String | Status order saat ini. |
| orderData[].SPECIAL_INS | String | Instruksi pengiriman, sebagaimana dikirim di `deliveryInstruction` saat order dibuat. Sebagian kurir menyimpan instruksi bawaan kalau tidak dikirim; selain itu `null`. |

Response juga membawa beberapa field lain untuk keperluan internal, seperti `currentHour`, `user`, `user_id`, `newBatchId`, dan `draftData`. Kamu tidak perlu memakainya.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| API key tidak valid atau nonaktif, tidak punya hak akses `Check order status`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
| `size` di atas 100 | 400 | `{ "success": false, "message": "size must not exceed 100; use cursor to fetch the next page" }` |
| `page` bernilai `0` atau kurang | 400 | `{ "success": false, "message": "page must be greater than 0" }` |
| `page` di atas 100 | 400 | `{ "success": false, "message": "page must not exceed 100; use cursor (or dateRange) to go further back" }` |
| `dateRange` bukan JSON yang valid | 400 | `{ "success": false, "message": "Error on getBatch" }` |
| Tidak ada yang cocok | 200 | `{ "success": true, "count": 0, "data": [] }` |
