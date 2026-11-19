# Get Receiver Score Number

`GET {BASE_URL}/api/public/{API_KEY}/getReceiverScoreByNumberUser`

Mengembalikan rekam jejak pengiriman seorang penerima, dicari lewat nomor telepon, per kurir, dengan satu `summary` untuk semua kurir. Rekam jejak itu mencakup order semua seller di Mengantar, bukan hanya milikmu, jadi kamu bisa mengecek bagaimana penerima itu sebelumnya sebelum mengirim, misalnya sebelum menawarkan COD.

Permission required: Tidak ada, cukup API key aktif yang dipanggil dari IP yang diizinkan
Environment: Sandbox dan production

> [!SANDBOX]
> Di sandbox, endpoint ini terbuka untuk semua API key dan mengembalikan **data contoh**, bukan riwayat penerima yang sebenarnya. Nomor yang sama selalu mengembalikan contoh yang sama, dengan bentuk response yang sama seperti production, termasuk `data.summary`. Nomor yang berakhiran `0` mengembalikan response "no valid courier" (contoh kedua).
>
> Akses terbatas dan batas harian di bawah ini tidak berlaku di sandbox, tetapi **berlaku di production**: akunmu harus masuk whitelist (kalau tidak, `403 Not allowed`), dan request di atas jatah hariannya mendapat `429` sampai tengah malam (WIB). Satu nomor telepon per request berlaku di kedua environment: parameter `search` yang tidak ada atau diulang mendapat `422`.

> [!IMPORTANT]
> **Akses terbatas.** Endpoint ini hanya untuk akun yang masuk whitelist. Request dari API key yang akunnya tidak ada di whitelist mendapat `403 Not allowed`. Akses diberikan lewat permintaan: hubungi Customer Service (CS) Mengantar untuk meminta akses.

> [!NOTE]
> **Batas harian.** Jumlah pengecekan yang diizinkan per hari berdasarkan volume order aktifmu di Mengantar, dihitung dari akunmu beserta sub-akunnya. Setelah jatah hari itu habis, request berikutnya mendapat `429` dengan pesan yang menjelaskannya, dan jatah terisi penuh lagi setelah tengah malam (WIB). Untuk meminta batas harian yang lebih tinggi, hubungi Customer Service (CS) Mengantar.
>
> Satu nomor telepon per request. Request yang membawa daftar nomor, misalnya parameter `search` yang diulang, mendapat `422`.

## Contoh request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/getReceiverScoreByNumberUser?search=8123456789'
```

## Contoh response

```json
{
    "success": true,
    "data": {
        "_id": "6af3c4d5e6f708192a3b4c5e",
        "phone": "8123456789",
        "JNE": {
            "total": 12,
            "value": 1850000,
            "inProgress": 1,
            "delivered": 11,
            "rts": 1,
            "undelivered": 0,
            "rate": 9.2
        },
        "SiCepat": {
            "total": 4,
            "value": 520000,
            "inProgress": 0,
            "delivered": 3,
            "rts": 1,
            "undelivered": 0,
            "rate": 7.5
        },
        "Sap": {
            "total": 3,
            "value": 310000,
            "inProgress": 1,
            "delivered": 2,
            "rts": 0,
            "undelivered": 1,
            "rate": 6.7
        },
        "iDexpress": {
            "total": 2,
            "value": 180000,
            "inProgress": 0,
            "delivered": 2,
            "rts": 0,
            "undelivered": 0,
            "rate": 10.0
        },
        "JT": {
            "total": 3,
            "value": 450000,
            "inProgress": 0,
            "delivered": 2,
            "rts": 1,
            "undelivered": 0,
            "rate": 6.7
        },
        "lion": {
            "total": 5,
            "value": 760000,
            "inProgress": 2,
            "delivered": 4,
            "rts": 1,
            "undelivered": 0,
            "rate": 8.0
        },
        "anteraja": {
            "total": 2,
            "value": 150000,
            "inProgress": 0,
            "delivered": 1,
            "rts": 1,
            "undelivered": 0,
            "rate": 5.0
        },
        "pos": {
            "total": 1,
            "value": 95000,
            "inProgress": 0,
            "delivered": 1,
            "rts": 0,
            "undelivered": 0,
            "rate": 10.0
        },
        "spx": {
            "total": 6,
            "value": 920000,
            "inProgress": 1,
            "delivered": 5,
            "rts": 0,
            "undelivered": 1,
            "rate": 8.3
        },
        "createdAt": "2025-01-15T03:00:00.000Z",
        "updatedAt": "2026-11-10T03:00:00.000Z",
        "summary": {
            "average_number": 7.9,
            "average_score": "B"
        }
    }
}
```

## Penerima tanpa data kurir

Nomor yang tidak punya transaksi di kurir mana pun tetap dijawab 200 `success: true`, tidak pernah 404. Kurirnya berupa object kosong, dan `summary` bernilai `null` dan `"-"`.

### Contoh request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/getReceiverScoreByNumberUser?search=8123456780'
```

