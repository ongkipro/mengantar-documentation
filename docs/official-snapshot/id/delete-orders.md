# Delete orders

`DELETE {BASE_URL}/api/public/{API_KEY}/order`

Menghapus satu atau lebih order milikmu dari satu kurir. Saldo order yang sudah dibayar dikembalikan ke kamu. Order hanya bisa dihapus selama statusnya masih `active`, `error`, `PENDING PICKUP`, `PICKUP FAILED`, atau `PICKUP_FAILED_API` (atau kosong). Ini sama untuk semua kurir: begitu order lewat tahap pickup, order tidak bisa dihapus lagi.

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Create order`. Tanpa itu, request ditolak dengan 403 `Not allowed`.

> [!WARNING]
> **Cek `deletedCount`, bukan `success`.** Panggilan bisa menjawab 200 dengan `success: true` tetapi tidak menghapus apa pun, atau hanya sebagian dari yang kamu kirim. `deletedCount` dan `deletedOrderIds` menunjukkan apa yang benar-benar terhapus.

Permission required: Create order
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/order' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "ids": ["6af68834ce96b86fe95821e9", "6af68834ce96b86fe95821ea"]
}'
```

## Contoh response

```json
{
    "success": true,
    "message": "2 orders are deleted from 2 selected orders",
    "deletedCount": 2,
    "deletedOrderIds": ["6af68834ce96b86fe95821e9", "6af68834ce96b86fe95821ea"],
    "deletedOrderIdsHumanReadable": ["261113IBBQ4K", "261113W04TMC"]
}
```

## Hapus dengan nomor order

Kirim `orderIds` (`ORDER_ID` tiap order) sebagai pengganti `ids`. Kalau kamu mengirim keduanya, `orderIds` yang dipakai dan `ids` diabaikan.

### Contoh request

```bash
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/order' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "orderIds": ["261113IBBQ4K"]
}'
```

### Contoh response

```json
{
    "success": true,
    "message": "1 orders are deleted from 1 selected orders",
    "deletedCount": 1,
    "deletedOrderIds": ["6af68834ce96b86fe95821e9"],
    "deletedOrderIdsHumanReadable": ["261113IBBQ4K"]
}
```

## Anteraja, lion, pos, dan spx

Empat kurir ini menambahkan `errorMessages`, `ordersCount`, dan `totalBalanceRefund` ke response. `errorMessages` berisi order yang ditolak kurir untuk dibatalkan, beserta alasannya. Anteraja baru mengizinkan order dihapus 5 menit setelah dibuat; menghapus lebih cepat dijawab seperti ini:

### Contoh request

```bash
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/order' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "anteraja",
  "ids": ["6af68834ce96b86fe95821eb"]
}'
```

### Contoh response

```json
{
    "success": true,
    "message": "0 orders are deleted from 1 selected orders",
    "deletedCount": 0,
    "deletedOrderIds": [],
    "errorMessages": ["45612446392831: Gagal menghapus pesanan Anteraja. Harap tunggu 5 menit setelah pesanan terbuat untuk menghapusnya."],
    "ordersCount": 1,
    "totalBalanceRefund": 0
}
```

## Body parameter

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| courier | String | Kurir order: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, atau `spx`. Huruf besar dan kecil dibedakan. Opsional untuk `JNE`, yang menjadi bawaan. Untuk kurir lain wajib: tanpa itu panggilan mencari order di antara order `JNE` dan menjawab `Orders already deleted`, dan tidak ada yang terhapus. Semua order dalam satu panggilan harus milik kurir ini. `Ninja` dihentikan per 1 September 2026 dan masih diterima untuk order lamanya. |
| ids | Array | `_id` tiap order yang dihapus. Wajib, kecuali kamu mengirim `orderIds`. Fieldnya `ids`, jamak: `id` tidak diterima, kebalikan dari [Delete batch](#delete-batch). |
| orderIds | Array | Opsional. `ORDER_ID` tiap order yang dihapus, sebagai pengganti `ids`. Kalau dikirim, `ids` diabaikan. |

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| success | Boolean | `true` kalau request diproses. Ini tidak berarti ada yang terhapus. |
| message | String | Ringkasan, misalnya `1 orders are deleted from 2 selected orders`. |
| deletedCount | Number | Jumlah order yang benar-benar terhapus. |
| deletedOrderIds | Array | `_id` order yang terhapus. |
| deletedOrderIdsHumanReadable | Array | `ORDER_ID` order yang terhapus. Tidak dikembalikan oleh `lion`, `anteraja`, `pos`, dan `spx`. |
| errorMessages | Array | Hanya untuk `lion`, `anteraja`, `pos`, dan `spx`: order yang ditolak kurir untuk dibatalkan, beserta alasannya. Kosong kalau tidak ada. |
| ordersCount | Number | Hanya untuk `lion`, `anteraja`, `pos`, dan `spx`: jumlah order yang diproses. |
| totalBalanceRefund | Number | Hanya untuk `lion`, `anteraja`, `pos`, dan `spx`: saldo yang dikembalikan, dalam rupiah. |

## Yang terhapus

- **Hanya sebagian order yang bisa dihapus.** Order yang sudah lewat pickup dilewati, dan yang lain tetap dihapus. Bandingkan `deletedCount` dengan jumlah yang kamu kirim.
- **Saldo kembali.** Order yang sudah dibayar dikembalikan saat dihapus. `JNE`, `SiCepat`, `Sap`, `iDexpress`, dan `JT` tidak menyebut jumlahnya di response: baca di [Get invoices and balance](#get-invoices-and-balance), di mana saldo bisa butuh beberapa detik untuk menampilkannya. Order berstatus `error` tidak pernah ditagih, jadi tidak ada yang dikembalikan.
- **Order yang disimulasikan tidak bisa dihapus.** Order yang kamu pindahkan dengan [Simulate Order Status](#simulate-order-status) ditolak: `deletedCount` bernilai `0`.
- **Kurir lain.** `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `pos`, dan `spx` tidak punya waktu tunggu di sisi Mengantar. Penghapusan diteruskan ke kurir, dan berhasil atau gagalnya mengikuti aturan kurir itu. Hanya Anteraja yang punya tunggu 5 menit.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| API key tidak valid atau nonaktif, tidak punya hak akses `Create order`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
| `courier` bukan nilai yang didukung, atau huruf besar dan kecilnya salah | 400 | `{ "success": false, "message": "Invalid courier" }` |
| `ids` kosong atau tidak ada, atau kamu mengirim `id` sebagai gantinya | 400 | `{ "success": false, "message": "ids array is required" }` |
| Ada id yang bukan `_id` yang valid | 400 | `{ "success": false, "message": "ids array is invalid" }` |
| Tidak ada yang cocok, untuk `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, dan `Ninja`: id tidak ada, milik akun lain, sudah dihapus, atau `courier` kosong untuk order yang bukan `JNE` | 200 | `{ "success": false, "message": "Orders already deleted" }` |
| Tidak ada yang cocok, untuk `lion`, `anteraja`, `pos`, dan `spx` | 400 | `{ "success": false, "message": "There is no order to delete" }` |
