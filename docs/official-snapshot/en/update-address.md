# Update address

`PUT {BASE_URL}/api/public/{API_KEY}/address/{id}`

Updates one saved pickup address by ID. Send only the fields you want to change; every other field keeps its value. To move the address to another area, send a new `PICKUP_AUTOFILL` from [Search address data](#search-address-data).

Permission required: Create order
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X PUT '{BASE_URL}/api/public/{API_KEY}/address/6af555fc8109274a92d72fb3' \
-H 'Content-Type: application/json' \
-d '{
  "PICKUP_NAME": "Gudang Utama 2",
  "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 14"
}'
```

## Example response

```json
{
    "success": true,
    "data": {
        "RETURN_COUNTRY": "INDONESIA",
        "isReturnDifferentFromPickup": false,
        "_id": "6af555fc8109274a92d72fb3",
        "PICKUP_NAME": "Gudang Utama 2",
        "PICKUP_PIC": "Budi",
        "PICKUP_PIC_PHONE": "081234567890",
        "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 14",
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
        "updatedAt": "2026-11-12T08:53:57.846Z",
        "__v": 0
    },
    "message": "Request successful"
}
```

## Url parameters

| Field | Type | Description |
| --- | --- | --- |
| id | String | The `_id` of the address to update. It must belong to your account. |

## Body parameters

All fields are optional. A call with an empty body succeeds and changes nothing. Only the fields in this table are saved: any other field in the body is ignored.

| Field | Type | Description |
| --- | --- | --- |
| PICKUP_NAME | String | Seller or store name. |
| PICKUP_PIC | String | Name of the contact person (PIC). |
| PICKUP_PIC_PHONE | String | Phone number. Spaces, dashes and parentheses are allowed. An invalid number, or `null`, is rejected. |
| PICKUP_ADDRESS | String | Street address text. |
| PICKUP_AUTOFILL | String | The `_id` of an address from [Search address data](#search-address-data). It replaces the province, city, district, subdistrict and zip code. It cannot be empty. |
| pinpointData | Object \| null | Pickup geolocation. Required when the address is used for a Pos Indonesia (`pos`) scheduled pickup. Send both `pinpointData.lat` and `pinpointData.lng` as numbers. Latitude must be between -90 and 90; longitude must be between -180 and 180. |
| SHIPPER_ADDR1 | String | Return address text, if it is different from the pickup address. |
| SHIPPER_AUTOFILL | String | The `_id` of the return address area from [Search address data](#search-address-data). |
| SHIPPER_CONTACT | String | Seller or store name for the return address. |
| SHIPPER_PHONE | String | Phone number for the return address. |

> [!NOTE]
> **Change the area with `PICKUP_AUTOFILL`.** The province, city, district, subdistrict and zip code of an address always come from `PICKUP_AUTOFILL`, so they are not body parameters. Send a new `PICKUP_AUTOFILL` to change them all together.

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| _id | String | The address ID. |
| user_id | String | The ID of your account. |
| pinpointData | Object | The pickup geolocation as saved, with `lat` and `lng`. Only present when one was saved. |
| PICKUP_DISTRICT | String | District, filled in from `PICKUP_AUTOFILL`. |
| PICKUP_SUBDISTRICT | String | Subdistrict, filled in from `PICKUP_AUTOFILL`. |
| PICKUP_REGION | String | Province, filled in from `PICKUP_AUTOFILL`. |
| PICKUP_CITY | String | City or regency, filled in from `PICKUP_AUTOFILL`. |
| PICKUP_ZIP | String | Zip code, filled in from `PICKUP_AUTOFILL`. |
| PICKUP_FULL_AUTOFILL | String | The area on one line: province, city, district, subdistrict. |
| updatedAt | String | When the address was last changed (ISO 8601). |

`data` is the whole address after the change. The other fields hold internal data that Mengantar uses to route pickups, such as courier codes. Your own input is returned as you sent it. Do not depend on the other fields.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| `id` is not a valid address ID | 400 | `{ "name": "BadRequestError", "message": "Invalid address object id", "success": false }` |
| `id` is not a saved address of yours | 422 | `{ "name": "ValidationError", "message": "address not found", "success": false }` |
| `PICKUP_PIC_PHONE` is not a valid phone number, or is `null` | 422 | `{ "name": "ValidationError", "message": "PIC phone number is invalid", "success": false }` |
| `PICKUP_AUTOFILL` is empty | 422 | `{ "name": "ValidationError", "message": "PICKUP_AUTOFILL is a required field", "success": false }` |
| `PICKUP_AUTOFILL` does not match any address data | 422 | `{ "name": "ValidationError", "message": "address not found", "success": false }` |
| `SHIPPER_AUTOFILL` does not match any address data | 422 | `{ "name": "ValidationError", "message": "shipper address not found", "success": false }` |
| Invalid or inactive API key, no `Create order` permission, or IP not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
