# Simulate Order Status

`POST {BASE_URL}/api/public/{API_KEY}/order/simulation`

> [!WARNING]
> **Khusus sandbox:** endpoint ini hanya ada saat deployment berjalan dalam mode sandbox. Memanggil path yang sama di production selalu mengembalikan `404 Not Found`, bahkan dengan API key yang valid.

Memindahkan salah satu order sandbox milikmu langsung ke satu status (`ON DELIVERY`, `DELIVERED`, atau `RTS`) tanpa menunggu update kurir sungguhan, jadi kamu bisa menguji seluruh alurnya di sandbox: buat order, simulasikan statusnya, lalu baca kembali.

Kalau akunmu punya Webhook URL, setiap panggilan yang berhasil juga mengirim satu webhook berisi status baru ke URL itu, lihat [Webhook](#webhook). Perubahan status tersimpan baik pengiriman webhook itu berhasil maupun tidak.

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Check order status`. Tidak ada hak akses simulasi tersendiri. Tanpa itu, request ditolak dengan 401 `Unauthorized`.

Permission required: Check order status
Environment: Sandbox saja

## Contoh request

```bash
# Here is a curl example
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order/simulation' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "orderId": "261113IBBQ4K",
  "statusCategory": "ON DELIVERY"
}'
```

## Contoh response

```json
{
    "success": true,
    "data": {
        "orderId": "261113IBBQ4K",
        "trackingNumber": "JJ6000001911",
        "courier": "JT",
        "previousStatus": "active",
        "previousStatusCategory": "active",
        "status": "ON DELIVERY",
        "statusCategory": "ON DELIVERY",
        "lastStatusChange": "2026-11-13T09:15:00.000Z",
        "history": [
            // the earlier entries of the trail are left out here
            {
                "counter_name": "Mengantar",
                "date": "14-09-2026 07:35",
                "desc": "Paket akan dikirim ke alamat penerima",
                "note": "",
                "phone": "628123456789",
                "name": "MGR",
                "proofUrl": "",
                "code": "ON DELIVERY"
            },
            {
                "counter_name": "Mengantar",
                "date": "14-09-2026 11:41",
                "desc": "Paket disimpan di gudang J&T",
                "note": "Telepon tidak diangkat atau non-aktif",
                "phone": "",
                "name": "",
                "proofUrl": "url.jpeg",
                "code": "UNDELIVERED"
            },
            {
                "counter_name": "Mengantar",
                "date": "22-09-2026 16:13",
                "desc": "Paket akan dikirim ke alamat penerima",
                "note": "",
                "phone": "628123456789",
                "name": "MGR",
                "proofUrl": "",
                "code": "ON DELIVERY"
            }
        ],
        "requestId": "80fd892e-03e6-4f3c-847e-08b1c548a77f"
    }
}
```

## Tentukan order dengan nomor resinya

Kirim `trackingId` sebagai pengganti `orderId`, dan `status` sebagai pengganti `statusCategory`. Kedua pasangan itu sama saja: kirim tepat satu dari masing-masing.

### Contoh request

```bash
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order/simulation' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "trackingId": "JJ6000001911",
  "status": "DELIVERED"
}'
```

### Contoh response

```json
{
    "success": true,
    "data": {
        "orderId": "261113IBBQ4K",
        "trackingNumber": "JJ6000001911",
        "courier": "JT",
        "previousStatus": "ON DELIVERY",
        "previousStatusCategory": "ON DELIVERY",
        "status": "DELIVERED",
        "statusCategory": "DELIVERED",
        "lastStatusChange": "2026-11-13T09:20:00.000Z",
        "history": [
            // the earlier entries of the trail are left out here
            {
                "counter_name": "Mengantar",
                "date": "11-09-2026 20:57",
                "desc": "Paket telah sampai di DC_ARJUNO",
                "note": "Mobil",
                "phone": "",
                "name": "",
                "proofUrl": "",
                "code": "INCOMING"
            },
            {
                "counter_name": "Mengantar",
                "date": "12-09-2026 07:06",
                "desc": "Paket akan dikirim ke alamat penerima",
                "note": "",
                "phone": "628123456789",
                "name": "MGR",
                "proofUrl": "",
                "code": "ON DELIVERY"
            },
            {
                "counter_name": "Mengantar",
                "date": "12-09-2026 11:02",
                "desc": "Paket telah diterima",
                "note": "",
                "phone": "",
                "name": "MGR",
                "proofUrl": "url.jpeg",
                "code": "DELIVERED"
            }
        ],
        "requestId": "80fd892e-03e6-4f3c-847e-08b1c548a77f"
    }
}
```

## Body parameter

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| courier | String | Wajib. `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, atau `spx`. Huruf besar dan kecil dibedakan. `Ninja` tidak didukung. |
| orderId | String | `ORDER_ID` order. Kirim tepat satu dari `orderId` dan `trackingId`. |
| trackingId | String | Nomor resi (`cnote_no`) order. Kirim tepat satu dari `orderId` dan `trackingId`. |
| statusCategory | String | Status tujuan: `ON DELIVERY`, `DELIVERED`, atau `RTS`, dengan huruf besar. Kirim tepat satu dari `statusCategory` dan `status`. |
| status | String | Status tujuan yang sama dengan `statusCategory`: salah satu field memilihnya. Kirim tepat satu dari `statusCategory` dan `status`. |

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| success | Boolean | `true` kalau status berhasil diubah. |
| data | Object | Hasil simulasi. |
| orderId | String | `ORDER_ID` order. |
| trackingNumber | String | Nomor resi (`cnote_no`) order. |
| courier | String | Kurir yang kamu kirim. |
| previousStatus | String | `status` order sebelum panggilan ini. |
| previousStatusCategory | String | `statusCategory` order sebelum panggilan ini. |
| status | String | `status` baru order, lihat mapping di bawah. |
| statusCategory | String | `statusCategory` baru order, lihat mapping di bawah. |
| lastStatusChange | String | Kapan status diubah, dalam ISO 8601 UTC. Ini adalah waktu request-mu. |
| history | Array | Riwayat tracking yang kini tersimpan di order. Lihat di bawah. |
| requestId | String | ID request ini. Berikan ke support saat kamu melaporkan masalah. |

