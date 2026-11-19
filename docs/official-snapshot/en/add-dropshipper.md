# Add Dropshipper

`POST {BASE_URL}/api/public/{API_KEY}/dropshippers`

Saves a dropshipper in your account. A dropshipper is the sender name and phone number printed on the shipment and label of a dropship order. Use the `id` of the result as `dropShipper.id` in [Create order](#create-order).

A valid, active API key with the `Create order` permission is required in `{API_KEY}`, and the Dropshipper feature must be enabled for your account through Seller Web. Without a valid key the call is rejected with 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox and production

## Example request

```bash
curl -X POST '{BASE_URL}/api/public/{API_KEY}/dropshippers' \
-H 'Content-Type: application/json' \
-d '{
  "name": "Toko Partner",
  "phone": "081234567890"
}'
```

## Example response

```json
{
  "success": true,
  "data": {
    "id": "66ab1234567890abcdef1234",
    "name": "Toko Partner",
    "phone": "081234567890"
  }
}
```

A successful request returns HTTP `201`.

## Body parameters

| Field | Type | Description |
| --- | --- | --- |
| name | String | Required. The dropshipper name. Spaces at the start and the end are removed. |
| phone | String | Required. A valid phone number, for example `081234567890` or `+6281234567890`. Spaces at the start and the end are removed. Send it as text, not as a number. |

## Duplicates

If you already saved a dropshipper with the same `name` and `phone`, the call returns that saved dropshipper, with the same `id`, and creates nothing new. The match is exact, so `Toko Partner` and `toko partner`, or `081234567890` and `+6281234567890`, are saved as two different dropshippers.

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| id | String | The ID of the dropshipper. Send it as `dropShipper.id` in Create order. |
| name | String | The saved name. |
| phone | String | The saved phone number. |

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| `name` or `phone` is missing | 400 | `{ "success": false, "message": "Missing fields: name, phone" }` |
| `phone` is not a valid phone number | 400 | `{ "success": false, "message": "Invalid Dropshipper phone number" }` |
| `name` is only spaces | 400 | `{ "success": false, "message": "Invalid Dropshipper name" }` |
| Invalid or inactive API key, no `Create order` permission, or IP not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
| The Dropshipper feature is not enabled for the account | 403 | `{ "success": false, "message": "Dropshipper Feature is not enabled. Enable it through Seller Web." }` |
| `name` or `phone` is not text, for example a number | 500 | `{ "success": false, "message": "reqBody.phone.trim is not a function" }` |
| The body is not valid JSON | 500 | `{ "success": false, "name": "InternalError", "message": "Something went wrong, please try again later." }` |
