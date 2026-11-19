# Get Invoices and Balance

`GET {BASE_URL}/api/public/{API_KEY}/invoices`

Menampilkan daftar invoice akunmu, yang terbaru dulu, beserta saldo akunmu saat ini. Satu invoice adalah satu pergerakan saldo: pembayaran batch, refund, top up saldo, penarikan, atau rekonsiliasi. Pakai ini untuk mencocokkan saldomu dengan sistemmu sendiri.

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Check balance`. Tanpa itu, request ditolak dengan 403 `Not allowed`.

Permission required: Check balance
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/invoices?size=2'
```

## Contoh response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af6011b7c3d9e4a52f8b001",
            "user": {
                "name": "Budi",
                "email": "budi@example.com"
            },
            "inv_number": "SS121126032870107",
            "type": "typePayment",
            "status": "statusCleared",
            "courier": "lion",
            "amount": 68000,
            "total": 68000,
            "description": "Payment for Non-COD batch 26111210ZWUD21",
            "subItems": [
                {
                    "type": "typePayment",
                    "description": "261112VCA1IF",
                    "amount": -68000,
                    "COD_AMOUNT": 0,
                    "COD_FEE": 0,
                    "estimatedSpecialPrice": 68000,
                    "estimatedPrice": 85000,
                    "status": "statusCompleted",
                    "cnote_no": "C1HR6W0U",
                    "RECEIVER_NAME": "Siti",
                    "RECEIVER_PHONE": "081234567890",
                    "GOODS_DESC": "Kaos polos",
                    "QTY": 1,
                    "PICKUP_NAME": "Gudang Utama"
                }
            ],
            "createdAt": "2026-11-12T03:28:39.657Z",
            "updatedAt": "2026-11-12T03:28:40.185Z",
            "balanceAmount": 294009
        },
        {
            "_id": "6af6021b7c3d9e4a52f8b001",
            "user": {
                "name": "Budi",
                "email": "budi@example.com"
            },
            "inv_number": "SS111126130000845",
            "type": "typeReconciliation",
            "status": "statusCleared",
            "courier": "JT",
            "amount": 66588,
            "total": 66588,
            "description": "Auto Reconciliation",
            "subItems": [
                {
                    "courier": "JT",
                    "type": "typeRevenue",
                    "description": "261111FFW527",
                    "amount": 66588,
                    "COD_AMOUNT": 125000,
                    "COD_FEE": 4162.499999999999,
                    "estimatedSpecialPrice": 58412,
                    "estimatedPrice": 81662,
                    "status": "statusCompleted",
                    "cnote_no": "JJ6000001910",
                    "RECEIVER_NAME": "Siti",
                    "RECEIVER_PHONE": "081234567890",
                    "GOODS_DESC": "Kaos polos",
                    "QTY": 1,
                    "PICKUP_NAME": "Gudang Utama"
                }
            ],
            "createdAt": "2026-11-11T13:00:00.725Z",
            "updatedAt": "2026-11-11T13:00:00.725Z"
        }
    ],
    "count": 5614,
    "balance": 294009,
    "nextCursor": "MjAyNi0xMS0xMVQxMzowMDowMC43MjVafDZhZjYwMjFiN2MzZDllNGE1MmY4YjAwMQ"
}
```

## Filter berdasarkan tipe

Tambahkan `invoiceFilter` untuk melihat satu tipe invoice saja. Contoh ini menampilkan penarikan saldo. `count` lalu menjadi jumlah penarikan, sedangkan `balance` tetap saldomu.

### Contoh request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/invoices?invoiceFilter=typeWithdraw&size=1'
```

### Contoh response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af6051b7c3d9e4a52f8b001",
            "user": {
                "name": "Budi",
                "email": "budi@example.com"
            },
            "inv_number": "SS1310261007202",
            "type": "typeWithdraw",
            "status": "statusPending",
            "courier": "spx",
            "amount": 1001000,
            "total": 1001000,
            "subItems": [],
            "expiration_date": "2026-10-15T03:07:00.000Z",
            "createdAt": "2026-10-13T03:07:25.167Z",
            "updatedAt": "2026-10-13T03:07:25.449Z",
            "balanceAmount": 0
        }
    ],
    "count": 72,
    "balance": 294009,
    "nextCursor": "MjAyNi0xMC0xM1QwMzowNzoyNS4xNjdafDZhZjYwNTFiN2MzZDllNGE1MmY4YjAwMQ"
}
```

## Baca halaman berikutnya

Kirim `nextCursor` dari response sebelumnya sebagai `cursor` dan ulangi sampai `nextCursor` kembali kosong. Halaman dengan cursor selalu akurat sedalam apa pun dan biayanya sama, baik halaman ke-2 maupun ke-500. Pakai ini menggantikan `page` untuk daftar yang lebih panjang dari beberapa halaman.

### Contoh request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/invoices?size=2&cursor=MjAyNi0xMS0xMVQxMzowMDowMC43MjVafDZhZjYwMjFiN2MzZDllNGE1MmY4YjAwMQ'
```

