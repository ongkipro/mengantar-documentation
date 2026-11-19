# Get user's addresses

`GET {BASE_URL}/api/public/{API_KEY}/address`

Returns the pickup addresses saved in your account. Use it to find the `_id` of a saved address. That `_id` is the `pickup.address_id` of [Create order](#create-order), and the ID to [update](#update-address) or [delete](#delete-address) the address. To save a new address, use [Add user's address](#add-users-address).

A valid, active API key with the `Create order` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/address'
```

## Example response

```json
{
    "success": true,
    "data": [
        {
            "RETURN_COUNTRY": "INDONESIA",
            "isReturnDifferentFromPickup": false,
            "_id": "6af555fc8109274a92d72fb3",
            "PICKUP_NAME": "Gudang Utama",
            "PICKUP_PIC": "Budi",
            "PICKUP_PIC_PHONE": "081234567890",
            "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
            "PICKUP_AUTOFILL": "5fc62de8f8f44b34aa4bdc49",
            "pinpointData": {
                "lat": -6.9456,
                "lng": 107.5703
            },
            "user_id": "6af1a2b3c4d5e6f708192a3b",
            "PICKUP_DISTRICT": "BABAKAN CIPARAY",
            "PICKUP_SUBDISTRICT": "MARGASUKA",
            "PICKUP_REGION": "JAWA BARAT",
            "PICKUP_CITY": "BANDUNG",
            "PICKUP_CITY_SI": "Kota Bandung",
            "PICKUP_ZIP": "40225",
            "PICKUP_DESTINATION_CODE": "BDO10044",
            "PICKUP_DESTINATION_CODE_SI": "BDO10044",
            "PICKUP_ORIGIN_CODE": "BDO10000",
            "PICKUP_ORIGIN_CODE_SI": "BDO",
            "PICKUP_SAP_CODE": "JB0306",
            "PICKUP_FULL_AUTOFILL": "JAWA BARAT, BANDUNG, BABAKAN CIPARAY, MARGASUKA",
            "createdAt": "2026-11-12T06:00:28.177Z",
            "updatedAt": "2026-11-12T06:00:28.177Z",
            "__v": 0
        }
    ],
    "nowDate": "11-12-2026",
    "now": "15"
}
```

## Search and paging

Add `keyword` to find addresses by store name, and `page` with `size` to read them in pages. This example returns the first page of 20 addresses whose name contains `gudang`.

### Example request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/address?keyword=gudang&page=1&size=20'
```

### Example response

```json
{
    "success": true,
    "data": [
        {
            "RETURN_COUNTRY": "INDONESIA",
            "isReturnDifferentFromPickup": false,
            "_id": "6af555fc8109274a92d72fb3",
            "PICKUP_NAME": "Gudang Utama",
            "PICKUP_PIC": "Budi",
            "PICKUP_PIC_PHONE": "081234567890",
            "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
            "PICKUP_AUTOFILL": "5fc62de8f8f44b34aa4bdc49",
            "pinpointData": {
                "lat": -6.9456,
                "lng": 107.5703
            },
            "user_id": "6af1a2b3c4d5e6f708192a3b",
            "PICKUP_DISTRICT": "BABAKAN CIPARAY",
            "PICKUP_SUBDISTRICT": "MARGASUKA",
            "PICKUP_REGION": "JAWA BARAT",
            "PICKUP_CITY": "BANDUNG",
            "PICKUP_CITY_SI": "Kota Bandung",
            "PICKUP_ZIP": "40225",
            "PICKUP_DESTINATION_CODE": "BDO10044",
            "PICKUP_DESTINATION_CODE_SI": "BDO10044",
            "PICKUP_ORIGIN_CODE": "BDO10000",
            "PICKUP_ORIGIN_CODE_SI": "BDO",
            "PICKUP_SAP_CODE": "JB0306",
            "PICKUP_FULL_AUTOFILL": "JAWA BARAT, BANDUNG, BABAKAN CIPARAY, MARGASUKA",
            "createdAt": "2026-11-12T06:00:28.177Z",
            "updatedAt": "2026-11-12T06:00:28.177Z",
            "__v": 0
        }
    ],
    "nowDate": "11-12-2026",
    "now": "15"
}
```

## Query parameters

All parameters are optional. Without any, the call returns every address in your account.

| Field | Type | Description |
| --- | --- | --- |
| keyword | String | Returns only addresses whose `PICKUP_NAME` contains this text. Upper or lower case does not matter. Use one word, because spaces and punctuation are removed from the keyword but not from the name, so `Toko Jawa` finds nothing even if `Toko Jawa Barat` exists. |
| page | Number | Page number, starting at 1. It only works together with `size`. |
| size | Number | Addresses per page, at most 100. It only works together with `page`. |
| fields | String | Comma-separated field names to return, without spaces, for example `_id,PICKUP_NAME`. `_id` is always included. |

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| data | Array | The addresses. An empty array when you have none, or none match. |
| nowDate | String | Today's date in Jakarta time, formatted `MM-DD-YYYY`. |
| now | String | The current hour in Jakarta time, from `00` to `23`. |
| _id | String | The address ID. Use it as `pickup.address_id` in Create order, and as `id` in Update address and Delete user's address. |
| PICKUP_NAME | String | Seller or store name. |
| PICKUP_PIC | String | Name of the contact person (PIC). |
| PICKUP_PIC_PHONE | String | Phone number. |
| PICKUP_ADDRESS | String | Street address text. |
| PICKUP_AUTOFILL | String | The `_id` of the address data that the area comes from. |
| pinpointData | Object | The pickup geolocation, with `lat` and `lng`. Only present when one was saved. |
| PICKUP_DISTRICT | String | District. |
| PICKUP_SUBDISTRICT | String | Subdistrict. |
| PICKUP_REGION | String | Province. |
| PICKUP_CITY | String | City or regency. |
| PICKUP_ZIP | String | Zip code. |
| PICKUP_FULL_AUTOFILL | String | The area on one line: province, city, district, subdistrict. |
| createdAt | String | When the address was added (ISO 8601). |
| updatedAt | String | When the address was last changed (ISO 8601). |

The other fields in each address hold internal data that Mengantar uses to route pickups, such as courier codes. Do not depend on them.

## Limits

- The response has no total count. To read everything in pages, keep asking for the next `page` until a page returns fewer addresses than `size`.
- `page` and `size` are ignored unless both are sent. A call with only one of them returns all addresses.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| Invalid or inactive API key, no `Create order` permission, or IP not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
