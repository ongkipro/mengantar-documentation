# Search address data

`GET {BASE_URL}/api/public/{API_KEY}/address/search`

Finds addresses by province, city, district, subdistrict or zip code. Use the `_id` of a result as `origin_id` and `destination_id` in [Check Shipping Fee](#check-shipping-fee), and as `customerAddressDataId` in [Create order](#create-order).

A valid, active API key with the `Create order` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/address/search?keyword=margasuka'
```

## Example response

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

## Query parameters

| Field | Type | Description |
| --- | --- | --- |
| keyword | String | Required. One or more words. Every word must match a province, city, district, subdistrict or zip code, and upper or lower case does not matter. Punctuation such as `. , - /` is ignored. |

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| _id | String | The address ID. Use it as `origin_id` and `destination_id` in Check Shipping Fee, and as `customerAddressDataId` in Create order. |
| COUNTRY_NAME | String | Country. |
| PROVINCE_NAME | String | Province. |
| CITY_NAME | String | City or regency. |
| DISTRICT_NAME | String | District (kecamatan). |
| SUBDISTRICT_NAME | String | Subdistrict (kelurahan). |
| ZIP_CODE | String | Zip code. |
| fullAddress | String | The address on one line: province, city, district, subdistrict. |
| fullAddressWithoutDistrict | String | The same line without the district. |

The other fields hold internal data that Mengantar uses to price and route shipments per courier, such as courier codes and coverage flags. Refer to an address by its `_id` and do not depend on those fields.

## Limits

- A call returns at most 50 addresses and has no pagination. Use more specific words to narrow the result.
- A keyword that has no words left once punctuation is removed returns `200` with an empty `data` list.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| `keyword` is missing | 400 | `{ "success": false, "message": "The request is missing a required parameter: 'keyword'" }` |
| `keyword` is not plain text, for example it is sent more than once | 400 | `{ "success": false, "message": "The 'keyword' parameter must be text" }` |
| Invalid or inactive API key, no `Create order` permission, or IP not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
