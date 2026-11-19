# Check Shipping Fee Public

`GET {BASE_URL}/api/order/allEstimatePublic`

Mengembalikan ongkos kirim semua kurir untuk satu rute, dalam satu panggilan. Ini estimasi di balik halaman publik [Cek Ongkos Kirim Mengantar](https://www.mengantar.com/cek-ongkos-kirim/). Ambil `origin_id` dan `destination_id` dari [Search address data](#search-address-data).

Endpoint ini tidak butuh API key maupun hak akses. Untuk estimasi yang terikat ke API key-mu, pakai [Check Shipping Fee](#check-shipping-fee).

Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/order/allEstimatePublic?origin_id=5fc62de8f8f44b34aa4bdc49&destination_id=5fc62f60f8f44b34aa4c0dc9&weight=1&COD_AMOUNT=100000'
```

## Contoh response

```json
{
    "success": true,
    "data": {
        "JNE": {
            "price": 11000,
            "estimate_delivery": "1 - 2 days",
            "currency": "IDR",
            "isFlat": true,
            "weight": "1",
            "JNE_zone": "A",
            "discountPercent": 0,
            "cargoDiscountPercent": 5,
            "discount": 100,
            "cargoDiscount": 0,
            "codFee": 3329,
            "estimatedPrice": 14329,
            "estimatedSpecialPrice": 14229,
            "cargoEstimatedPrice": 0,
            "cargoEstimatedSpecialPrice": 0,
            "estimatedDate": "2-4 hari",
            "discountExtraPercent": 0,
            "discountExtra": 0,
            "cargoDiscountExtraPercent": 0,
            "cargoDiscountExtra": 0,
            "estimate_delivery_cargo": "1 - 2 days"
        },
        "SiCepat": {
            "price": 62900,
            "currency": "IDR",
            "cargoPrice": 445000,
            "estimate_delivery": "1 - 2 Days",
            "estimate_delivery_cargo": "2 - 3 Days",
            "weight": "1",
            "discountPercent": 20,
            "cargoDiscountPercent": 5,
            "discount": 12580,
            "cargoDiscount": 22250,
            "codFee": 3329,
            "estimatedPrice": 66229,
            "estimatedSpecialPrice": 53649,
            "cargoEstimatedPrice": 448330,
            "cargoEstimatedSpecialPrice": 426080,
            "estimatedDate": "2-4 hari",
            "discountExtraPercent": 0,
            "discountExtra": 0,
            "cargoDiscountExtraPercent": 0,
            "cargoDiscountExtra": 0,
            "unsupported": false,
            "unsupportedOriginSicepat": false,
            "originId": "5fc62de8f8f44b34aa4bdc49",
            "destinationId": "5fc62f60f8f44b34aa4c0dc9",
            "unsupportedPickup": false,
            "unsupportedFlag": "",
            "isDangerousGoodsSupported": true
        },
        "JT": {
            "unsupported": false,
            "unsupported_cod": false,
            "price": 64700,
            "estimate_delivery": "-",
            "discountPercent": 20,
            "cargoDiscountPercent": 0,
            "discount": 12940,
            "cargoDiscount": 0,
            "codFee": 3329,
            "estimatedPrice": 68029,
            "estimatedSpecialPrice": 48619,
            "cargoEstimatedPrice": 0,
            "cargoEstimatedSpecialPrice": 0,
            "estimatedDate": "2-4 hari",
            "discountExtraPercent": 10,
            "discountExtra": 6470,
            "cargoDiscountExtraPercent": 10,
            "cargoDiscountExtra": 0
        },
        "pos": {
            "currency": "IDR",
            "unsupported": false,
            "unsupported_cod": false,
            "estimate_delivery": "2 HARI",
            "price": 5900,
            "discountPercent": 10,
            "cargoDiscountPercent": 0,
            "discount": 590,
            "cargoDiscount": 0,
            "codFee": 3329,
            "estimatedPrice": 9229,
            "estimatedSpecialPrice": 8639,
            "cargoEstimatedPrice": 0,
            "cargoEstimatedSpecialPrice": 0,
            "estimatedDate": "2-4 hari",
            "discountExtraPercent": 0,
            "discountExtra": 0,
            "cargoDiscountExtraPercent": 0,
            "cargoDiscountExtra": 0
        }
    }
}
```

`data` berisi satu entri per kurir, dengan nama kurir sebagai key. Response berisi 15 entri: `JNE`, `JNECargo`, `SiCepat`, `SiCepatCargo`, `SAP`, `SAPLite`, `SapCargo`, `iDexpress`, `iDlite`, `JT`, `lion`, `iDexpressCargo`, `anteraja`, `spx`, `pos`. Contoh menampilkan empat di antaranya, lengkap dengan semua field-nya. `iDlite` adalah tarif tambahan di samping `iDexpress`, dan Create order tidak punya nilai kurir `iDlite`.

## Query parameter

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| origin_id | String | Wajib. `_id` area pickup, dari [Search address data](#search-address-data). |
| destination_id | String | Wajib. `_id` area tujuan, dari [Search address data](#search-address-data). |
| weight | Number | Berat dalam kg. Bawaan `1`. Desimal seperti `0.5` boleh, dan harga naik mengikuti berat. Kirim angka positif. |
| COD_AMOUNT | Number | Nominal COD: nilai barang ditambah ongkos kirim. Hanya dipakai untuk menghitung `codFee`. Untuk ongkos kirimnya sendiri, pakai `price`. |
| isDangerousGoods | Boolean | Opsional. Bawaan `false`. Kirim `true` atau `1` untuk mendapat tarif Dangerous Goods dan cakupan tujuan semua kurir. |
| withCourierServices | Boolean | Opsional. Bawaan `false`. Kirim `true` untuk ikut mendapat layanan kurir yang tidak ada di daftar bawaan. Saat ini itu J&T ECO, muncul sebagai entri `JTEco` tersendiri di samping `JT`, dengan field yang sama. Tanpa parameter ini, `JTEco` tidak dikembalikan. |

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| price | Number | Ongkos kirim sebelum diskon, dalam rupiah. |
| discountPercent | Number | Diskon dalam persen. Umumnya diskon dasar 20%, lihat di bawah. |
| discount | Number | Diskon dalam rupiah: `price` × `discountPercent`. |
| discountExtraPercent | Number | Diskon tambahan dalam persen, untuk kurir yang punya. |
| discountExtra | Number | Diskon tambahan dalam rupiah. |
| codFee | Number | Biaya layanan COD untuk `COD_AMOUNT`. `0` kalau kamu tidak mengirim `COD_AMOUNT`. |
| estimatedPrice | Number | `price` ditambah `codFee`. |
| estimatedSpecialPrice | Number | Yang kamu bayar: `estimatedPrice` dikurangi `discount` dan `discountExtra`. |
| estimate_delivery | String | Estimasi waktu pengiriman sebagai teks. Beberapa kurir mengembalikan `-`, jadi jangan diandalkan. |
| estimatedDate | String | Perkiraan umum waktu pengiriman sebagai teks, misalnya `2-4 hari`. Nilainya sama untuk kebanyakan kurir, dan sebagian kurir, seperti `lion`, mengembalikan miliknya sendiri. Untuk perkiraan satu kurir, pakai `estimate_delivery` kalau isinya bukan `-`. |
| unsupported | Boolean | `true` kalau kurir sama sekali tidak bisa melayani rute ini. `null` untuk `JNE`, `JNECargo`, dan `SapCargo`, yang tidak melaporkannya. |
| unsupported_cod | Boolean | `true` kalau kurir tidak bisa melayani rute ini dengan COD. |
| isDangerousGoodsSupported | Boolean | Apakah kurir membawa dangerous goods. Selalu dikembalikan untuk `SiCepat`, `iDexpress`, dan `iDlite`, dan untuk semua kurir kalau `isDangerousGoods` aktif. |

Field `cargo...` untuk pengiriman cargo dan bernilai `0` kalau bukan. Tiap kurir mengembalikan field yang berlaku untuknya, jadi cek dulu apakah sebuah field ada sebelum kamu membacanya. Daftar lengkapnya ada di [Check Shipping Fee](#check-shipping-fee).

## Diskon

Tidak ada akun yang terlibat, jadi diskon tidak bergantung pada volume pengirimanmu. Diskonnya adalah **diskon dasar 20%** yang didapat setiap akun Mengantar baru. Sebuah kurir bisa menampilkan nilai lain karena memakai harga flat atau harga lite, atau karena punya diskon tambahan di `discountExtraPercent`. Nilainya bisa berbeda antara sandbox dan production, jadi selalu baca `discountPercent` dan `discountExtraPercent` dari response. Harga yang kamu bayar adalah `estimatedSpecialPrice`.

## Cakupan

`unsupported` dan `unsupported_cod` memberi tahu apa yang bisa dikirim kurir ke tujuan.

| `unsupported` | `unsupported_cod` | Artinya |
| --- | --- | --- |
| `false` | `false` | Bisa kirim COD maupun non-COD. |
| `false` | `true` | Tidak bisa kirim COD, tapi masih bisa kirim non-COD. |
| `true` | `false` atau `true` | Tidak bisa kirim ke tujuan ini sama sekali, COD maupun non-COD. |

Untuk request Dangerous Goods, `isDangerousGoodsSupported` menunjukkan apakah kurir membawa dangerous goods, sedangkan `unsupported` menunjukkan cakupan tujuan. Cek keduanya. Hanya `SiCepat` dan `iDexpress` yang membawa dangerous goods. Kurir lain mengembalikan `isDangerousGoodsSupported: false`.

## Batas dan aturan

- Batas kurir, seperti COD maksimum, berat, dan nilai barang, sama seperti di [Check Shipping Fee](#check-shipping-fee). `anteraja`, `pos`, dan `spx` mengembalikan `unsupported: true` dan `price` `0` kalau berat di atas 50 kg.
- Estimasi tidak mengecek nominal COD terhadap batas maksimum kurir. Create order yang menolak order di atas batas itu.
- `Ninja` dihentikan per 1 September 2026, jadi `Ninja` tidak ada di response.
- Dengan `withCourierServices=true`, J&T ECO muncul sebagai entri `JTEco` tersendiri di samping `JT`. Hanya muncul kalau rutenya punya tarif J&T ECO dan request bukan Dangerous Goods. `JTEco` bukan nilai `courier`.
- Endpoint hanya mengecek bahwa format id valid. Id berformat valid yang tidak cocok dengan alamat mana pun tetap mengembalikan tarif, jadi ambil id dari Search address data.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| `origin_id` atau `destination_id` tidak ada | 400 | `{ "success": false, "message": "from or to is empty" }` |
| `origin_id` atau `destination_id` bukan id yang valid | 400 | `{ "success": false, "message": "origin_id is invalid" }` (atau `destination_id is invalid`) |
