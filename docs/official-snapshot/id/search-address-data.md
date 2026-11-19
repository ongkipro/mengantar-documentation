# Search address data

`GET {BASE_URL}/api/public/{API_KEY}/address/search`

Mencari alamat berdasarkan provinsi, kota, kecamatan, kelurahan, atau kode pos. Pakai `_id` dari hasilnya sebagai `origin_id` dan `destination_id` di [Check Shipping Fee](#check-shipping-fee), dan sebagai `customerAddressDataId` di [Create order](#create-order).

`{API_KEY}` wajib berisi API key yang valid dan aktif dengan hak akses `Create order`. Tanpa itu, request ditolak dengan 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox dan production

## Contoh request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/address/search?keyword=margasuka'
```

## Contoh response

```json
{
    "success": true,
    "data": [
        {
            "_id": "5fc62de8f8f44b34aa4bdc49",
            "COUNTRY_NAME": "Indonesia",
            "PROVINCE_NAME": "JAWA BARAT",
            "CITY_NAME": "BANDUNG",
            "DISTRICT_NAME": "BABAKAN CIPARAY",
            "SUBDISTRICT_NAME": "MARGASUKA",
            "ZIP_CODE": "40225",
            "DESTINATION_CODE": "BDO10044",
            "createdAt": "2020-12-01T11:50:00.881Z",
            "updatedAt": "2026-10-26T06:52:43.930Z",
            "__v": 0,
            "ORIGIN_CODE": "BDO10000",
            "CITY_NAME_SI": "Kota Bandung",
            "DESTINATION_CODE_SI": "BDO10044",
            "ORIGIN_CODE_SI": "BDO",
            "change": 1,
            "closedSi": false,
            "unsupportedSi": false,
            "CODE_SAP": "JB0306",
            "iCityID": 62,
            "iDistrictID": 15180,
            "iProvinceID": 3,
            "JT_City": "BDO",
            "JT_City_Code": "BANDUNG",
            "JT_Code": "BDO008",
            "JT_District": "BABAKAN CIPARAY",
            "unsupportedId": false,
            "unsupportedNinja": false,
            "unsupportedCodSi": false,
            "l1_tier_code": "ID_A00009_01",
            "l2_tier_code": "ID_B00095_01",
            "unsupportedJNE": false,
            "unsupportedJT": false,
            "JNE_zone": "A",
            "lion3lc": "BDO",
            "lionDestinationRoute": "BABAKAN CIPARAY, BANDUNG",
            "lionDistrictCode": "JBR00118",
            "posCode": "40000",
            "unsupportedCodLion": false,
            "unsupportedLion": false,
            "fullAddress": "JAWA BARAT, BANDUNG, BABAKAN CIPARAY, MARGASUKA",
            "fullAddressWithoutDistrict": "JAWA BARAT, BANDUNG, MARGASUKA",
            "l3_tier_code": "ID_C01246",
            "unsupportedOriginSicepat": false,
            "unsupportedPaxel": true,
            "unsupportedCodPaxel": true,
            "unsupportedCodId": false,
            "anterajaDistrictCode": "32.73.03",
            "unsupportedAnteraja": false,
            "unsupportedCodAnteraja": false,
            "JT_Province": "JAWA BARAT",
            "POS_KECAMATAN": "BABAKAN CIPARAY",
            "POS_KELURAHAN": "SUKAHAJI",
            "POS_KODEPOS": "40221",
            "POS_KOTA": "KOTA BANDUNG",
            "POS_NAME_DESTINATION": "BANDUNG",
            "POS_NOPEND_DESTINATION": "40000",
            "POS_PROVINSI": "JAWA BARAT",
            "unsupportedCodJT": false,
            "SPX_CITY": "KOTA BANDUNG",
            "SPX_DISTRICT": "BABAKAN CIPARAY",
            "SPX_PROVINCE": "JAWA BARAT",
            "unsupportedIdDG": false,
            "unsupportedSiDG": false,
            "unsupportedOriginNinja": false,
            "idexFlatEligible": true,
            "unsupportedCodSpx": false,
            "unsupportedOriginSpx": false,
            "unsupportedSpx": false,
            "unsupportedCodOriginSpx": false
        }
    ]
}
```

## Query parameter

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| keyword | String | Wajib. Satu kata atau lebih. Setiap kata harus cocok dengan provinsi, kota, kecamatan, kelurahan, atau kode pos, dan huruf besar atau kecil tidak berpengaruh. Tanda baca seperti `. , - /` diabaikan. |

## Field response

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| _id | String | ID alamat. Pakai sebagai `origin_id` dan `destination_id` di Check Shipping Fee, dan sebagai `customerAddressDataId` di Create order. |
| COUNTRY_NAME | String | Negara. |
| PROVINCE_NAME | String | Provinsi. |
| CITY_NAME | String | Kota atau kabupaten. |
| DISTRICT_NAME | String | Kecamatan. |
| SUBDISTRICT_NAME | String | Kelurahan. |
| ZIP_CODE | String | Kode pos. |
| fullAddress | String | Alamat dalam satu baris: provinsi, kota, kecamatan, kelurahan. |
| fullAddressWithoutDistrict | String | Baris yang sama tanpa kecamatan. |

Field lainnya berisi data internal yang dipakai Mengantar untuk menghitung dan mengarahkan pengiriman per kurir, seperti kode kurir dan flag cakupan. Rujuk sebuah alamat lewat `_id`-nya dan jangan bergantung pada field tersebut.

## Batasan

- Satu panggilan mengembalikan paling banyak 50 alamat dan tidak ada pagination. Pakai kata yang lebih spesifik untuk mempersempit hasil.
- Keyword yang tidak punya kata tersisa setelah tanda baca dibuang mengembalikan `200` dengan `data` kosong.

## Response error

| Kondisi | Status | Response |
| --- | --- | --- |
| `keyword` tidak dikirim | 400 | `{ "success": false, "message": "The request is missing a required parameter: 'keyword'" }` |
| `keyword` bukan teks biasa, misalnya dikirim lebih dari sekali | 400 | `{ "success": false, "message": "The 'keyword' parameter must be text" }` |
| API key tidak valid atau nonaktif, tidak punya hak akses `Create order`, atau IP tidak diizinkan | 403 | `{ "success": false, "message": "Not allowed" }` |
