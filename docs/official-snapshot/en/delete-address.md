# Delete address

`DELETE {BASE_URL}/api/public/{API_KEY}/address`

Deletes one saved pickup address from your account. Only an address of your own can be deleted. Get the `_id` of the address from [Get user's addresses](#get-users-addresses) or [Add user's address](#add-users-address).

A valid, active API key with the `Create order` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/address' \
-H 'Content-Type: application/json' \
-d '{
  "id": "6af555fc8109274a92d72fb3"
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
    }
}
```

## Body parameters

| Field | Type | Description |
| --- | --- | --- |
| id | String | Required. The `_id` of the address to delete. It must belong to your account. |

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| data | Object | The address as it was just before it was deleted. |

> [!NOTE]
> **Warning:** This action is permanent. A deleted address cannot be recovered. Make sure you intend to delete this address before you send the request.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| `id` is missing, was already deleted, does not exist, or belongs to another account | 400 | `{ "success": false, "message": "Something went wrong" }` |
| `id` is not a valid address ID, for example `abc` | 400 | `{ "success": false, "message": "Error on delete address", "error": { ... } }` |
| Invalid or inactive API key, no `Create order` permission, or IP not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |

Deleting the same address a second time returns the first error, not a success.
