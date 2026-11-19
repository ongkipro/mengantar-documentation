# Create order

`POST {BASE_URL}/api/public/{API_KEY}/order`

Membuat satu batch order untuk satu kurir dan satu pickup. Semua order di `orders` dikirim oleh kurir yang kamu pilih di `courier` dan dijemput di alamat dan waktu yang sama. Response berisi order yang dibuat dan batch-nya. Pakai [Check Shipping Fee](#check-shipping-fee) dulu untuk memilih kurir dan melihat harganya.

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Create order`. Tanpa itu, request ditolak dengan 403 `Not allowed`. Kamu juga butuh alamat yang tersimpan ([Add user's address](#add-users-address)) dan, untuk pickup terjadwal, waktu pickup ([Add Time](#add-time)).

Permission required: Create order
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a COD curl example
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "pickup": {
    "type": "scheduledPickup",
    "volume": "volumeMotor",
    "address_id": "6af555fc8109274a92d72fb3",
    "time_id": "6af583fb9708e74dced0799e"
  },
  "orders": [
    {
      "COD": 100000,
      "customerName": "Siti",
      "customerAddress": "Jalan Melati No. 5",
      "customerAddressDataId": "5fc62f60f8f44b34aa4c0dc9",
      "customerPhone": "081234567890",
      "parcelContent": "Kaos polos",
      "weight": 1,
      "quantity": 1
    }
  ]
}'
```

## Contoh response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af68834ce96b86fe95821e9",
            "ORDER_ID": "261113IBBQ4K",
            "cnote_no": "JJ6000001911",
            "isPaid": true,
            "status": "active",
            "statusCategory": "active",
            "batch": "26111310KDX9LE",
            "batch_id": "6af68834ce96b86fe95821d1",
            "assignee": null,
            "COD_AMOUNT": 100000,
            "COD_FEE": 3329,
            "GOODS_AMOUNT": 100000,
            "price": 11000,
            "estimatedPrice": 14329,
            "estimatedSpecialPrice": 10479,
            "discountPercent": 30,
            "discountExtraPercent": 5,
            "discount": 3300,
            "discountExtra": 550,
            "WEIGHT": 1,
            "QTY": 1,
            "SERVICE_CODE": "REG",
            "GOODS_DESC": "Kaos polos",
            "isDangerousGoods": false,
            "cargo": false,
            "PICKUP_NAME": "Gudang Utama",
            "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
            "PICKUP_DISTRICT": "BABAKAN CIPARAY",
            "PICKUP_CITY": "BANDUNG",
            "PICKUP_PIC_PHONE": "081234567890",
            "RECEIVER_NAME": "Siti",
            "RECEIVER_ADDR1": "Jalan Melati No. 5",
            "RECEIVER_SUBDISTRICT": "CIPETE UTARA",
            "RECEIVER_DISTRICT": "KEBAYORAN BARU",
            "RECEIVER_CITY": "JAKARTA SELATAN",
            "RECEIVER_ZIP": "12150",
            "RECEIVER_PHONE": "081234567890",
            "address_id": "6af555fc8109274a92d72fb3",
            "time_id": "6af583fb9708e74dced0799e",
            "createdAt": "2026-11-13T03:47:00.448Z"
        }
    ],
    "batch": "26111310KDX9LE",
    "batch_id": "6af68834ce96b86fe95821d1",
    "courier": "JT",
    "errors": [],
    "ordersClosedDestination": []
}
```

`data` berisi satu entri per order yang dibuat. Response tiap order punya lebih banyak field daripada yang tampil di sini. Contoh ini menampilkan yang akan kamu pakai.

## Order non-COD

Kirim `goodsValue` sebagai pengganti `COD`. Ongkos kirim dipotong dari saldomu saat order dibuat.

### Contoh request

```bash
# Here is a Non-COD curl example
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "pickup": {
    "type": "scheduledPickup",
    "volume": "volumeMotor",
    "address_id": "6af555fc8109274a92d72fb3",
    "time_id": "6af583fb9708e74dced0799e"
  },
  "orders": [
    {
      "goodsValue": 100000,
      "customerName": "Siti",
      "customerAddress": "Jalan Melati No. 5",
      "customerAddressDataId": "5fc62f60f8f44b34aa4c0dc9",
      "customerPhone": "081234567890",
      "parcelContent": "Kaos polos",
      "weight": 1,
      "quantity": 1
    }
  ]
}'
```

### Contoh response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af68834ce96b86fe95821e9",
            "ORDER_ID": "261113IBBQ4K",
            "cnote_no": "JJ6000001911",
            "isPaid": true,
            "status": "active",
            "statusCategory": "active",
            "batch": "26111310KDX9LE",
            "batch_id": "6af68834ce96b86fe95821d1",
            "assignee": null,
            "COD_AMOUNT": 0,
            "GOODS_AMOUNT": 100000,
            "price": 11000,
            "estimatedPrice": 11000,
            "estimatedSpecialPrice": 7150,
            "discountPercent": 30,
            "discountExtraPercent": 5,
            "discount": 3300,
            "discountExtra": 550,
            "WEIGHT": 1,
            "QTY": 1,
            "SERVICE_CODE": "REG",
            "GOODS_DESC": "Kaos polos",
            "isDangerousGoods": false,
            "cargo": false,
            "PICKUP_NAME": "Gudang Utama",
            "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
            "PICKUP_DISTRICT": "BABAKAN CIPARAY",
            "PICKUP_CITY": "BANDUNG",
            "PICKUP_PIC_PHONE": "081234567890",
            "RECEIVER_NAME": "Siti",
            "RECEIVER_ADDR1": "Jalan Melati No. 5",
            "RECEIVER_SUBDISTRICT": "CIPETE UTARA",
            "RECEIVER_DISTRICT": "KEBAYORAN BARU",
            "RECEIVER_CITY": "JAKARTA SELATAN",
            "RECEIVER_ZIP": "12150",
            "RECEIVER_PHONE": "081234567890",
            "address_id": "6af555fc8109274a92d72fb3",
            "time_id": "6af583fb9708e74dced0799e",
            "createdAt": "2026-11-13T03:47:00.448Z"
        }
    ],
    "batch": "26111310KDX9LE",
    "batch_id": "6af68834ce96b86fe95821d1",
    "courier": "JT",
    "errors": [],
    "ordersClosedDestination": []
}
```

