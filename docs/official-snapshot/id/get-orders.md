# Get orders

`GET {BASE_URL}/api/public/{API_KEY}/order`

Menampilkan order milikmu, dari yang terbaru, dengan filter kurir, COD, status, tanggal, dan batch. Untuk membaca satu order beserta riwayat tracking lengkapnya, cari lewat nomor resi atau nomor ordernya. Pakai [Pay unpaid](#pay-unpaid) dan [Delete orders](#delete-orders) untuk order yang kamu baca di sini.

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Check order status`. Tanpa itu, request ditolak dengan 403 `Not allowed`.

Permission required: Check order status
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order?size=1&courier=JT&cod=NON_COD'
```

## Contoh response

```json
{
    "success": true,
    "data": [
        {
            "assignee": null,
            "receiverScore": {
                "delivered": 1,
                "rts": 0,
                "undelivered": 0,
                "rate": 10
            },
            "isBreach": false,
            "COD_AMOUNT": 0,
            "status": "ON DELIVERY",
            "isDeleted": false,
            "isArchived": false,
            "isPaid": true,
            "ticketStatus": "none",
            "printedDates": [],
            "isDangerousGoods": false,
            "_id": "6af68834ce96b86fe95821e9",
            "destinationMark": "",
            "ORDER_ID": "261113IBBQ4K",
            "SHIPPER_NAME": "Gudang Utama",
            "SHIPPER_CONTACT": "Budi",
            "SHIPPER_PHONE": "081234567890",
            "RECEIVER_NAME": "Siti",
            "RECEIVER_ADDR1": "Jalan Melati No. 5",
            "RECEIVER_ADDR2": "",
            "RECEIVER_CITY": "JAKARTA SELATAN",
            "RECEIVER_REGION": "DKI JAKARTA",
            "RECEIVER_PHONE": "081234567890",
            "RECEIVER_SUBDISTRICT": "CIPETE UTARA",
            "RECEIVER_DISTRICT": "KEBAYORAN BARU",
            "ORIGIN_CODE": "BDO",
            "DESTINATION_CODE": "JKT",
            "WEIGHT": 1,
            "GOODS_DESC": "Kaos polos",
            "GOODS_AMOUNT": 100000,
            "cnote_no": "JJ6000001911",
            "user_id": "6af1a2b3c4d5e6f708192a3b",
            "batch": "26111310KDX9LE",
            "price": 11000,
            "estimatedPrice": 11000,
            "courier": "JT",
            "SERVICE_CODE": "REG",
            "lastStatusChange": "2026-11-13T09:15:00.000Z",
            "receiver_id": "6af3c4d5e6f708192a3b4c5d",
            "createdAt": "2026-11-13T03:47:00.448Z"
        }
    ],
    "nextCursor": "MjAyNi0xMS0xM1QwMzo0NzowMC40NDhafDZhZjY4ODM0Y2U5NmI4NmZlOTU4MjFlOQ"
}
```

## Cari satu order

Kirim `tracking_id` (nomor resi) atau `order_id` (nomor order) untuk mendapat satu order. Hanya pencarian ini yang mengembalikan `history`, riwayat tracking dari kurir, dan pencarian ini juga mencari di arsip, jadi order lama ikut ditemukan. Order yang sudah terkirim juga bisa membawa bukti pengiriman: `JNE` menambahkan tautannya di `history[].proofUrl`, seperti di contoh pertama.

### Contoh request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order?tracking_id=0419332600020061'
```

### Contoh response

```json
{
    "success": true,
    "data": [
        {
            "assignee": null,
            "receiverScore": {
                "delivered": 2,
                "rts": 0,
                "undelivered": 0,
                "rate": 10
            },
            "isBreach": false,
            "COD_AMOUNT": 0,
            "status": "DELIVERED",
            "isDeleted": false,
            "isArchived": false,
            "isPaid": true,
            "ticketStatus": "none",
            "printedDates": [
                "2026-11-10T04:05:14.407Z"
            ],
            "isDangerousGoods": false,
            "_id": "6af2b7d4ce96b86fe95800a1",
            "destinationMark": "",
            "ORDER_ID": "261110KQ7M2D",
            "SHIPPER_NAME": "Gudang Utama",
            "SHIPPER_CONTACT": "Budi",
            "SHIPPER_PHONE": "081234567890",
            "RECEIVER_NAME": "Siti",
            "RECEIVER_ADDR1": "Jalan Melati No. 5",
            "RECEIVER_ADDR2": "",
            "RECEIVER_CITY": "JAKARTA SELATAN",
            "RECEIVER_REGION": "DKI JAKARTA",
            "RECEIVER_PHONE": "081234567890",
            "RECEIVER_SUBDISTRICT": "CIPETE UTARA",
            "RECEIVER_DISTRICT": "KEBAYORAN BARU",
            "ORIGIN_CODE": "BDO10000",
            "DESTINATION_CODE": "CGK20123",
            "WEIGHT": 1,
            "GOODS_DESC": "Kaos polos",
            "GOODS_AMOUNT": 100000,
            "cnote_no": "0419332600020061",
            "user_id": "6af1a2b3c4d5e6f708192a3b",
            "batch": "2611101960C365",
            "price": 20000,
            "estimatedPrice": 20000,
            "courier": "JNE",
            "lastStatusChange": "2026-11-11T10:27:00.000Z",
            "receiver_id": "6af3c4d5e6f708192a3b4c5d",
            "createdAt": "2026-11-10T03:47:00.448Z",
            "history": [
                {
                    "date": "10-11-2026 13:18",
                    "desc": "SHIPMENT RECEIVED AT [BANDUNG] [BDO, OUTBOUND CCC]",
                    "code": "RC1",
                    "location": "BANDUNG"
                },
                {
                    "date": "10-11-2026 14:08",
                    "desc": "PROCESSED AT SORTING CENTER [BDO, HUB OUTBOUND] [BDO, HUB OUTBOUND]",
                    "code": "OP2",
                    "location": "BDO, HUB OUTBOUND"
                },
                {
                    "date": "11-11-2026 08:21",
                    "desc": "SHIPMENT PICKED UP BY JNE COURIER [BANDUNG] []",
                    "code": "PU0"
                },
                {
                    "date": "11-11-2026 08:21",
                    "desc": "SHIPMENT RECEIVED AT [BANDUNG]",
                    "code": "RC1"
                },
                {
                    "date": "11-11-2026 08:21",
                    "desc": "RECEIVED AT SORTING CENTER [BANDUNG]",
                    "code": "OP1"
                },
                {
                    "date": "11-11-2026 08:26",
                    "desc": "RECEIVED AT WAREHOUSE [JAKARTA, CASH SALES (JAKARTA SELATAN)] [JAKARTA, CASH SALES (JAKARTA SELATAN)]",
                    "code": "IP1",
                    "location": "JAKARTA, CASH SALES (JAKARTA SELATAN)"
                },
                {
                    "date": "11-11-2026 09:35",
                    "desc": "WITH DELIVERY COURIER [KEBAYORAN BARU,JAKARTA SELATAN] [JAKARTA, CASH SALES (JAKARTA SELATAN)]",
                    "code": "IP3",
                    "location": "KEBAYORAN BARU,JAKARTA SELATAN"
                },
                {
                    "date": "11-11-2026 10:27",
                    "desc": "DELIVERED TO [SITI | 11-11-2026 10:27 | JAKARTA SELATAN ]",
                    "code": "D01",
                    "location": "JAKARTA SELATAN",
                    "proofUrl": "https://example.com/proof/7c1f2a9e.jpg"
                }
            ]
        }
    ],
    "nextCursor": ""
}
```

Bukti pengiriman disimpan di `proofHistory`, oleh sebagian besar kurir dan bukan hanya `spx`. Bukti ini hanya dikembalikan saat order dicari dengan `order_id`, seperti di contoh kedua ini: pencarian `tracking_id` dan daftar mengembalikan `proofHistory` kosong. Tidak semua order terkirim punya bukti, jadi anggap `proofHistory` kosong dari pencarian `order_id` berarti belum ada bukti.

### Contoh request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order?order_id=261110HX4B6V'
```

### Contoh response

```json
{
    "success": true,
    "data": [
        {
            "assignee": null,
            "receiverScore": {
                "delivered": 2,
                "rts": 0,
                "undelivered": 0,
                "rate": 10
            },
            "isBreach": false,
            "COD_AMOUNT": 0,
            "status": "DELIVERED",
            "isDeleted": false,
            "isArchived": false,
            "isPaid": true,
            "ticketStatus": "none",
            "printedDates": [
                "2026-11-10T04:05:14.407Z"
            ],
            "isDangerousGoods": false,
            "_id": "6af2b7d4ce96b86fe95800b2",
            "destinationMark": "",
            "ORDER_ID": "261110HX4B6V",
            "SHIPPER_NAME": "Gudang Utama",
            "SHIPPER_CONTACT": "Budi",
            "SHIPPER_PHONE": "081234567890",
            "RECEIVER_NAME": "Siti",
            "RECEIVER_ADDR1": "Jalan Melati No. 5",
            "RECEIVER_ADDR2": "",
            "RECEIVER_CITY": "JAKARTA SELATAN",
            "RECEIVER_REGION": "DKI JAKARTA",
            "RECEIVER_PHONE": "081234567890",
            "RECEIVER_SUBDISTRICT": "CIPETE UTARA",
            "RECEIVER_DISTRICT": "KEBAYORAN BARU",
            "ORIGIN_CODE": "BDO10000",
            "DESTINATION_CODE": "CGK20123",
            "WEIGHT": 1,
            "GOODS_DESC": "Kaos polos",
            "GOODS_AMOUNT": 100000,
            "cnote_no": "SPXID06338721090A",
            "user_id": "6af1a2b3c4d5e6f708192a3b",
            "batch": "2611101960D471",
            "price": 12500,
            "estimatedPrice": 12500,
            "courier": "spx",
            "lastStatusChange": "2026-11-11T09:40:00.000Z",
            "receiver_id": "6af3c4d5e6f708192a3b4c5d",
            "createdAt": "2026-11-10T03:52:00.448Z",
            "history": [
                {
                    "date": "10-11-2026 14:06",
                    "desc": "Pengirim telah mengatur pengiriman. Menunggu pesanan diserahkan ke pihak jasa kirim.",
                    "code": "PENDING PICKUP"
                },
                {
                    "date": "10-11-2026 16:20",
                    "desc": "Pesanan tiba di lokasi transit  Bandung 2 First Mile Hub.",
                    "code": "PICKED UP"
                },
                {
                    "date": "10-11-2026 19:09",
                    "desc": "Pesanan dikirim dari lokasi transit  Bandung 2 First Mile Hub.",
                    "code": "ON TRANSIT"
                },
                {
                    "date": "10-11-2026 22:34",
                    "desc": "Pesanan diproses di lokasi sortir  Bandung DC.",
                    "code": "ON TRANSIT"
                },
                {
                    "date": "11-11-2026 02:21",
                    "desc": "Pesanan dikirim dari lokasi sortir  Bandung DC  Jakarta Hub  ",
                    "code": "ON TRANSIT"
                },
                {
                    "date": "11-11-2026 05:08",
                    "desc": "Pesanan diproses di lokasi transit  Jakarta Hub.",
                    "code": "ON TRANSIT"
                },
                {
                    "date": "11-11-2026 06:39",
                    "desc": "Pesanan dalam proses pengantaran.",
                    "code": "ON DELIVERY"
                },
                {
                    "date": "11-11-2026 09:40",
                    "desc": "Pesanan tiba di alamat tujuan. diterima oleh Yang bersangkutan.",
                    "code": "DELIVERED"
                }
            ],
            "proofHistory": [
                {
                    "status": "DELIVERED",
                    "date": "2026-11-11T02:40:45.566Z",
                    "photo": "https://example.com/proof/3b9d41c7.jpg"
                }
            ]
        }
    ],
    "nextCursor": ""
}
```

### Field history dan bukti

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| history[].date | String | Waktu status dalam format `DD-MM-YYYY HH:mm` (zona waktu Asia/Jakarta). |
| history[].desc | String | Deskripsi status yang mudah dibaca. |
| history[].code | String | Kode status dari kurir, misalnya `D01` untuk terkirim. |
| history[].location | String | Lokasi terjadinya status. Tidak ada di setiap entri. |
| history[].proofUrl | String | Hanya pada entri terkirim milik `JNE`: tautan foto bukti pengiriman. |
| proofHistory[].status | String | Status yang dimiliki bukti, misalnya `DELIVERED`. |
| proofHistory[].date | String | Kapan bukti dicatat, dalam ISO 8601 UTC. |
| proofHistory[].photo | String | Tautan foto bukti. |
| proofHistory[].video | String | Tautan video bukti, kalau kurir memberikannya. |

> [!WARNING]
> **Catatan:** Tracking history berasal dari kurir pihak ketiga, jadi isinya berbeda per kurir. `date` dan `desc` adalah field umum di `history`. `code` dan `location` adalah yang dikembalikan `JNE`, dan kurir lain bisa mengembalikan field lain. Teks `desc` diberikan oleh masing-masing kurir, jadi kata-katanya bisa berbeda.

## Parameter query

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| page | Number | Nomor halaman. Bawaan `1`, maksimum `100`. Diabaikan kalau `cursor` dikirim. Lihat Pagination. |
| size | Number | Jumlah order per halaman. Bawaan `50`, maksimum `100`; nilai yang lebih besar ditolak dengan 400. Nilai kosong atau bukan angka memakai bawaan. |
| cursor | String | `nextCursor` dari response sebelumnya. Mengembalikan order yang mengikuti halaman itu. Pakai sebagai pengganti `page` untuk membaca daftar yang panjang; `page` diabaikan kalau `cursor` dikirim. Nilai yang tidak valid ditolak dengan 400. |
| courier | String | Hanya order kurir ini: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, atau `spx`. `Ninja` dihentikan per 1 September 2026, tetapi order lamanya tetap bisa dibaca: order itu ada di daftar dan bisa difilter dengan `courier=Ninja`. Kirim nilai yang persis sama: nilai lain tidak ditolak dan bisa mengembalikan daftar yang salah. Tanpa `courier`, daftar mencakup semua kurir yang kamu pakai, termasuk `Ninja`. |
| cod | String | `COD` hanya untuk order COD, `NON_COD` untuk yang lain. Nilai lain diabaikan. |
| status | String | Hanya order dengan status ini. Object JSON seperti `{"DELIVERED_PENDING":true,"RTS":true}`, atau daftar dengan koma seperti `DELIVERED_PENDING,RTS`. Key-nya adalah kode status di [Order Status Reference Sheet](https://docs.google.com/spreadsheets/d/1Z9MV8PEsqBCp7nNUyPdhypYSneVnzDR8pw3JDf6nQSw/edit?usp=sharing). |
| dateRange | String | Hanya order yang dibuat dalam rentang ini. String JSON, `{"startDate":"2026-11-12T00:00:00.000Z","endDate":"2026-11-13T23:59:59.999Z"}`, di-encode URL. Lihat Rentang tanggal di bawah. |
| batch | String | Hanya order batch ini. Kirim nomor batch, misalnya `26111310KDX9LE`: field `batch` pada order, bukan `_id` batch. |
| tracking_id | String | Nomor resi (`cnote_no`). Mengembalikan order itu beserta `history`-nya. |
| order_id | String | Nomor order (`ORDER_ID`). Mengembalikan order itu beserta `history`-nya. |
| keyword | String | Mencari nomor order, nomor resi, dan nama penerima. Huruf besar dan kecil tidak dibedakan. Dibaca sebagai regular expression, jadi karakter seperti `[`, `(`, dan `+` punya arti khusus: escape karakter itu, atau nama yang mengandung karakter tersebut bisa tidak menemukan dirinya sendiri. |

### Rentang tanggal

`dateRange` memfilter berdasarkan `createdAt`. Dibaca dalam waktu Jakarta (WIB) per hari penuh: `endDate` selalu sampai akhir harinya. Batasnya tidak persis: `startDate` `2026-11-13T00:00:00.000Z` hanya cocok dengan order yang dibuat sejak pukul 07:00 UTC tanggal 13 November. Mulai satu hari lebih awal dari yang kamu butuhkan, dan filter `createdAt` sendiri kalau butuh yang persis. Hanya bentuk `dateRange` yang didukung; `dateRange.startDate` dan `dateRange.endDate` dengan datetime lengkap diabaikan. Nilai yang bukan JSON valid ditolak dengan 400. Di curl, biarkan `--data-urlencode` yang meng-encode-nya:

```bash
curl -G '{BASE_URL}/api/public/{API_KEY}/order' \
--data-urlencode 'size=50' \
--data-urlencode 'dateRange={"startDate":"2026-11-12T00:00:00.000Z","endDate":"2026-11-13T23:59:59.999Z"}'
```

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| success | Boolean | `true` kalau request diproses. |
| data | Array | Order di halaman ini, dari yang terbaru. Array kosong kalau tidak ada yang cocok. |
| nextCursor | String | Cursor halaman berikutnya, atau string kosong di halaman terakhir. Lihat Pagination. |
| _id | String | `_id` order. |
| ORDER_ID | String | Nomor order. |
| cnote_no | String | Nomor resi (AWB). Kosong selama order belum dibayar atau kalau gagal. |
| courier | String | Kurir order. |
| SERVICE_CODE | String | Layanan kurir order, misalnya `REG` untuk J&T Regular atau `ECO` untuk order J&T ECO (`courier` tetap `JT` untuk keduanya). Tidak ada kalau order tidak punya service code. |
| batch | String | Nomor batch order. Pakai sebagai `batch` untuk memfilter. |
| status | String | Status order: teks status dari kurir, seperti `ON DELIVERY`, `DELIVERED`, atau `RTS`; `active` sebelum kurir punya update; `error` kalau kurir menolak order. Lihat Order Status Reference Sheet. |
| lastStatusChange | String | Kapan status terakhir berubah, dalam ISO 8601. |
| isPaid | Boolean | `false` selama order belum dibayar, lihat [Pay unpaid](#pay-unpaid). |
| isDeleted | Boolean | Selalu `false` di sini: order yang dihapus tidak ditampilkan. |
| isArchived | Boolean | `true` untuk order yang sudah dipindah ke arsip. |
| price | Number | Ongkos kirim sebelum diskon, dalam rupiah. |
| estimatedPrice | Number | `price` ditambah biaya COD. |
| COD_AMOUNT | Number | Nominal COD. `0` untuk order non-COD. |
| GOODS_AMOUNT | Number | Nilai barang dalam rupiah. Untuk order COD, nilainya sama dengan nominal COD. |
| GOODS_DESC | String | `parcelContent` yang kamu kirim. |
| WEIGHT | Number | Berat order dalam kg. |
| isDangerousGoods | Boolean | `true` untuk order dangerous goods. |
| assignee | String | `_id` anggota tim yang ditugaskan ke order, atau `null`. |
| destinationMark | String | Patokan lokasi tujuan yang kamu kirim. |
| SHIPPER_NAME | String | Nama alamat pickup. |
| SHIPPER_CONTACT | String | Kontak person alamat pickup. |
| SHIPPER_PHONE | String | Nomor telepon alamat pickup. |
| RECEIVER_* | String | Penerima sebagaimana tersimpan di order: `RECEIVER_NAME`, `RECEIVER_PHONE`, `RECEIVER_ADDR1`, `RECEIVER_ADDR2`, `RECEIVER_SUBDISTRICT`, `RECEIVER_DISTRICT`, `RECEIVER_CITY`, dan `RECEIVER_REGION`. |
| ORIGIN_CODE | String | Kode asal dari kurir. |
| DESTINATION_CODE | String | Kode tujuan dari kurir. Tidak semua kurir punya. |
| createdAt | String | Kapan order dibuat, dalam ISO 8601 UTC. |
| user_id | String | `_id` akunmu. |
| receiver_id | String | `_id` penerima, sama untuk nomor telepon yang sama. |
| receiverScore | Object | Rekam jejak penerima ini pada order sebelumnya: jumlah `delivered`, `rts`, dan `undelivered`, serta skor di `rate`. Lihat [Get receiver score by number](#get-receiver-score-number). |
| ticketStatus | String | Status tiket kurir untuk order. `none` kalau tidak ada tiket. |
| printedDates | Array | Kapan label dicetak. |
| isBreach | Boolean | `true` kalau order ditandai terlambat. |
| history | Array | Hanya saat order dicari dengan `tracking_id` atau `order_id`: riwayat tracking. Lihat Cari satu order. |
| proofHistory | Array | Foto dan video bukti yang disimpan untuk order, seperti bukti pengiriman. Tiap item punya `photo` dan `video` (tautan), `status`, dan `date`. Hanya terisi saat order dicari dengan `order_id`; kosong di daftar dan lewat `tracking_id`. Lihat Cari satu order. |
| dropShipperId | String | Hanya pada order dropship: ID dropshipper. |
| dropShipper | Object | Hanya pada order dropship: `id`, `name`, dan `phone` dropshipper. |

Response juga membawa beberapa field internal (`ticket`, `ticketRTS`, `ticketDamaged`, `count`, `total`, `lastUpdateHours`, dan `currentHour`) dan tiap order beberapa field lain, seperti `productOrders` dan `customProductOrderIds`. Kamu tidak perlu memakainya.

## Pagination

Satu halaman berisi maksimal **100** data (`size`, bawaan 50), dan `page` maksimal **100**. Di atas batas itu, atau untuk daftar yang lebih panjang dari beberapa halaman, baca pakai `cursor`: kirim nilai `nextCursor` dari response sebelumnya, lalu ulangi sampai nilainya kosong. Halaman dengan cursor selalu akurat di kedalaman berapa pun, dan biayanya sama saja, baik halaman ke-2 maupun ke-500.

```bash
# First page
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order?size=100'
# Next page: pass nextCursor from the previous response
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order?size=100&cursor=MjAyMi0wOS0xNVQw...'
```

Response berisi `nextCursor`: string opaque untuk halaman berikutnya, atau string kosong kalau halaman yang dikembalikan adalah yang terakhir.

Tanpa `dateRange`, daftar mencakup order yang belum diarsipkan (kira-kira 6 bulan terakhir), dari semua kurir yang punya order di akunmu. Untuk membaca order yang lebih lama, kirim `dateRange` yang mencakupnya. Pencarian satu order lewat `order_id` atau `tracking_id` selalu ikut mencari di arsip.

Tanpa `courier`, halaman digabung dari semua kurir yang dipakai akunmu, jadi `page` × `size` tidak boleh lebih dari **1.500** (halaman 15 dengan size 100, halaman 30 dengan size 50). Untuk mengambil data yang lebih lama, sebutkan `courier` atau pakai `cursor`. Batas yang sama berlaku untuk satu kurir kalau `dateRange` dimulai lebih dari enam bulan lalu (atau pencarian tidak mengirim `dateRange`), karena halaman seperti itu digabung dari order terbaru dan order yang sudah diarsipkan.

Request yang melewati batas ditolak sebelum data apa pun dibaca:

```json
{ "success": false, "message": "size must not exceed 100; use cursor to fetch the next page" }
{ "success": false, "message": "page must not exceed 100; use cursor (or dateRange) to go further back" }
{ "success": false, "message": "page x size must not exceed 1500 without courier; send courier or use cursor to go further back" }
{ "success": false, "message": "page x size must not exceed 1500 when the date range reaches the archive; use cursor to go further back" }
{ "success": false, "message": "Invalid cursor; send the nextCursor value from the previous response" }
```

## Status order

Status order adalah response dari kurir. Supaya sederhana, kamu cukup tahu **DELIVERED**, **RTS**, dan selain itu berarti **ON GOING**. Daftar lengkap kode status kurir dan artinya ada di [Order Status Reference Sheet](https://docs.google.com/spreadsheets/d/1Z9MV8PEsqBCp7nNUyPdhypYSneVnzDR8pw3JDf6nQSw/edit?usp=sharing).

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| API key tidak valid atau nonaktif, tidak punya hak akses `Check order status`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
| `size`, `page`, atau `page` × `size` melewati batas, atau `cursor` tidak valid | 400 | Salah satu pesan yang tercantum di Pagination. |
| `dateRange` bukan JSON yang valid | 400 | `{ "success": false, "message": "Error on getOrders", "error": {} }` |
| `order_id` bukan satu nilai, misalnya `order_id=A&order_id=B` yang diulang, `order_id[]=`, atau `order_id[key]=x` | 400 | `{ "success": false, "message": "Invalid order_id" }` |
| Tidak ada yang cocok | 200 | `{ "success": true, "data": [], "nextCursor": "" }` (beserta field internal) |
