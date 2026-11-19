# Get Courier Performance

`POST {BASE_URL}/api/public/{API_KEY}/order/getPerformancePublic`

Memberi skor semua kurir untuk kota tujuan berdasarkan performa pengirimannya, dan memberi tahu kurir mana yang paling bagus dipilih. Ini skor yang tampil di samping harga pada halaman publik [Cek Ongkos Kirim Mengantar](https://www.mengantar.com/cek-ongkos-kirim/). Kirimkan estimasi yang kamu dapat dari [Check Shipping Fee](#check-shipping-fee) atau [Check Shipping Fee Public](#check-shipping-fee-public), supaya hanya kurir yang bisa melayani rute itu yang terpilih.

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Check shipping fee`. Tanpa itu, request ditolak dengan 403 `Not allowed`.

Permission required: Check shipping fee
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order/getPerformancePublic' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-d '{"city": "BANDUNG", "allEstimateData": {"JNE": {"price": 11000, "unsupported": false, "unsupported_cod": false}, "SiCepat": {"price": 62900, "unsupported": false, "unsupported_cod": false, "isDangerousGoodsSupported": true}, "JT": {"price": 64700, "unsupported": false, "unsupported_cod": false}}}'
```

## Contoh response

```json
{
    "success": true,
    "data": {
        "couriers": [
            {
                "key": "JNE",
                "score": 96
            },
            {
                "key": "SiCepat",
                "score": 100
            },
            {
                "key": "Sap",
                "score": 91
            },
            {
                "key": "iDexpress",
                "score": 96
            },
            {
                "key": "JT",
                "score": 97
            },
            {
                "key": "lion",
                "score": 102
            },
            {
                "key": "anteraja",
                "score": 0
            },
            {
                "key": "pos",
                "score": 0
            },
            {
                "key": "spx",
                "score": 0
            }
        ],
        "bestCourier": "SiCepat",
        "recommendedDGCourier": "SiCepat",
        "recommended": "JNE"
    }
}
```

## Body parameter

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| city | String | Wajib. Kota tujuan, sebagai `CITY_NAME` data alamat dari [Search address data](#search-address-data). Huruf besar dan kecil dibedakan dan harus sama persis, misalnya `BANDUNG`. |
| allEstimateData | Object | Wajib. Objek `data` dari response Check Shipping Fee dengan `courier=all`, atau dari Check Shipping Fee Public. Kirim utuh, sebagai `allEstimateData`. |

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| couriers | Array | Satu entri per kurir: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, dan `spx`. |
| key | String | Nama kurir. |
| score | Number | Performa pengiriman kurir di kota tujuan. Makin tinggi makin bagus, dan `0` berarti tidak ada skor. |
| bestCourier | String | Kurir dengan skor tertinggi yang bisa melayani rute. `JNE` kalau tidak ada kurir yang memenuhi. |
| recommendedDGCourier | String | Kurir terbaik untuk dangerous goods: skor tertinggi di antara kurir yang `isDangerousGoodsSupported`-nya `true` di estimasimu. `iDexpress` kalau tidak ada yang memenuhi. |
| recommended | String | Saat ini selalu `JNE`. Pakai `bestCourier` untuk memilih kurir. |

## Cara skor dihitung

- Skor berasal dari tingkat pengiriman sukses tiap kurir di kota itu. Lalu digeser supaya kurir terbaik yang memenuhi syarat mendapat `100`.
- Kurir yang tidak ada di `allEstimateData`, atau `unsupported`, atau `unsupported_cod`-nya `true`, tidak bisa jadi `bestCourier`. Skornya tetap bisa di atas `100`, seperti `lion` pada contoh.
- `anteraja`, `pos`, dan `spx` selalu bernilai skor `0`, jadi tidak pernah jadi kurir terbaik.
- `city` yang tidak cocok dengan kota mana pun, atau tidak dikirim, memberi skor `0` ke semua kurir dan `bestCourier` bernilai `JNE`. Cek ejaan dan huruf besar kecilnya dulu.
- `Ninja` sudah dihentikan dan tidak diberi skor, walau ada di `allEstimateData`.
- Skor di sandbox berasal dari data non-production, jadi bisa berbeda dengan production.

> [!IMPORTANT]
> **Akses terbatas.** Endpoint ini hanya untuk akun yang masuk whitelist. Request dari API key yang akunnya tidak ada di whitelist mendapat `403 Not allowed`. Akses diberikan lewat permintaan: hubungi Customer Service (CS) Mengantar untuk meminta akses.
>
> **Sandbox:** whitelist tidak berlaku di sandbox, jadi API key sandbox mana pun bisa memanggil endpoint ini selama kamu membangun integrasi. Whitelist tetap berlaku setelah kamu pindah ke production.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| `allEstimateData` tidak ada | 400 | `{ "success": false, "message": "allEstimateData is required" }` |
| API key tidak valid atau nonaktif, tidak punya hak akses `Check shipping fee`, IP tidak diizinkan, atau akun tidak ada di whitelist di production | 403 | `{ "success": false, "message": "Not allowed" }` |
| Method bukan `POST` | 405 | `{ "success": false, "message": "GET not allowed on this route" }` |
| Body bukan JSON yang valid | 500 | `{ "success": false, "name": "InternalError", "message": "Something went wrong, please try again later." }` |
