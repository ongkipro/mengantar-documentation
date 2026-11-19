# Add Time

`POST {BASE_URL}/api/public/{API_KEY}/time`

Adds a pickup time for one of your saved addresses. Use the `_id` in the response as `pickup.time_id` in [Create order](#create-order) when the pickup type is `scheduledPickup`. To list the pickup times you already added, use [Get Time](#get-time).

A valid, active API key with the `Create order` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl \
-X POST '{BASE_URL}/api/public/{API_KEY}/time' \
-H 'Content-Type: application/json' \
-d '{
  "address_id": "6af555fc8109274a92d72fb3",
  "date": "11-30-2026",
  "time": "13:00"
}'
```

## Example response

```json
{
    "success": true,
    "data": {
        "isSunday": false,
        "_id": "6af583fb9708e74dced0799e",
        "date": "2026-11-30T00:00:00.000Z",
        "time": "13:00",
        "address": {
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
        },
        "user_id": "6af1a2b3c4d5e6f708192a3b",
        "createdAt": "2026-11-12T09:16:43.903Z",
        "updatedAt": "2026-11-12T09:16:43.903Z",
        "__v": 0
    }
}
```

## Body parameters

| Field | Type | Description |
| --- | --- | --- |
| address_id | String | Required. The `_id` of one of your saved addresses, from [Get user's addresses](#get-users-addresses) or [Add user's address](#add-users-address). |
| date | String \| Number | Required. The pickup date, either as text in `MM-DD-YYYY` format, for example `"11-30-2026"`, or as a Unix timestamp in milliseconds sent as a number, for example `1794787200000` (midnight UTC of `2026-11-16`). A timestamp sent as text, such as `"1794787200000"`, is rejected. |
| time | String | Required. The pickup hour, always with two digits: `09:00`, `10:00`, `11:00`, `12:00`, `13:00`, `14:00`, `15:00`, `16:00`, `17:00`, `18:00`, `19:00` or `20:00`. `9:00` is rejected. |

> [!WARNING]
> **Note:** A pickup used for an order must be at least **90 minutes** from the current time. Adding a time does not check this. The check happens when you use the time in Create order, which rejects a pickup time that is too close with `invalid pickup time`.

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| _id | String | The pickup time ID. Use it as `pickup.time_id` in Create order. |
| date | String | The pickup date (ISO 8601, midnight UTC of the date you sent). |
| time | String | The pickup hour, for example `13:00`. |
| isSunday | Boolean | `true` when the date is a Sunday in Jakarta time. |
| address | Object | A copy of the address as it was when the time was added. |
| user_id | String | The ID of your account. |
| createdAt | String | When the pickup time was added (ISO 8601). |
| updatedAt | String | When the pickup time was last changed (ISO 8601). |

## Limits

- Each call creates a new pickup time, even when the same `address_id`, `date` and `time` already exist. Each one has its own `_id`. Add a time once and reuse its `_id`.
- A date in the past is accepted and saved, but it no longer appears in [Get Time](#get-time) once its hour has passed.
- A missing field is reported one at a time, in this order: `address_id`, then `time`, then `date`.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| `address_id`, `time` or `date` is missing | 400 | `{ "success": false, "field": "time", "message": "time is required" }` |
| `time` is not one of the allowed hours | 400 | `{ "success": false, "message": "Time allowed 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00, 19:00, 20:00" }` |
| `address_id` is not one of your saved addresses | 404 | `{ "success": false, "message": "address not found" }` |
| `address_id` or `date` is not valid, for example `abc` | 400 | `{ "success": false, "message": "Error on add time", "error": { ... } }` |
| Invalid or inactive API key, no `Create order` permission, or IP not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