### Contoh response

```json
{
    "success": true,
    "data": {
        // Which courier keys appear can differ: a number already in the rollup only
        // returns the couriers that have data, none here. `summary` is the stable part.
        "JNE": {},
        "SiCepat": {},
        "Sap": {},
        "iDexpress": {},
        "JT": {},
        "lion": {},
        "anteraja": {},
        "pos": {},
        "spx": {},
        "summary": {
            "average_number": null,
            "average_score": "-"
        }
    }
}
```

## Parameter query

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| search | String | Wajib. Nomor telepon penerima, satu per request. `08123456789`, `8123456789`, `628123456789`, dan `+628123456789` menemukan rekam yang sama. Formatnya tidak divalidasi: nilai yang bukan nomor telepon dicari seperti nomor lain dan menemukan rekam atau bentuk kosong. `search` yang kosong atau tidak ada ditolak dengan 422, begitu juga daftar nomor, seperti `search` yang diulang, dengan 422. |

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| success | Boolean | `true` kalau request diproses. |
| data | Object | Rekam jejak penerima. |
| _id | String | `_id` rekam. Tidak dikembalikan kalau nomor tidak punya rekam. |
| phone | String | Nomor telepon sebagaimana tersimpan: tanpa awalan `0`, `62`, atau `+62`. |
| JNE | Object | Rekam di satu kurir, dengan field di bawah. Key-nya adalah kurir: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, atau `spx`. Hanya kurir yang punya data yang dijamin ada; object kosong `{}` berarti tidak ada data. |
| total | Number | Per kurir: `delivered` + `rts` + `undelivered`. Hanya order COD yang dihitung. |
| delivered | Number | Per kurir: order COD yang terkirim. |
| rts | Number | Per kurir: order COD yang dikembalikan ke pengirim. |
| undelivered | Number | Per kurir: order COD yang gagal diantar atau terlambat. |
| inProgress | Number | Per kurir: order COD yang masih dalam perjalanan. |
| value | Number | Per kurir: total nilai order dalam rupiah, COD maupun non-COD. Nilainya nominal COD, atau nilai barang kalau tidak ada COD. |
| rate | Number | Per kurir: tingkat terkirim dengan skala 0 sampai 10, `10 × delivered ÷ total`. |
| createdAt | String | Kapan rekam dibuat, dalam ISO 8601 UTC. |
| updatedAt | String | Kapan rekam terakhir diperbarui, dalam ISO 8601 UTC. |
| summary | Object | Skor gabungan semua kurir, lihat Summary di bawah. Selalu dikembalikan. |

### Summary

`data.summary` adalah receiver score yang digabung dari semua kurir, jadi kamu tidak perlu menghitungnya sendiri. Hanya kurir dengan lebih dari 0 transaksi yang dihitung, dan setiap kurir yang dihitung punya bobot sama, berapa pun jumlah transaksinya.

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| average_number | Number / null | Rata-rata `rate` dari setiap kurir yang dihitung, dibulatkan ke satu desimal. Ini skor dengan **skala 0-10**, skala yang sama dengan `rate` per kurir, bukan jumlah transaksi dan bukan persentase. Misalnya `8.4` berarti rata-rata rate 8,4 dari 10. `null` kalau tidak ada kurir yang punya data. |
| average_score | String | Nilai huruf untuk `average_number`: `A` mulai dari 9, `A-` mulai dari 8, `B` mulai dari 7, `B-` mulai dari 6, `C` mulai dari 5, `C-` mulai dari 4, `D` mulai dari 3, `D-` mulai dari 2, `E` mulai dari 1, `E-` di bawah 1. Diawali `≈` kalau kurir yang dihitung punya total kurang dari 4 transaksi. Nilainya tetap dikembalikan, tapi hanya perkiraan dari riwayat yang masih terlalu sedikit untuk stabil. Jadi nilainya bisa muncul sebagai `"≈A"`, `"≈D-"`, atau `"≈E-"`, dan parser-mu harus menerima awalan itu di semua nilai di atas. Perhatikan bahwa ambang batasnya menghitung *transaksi*, bukan kurir: satu kurir dengan 3 transaksi tetap mendapat awalan. Nilainya `"-"` kalau tidak ada kurir yang punya data. |

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| API key tidak valid atau nonaktif, atau IP tidak diizinkan. Di production juga akun yang tidak masuk whitelist | 403 | `{ "success": false, "message": "Not allowed" }` |
| `search` kosong atau tidak ada | 422 | `{ "success": false, "message": "Missing 'search' in the query param." }` |
| `search` berupa daftar nomor | 422 | `{ "success": false, "message": "'search' must be a single phone number." }` |
| Hanya production: batas harian sudah habis | 429 | Pesan yang menyebutkannya. Jatah penuh lagi setelah tengah malam (WIB). |
