# Pay unpaid

`POST {BASE_URL}/api/public/{API_KEY}/order/pay-unpaid`

Membayar order yang belum dibayar dalam satu batch dan membuat nomor resinya. Order belum dibayar (`isPaid: false`, `cnote_no` kosong) kalau dibuat saat saldomu lebih kecil dari harganya, lihat [Create order](#create-order). Isi saldo dulu, lalu panggil endpoint ini dengan batch order itu. Batch-nya berasal dari `batch_id` di response Create order.

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Create order`. Tanpa itu, request ditolak dengan 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl \
-X POST '{BASE_URL}/api/public/{API_KEY}/order/pay-unpaid' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "batch_id": "6af68854ce96b86fe95825ef"
}'
```

## Contoh response

```json
{
    "success": true,
    "data": 1,
    "cnote_no": ["JJ6000001923"]
}
```

## Layanan kurir: lion, anteraja, pos, dan spx

Empat kurir ini menjawab dengan bentuk berbeda: `data` berupa object yang berisi `cnote_no` dan `count`.

### Contoh request

```bash
# Here is a curl example
curl \
-X POST '{BASE_URL}/api/public/{API_KEY}/order/pay-unpaid' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "lion",
  "batch_id": "6af6b86ece96b86fe9586371"
}'
```

### Contoh response

```json
{
    "success": true,
    "data": {
        "cnote_no": ["C15DQQW7"],
        "count": 1
    }
}
```

## Body parameter

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| courier | String | Kurir batch: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, atau `spx`. Huruf besar dan kecil dibedakan. Opsional untuk `JNE`, yang menjadi bawaan; wajib untuk kurir lain. Kurir yang tidak cocok dengan batch dijawab `batch not found`. `Ninja` dihentikan per 1 September 2026 dan order unpaid-nya tidak bisa lagi dibayar di sini, hubungi support Mengantar untuk sisa order sebelum tanggal itu. |
| batch_id | String | Wajib. `_id` batch, dari `batch_id` di [Create order](#create-order) atau `_id` di [Get batches](#get-batches). |

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| success | Boolean | `true` kalau request diproses. |
| data | Number | Untuk `JNE`, `SiCepat`, `Sap`, `iDexpress`, dan `JT`: jumlah order yang dibayar. Untuk `lion`, `anteraja`, `pos`, dan `spx`: object berisi `cnote_no` dan `count`. |
| cnote_no | Array | Nomor resi order yang dibayar. Di level atas untuk `JNE`, `SiCepat`, `Sap`, `iDexpress`, dan `JT`, di dalam `data` untuk kurir lain. Kosong kalau tidak ada yang dibayar. |
| count | Number | Hanya untuk `lion`, `anteraja`, `pos`, dan `spx`: jumlah order yang dibayar. |

## Cara kerja pembayaran

- Harga semua order unpaid dalam batch dijumlahkan dan dipotong dari saldomu sekaligus. Kalau saldo lebih kecil dari totalnya, tidak ada yang dibayar.
- Order dalam batch yang sudah dibayar dilewati dan tidak pernah ditagih dua kali.
- Order mendapat nomor resi (`cnote_no`) dan menjadi `isPaid: true`. Baca order lewat [Get orders](#get-orders).
- Saldo di [Get invoices and balance](#get-invoices-and-balance) bisa butuh beberapa detik untuk menampilkan pembayaran ini.

Membayar batch yang tidak punya sisa tagihan tidak menagih apa pun. `JNE`, `SiCepat`, `Sap`, `iDexpress`, dan `JT` menjawab 200 dengan `data` `0` dan `cnote_no` kosong; `lion`, `anteraja`, `pos`, dan `spx` menjawab 400 `no unpaid orders in this batch`.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| `batch_id` kosong, formatnya salah, bukan milikmu, atau milik kurir lain, atau `courier` kosong untuk batch yang bukan `JNE` | 400 | `{ "success": false, "message": "batch not found" }` |
| `courier` bukan nilai yang didukung, atau huruf besar dan kecilnya salah | 400 | `{ "success": false, "message": "Invalid courier" }` |
| Saldo lebih kecil dari total harga order unpaid | 400 | `{ "success": false, "message": "balance is not enough" }` |
| Tidak ada yang unpaid di batch (`lion`, `anteraja`, `pos`, `spx`) | 400 | `{ "success": false, "message": "no unpaid orders in this batch" }` |
| API key tidak valid atau nonaktif, tidak punya hak akses `Create order`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
