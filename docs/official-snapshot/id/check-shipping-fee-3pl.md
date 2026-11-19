# Check Shipping Fee 3PL

`GET {BASE_URL}/api/order/allEstimate3PL`

Mengembalikan harga ongkos kirim standar semua kurir untuk satu rute, dalam satu panggilan, **tanpa diskon dan tanpa harga flat**. Cocok untuk partner logistik dan integrator yang butuh harga kurir apa adanya. Ambil `origin_id` dan `destination_id` dari [Search address data](#search-address-data).

Endpoint ini tidak butuh API key maupun hak akses. Untuk harga dengan diskonmu, pakai [Check Shipping Fee](#check-shipping-fee). Untuk harga publik dengan diskon dasar, pakai [Check Shipping Fee Public](#check-shipping-fee-public).

Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/order/allEstimate3PL?origin_id=5fc62de8f8f44b34aa4bdc49&destination_id=5fc62f60f8f44b34aa4c0dc9&weight=1&isDangerousGoods=true'
```

## Contoh response

```json
{
    "success": true,
    "data": {
        "JNE": {
            "unsupported": null,
            "unsupported_cod": null,
            "price": 13000,
            "estimatedDate": "1 - 2 days",
            "isDangerousGoodsSupported": false
        },
        "JNECargo": {
            "unsupported": null,
            "unsupported_cod": null,
            "price": 45000,
            "minimumWeightCargo": 10,
            "estimatedDate": "3 - 4 days",
            "isDangerousGoodsSupported": false
        },
        "SiCepat": {
            "unsupported": false,
            "unsupported_cod": null,
            "price": 11000,
            "estimatedDate": "1 - 2 days",
            "isDangerousGoodsSupported": true
        },
        "JT": {
            "unsupported": false,
            "unsupported_cod": false,
            "price": 11000,
            "estimatedDate": "2-4 days",
            "isDangerousGoodsSupported": false
        },
        "anteraja": {
            "unsupported": false,
            "unsupported_cod": false,
            "price": 11000,
            "isFlat": false,
            "estimatedDate": "2-4 Day",
            "isDangerousGoodsSupported": false
        }
    }
}
```

`data` berisi satu entri per kurir, dengan nama kurir sebagai key. Response berisi 15 entri: `JNE`, `JNECargo`, `SiCepat`, `SiCepatCargo`, `SAP`, `SAPLite`, `SapCargo`, `iDexpress`, `iDlite`, `JT`, `lion`, `iDexpressCargo`, `anteraja`, `spx`, `pos`. Contoh menampilkan lima di antaranya. Tiap entri singkat: hanya berisi field di bawah.

## Query parameter

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| origin_id | String | Wajib. `_id` area pickup, dari [Search address data](#search-address-data). |
| destination_id | String | Wajib. `_id` area tujuan, dari [Search address data](#search-address-data). |
| weight | Number | Berat dalam kg. Bawaan `1`. Desimal seperti `0.5` boleh, dan harga naik mengikuti berat. Kirim angka positif. |
| isDangerousGoods | Boolean | Opsional. Bawaan `false`. Kirim `true` atau `1` untuk mendapat harga Dangerous Goods dan cakupan tujuan semua kurir. |

Endpoint ini tidak punya `COD_AMOUNT`. Tidak ada biaya COD di response, dan `COD_AMOUNT` yang kamu kirim diabaikan.

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| price | Number | Harga ongkos kirim standar dalam rupiah, tanpa diskon dan tanpa harga flat. `0` kalau kurir tidak bisa melayani request. |
| estimatedDate | String | Estimasi waktu pengiriman sebagai teks, misalnya `1 - 2 days`. Formatnya berbeda per kurir. |
| unsupported | Boolean | `true` kalau kurir sama sekali tidak bisa melayani rute ini. `null` kalau kurir tidak melaporkannya. |
| unsupported_cod | Boolean | `true` kalau kurir tidak bisa melayani rute ini dengan COD. `null` kalau kurir tidak melaporkannya. |
| isDangerousGoodsSupported | Boolean | Hanya dikembalikan kalau `isDangerousGoods` aktif. Apakah kurir membawa dangerous goods. |
| minimumWeightCargo | Number | Hanya dikembalikan untuk entri cargo. Berat minimum dalam kg untuk layanan cargo. |
| isFlat | Boolean | Hanya dikembalikan untuk `anteraja`. Apakah harganya harga flat. |

## Cakupan

`unsupported` dan `unsupported_cod` memberi tahu apa yang bisa dikirim kurir ke tujuan. Nilai `null` berarti kurir tidak memberi jawaban, jadi jangan dianggap ya atau tidak.

| `unsupported` | `unsupported_cod` | Artinya |
| --- | --- | --- |
| `false` | `false` | Bisa kirim COD maupun non-COD. |
| `false` | `true` | Tidak bisa kirim COD, tapi masih bisa kirim non-COD. |
| `true` | `false` atau `true` | Tidak bisa kirim ke tujuan ini sama sekali, COD maupun non-COD. |

Untuk request Dangerous Goods, `isDangerousGoodsSupported` menunjukkan apakah kurir membawa dangerous goods, sedangkan `unsupported` menunjukkan cakupan tujuan. Cek keduanya. Hanya `SiCepat` dan `iDexpress` yang membawa dangerous goods. Kurir lain mengembalikan `isDangerousGoodsSupported: false`.

## Batas dan aturan

- Batas kurir, seperti COD maksimum, berat, dan nilai barang, sama seperti di [Check Shipping Fee](#check-shipping-fee). `anteraja`, `pos`, dan `spx` mengembalikan `price` `0` kalau berat di atas 50 kg.
- `Ninja` dihentikan per 1 September 2026, jadi `Ninja` tidak ada di response.
- J&T ECO muncul sebagai entri `JTEco` tersendiri di samping `JT`, dengan field yang sama. Hanya muncul kalau rutenya punya tarif J&T ECO dan request bukan Dangerous Goods.
- Endpoint hanya mengecek bahwa format id valid. Id berformat valid yang tidak cocok dengan alamat mana pun tetap mengembalikan harga, jadi ambil id dari Search address data.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| `origin_id` atau `destination_id` tidak ada | 400 | `{ "success": false, "message": "from or to is empty" }` |
| `origin_id` atau `destination_id` bukan id yang valid | 400 | `{ "success": false, "message": "origin_id is invalid" }` (atau `destination_id is invalid`) |