## Order dropship

Tambahkan objek opsional `dropShipper` ke sebuah order untuk mengirimnya atas nama dan nomor telepon dropshipper yang tersimpan. Ambil dropshipper dari [Add Dropshipper](#add-dropshipper) atau [Search Dropshipper](#search-dropshipper) dulu.

### Contoh request

```bash
# Here is a dropship curl example
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "pickup": {
    "type": "scheduledPickup",
    "volume": "volumeMotor",
    "address_id": "6af555fc8109274a92d72fb3",
    "time_id": "6af583fb9708e74dced0799e"
  },
  "orders": [
    {
      "goodsValue": 100000,
      "customerName": "Siti",
      "customerAddress": "Jalan Melati No. 5",
      "customerAddressDataId": "5fc62f60f8f44b34aa4c0dc9",
      "customerPhone": "081234567890",
      "parcelContent": "Kaos polos",
      "weight": 1,
      "quantity": 1,
      "dropShipper": {
        "id": "66ab1234567890abcdef1234",
        "name": "Toko Partner",
        "phone": "081234567890"
      }
    }
  ]
}'
```

### Contoh response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af68834ce96b86fe95821ea",
            "ORDER_ID": "261113W04TMC",
            "cnote_no": "JJ6000001912",
            "isPaid": true,
            "status": "active",
            "statusCategory": "active",
            "batch": "26111310KDX9LE",
            "batch_id": "6af68834ce96b86fe95821d1",
            "assignee": null,
            "COD_AMOUNT": 0,
            "GOODS_AMOUNT": 100000,
            "price": 11000,
            "estimatedPrice": 11000,
            "estimatedSpecialPrice": 7150,
            "discountPercent": 30,
            "discountExtraPercent": 5,
            "discount": 3300,
            "discountExtra": 550,
            "WEIGHT": 1,
            "QTY": 1,
            "SERVICE_CODE": "REG",
            "GOODS_DESC": "Kaos polos",
            "isDangerousGoods": false,
            "cargo": false,
            "PICKUP_NAME": "Toko Partner",
            "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
            "PICKUP_DISTRICT": "BABAKAN CIPARAY",
            "PICKUP_CITY": "BANDUNG",
            "PICKUP_PIC_PHONE": "081234567890",
            "RECEIVER_NAME": "Siti",
            "RECEIVER_ADDR1": "Jalan Melati No. 5",
            "RECEIVER_SUBDISTRICT": "CIPETE UTARA",
            "RECEIVER_DISTRICT": "KEBAYORAN BARU",
            "RECEIVER_CITY": "JAKARTA SELATAN",
            "RECEIVER_ZIP": "12150",
            "RECEIVER_PHONE": "081234567890",
            "address_id": "6af555fc8109274a92d72fb3",
            "time_id": "6af583fb9708e74dced0799e",
            "createdAt": "2026-11-13T03:47:00.448Z",
            "dropShipperId": "66ab1234567890abcdef1234",
            "dropShipper": {
                "id": "66ab1234567890abcdef1234",
                "name": "Toko Partner",
                "phone": "081234567890"
            }
        }
    ],
    "batch": "26111310KDX9LE",
    "batch_id": "6af68834ce96b86fe95821d1",
    "courier": "JT",
    "errors": [],
    "ordersClosedDestination": []
}
```

## Order dengan custom products

Tambahkan `customProducts` untuk mencantumkan produk di dalam paket. Produk dicetak di tabel produk pada label. `weight` dan `quantity` order harus sama dengan total produknya: di sini `0.5 × 2 + 1 × 1 = 2` kg dan `2 + 1 = 3` barang. Produk disimpan sesaat setelah order dibuat, jadi `customProductOrderIds` masih kosong di response ini; isinya terisi saat kamu membaca order lewat [Get orders](#get-orders).

### Contoh request

```bash
# Here is a custom products curl example
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "pickup": {
    "type": "scheduledPickup",
    "volume": "volumeMotor",
    "address_id": "6af555fc8109274a92d72fb3",
    "time_id": "6af583fb9708e74dced0799e"
  },
  "orders": [
    {
      "goodsValue": 125000,
      "customerName": "Siti",
      "customerAddress": "Jalan Melati No. 5",
      "customerAddressDataId": "5fc62f60f8f44b34aa4c0dc9",
      "customerPhone": "081234567890",
      "parcelContent": "Kaos polos dan topi",
      "weight": 2,
      "quantity": 3,
      "customProducts": [
        { "name": "Kaos polos", "variant": "M", "qty": 2, "price": 50000, "weight": 0.5 },
        { "name": "Topi", "variant": "Hitam", "qty": 1, "price": 25000, "weight": 1 }
      ]
    }
  ]
}'
```

### Contoh response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af68834ce96b86fe95821eb",
            "ORDER_ID": "261113XPCRD8",
            "cnote_no": "JJ6000001913",
            "isPaid": true,
            "status": "active",
            "statusCategory": "active",
            "batch": "26111310KDX9LE",
            "batch_id": "6af68834ce96b86fe95821d1",
            "assignee": null,
            "COD_AMOUNT": 0,
            "GOODS_AMOUNT": 125000,
            "price": 22000,
            "estimatedPrice": 22000,
            "estimatedSpecialPrice": 14300,
            "discountPercent": 30,
            "discountExtraPercent": 5,
            "discount": 6600,
            "discountExtra": 1100,
            "WEIGHT": 2,
            "QTY": 3,
            "SERVICE_CODE": "REG",
            "GOODS_DESC": "Kaos polos",
            "isDangerousGoods": false,
            "cargo": false,
            "PICKUP_NAME": "Gudang Utama",
            "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
            "PICKUP_DISTRICT": "BABAKAN CIPARAY",
            "PICKUP_CITY": "BANDUNG",
            "PICKUP_PIC_PHONE": "081234567890",
            "RECEIVER_NAME": "Siti",
            "RECEIVER_ADDR1": "Jalan Melati No. 5",
            "RECEIVER_SUBDISTRICT": "CIPETE UTARA",
            "RECEIVER_DISTRICT": "KEBAYORAN BARU",
            "RECEIVER_CITY": "JAKARTA SELATAN",
            "RECEIVER_ZIP": "12150",
            "RECEIVER_PHONE": "081234567890",
            "address_id": "6af555fc8109274a92d72fb3",
            "time_id": "6af583fb9708e74dced0799e",
            "createdAt": "2026-11-13T03:47:00.448Z",
            "customProductOrderIds": []
        }
    ],
    "batch": "26111310KDX9LE",
    "batch_id": "6af68834ce96b86fe95821d1",
    "courier": "JT",
    "errors": [],
    "ordersClosedDestination": []
}
```