### Contoh response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af6031b7c3d9e4a52f8b001",
            "user": {
                "name": "Budi",
                "email": "budi@example.com"
            },
            "inv_number": "SS111126130000427",
            "type": "typeReconciliation",
            "status": "statusCleared",
            "courier": "spx",
            "amount": 119695,
            "total": 119695,
            "description": "Auto Reconciliation",
            "subItems": [
                {
                    "courier": "spx",
                    "type": "typeRevenue",
                    "description": "261111MF13NE",
                    "amount": 119695,
                    "COD_AMOUNT": 128000,
                    "COD_FEE": 4262,
                    "estimatedSpecialPrice": 8305,
                    "estimatedPrice": 9652,
                    "status": "statusCompleted",
                    "cnote_no": "SPXID06563649935B",
                    "RECEIVER_NAME": "Siti",
                    "RECEIVER_PHONE": "081234567890",
                    "GOODS_DESC": "Kaos polos",
                    "QTY": 1,
                    "PICKUP_NAME": "Gudang Utama"
                }
            ],
            "createdAt": "2026-11-11T13:00:00.101Z",
            "updatedAt": "2026-11-11T13:00:00.101Z"
        },
        {
            "_id": "6af6041b7c3d9e4a52f8b001",
            "user": {
                "name": "Budi",
                "email": "budi@example.com"
            },
            "inv_number": "SS111126062985822",
            "type": "typePayment",
            "status": "statusCleared",
            "courier": "iDexpress",
            "amount": 1067625,
            "total": 1067625,
            "description": "Payment for Non-COD batch 26111113542FR2",
            "subItems": [
                {
                    "type": "typePayment",
                    "description": "261111MTBCUC",
                    "amount": -1067625,
                    "COD_AMOUNT": 0,
                    "COD_FEE": 0,
                    "estimatedSpecialPrice": 1067625,
                    "estimatedPrice": 1186250,
                    "status": "statusCompleted",
                    "cnote_no": "IDE4378561901409",
                    "RECEIVER_NAME": "Siti",
                    "RECEIVER_PHONE": "081234567890",
                    "GOODS_DESC": "Kaos polos",
                    "QTY": 1,
                    "PICKUP_NAME": "Gudang Utama"
                }
            ],
            "createdAt": "2026-11-11T06:29:21.941Z",
            "updatedAt": "2026-11-11T06:29:22.298Z",
            "balanceAmount": 175726
        }
    ],
    "count": 5614,
    "balance": 294009,
    "nextCursor": "MjAyNi0xMS0xMVQwNjoyOToyMS45NDFafDZhZjYwNDFiN2MzZDllNGE1MmY4YjAwMQ"
}
```

## Query parameter

Semua parameter opsional. Tanpa parameter, kamu mendapat 50 invoice terbaru.

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| page | Number | Nomor halaman. Bawaan `1`, maksimum `100`, dan harus di atas `0`. Diabaikan kalau `cursor` dikirim. |
| size | Number | Jumlah data per halaman. Bawaan `50`, maksimum `100`. Nilai lebih besar ditolak dengan 400. `0` atau nilai yang bukan angka memakai bawaan. |
| cursor | String | `nextCursor` dari response sebelumnya. Mengembalikan data setelah halaman itu. Nilai yang tidak dikenali ditolak dengan 400. |
| keyword | String | Mencari invoice berdasarkan sebagian nomor invoice, ORDER_ID, nomor resi (`cnote_no`), atau deskripsi item, atau berdasarkan nominal yang persis. Kirim teks biasa: karakter seperti `(` membuat request gagal dengan 400. |
| ids | String | Nomor invoice (`inv_number`) dipisah koma, misalnya `SS121126032870107,SS111126130000845`. Hanya mengembalikan invoice tersebut. |
| dateRange | String | Objek JSON dengan `startDate` dan `endDate`, misalnya `{"startDate":"2026-11-01T00:00:00.000Z","endDate":"2026-11-30T23:59:59.999Z"}`. Mengembalikan invoice yang dibuat setelah `startDate` dan sebelum `endDate`. Tanpa kedua tanggal itu, request gagal dengan 400. |
| invoiceFilter | String | Satu tipe invoice, lihat di bawah. Kosongkan atau kirim `all` untuk semua tipe. Tipe yang tidak dikenal mengembalikan daftar kosong. |

Invoice selalu urut dari yang terbaru. Tidak ada parameter pengurutan, jadi `sort` dan `asc` tidak berpengaruh.

Satu halaman berisi paling banyak 100 invoice, dan `page` maksimum 100. Untuk melihat lebih jauh ke belakang, pakai `cursor` atau persempit daftar dengan `dateRange`.

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| data | Array | Invoice di halaman ini. Array kosong kalau tidak ada yang cocok. |
| count | Number | Jumlah invoice yang cocok dengan filtermu, di semua halaman. |
| balance | Number | Saldomu saat ini dalam rupiah. Tidak bergantung pada filter. |
| nextCursor | String | Kirim sebagai `cursor` untuk membaca halaman berikutnya. Kosong kalau halaman itu yang terakhir. |
| _id | String | ID internal invoice. |
| inv_number | String | Nomor invoice. |
| type | String | Tipe invoice, lihat di bawah. |
| status | String | Status invoice, lihat di bawah. |
| courier | String | Kurir invoice, atau `system` untuk top up saldo. |
| amount | Number | Nominal invoice dalam rupiah. |
| total | Number | Total invoice dalam rupiah. |
| description | String | Untuk apa invoice itu, misalnya batch yang dibayarnya. |
| subItems | Array | Order di dalam invoice, masing-masing dengan `description` (ORDER_ID), `cnote_no`, `amount`, `status`, `COD_AMOUNT`, `COD_FEE`, `estimatedPrice`, `estimatedSpecialPrice`, dan data penerima. Kosong kalau invoice tidak punya order. |
| user | Object | `name` dan `email` akun pemilik invoice. |
| ORDER_ID | String | Hanya pada refund: order yang direfund. Refund juga punya `cnote_no`. |
| balanceAmount | Number | Saldomu tepat setelah invoice ini, dalam rupiah. Tidak ada di setiap invoice. |
| expiration_date | String | Hanya pada penarikan: kapan permintaan kedaluwarsa. |
| createdAt | String | Kapan invoice dibuat, dalam ISO 8601 UTC. |
| updatedAt | String | Kapan invoice terakhir diperbarui, dalam ISO 8601 UTC. |

## Tipe invoice

| `invoiceFilter` | Artinya |
| --- | --- |
| `typePayment` | Pembayaran untuk satu batch order. |
| `typeRefund` | Pengembalian ke saldomu, misalnya untuk order yang dihapus. |
| `typeAddBalance` | Top up saldomu. |
| `typeWithdraw` | Penarikan saldomu. |
| `typeReconciliation` | Penyelesaian otomatis uang COD dari order yang sudah terkirim ke saldomu. |

## Status invoice

| `status` | Artinya |
| --- | --- |
| `statusCleared` | Selesai. |
| `statusPending` | Menunggu diproses. Terlihat pada penarikan. |
| `statusProcessing` | Sedang diproses. Terlihat pada penarikan. |
| `statusFailed` | Gagal. Terlihat pada penarikan. |
| `statusExpired` | Kedaluwarsa sebelum dibayar. Terlihat pada top up. |

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| `size` di atas 100 | 400 | `{ "success": false, "message": "size must not exceed 100; use cursor to fetch the next page" }` |
| `page` di atas 100 | 400 | `{ "success": false, "message": "page must not exceed 100; use cursor (or dateRange) to go further back" }` |
| `page` bernilai `0` atau kurang | 400 | `{ "success": false, "message": "page must be greater than 0" }` |
| `cursor` bukan nilai `nextCursor` | 400 | `{ "success": false, "message": "Invalid cursor; send the nextCursor value from the previous response" }` |
| `dateRange` bukan JSON yang valid atau kurang tanggal, atau `keyword` berisi karakter seperti `(` | 400 | `{ "success": false, "message": "Error on get invoice" }` |
| API key tidak valid atau nonaktif, tidak punya hak akses `Check balance`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
