# Delete batch

`DELETE {BASE_URL}/api/public/{API_KEY}/batch`

Menghapus satu batch beserta semua order di dalamnya yang masih bisa dihapus. Ini cara cepat untuk menghapus satu panggilan [Create order](#create-order) sekaligus. Saldo order yang sudah dibayar dikembalikan ke kamu. Aturan statusnya sama dengan [Delete orders](#delete-orders): order hanya bisa dihapus selama statusnya `active`, `error`, `PENDING PICKUP`, `PICKUP FAILED`, atau `PICKUP_FAILED_API` (atau kosong).

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Create order`. Tanpa itu, request ditolak dengan 403 `Not allowed`.

> [!WARNING]
> **Cek `deletedCount`, bukan `success`.** Panggilan menjawab 200 dengan `success: true` walau tidak ada yang terhapus, misalnya saat batch sudah dihapus atau order-ordernya sudah lewat pickup. `deletedCount` dan `unDeletedCount` menunjukkan apa yang benar-benar terjadi.

Permission required: Create order
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/batch' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "id": "6af68834ce96b86fe95821d1"
}'
```

## Contoh response

```json
{
    "success": true,
    "data": {
        "isDraft": false,
        "isDeleted": true,
        "isArchived": false,
        "orders": 0,
        "error": 0,
        "unpaid": 0,
        "delivered": 0,
        "undelivered": 2,
        "rts": 0,
        "reconciled": 0,
        "active": 2,
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
        "createdAt": "2026-11-13T03:47:00.448Z",
        "updatedAt": "2026-11-13T04:10:12.731Z"
    },
    "deletedCount": 2,
    "unDeletedCount": 0,
    "totalCount": 2,
    "message": "2 orders are deleted from 2 orders"
}
```

## Lion, anteraja, pos, dan spx

Empat kurir ini menambahkan `ordersCount`, `totalBalanceRefund`, dan `errorMessages` ke response.

### Contoh request

```bash
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/batch' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "lion",
  "id": "26111310LNQ4A2"
}'
```

### Contoh response

```json
{
    "success": true,
    "data": {
        "isDraft": false,
        "_id": "6af68834ce96b86fe95821d2",
        "id": "26111310LNQ4A2",
        "isDeleted": true,
        "orders": 0
    },
    "deletedCount": 1,
    "unDeletedCount": 0,
    "totalCount": 1,
    "message": "1 orders are deleted from 1 orders",
    "ordersCount": 1,
    "totalBalanceRefund": 31200,
    "errorMessages": []
}
```

## Body parameter

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| courier | String | Kurir batch: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, atau `spx`. Huruf besar dan kecil dibedakan. Opsional untuk `JNE`, yang menjadi bawaan. Untuk kurir lain wajib: tanpa itu batch dicari di antara batch `JNE` dan panggilan menjawab `batch not found`. `Ninja` dihentikan per 1 September 2026 dan masih diterima untuk batch lamanya. |
| id | String | Wajib. `_id` batch, atau nomor batchnya seperti `26111310KDX9LE`, dari [Create order](#create-order) atau [Get batches](#get-batches). Satu nilai saja: `id` di sini kebalikan dari array `ids` di [Delete orders](#delete-orders). |

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| success | Boolean | `true` kalau request diproses. Ini tidak berarti ada yang terhapus. |
| data | Object | Batch setelah penghapusan, lihat [Get batches](#get-batches). `isDeleted` bernilai `true` dan `orders` bernilai `0` setelah semua order terhapus; counter lain tidak dihitung ulang. `lion`, `anteraja`, `pos`, dan `spx` mengembalikan object yang lebih pendek. |
| deletedCount | Number | Jumlah order yang dihapus request ini. |
| unDeletedCount | Number | Jumlah order dalam batch yang tidak terhapus. |
| totalCount | Number | Jumlah order dalam batch yang diproses. |
| message | String | Ringkasan, misalnya `2 orders are deleted from 3 orders`. |
| ordersCount | Number | Hanya untuk `lion`, `anteraja`, `pos`, dan `spx`: sama dengan `totalCount`. |
| totalBalanceRefund | Number | Hanya untuk `lion`, `anteraja`, `pos`, dan `spx`: saldo yang dikembalikan, dalam rupiah. Saat kurir menolak membatalkan order, seperti Anteraja pada 5 menit pertama, angkanya bisa tetap terisi walau tidak ada yang dikembalikan: percayai `deletedCount` dan saldomu. |
| errorMessages | Array | Hanya untuk `lion`, `anteraja`, `pos`, dan `spx`: order yang ditolak kurir untuk dibatalkan, beserta alasannya. |

## Yang terhapus

- **Hanya sebagian order yang bisa dihapus.** Order yang sudah lewat pickup dilewati dan yang lain tetap dihapus. `unDeletedCount` menghitung yang tertinggal.
- **Saldo kembali.** Order non-COD yang sudah dibayar dikembalikan saat dihapus. `JNE`, `SiCepat`, `Sap`, `iDexpress`, dan `JT` tidak menyebut jumlahnya: baca di [Get invoices and balance](#get-invoices-and-balance), di mana saldo bisa butuh beberapa detik untuk menampilkannya. Order berstatus `error` tidak pernah ditagih, jadi tidak ada yang dikembalikan.
- **Order yang disimulasikan tetap ada.** Order yang kamu pindahkan dengan [Simulate Order Status](#simulate-order-status) dilewati: `deletedCount` bernilai `0` dan `unDeletedCount` menghitungnya.
- **Menghapus dua kali tidak ditolak.** Batch yang sudah dihapus dijawab 200 dengan `deletedCount` `0` dan `totalCount` `0`.
- **Anteraja** baru mengizinkan order dihapus 5 menit setelah dibuat. Menghapus lebih cepat dijawab 200 dengan `deletedCount` `0` dan alasannya di `errorMessages`.
- **Batch draft** belum punya order: `deletedCount`, `unDeletedCount`, dan `totalCount` bernilai `0`, dan response menambah `isBatchDraft: true`.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| API key tidak valid atau nonaktif, tidak punya hak akses `Create order`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
| `courier` bukan nilai yang didukung, atau huruf besar dan kecilnya salah | 400 | `{ "success": false, "message": "Invalid courier" }` |
| `id` kosong atau tidak ada | 400 | `{ "success": false, "message": "id is required" }` |
| Batch tidak ada, bukan milikmu, `id` salah format atau dikirim sebagai array, atau `courier` kosong untuk batch yang bukan `JNE`, untuk `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, dan `Ninja` | 400 | `{ "success": false, "message": "batch not found" }` |
| Batch milik kurir lain, untuk `lion`, `anteraja`, `pos`, dan `spx` | 404 | `{ "success": false, "message": "Batch not found" }` |