## Body parameter

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| courier | String | Wajib. `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, atau `spx`. Huruf besar dan kecil dibedakan. `Ninja` dihentikan per 1 September 2026 dan ditolak dengan 400. |
| pickup | Object | Wajib. Bagaimana dan di mana kurir menjemput order. |
| pickup.type | String | Wajib. `scheduledPickup` atau `dropOff`. Untuk `JNE` dan `spx`, `dropOff` hanya diterima kalau Drop Off aktif di akunmu, hubungi admin untuk mengaktifkannya. `anteraja` tidak mendukung `dropOff`. |
| pickup.address_id | String | Wajib. `_id` salah satu alamatmu yang tersimpan, dari [Get user's addresses](#get-users-addresses) atau [Add user's address](#add-users-address). |
| pickup.time_id | String | Wajib untuk `scheduledPickup`, tidak perlu untuk `dropOff`. `_id` waktu pickup, dari [Get Time](#get-time) atau [Add Time](#add-time). Pickup harus minimal 90 menit dari sekarang. Untuk `spx`, waktunya juga harus masuk ke slot yang dibuka SPX untuk hari itu. |
| pickup.volume | String | Wajib untuk `scheduledPickup`, tidak perlu untuk `dropOff`. `volumeMotor`, `volumeMobil`, atau `volumeTruck`. |
| orders | Array | Wajib. Order dalam batch. Tidak boleh kosong. |
| orders.COD | Number | Nominal COD: nilai barang ditambah ongkos kirim ditambah biaya COD. Minimal Rp1.000, dan paling banyak batas COD kurir, lihat batas kurir di [Check Shipping Fee](#check-shipping-fee). Kirim `COD` atau `goodsValue`, jangan keduanya. Kalau keduanya dikirim, `COD` yang dipakai. |
| orders.goodsValue | Number | Nilai barang, untuk order non-COD. Wajib kalau `COD` kosong. Harus berupa angka. |
| orders.customerName | String | Wajib. Nama penerima. |
| orders.customerAddress | String | Wajib. Alamat jalan penerima. |
| orders.customerAddressDataId | String | Wajib. `_id` area tujuan, dari [Search address data](#search-address-data). |
| orders.customerPhone | String | Wajib. Nomor telepon penerima, 10 sampai 15 digit. Kode negara ikut dihitung, jadi `62` dan `+62` termasuk digit nomor. Tanda strip dan spasi diterima. Ekstensi seperti `x12` diterima, tetapi digitnya tidak dihitung. |
| orders.parcelContent | String | Wajib. Isi paket, misalnya nama produk. |
| orders.weight | Number | Berat total dalam kg. Kirim angka positif: angka negatif ditolak dengan 400. `JT` menolak lebih dari `50` kg, dan `anteraja`, `pos`, serta `spx` menerima 1 sampai 50 kg, lihat batas kurir di [Check Shipping Fee](#check-shipping-fee). Kalau kamu mengirim `customProducts`, nilainya harus sama dengan jumlah `qty` × `weight` semua item. |
| orders.quantity | Number | Jumlah barang. Kalau kamu mengirim `customProducts`, nilainya harus sama dengan jumlah `qty` semua item. |
| orders.assignee | String | Opsional. `_id` anggota tim, dari [Get My Users](#get-my-users-assignee). |
| orders.destinationMark | String | Opsional. Patokan lokasi tujuan. |
| orders.deliveryInstruction | String | Opsional. Catatan untuk kurir. |
| orders.dontIncludeSubdistrict | Boolean | Opsional. Tidak menampilkan kelurahan pada alamat penerima di label. |
| orders.cargo | Boolean | Opsional. `true` mengirim order dengan layanan cargo. Cargo tersedia untuk `JNE`, `SiCepat`, `Sap`, dan `iDexpress`. |
| orders.eco | Boolean | Opsional. Hanya untuk `courier` `JT`. `true` memesan layanan J&T ECO. Kalau tidak dikirim, `false`, atau `null`, order memakai layanan reguler (REG). Tiap order dalam batch memilih layanannya sendiri. Tidak bisa digabung dengan `cargo` atau `isDangerousGoods`. ECO hanya tersedia di sebagian rute: itu entri `JTEco` pada estimasi. Order ECO ke rute tanpa ECO tidak dibuat dan masuk ke `ordersClosedDestination`; order itu tidak pernah dialihkan ke REG. `JTEco` bukan nilai `courier`. |
| orders.isDangerousGoods | Boolean | Opsional. Bawaan `false`. `true` membuat order dangerous goods. Harus berupa Boolean JSON, bukan string. Hanya `SiCepat` dan `iDexpress` yang menerimanya, lihat di bawah. |
| orders.dropShipper | Object | Opsional. Dropshipper yang tersimpan, dengan `id`, `name`, dan `phone`. Ketiganya wajib dan harus sama persis dengan dropshipper yang tersimpan. |
| orders.customProducts | Array | Opsional. Produk di dalam paket, ditampilkan di label. Tiap item punya `name` (wajib), `qty` (wajib), dan opsional `variant`, `price`, serta `weight` (bawaan `1`). `quantity` dan `orderQuantity` diterima sebagai pengganti `qty`, dan `harga` atau `regularPrice` sebagai pengganti `price`. |

Field yang diatur sistem ditolak dengan 400 `Fields not allowed in public API request`, diikuti nama field-nya: `price`, `estimatedPrice`, `estimatedSpecialPrice`, `isFlat`, `discount`, `discountPercent`, `discountExtra`, `discountExtraPercent`, `allEstimateData`, `iDlite`, dan `iDliteDiscount`. Request ditolak begitu key-nya ada, walau nilainya `0`, `null`, atau string kosong, dan di mana pun kamu menaruhnya: di body, di `pickup`, atau di order.

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| data | Array | Order yang berhasil dibuat. |
| batch | String | Nomor batch, misalnya `26111310KDX9LE`. |
| batch_id | String | `_id` batch. Pakai sebagai `batch_id` di [Pay unpaid](#pay-unpaid) dan sebagai `id` di [Delete batch](#delete-batch). |
| courier | String | Kurir batch. |
| errors | Array | Kosong kalau batch berhasil dibuat. |
| ordersClosedDestination | Array | Order yang tidak dibuat karena kurir tidak melayani tujuannya. Lihat di bawah. |
| _id | String | `_id` order. |
| ORDER_ID | String | Nomor order. |
| cnote_no | String | Nomor resi (AWB). `null` atau kosong selama order belum dibayar atau kalau gagal. |
| isPaid | Boolean | `false` kalau saldomu tidak cukup, lihat di bawah. |
| status | String | `active` untuk order yang dibuat, `error` kalau kurir menolaknya, lihat di bawah. |
| error | String | Hanya kalau `status` adalah `error`: pesan dari kurir. |
| price | Number | Ongkos kirim sebelum diskon, dalam rupiah. |
| COD_AMOUNT | Number | Nominal COD. `0` untuk order non-COD. |
| COD_FEE | Number | Biaya layanan COD. `0` untuk order non-COD. |
| estimatedPrice | Number | `price` ditambah biaya COD. Sama seperti di [Check Shipping Fee](#check-shipping-fee). |
| estimatedSpecialPrice | Number | Yang kamu bayar setelah diskon. Sama seperti di [Check Shipping Fee](#check-shipping-fee). |
| discountPercent | Number | Diskon dalam persen. |
| discount | Number | Diskon dalam rupiah. |
| discountExtraPercent | Number | Diskon tambahan dalam persen. |
| discountExtra | Number | Diskon tambahan dalam rupiah. |
| SERVICE_CODE | String | Layanan yang dipesan: `REG`, atau `ECO` untuk order J&T ECO. |
| statusCategory | String | Kelompok status order, seperti `active` atau `error`. |
| GOODS_AMOUNT | Number | Nilai barang dalam rupiah. Untuk order COD, nilainya sama dengan nominal COD. |
| GOODS_DESC | String | `parcelContent` yang kamu kirim. |
| WEIGHT | Number | Berat order dalam kg. |
| QTY | Number | Jumlah barang. |
| assignee | String | `_id` anggota tim yang ditugaskan untuk order ini, atau `null`. |
| cargo | Boolean | `true` kalau order memakai layanan cargo. |
| isDangerousGoods | Boolean | `true` kalau order adalah order dangerous goods. |
| address_id | String | `_id` alamat pickup yang kamu kirim. |
| time_id | String | `_id` waktu pickup yang kamu kirim. |
| createdAt | String | Kapan order dibuat, dalam ISO 8601 UTC. |
| PICKUP_* | String | Alamat pickup seperti yang tersimpan di order, misalnya `PICKUP_NAME`, `PICKUP_ADDRESS`, dan `PICKUP_CITY`. |
| RECEIVER_* | String | Penerima seperti yang tersimpan di order, misalnya `RECEIVER_NAME`, `RECEIVER_ADDR1`, dan `RECEIVER_PHONE`. |
| dropShipperId | String | Hanya pada order dropship: ID dropshipper. |
| dropShipper | Object | Hanya pada order dropship: `id`, `name`, dan `phone` dropshipper. |

## Membaca hasilnya

HTTP `200` dan `success: true` berarti batch diproses, bukan berarti semua order terkirim. Cek tiap order:

- **`status: "active"` dengan `cnote_no`:** order dibuat dan sudah punya nomor resi.
- **`isPaid: false`:** saldomu tidak cukup, lihat Order belum dibayar di bawah. Belum ada nomor resi.
- **`status: "error"` dan pesan `error`:** kurir menolak order itu, misalnya karena rute tidak dilayani. Batch tetap dibuat. Hapus dengan [Delete batch](#delete-batch) atau perbaiki order lalu kirim lagi.
- **Order di `ordersClosedDestination`:** tujuan tidak dilayani kurir. Order tidak dibuat dan tidak ada di `data`.

## Order belum dibayar

Untuk order non-COD, ongkos kirim dipotong dari saldomu. Kalau saldo tidak cukup, order tetap dibuat dengan `isPaid: false` dan `cnote_no: null`, dan tidak ada yang dipotong. Setelah kamu top up saldo, bayar dengan [Pay unpaid](#pay-unpaid) dan nomor resi dibuat. Order COD tidak dipotong saat dibuat.

> [!SANDBOX]
> Untuk menambah saldo di sandbox, pakai **Top Up Saldo** di aplikasi Mengantar, lalu selesaikan pembayaran di simulator Midtrans sandbox: [https://simulator.sandbox.midtrans.com/](https://simulator.sandbox.midtrans.com/)

## Dangerous Goods

Sebelum membuat order DG, panggil endpoint estimasi ongkos kirim dengan `isDangerousGoods=true`. Lanjutkan hanya kalau `isDangerousGoodsSupported` bernilai `true` dan `unsupported` bernilai `false`.

| Kurir | Create Order DG | Layanan |
| --- | --- | --- |
| `SiCepat` | `true` | `HALU` |
| `iDexpress` | `true` | Layanan reguler |

**Error validasi mengembalikan HTTP 400:**

```json
{
  "success": false,
  "message": "orders[0].isDangerousGoods must be a boolean"
}
```

- `Dangerous goods cannot be combined with cargo service`
- `Dangerous goods service is not supported by courier {courier}`
- `Dangerous goods service is not available for destination of orders[{index}]`

## Dropshipper

Aktifkan fitur Dropshipper lewat Seller Web sebelum memakai `dropShipper`. Nama dan nomor telepon dropshipper yang tersimpan menjadi identitas pengirim di shipment dan label. Alamat pickup tetap alamat yang kamu pilih di request, dan alamat yang tersimpan tidak diubah. Create order tidak pernah membuat dropshipper, dan dalam batch dengan beberapa order, order lain tetap memakai identitasmu sendiri. Validasi dropshipper berjalan untuk seluruh batch sebelum order mana pun dibuat. Kalau satu order punya referensi yang tidak valid, seluruh request ditolak dan tidak ada yang dibuat.

| Status HTTP | Kondisi |
| --- | --- |
| 200 | Batch order berhasil dibuat. Setiap order dropship menyertakan `dropShipperId` dan referensi `dropShipper` yang cocok di item response-nya. |
| 400 | Field dropshipper kosong, ID tidak valid atau bukan milik akun API Key, atau nama/nomor telepon yang dikirim tidak sama persis dengan master tersimpan. Tidak ada order di batch yang dibuat. |
| 403 | Fitur Dropshipper di akun nonaktif. Tidak ada order di batch yang dibuat. |
| 500 | Validasi dropshipper tidak bisa diselesaikan karena error internal. Tidak ada order yang dikirim. |

```json
Invalid dropshipper example (HTTP 400):
{
    "success": false,
    "message": "Invalid dropshipper data",
    "errors": [
        {
            "order": 1,
            "path": "orders[0].dropShipper",
            "message": "name or phone does not match the saved dropshipper"
        }
    ]
}
```

## Idempotency key (opsional)

Request create order bisa timeout di sisimu saat Mengantar masih membuat batch. Kalau kamu mengirim ulang request itu, order yang sama akan dibuat dua kali. Supaya aman saat retry, kirim header `idempotencyKey` berisi referensi dari sistemmu untuk request ini, misalnya nomor order atau nomor batch, lalu kirim nilai yang sama di setiap retry request tersebut.

```bash
curl --location '{BASE_URL}/api/public/{API_KEY}/order' \
--header 'Content-Type: application/json' \
--header 'idempotencyKey: INV-2026-0001' \
--data '{ ...same body as above... }'
```

| Header | Tipe | Deskripsi |
| --- | --- | --- |
| idempotencyKey | String | (Opsional). 1–50 karakter; spasi di awal dan akhir diabaikan. Key diingat selama **24 jam** sejak request pertama yang memakainya, per akun API Key: key yang sama dari akun lain tidak saling berkaitan. Tanpa header ini, request diproses persis seperti sebelumnya. Key hanya dibaca dari header, tidak pernah dari body, dan diabaikan pada request `validate`. |

Dua request dianggap sama kalau memakai key yang sama dan body yang sama (urutan field JSON tidak berpengaruh).

| Status HTTP | Kondisi |
| --- | --- |
| Sama dengan request pertama | Key sudah pernah dipakai dengan body yang sama dan request itu sudah selesai. Response pertama dikirim lagi, dengan `batch`, `batch_id`, dan hasil per order yang sama, dan tidak ada batch atau order baru yang dibuat. Response membawa header `Idempotent-Replayed: true` dan field `"idempotentReplayed": true`. Order dalam kondisi saat pertama kali dibuat; pakai `GET /order` untuk melihat status terkininya. Ini berlaku juga untuk request pertama yang gagal dengan 5xx: request itu mungkin sudah membuat sebagian batch, jadi tidak dijalankan lagi. |
| 400 | `code: IDEMPOTENCY_KEY_INVALID`. Header kosong atau lebih dari 50 karakter. Tidak ada batch yang dibuat. |
| 409 | `code: IDEMPOTENCY_REQUEST_IN_PROGRESS`. Request pertama dengan key ini masih diproses. Tidak ada batch yang dibuat. Kirim ulang dengan key yang sama setelah jumlah detik pada header `Retry-After` untuk mendapatkan hasilnya. |
| 409 | `code: IDEMPOTENCY_REQUEST_UNRESOLVED`. Request pertama dengan key ini tidak pernah selesai. Request itu mungkin sudah membuat sebagian order, jadi tidak dijalankan lagi: cek `GET /order` dan kirim order yang belum ada dengan key baru. |
| 422 | `code: IDEMPOTENCY_KEY_REUSED`. Key sudah pernah dipakai untuk request dengan body yang berbeda. Tidak ada batch yang dibuat. |
| 503 | `code: IDEMPOTENCY_UNAVAILABLE`. Key tidak bisa dicek. Tidak ada batch yang dibuat; kirim ulang dengan key yang sama. |

Kalau request pertama ditolak dengan 4xx sebelum order apa pun dibuat (misalnya error validasi), key dilepas: perbaiki body lalu kirim lagi dengan key yang sama.

Replay adalah salinan response pertama, bukan kondisi terkini order. Menghapus batch atau ordernya (lihat [Delete Batch](#delete-batch)) tidak melepas key: mengirim key yang sama lagi tetap mengembalikan response lama, dengan `"idempotentReplayed": true` serta `batch_id` dan nomor AWB yang lama, dan tidak ada order baru yang dibuat. Untuk membuat ulang order setelah dihapus, kirim dengan key yang **baru**. Pakai `GET /order` untuk mengecek apakah order masih aktif.

**Alur retry yang disarankan**

1. Kirim request dengan `idempotencyKey` berisi referensimu sendiri, misalnya `INV-2026-0001`.
2. Kalau koneksi timeout atau terputus, kirim lagi **body yang persis sama** dengan **key yang sama**. Jangan membuat ulang nilai yang berubah di setiap pemanggilan (timestamp, ID acak), karena retry akan dianggap request yang berbeda.
3. Saat menerima `409 IDEMPOTENCY_REQUEST_IN_PROGRESS`, tunggu sesuai detik pada `Retry-After`, lalu kirim ulang dengan key yang sama.
4. Berhenti saat kamu mendapat batch-nya kembali (response pertama, atau replay dengan `"idempotentReplayed": true`).
5. Pada 5xx yang di-replay atau `409 IDEMPOTENCY_REQUEST_UNRESOLVED`, cek `GET /order` dulu, lalu kirim hanya order yang belum ada dengan key **baru**.

```json
Replayed result, same key and same body after the first request finished (HTTP 200).
Response header: Idempotent-Replayed: true
{
    "success": true,
    "data": [
        {
            "_id": "697c58034fa61abe7c700da9",
            "batch_id": "697c58034fa61abe7c700da6",
            "batch": "26013014BBQFMM",
            "ORDER_ID": "260130OVBBOO",
            "cnote_no": "11000009548385",
            ...same order fields as the first response...
        }
    ],
    "batch": "26013014BBQFMM",
    "batch_id": "697c58034fa61abe7c700da6",
    "courier": "JNE",
    "errors": [],
    "idempotentReplayed": true
}
```

```json
First request still being processed (HTTP 409).
Response header: Retry-After: 10
{
    "success": false,
    "code": "IDEMPOTENCY_REQUEST_IN_PROGRESS",
    "message": "The earlier request with this idempotencyKey is still being processed, retry later"
}
```

```json
First request never finished (HTTP 409):
{
    "success": false,
    "code": "IDEMPOTENCY_REQUEST_UNRESOLVED",
    "message": "The earlier request with this idempotencyKey did not finish. Check GET /order for orders it created before sending them again with a new idempotencyKey"
}
```

```json
Replayed server error, the first request failed with a 5xx (HTTP 500).
Response header: Idempotent-Replayed: true
{
    "success": false,
    "message": "Error on createOrderFunction",
    "idempotentReplayed": true
}
```

```json
Key reused with a different body (HTTP 422):
{
    "success": false,
    "code": "IDEMPOTENCY_KEY_REUSED",
    "message": "idempotencyKey has already been used for a different request"
}
```

```json
Invalid key (HTTP 400):
{
    "success": false,
    "code": "IDEMPOTENCY_KEY_INVALID",
    "message": "idempotencyKey header must not exceed 50 characters"
}
```

```json
Key could not be checked, nothing was created (HTTP 503):
{
    "success": false,
    "code": "IDEMPOTENCY_UNAVAILABLE",
    "message": "Order could not be processed right now, please retry with the same idempotencyKey"
}
```

## Pos Indonesia (`pos`)

Pakai nilai kurir huruf kecil persis `pos`. Untuk pickup terjadwal, alamat pickup yang dipilih harus berisi `pinpointData.lat` dan `pinpointData.lng` yang valid.

COD Pos Indonesia mewajibkan delivered rate minimal **82%**, dihitung dari order yang dibuat selama periode bergulir **21–60 hari** di semua kurir. COD diblokir kalau tiga periode evaluasi terakhir semuanya di bawah ambang batas. Order non-COD tetap tersedia.

**Status kelayakan COD:**

**Diblokir (response 403 Forbidden):** Field `status` menunjukkan alasan COD diblokir. Ketiga status mengembalikan pesan umum yang sama; pakai field `status` untuk membedakan alasannya:

- **new_seller:** Akun belum punya riwayat pengiriman, yaitu belum ada paket atau belum ada yang terkirim. COD diblokir. `deliveredRate` bernilai `0` (belum ada riwayat pengiriman).
- **insufficient:** Data belum cukup untuk dievaluasi: belum ada periode rate yang dibuat, periode terbaru kurang dari 21 hari, atau tidak berisi paket. Ini bukan masalah performa. COD diblokir. `deliveredRate` menunjukkan delivered rate keseluruhan akun, yang tidak mencerminkan periode evaluasi.
- **blocked:** Ketiga periode evaluasi terakhir semuanya di bawah 82%. COD diblokir. `deliveredRate` menunjukkan rate sebenarnya (misalnya 70%).

**Tersedia (200 OK):** Kalau salah satu status berikut dikembalikan, order berhasil seperti biasa tanpa response 403:

- **eligible:** Periode evaluasi terbaru punya delivered rate 82% atau lebih. COD tersedia.
- **warning:** Periode terbaru di bawah 82%, tetapi tidak semua dari tiga periode terakhir. COD masih tersedia. `deliveredRate` menunjukkan rate sebenarnya (misalnya 75%).

**Contoh: status new_seller**

```json
{
  "success": false,
  "message": "Pos Indonesia COD is not available for this account",
  "status": "new_seller",
  "deliveredRate": 0,
  "minimumDeliveredRate": 82
}
```

**Contoh: status insufficient**

```json
{
  "success": false,
  "message": "Pos Indonesia COD is not available for this account",
  "status": "insufficient",
  "deliveredRate": 40,
  "minimumDeliveredRate": 82
}
```

**Contoh: status blocked**

```json
{
  "success": false,
  "message": "Pos Indonesia COD is not available for this account",
  "status": "blocked",
  "deliveredRate": 70,
  "minimumDeliveredRate": 82
}
```

## Penting — JT Premium dan SiCepat: batch bersamaan

Untuk kurir yang nomor resinya (`cnote_no` / resi) **dibuat di sisi kami**, saat ini **JT Premium** dan **SiCepat**, sistem memberi nomor secara berurutan per akun. Supaya nomor resi unik dan terpasang dengan benar, **hanya satu batch yang bisa diproses dalam satu waktu per akun**.

**Jangan kirim beberapa request batch secara bersamaan** (misalnya menembak beberapa panggilan API paralel dari sistemmu). Sebagai gantinya, gabungkan semua order dalam satu batch dan kirim dalam satu request.

**Kalau request bersamaan terdeteksi (JT Premium), API akan merespons dengan:**

```json
{
  "success": false,
  "message": "Sedang ada proses pembuatan order JT Premium yang berjalan. Mohon gabungkan semua order dalam 1 batch yang sama daripada mengirim beberapa batch secara bersamaan."
}
```

Status HTTP: `409 Conflict`

## SPX Express (`spx`)

Pakai nilai kurir huruf kecil persis `spx`. `dropOff` hanya tersedia untuk akun dengan SPX Drop Off aktif, hubungi admin untuk mengaktifkannya. `pickup.time_id` dicek terhadap slot pickup yang dibuka SPX untuk hari itu: tanggal dan jamnya harus masuk ke salah satu slot, kalau tidak request ditolak dengan 400 beserta slot yang sedang terbuka. Slot itu juga ada di `pickupSchedule` pada [Check Shipping Fee](#check-shipping-fee).

Di sandbox, SPX hanya berfungsi untuk area pickup dan tujuan di **Jakarta**. Untuk area lain, SPX menolak order setelah order dibuat. Request tetap mengembalikan 200, dan order berstatus `status: "error"` dengan pesan SPX di `error`. Ini tidak terjadi di production.

> [!SANDBOX]
> **Error khusus sandbox**
>
> Pesan berikut muncul di `error` order saat kamu menguji SPX di sandbox, karena keterbatasan API dev kurir.
>
> | Pesan | Penyebab dan tindakan |
> | --- | --- |
> | `station not FIRST_MILE_HUB or DC or AM_HUB, or station not InOperation, or no match pickupStationId` | Sandbox SPX hanya punya stasiun pickup di Jakarta. Pakai alamat pickup di **Jakarta**. |
> | `buyer address not support delivery` | Sandbox SPX mencakup lebih sedikit tujuan dibanding production. Pakai tujuan di **Jakarta**. |

## Response error

Sebagian besar error mengembalikan 400 dengan `success: false`, `message`, dan `courier`. Error validasi pada order mengembalikan `message: "Error in orders"`, dengan `errors` dalam bahasa Inggris dan `errorsFront` dalam bahasa Indonesia, satu entri per masalah.

| Kondisi | Status | `message` |
| --- | --- | --- |
| `courier` tidak ada | 400 | `courier is required` |
| `weight` sebuah order bernilai negatif | 400 | `orders[0].weight must not be negative` (dengan posisi order di `orders`) |
| `courier` bukan salah satu nilai yang diizinkan | 400 | `Invalid courier` |
| `courier` adalah `Ninja` | 400 | `Ninja Xpress is no longer available for new shipments` |
| Ada field milik sistem di body | 400 | `Fields not allowed in public API request: price` |
| `pickup.address_id`, `pickup.time_id`, `pickup.type`, atau `pickup.volume` tidak ada atau tidak valid | 400 | `pickup.address_id is required` |
| Alamat tersimpan tidak ditemukan, atau milik akun lain | 400 | `Pickup address not found` |
| `COD` di bawah Rp1.000 | 400 | `Error in orders (`COD value is less than Rp1,000 or empty`)` |
| `COD` di atas batas kurir | 400 | `Error in orders (for example `Anteraja COD value is more than Rp2.000.000`)` |
| Kurir tidak menjemput di hari itu, misalnya `anteraja` pada hari Minggu | 400 | `Ekspedisi Anteraja tidak mendukung penjemputan pada hari Minggu` |
| Pickup kurang dari 90 menit dari sekarang | 400 | `Waktu Penjemputan harus minimal 90 menit dari sekarang` |
| `orders` kosong | 400 | `orders are empty` |
| Order tidak punya `COD` dan `goodsValue`, `customerName`, `customerAddress`, `customerAddressDataId`, `customerPhone`, atau `parcelContent`, atau nomor telepon tidak valid | 400 | `Error in orders` |
| Berat di atas batas kurir, misalnya 50 kg untuk `JT` | 400 | `Error in orders (`orders[Siti] weight max is 50`)` |
| `weight` atau `quantity` tidak cocok dengan `customProducts` | 400 | `Error in orders` |
| `isDangerousGoods` bukan Boolean, atau kurir atau tujuan tidak mendukung dangerous goods | 400 | `orders[0].isDangerousGoods must be a boolean` |
| `eco` dipakai dengan kurir selain `JT`, dengan `cargo`, atau bukan Boolean | 400 | `orders[0].eco is only available for courier JT` |
| Dropshipper tidak valid | 400 | `Invalid dropshipper data` |
| API key tidak valid atau nonaktif, tidak punya hak akses `Create order`, atau IP tidak diizinkan | 403 | `Not allowed` |

Sebagian pesan mengikuti bahasa akunmu (aplikasi web Mengantar, pengaturan akun), jadi error yang sama bisa datang dalam bahasa Indonesia atau Inggris, misalnya `Nilai COD kurang dari Rp1,000` atau `COD value is less than Rp1,000 or empty`. Cocokkan berdasarkan status dan field, bukan teks persisnya. Error idempotency, dropshipper, Pos Indonesia, dan concurrency punya kode status sendiri, dijelaskan di section masing-masing di atas.