## Mapping status per kurir

`DELIVERED` dan `RTS` disimpan apa adanya untuk semua kurir: `status` dan `statusCategory` sama dengan nilai yang kamu kirim. Hanya `ON DELIVERY` yang berbeda per kurir:

| Courier | Stored `status` | Stored `statusCategory` |
| --- | --- | --- |
| `JNE` | ON DELIVERY | ON DELIVERY |
| `SiCepat` | ON DELIVERY | DELIVERY COURIER |
| `Sap` | ON DELIVERY | ON DELIVERY |
| `iDexpress` | ON DELIVERY | ON DELIVERY |
| `JT` | ON DELIVERY | ON DELIVERY |
| `lion` | DELIVERY COURIER | ON DELIVERY |
| `anteraja` | DELIVERY COURIER | DELIVERY COURIER |
| `pos` | DELIVERY COURIER | DELIVERY COURIER |
| `spx` | ON DELIVERY | ON DELIVERY |

## Yang dilakukan simulasi

- **Webhook-mu ikut terkirim.** Kalau kamu mengisi Webhook URL di sandbox (semua akun sandbox bisa, lihat [Webhook](#webhook)), setiap panggilan yang berhasil mengirim satu webhook berisi `status_category` baru ke URL itu, dengan header `x-environment: sandbox`. Webhook tidak dikirim kalau akun tidak punya Webhook URL atau URL-nya ditangguhkan. Pengiriman yang gagal dicoba ulang sekitar 20 detik, dan perubahan status tetap tersimpan apa pun hasilnya.
- **History diganti.** `history` order diganti dengan rangkaian riwayat siap pakai milik kurir itu untuk status tujuan, bukan satu baris buatan. Tanggal di rangkaian itu adalah tanggal referensi yang tetap, bukan hari ini, dan bisa lebih awal dari ordernya sendiri. Satu-satunya waktu yang nyata adalah `lastStatusChange`.
- **Urutan status bebas.** Kamu bisa ke `DELIVERED`, lalu `RTS`, lalu `ON DELIVERY`, atau mengirim status yang sama lagi. Ini override, bukan siklus order sungguhan.
- **Order yang disimulasikan tidak bisa dihapus.** [Delete orders](#delete-orders) menjawab 0 order terhapus, jadi simulasikan hanya order yang memang mau kamu pertahankan.
- **Tidak ada yang nyata terjadi.** Simulasi tidak pernah mengirim WhatsApp, SMS, atau email ke penerima, dan tidak pernah mengubah saldo, pencairan COD, refund, klaim, invoice, biaya, atau tiket. Simulasi tidak pernah memanggil kurir sungguhan.

## Alur pengujian

1. Buat order sandbox dengan [Create order](#create-order) dan simpan `ORDER_ID`-nya.
2. Simulasikan satu status dengan endpoint ini, misalnya `ON DELIVERY`.
3. Baca order kembali dengan [Get orders](#get-orders), memakai `order_id`. `status`, `lastStatusChange`, dan `history` menunjukkan perubahannya.
4. Simulasikan `DELIVERED` atau `RTS` dengan cara yang sama untuk menguji titik lain dari alur, dan cek Webhook URL-mu kalau kamu memakainya.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| API key tidak valid atau nonaktif, atau tidak punya hak akses `Check order status` | 401 | `{ "success": false, "message": "Unauthorized" }` |
| Deployment bukan sandbox | 404 | `{ "success": false, "message": "Not Found" }` |
| `courier` kosong, huruf besar dan kecilnya salah, atau tidak didukung, seperti `Ninja` | 422 | `{ "success": false, "message": "courier is required and must be supported" }` |
| `orderId` dan `trackingId` dikirim keduanya atau tidak sama sekali | 422 | `{ "success": false, "message": "Provide exactly one of orderId or trackingId" }` |
| `orderId` atau `trackingId` kosong | 422 | `{ "success": false, "message": "orderId or trackingId must be a non-empty string" }` |
| `statusCategory` dan `status` dikirim keduanya atau tidak sama sekali | 422 | `{ "success": false, "message": "Provide exactly one of statusCategory or status", "supportedValues": ["ON DELIVERY", "DELIVERED", "RTS"] }` |
| Status tujuan bukan `ON DELIVERY`, `DELIVERED`, atau `RTS`, misalnya `PENDING` atau `delivered` | 422 | `{ "success": false, "message": "Unsupported simulation status", "supportedValues": ["ON DELIVERY", "DELIVERED", "RTS"] }` |
| Tidak ada order kurir itu yang cocok, atau order milik akun lain | 404 | `{ "success": false, "message": "Order not found" }` |
| Order sudah dihapus | 409 | `{ "success": false, "message": "Order has been deleted" }` |
| Status tidak bisa disimpan. Tidak ada yang berubah | 500 | - |
