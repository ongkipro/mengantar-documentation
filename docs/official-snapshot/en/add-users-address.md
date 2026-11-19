# Add user's address

`POST {BASE_URL}/api/public/{API_KEY}/address`

Saves a pickup address to your account. The area (province, city, district, subdistrict and zip code) is not typed in. Look it up with [Search address data](#search-address-data) and send the `_id` of the result as `PICKUP_AUTOFILL`. To change an address that is already saved, use [Update address](#update-address).

A valid, active API key with the `Create order` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl \
-X POST '{BASE_URL}/api/public/{API_KEY}/address' \
-H 'Content-Type: application/json' \
-d '{
  "PICKUP_NAME": "Gudang Utama",
  "PICKUP_PIC": "Budi",
  "PICKUP_PIC_PHONE": "081234567890",
  "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
  "PICKUP_AUTOFILL": "5fc62de8f8f44b34aa4bdc49",
  "pinpointData": {
    "lat": -6.9456,
    "lng": 107.5703
  }
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
}
```

## Body parameters

| Field | Type | Description |
| --- | --- | --- |
| PICKUP_NAME | String | Required when adding. Seller or store name. |
| PICKUP_PIC | String | Required when adding. Name of the contact person (PIC). |
| PICKUP_PIC_PHONE | String | Required when adding. Phone number. Spaces, dashes and parentheses are allowed, for example `0812-3456-7890`. An invalid number is rejected. |
| PICKUP_ADDRESS | String | Required when adding. Street address text. |
| PICKUP_AUTOFILL | String | Required when adding. The `_id` of an address from [Search address data](#search-address-data). It fills in the province, city, district, subdistrict and zip code. |
| pinpointData | Object \| null | Optional. Pickup geolocation. Required when the address is used for a Pos Indonesia (`pos`) scheduled pickup. Send both `pinpointData.lat` and `pinpointData.lng` as numbers. Latitude must be between -90 and 90; longitude must be between -180 and 180. Send `null` or omit this field when no pinpoint is available. |
| SHIPPER_ADDR1 | String | Optional. Return address text, if it is different from the pickup address. |
| SHIPPER_AUTOFILL | String | Optional. The `_id` of the return address area from [Search address data](#search-address-data). |
| SHIPPER_CONTACT | String | Optional. Seller or store name for the return address. |
| SHIPPER_PHONE | String | Optional. Phone number for the return address. |

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| _id | String | The address ID. Use it as `pickup.address_id` in Create order, and as `id` in Update address and Delete user's address. |
| user_id | String | The ID of your account. |
| pinpointData | Object | The pickup geolocation as saved, with `lat` and `lng`. Only present when you sent it. |
| PICKUP_DISTRICT | String | District, filled in from `PICKUP_AUTOFILL`. |
| PICKUP_SUBDISTRICT | String | Subdistrict, filled in from `PICKUP_AUTOFILL`. |
| PICKUP_REGION | String | Province, filled in from `PICKUP_AUTOFILL`. |
| PICKUP_CITY | String | City or regency, filled in from `PICKUP_AUTOFILL`. |
| PICKUP_ZIP | String | Zip code, filled in from `PICKUP_AUTOFILL`. |
| PICKUP_FULL_AUTOFILL | String | The area on one line: province, city, district, subdistrict. |
| createdAt | String | When the address was added (ISO 8601). |
| updatedAt | String | When the address was last changed (ISO 8601). |

The other fields hold internal data that Mengantar uses to route pickups, such as courier codes. Your own input is returned as you sent it. Do not depend on the other fields.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| A required field is missing | 400 | `{ "success": false, "field": "PICKUP_NAME", "message": "PICKUP_NAME is required" }` |
| `PICKUP_PIC_PHONE` is not a valid phone number | 400 | `{ "success": false, "field": "PICKUP_PIC_PHONE", "message": "PICKUP_PIC_PHONE is invalid" }` |
| `PICKUP_AUTOFILL` does not match any address data | 400 | `{ "success": false, "field": "PICKUP_AUTOFILL", "message": "address not found" }` |
| `SHIPPER_AUTOFILL` does not match any address data | 400 | `{ "success": false, "field": "SHIPPER_AUTOFILL", "message": "return address not found" }` |
| `pinpointData` is out of range, for example latitude 999 | 400 | `{ "success": false, "field": "pinpointData.lat", "message": "pinpointData.lat must be less than or equal to 90" }` |
| Invalid or inactive API key, no `Create order` permission, or IP not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
