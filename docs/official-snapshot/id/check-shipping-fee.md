# Check Shipping Fee

`GET {BASE_URL}/api/public/{API_KEY}/order/estimate`

Mengestimasi ongkos kirim antara dua alamat untuk satu kurir, atau untuk semua kurir sekaligus, **sudah dengan diskon akunmu**. Diskonnya berbeda untuk tiap seller, jadi harga yang kamu dapat di sini adalah harga yang dibayar akunmu. Ambil `origin_id` dan `destination_id` dari [Search address data](#search-address-data). Pakai kurir dan harga dari hasilnya saat [membuat order](#create-order).

Diskonnya tergantung volume pengirimanmu, lihat [Diskon Ongkos Kirim](https://help.mengantar.com/id/articles/5207011-apa-kelebihan-mengantar). Estimasi publik tanpa API key, [Check Shipping Fee Public](#check-shipping-fee-public), memberi diskon dasar 20% yang didapat setiap akun baru, berapa pun volumemu.

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Check shipping fee`. Tanpa itu, request ditolak dengan 403 `Not allowed`.

Permission required: Check shipping fee
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order/estimate?origin_id=5fc62de8f8f44b34aa4bdc49&destination_id=5fc62f60f8f44b34aa4c0dc9&courier=JT&weight=1&COD_AMOUNT=100000'
```

## Contoh response

```json
{
    "success": true,
    "data": {
        "price": 11000,
        "currency": "IDR",
        "discountPercent": 30,
        "cargoDiscountPercent": 0,
        "discount": 3300,
        "cargoDiscount": 0,
        "codFee": 3329,
        "estimatedPrice": 14329,
        "estimatedSpecialPrice": 10479,
        "cargoEstimatedPrice": 0,
        "cargoEstimatedSpecialPrice": 0,
        "estimatedDate": "2-4 hari",
        "discountExtraPercent": 5,
        "discountExtra": 550,
        "cargoDiscountExtraPercent": 5,
        "cargoDiscountExtra": 0,
        "estimate_delivery": "undefined",
        "unsupported": false,
        "unsupported_cod": false
    }
}
```

## Semua kurir

Dengan `courier=all`, `data` berisi satu entri per kurir, dengan nama kurir sebagai key. Tiap kurir mengembalikan field yang berlaku untuknya. Response berisi 14 entri: `JNE`, `JNECargo`, `SiCepat`, `SiCepatCargo`, `SAP`, `SAPLite`, `SapCargo`, `iDexpress`, `JT`, `lion`, `iDexpressCargo`, `anteraja`, `spx`, `pos`. Contoh menampilkan empat di antaranya, dengan semua field-nya.

### Contoh request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order/estimate?origin_id=5fc62de8f8f44b34aa4bdc49&destination_id=5fc62f60f8f44b34aa4c0dc9&courier=all&weight=1'
```

### Contoh response

```json
{
    "success": true,
    "data": {
        "JNE": {
            "price": 13000,
            "estimate_delivery": "1 - 2 days",
            "currency": "IDR",
            "isFlat": false,
            "weight": "1",
            "JNE_zone": "A",
            "discountPercent": 30,
            "cargoDiscountPercent": 5,
            "discount": 3900,
            "cargoDiscount": 0,
            "codFee": 0,
            "estimatedPrice": 13000,
            "estimatedSpecialPrice": 9100,
            "cargoEstimatedPrice": 0,
            "cargoEstimatedSpecialPrice": 0,
            "estimatedDate": "2-4 hari",
            "discountExtraPercent": 0,
            "discountExtra": 0,
            "cargoDiscountExtraPercent": 0,
            "cargoDiscountExtra": 0,
            "estimate_delivery_cargo": "3 - 4 days"
        },
        "SiCepat": {
            "price": 11000,
            "currency": "IDR",
            "cargoPrice": 35000,
            "estimate_delivery": "1 - 2 Days",
            "estimate_delivery_cargo": "2 - 4 Days",
            "weight": "1",
            "discountPercent": 30,
            "cargoDiscountPercent": 5,
            "discount": 3300,
            "cargoDiscount": 1750,
            "codFee": 0,
            "estimatedPrice": 11000,
            "estimatedSpecialPrice": 7699,
            "cargoEstimatedPrice": 35000,
            "cargoEstimatedSpecialPrice": 33250,
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
            "unsupportedFlag": ""
        },
        "JT": {
            "unsupported": false,
            "unsupported_cod": false,
            "price": 11000,
            "estimate_delivery": "-",
            "discountPercent": 30,
            "cargoDiscountPercent": 0,
            "discount": 3300,
            "cargoDiscount": 0,
            "codFee": 0,
            "estimatedPrice": 11000,
            "estimatedSpecialPrice": 7149,
            "cargoEstimatedPrice": 0,
            "cargoEstimatedSpecialPrice": 0,
            "estimatedDate": "2-4 hari",
            "discountExtraPercent": 5,
            "discountExtra": 550,
            "cargoDiscountExtraPercent": 5,
            "cargoDiscountExtra": 0
        },
        "spx": {
            "currency": "IDR",
            "unsupported": false,
            "unsupported_cod": false,
            "estimate_delivery": "1 - 2 days",
            "price": 10700,
            "pickupSchedule": {
                "2026-11-13": [
                    {
                        "timeRangeId": 1,
                        "start": "14:00",
                        "end": "22:00",
                        "timeEpoch": 1794560400
                    }
                ],
                "2026-11-14": [
                    {
                        "timeRangeId": 1,
                        "start": "14:00",
                        "end": "22:00",
                        "timeEpoch": 1794646800
                    }
                ],
                "2026-11-15": [
                    {
                        "timeRangeId": 1,
                        "start": "14:00",
                        "end": "22:00",
                        "timeEpoch": 1794733200
                    }
                ]
            },
            "discountPercent": 30,
            "cargoDiscountPercent": 0,
            "discount": 3210,
            "cargoDiscount": 0,
            "codFee": 0,
            "estimatedPrice": 10700,
            "estimatedSpecialPrice": 6954,
            "cargoEstimatedPrice": 0,
            "cargoEstimatedSpecialPrice": 0,
            "estimatedDate": "2-4 hari",
            "discountExtraPercent": 5,
            "discountExtra": 535,
            "cargoDiscountExtraPercent": 5,
            "cargoDiscountExtra": 0,
            "unsupportedOriginSpx": false,
            "unsupportedPickup": false
        }
    }
}
```

## Query parameter

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| origin_id | String | Wajib. `_id` wilayah pickup, dari [Search address data](#search-address-data). |
| destination_id | String | Wajib. `_id` wilayah tujuan, dari [Search address data](#search-address-data). |
| courier | String | Salah satu dari `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, `spx`, atau `all`. Huruf besar dan kecil dibedakan, dan hanya boleh dikirim sekali. Nilai bawaannya `JNE`. `all` mengembalikan estimasi semua kurir yang tersedia. |
| weight | Number | Berat dalam kg. Bawaan `1`. Desimal seperti `0.5` boleh, dan harga naik seiring berat. Kirim angka positif. |
| COD_AMOUNT | Number | Nominal COD: nilai barang ditambah ongkos kirim. Hanya dipakai untuk menghitung `codFee`. Untuk ongkos kirimnya sendiri, pakai `price`. |
| isDangerousGoods | Boolean | Opsional. Bawaan `false`. Kirim `true` atau `1` untuk mendapat tarif Dangerous Goods dan jangkauan tujuan kurir. |

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| price | Number | Ongkos kirim sebelum diskon, dalam rupiah. |
| currency | String | Selalu `IDR`. |
| discountPercent | Number | Diskon dalam persen. Tergantung volume pengirimanmu, lihat di bawah. |
| discount | Number | Diskon dalam rupiah: `price` × `discountPercent`. |
| discountExtraPercent | Number | Diskon tambahan dalam persen, kalau akunmu punya. |
| discountExtra | Number | Diskon tambahan dalam rupiah. |
| codFee | Number | Biaya layanan COD untuk `COD_AMOUNT`. `0` kalau kamu tidak mengirim `COD_AMOUNT`. |
| estimatedPrice | Number | `price` ditambah `codFee`. |
| estimatedSpecialPrice | Number | Yang kamu bayar: `estimatedPrice` dikurangi `discount` dan `discountExtra`. |
| estimate_delivery | String | Estimasi waktu pengiriman dalam bentuk teks. Beberapa kurir mengembalikan `-`, jadi jangan diandalkan. |
| estimatedDate | String | Perkiraan umum waktu pengiriman sebagai teks, misalnya `2-4 hari`. Nilainya sama untuk kebanyakan kurir, dan sebagian kurir, seperti `lion`, mengembalikan miliknya sendiri. Untuk perkiraan satu kurir, pakai `estimate_delivery` kalau isinya bukan `-`. |
| unsupported | Boolean | `true` kalau kurir sama sekali tidak melayani rute ini. |
| unsupported_cod | Boolean | `true` kalau kurir tidak melayani rute ini dengan COD. |
| isDangerousGoodsSupported | Boolean | Hanya dikembalikan kalau `isDangerousGoods` aktif. Apakah kurir membawa dangerous goods. |
| pickupSchedule | Object | Hanya dikembalikan untuk `spx`. Slot pickup yang dibuka SPX untuk hari ini, besok, dan lusa, dikelompokkan per tanggal (`YYYY-MM-DD`). Tiap slot punya `timeRangeId`, jam `start` dan `end`, serta `timeEpoch` dalam Unix detik. |

Field `cargo...` untuk pengiriman cargo dan bernilai `0` untuk yang lain. Tiap kurir mengembalikan field yang berlaku untuknya, jadi cek dulu field itu ada sebelum dibaca.

## Jangkauan

`unsupported` dan `unsupported_cod` menunjukkan apa yang bisa dikirim kurir ke tujuan.

| `unsupported` | `unsupported_cod` | Artinya |
| --- | --- | --- |
| `false` | `false` | Bisa kirim COD maupun non-COD. |
| `false` | `true` | Tidak bisa kirim COD, tapi masih bisa kirim non-COD. |
| `true` | `false` atau `true` | Sama sekali tidak bisa kirim ke tujuan ini, baik COD maupun non-COD. |

Untuk request Dangerous Goods, `isDangerousGoodsSupported` menunjukkan apakah kurir membawa dangerous goods, sedangkan `unsupported` menunjukkan jangkauan tujuan. Cek keduanya sebelum membuat order. Hanya `SiCepat` dan `iDexpress` yang membawa dangerous goods. Kurir lain mengembalikan `isDangerousGoodsSupported: false`.

## Batas kurir

Tiap kurir punya batasnya sendiri. Tanda strip berarti kurir itu tidak punya batas sendiri.

| Kurir | COD maksimum | Berat | Nilai barang tanpa COD |
| --- | --- | --- | --- |
| `JNE` | Rp5.000.000 | - | - |
| `SiCepat` | Rp5.000.000 | - | - |
| `Sap` | Rp2.000.000 | - | - |
| `iDexpress` | Rp5.000.000 | - | - |
| `JT` | Rp5.000.000 | - | - |
| `lion` | Rp5.000.000 | - | - |
| `anteraja` | Rp2.000.000 | 1 sampai 50 kg | Rp1.000 sampai Rp10.000.000 |
| `pos` | Rp2.000.000 | 1 sampai 50 kg | Rp1.000 sampai Rp10.000.000 |
| `spx` | Rp5.000.000 | 1 sampai 50 kg | Rp1.000 sampai Rp10.000.000 |

- Nominal COD minimum Rp1.000, dan Rp10.000 untuk `lion`.
- `anteraja`, `pos`, dan `spx` menghitung berat di bawah 1 kg sebagai 1 kg.
- Estimasi sendiri hanya menegakkan sebagian batas. `anteraja`, `pos`, dan `spx` mengembalikan `unsupported: true` dan `price` `0` kalau berat di atas 50 kg (di sandbox `pos` masih mengembalikan harga), dan `spx` melakukan hal yang sama kalau nominal COD di atas maksimumnya. Untuk batas lainnya, estimasi tetap mengembalikan harga.
- Create order menolak order yang nominal CODnya di atas maksimum kurirnya.

## Aturan kurir

| Kurir | Aturan |
| --- | --- |
| `pos` | COD butuh tingkat terkirim minimal **82%**, dihitung dari order semua kurir yang dibuat dalam rentang bergulir **21 sampai 60 hari**. Kalau tingkatnya tetap di bawah batas, berlaku **masa tenggang tiga hari** sebelum COD Pos Indonesia diblokir. Non-COD tidak terpengaruh. |
| `JTEco` | Muncul sebagai entri tersendiri di samping `JT` kalau kamu mengirim `courier=all`, dengan field yang sama. Hanya muncul kalau rutenya punya tarif J&T ECO dan request bukan Dangerous Goods. `JTEco` bukan nilai `courier`: untuk memesannya, kirim `eco: true` pada order `JT` di [Create order](#create-order). |
| `Ninja` | Dihentikan per 1 September 2026. Request dengan `courier=Ninja` mengembalikan HTTP 400 dengan `code: "COURIER_DISABLED"`, dan `courier=all` tidak menyertakan `Ninja`. Endpoint baca order dan batch lama tetap menerimanya. |

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| `origin_id` atau `destination_id` tidak dikirim | 400 | `{ "success": false, "message": "origin_id or destination_id is empty" }` |
| `origin_id` atau `destination_id` tidak cocok dengan data alamat mana pun | 400 | `{ "success": false, "message": "origin not found" }` (atau `destination not found`) |
| `courier` bukan salah satu nilai yang diizinkan, huruf besar-kecilnya salah, atau dikirim lebih dari sekali | 400 | `{ "success": false, "message": "Invalid courier" }` |
| `courier` adalah `Ninja`, atau `spx` saat SPX sedang dimatikan | 400 | `{ "success": false, "message": "Courier is not available", "code": "COURIER_DISABLED" }` |
| API key tidak valid atau nonaktif, tidak punya hak akses `Check shipping fee`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
