# Simulate Order Status

`POST {BASE_URL}/api/public/{API_KEY}/order/simulation`

> [!WARNING]
> **Sandbox only:** this endpoint only exists when the deployment runs in sandbox mode. Calling the same path in production always returns `404 Not Found`, even with a valid API key.

Moves one of your own sandbox orders straight to a status (`ON DELIVERY`, `DELIVERED` or `RTS`) without waiting for a real courier update, so you can test the whole flow in the sandbox: create an order, simulate its status, read it back.

If your account has a Webhook URL, each successful call also sends one webhook with the new status to that URL, see [Webhook](#webhook). The status change is saved whether or not that delivery succeeds.

A valid, active API key with the `Check order status` permission is required in `{API_KEY}`. No separate simulation permission exists. Without it the call is rejected with 401 `Unauthorized`.

Permission required: Check order status
Environment: Sandbox only

## Example request

```bash
# Here is a curl example
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order/simulation' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "orderId": "261113IBBQ4K",
  "statusCategory": "ON DELIVERY"
}'
```

## Example response

```json
{
    "success": true,
    "data": {
        "orderId": "261113IBBQ4K",
        "trackingNumber": "JJ6000001911",
        "courier": "JT",
        "previousStatus": "active",
        "previousStatusCategory": "active",
        "status": "ON DELIVERY",
        "statusCategory": "ON DELIVERY",
        "lastStatusChange": "2026-11-13T09:15:00.000Z",
        "history": [
            // the earlier entries of the trail are left out here
            {
                "counter_name": "Mengantar",
                "date": "14-09-2026 07:35",
                "desc": "Paket akan dikirim ke alamat penerima",
                "note": "",
                "phone": "628123456789",
                "name": "MGR",
                "proofUrl": "",
                "code": "ON DELIVERY"
            },
            {
                "counter_name": "Mengantar",
                "date": "14-09-2026 11:41",
                "desc": "Paket disimpan di gudang J&T",
                "note": "Telepon tidak diangkat atau non-aktif",
                "phone": "",
                "name": "",
                "proofUrl": "url.jpeg",
                "code": "UNDELIVERED"
            },
            {
                "counter_name": "Mengantar",
                "date": "22-09-2026 16:13",
                "desc": "Paket akan dikirim ke alamat penerima",
                "note": "",
                "phone": "628123456789",
                "name": "MGR",
                "proofUrl": "",
                "code": "ON DELIVERY"
            }
        ],
        "requestId": "80fd892e-03e6-4f3c-847e-08b1c548a77f"
    }
}
```

## Identify the order by its tracking number

Send `trackingId` instead of `orderId`, and `status` instead of `statusCategory`. Both pairs are interchangeable: send exactly one of each.

### Example request

```bash
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order/simulation' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "trackingId": "JJ6000001911",
  "status": "DELIVERED"
}'
```

### Example response

```json
{
    "success": true,
    "data": {
        "orderId": "261113IBBQ4K",
        "trackingNumber": "JJ6000001911",
        "courier": "JT",
        "previousStatus": "ON DELIVERY",
        "previousStatusCategory": "ON DELIVERY",
        "status": "DELIVERED",
        "statusCategory": "DELIVERED",
        "lastStatusChange": "2026-11-13T09:20:00.000Z",
        "history": [
            // the earlier entries of the trail are left out here
            {
                "counter_name": "Mengantar",
                "date": "11-09-2026 20:57",
                "desc": "Paket telah sampai di DC_ARJUNO",
                "note": "Mobil",
                "phone": "",
                "name": "",
                "proofUrl": "",
                "code": "INCOMING"
            },
            {
                "counter_name": "Mengantar",
                "date": "12-09-2026 07:06",
                "desc": "Paket akan dikirim ke alamat penerima",
                "note": "",
                "phone": "628123456789",
                "name": "MGR",
                "proofUrl": "",
                "code": "ON DELIVERY"
            },
            {
                "counter_name": "Mengantar",
                "date": "12-09-2026 11:02",
                "desc": "Paket telah diterima",
                "note": "",
                "phone": "",
                "name": "MGR",
                "proofUrl": "url.jpeg",
                "code": "DELIVERED"
            }
        ],
        "requestId": "80fd892e-03e6-4f3c-847e-08b1c548a77f"
    }
}
```

## Body parameters

| Field | Type | Description |
| --- | --- | --- |
| courier | String | Required. `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos` or `spx`. It is case sensitive. `Ninja` is not supported. |
| orderId | String | The `ORDER_ID` of the order. Send exactly one of `orderId` and `trackingId`. |
| trackingId | String | The tracking number (`cnote_no`) of the order. Send exactly one of `orderId` and `trackingId`. |
| statusCategory | String | The target status: `ON DELIVERY`, `DELIVERED` or `RTS`, in capitals. Send exactly one of `statusCategory` and `status`. |
| status | String | The same target status as `statusCategory`: either field selects it. Send exactly one of `statusCategory` and `status`. |

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | `true` when the status was changed. |
| data | Object | The result of the simulation. |
| orderId | String | The `ORDER_ID` of the order. |
| trackingNumber | String | The tracking number (`cnote_no`) of the order. |
| courier | String | The courier you sent. |
| previousStatus | String | The `status` of the order before this call. |
| previousStatusCategory | String | The `statusCategory` of the order before this call. |
| status | String | The new `status` of the order, see the mapping below. |
| statusCategory | String | The new `statusCategory` of the order, see the mapping below. |
| lastStatusChange | String | When the status was changed, in ISO 8601 UTC. It is the time of your request. |
| history | Array | The tracking history now saved on the order. See below. |
| requestId | String | The id of this request. Give it to support when you report a problem. |

## Status mapping per courier

`DELIVERED` and `RTS` are saved as they are for every courier: `status` and `statusCategory` both equal the value you sent. Only `ON DELIVERY` differs per courier:

| Courier | Stored `status` | Stored `statusCategory` |
| --- | --- | --- |
| `JNE` | ON DELIVERY | ON DELIVERY |
| `SiCepat` | ON DELIVERY | DELIVERY COURIER |
| `Sap` | ON DELIVERY | ON DELIVERY |
| `iDexpress` | ON DELIVERY | ON DELIVERY |
| `JT` | ON DELIVERY | ON DELIVERY |
| `lion` | DELIVERY COURIER | ON DELIVERY |
| `anteraja` | DELIVERY COURIER | DELIVERY COURIER |
| `pos` | DELIVERY COURIER | DELIVERY COURIER |
| `spx` | ON DELIVERY | ON DELIVERY |

## What a simulation does

- **Your webhook is sent too.** If you set a Webhook URL in the sandbox (every sandbox account can, see [Webhook](#webhook)), each successful call sends one webhook with the new `status_category` to it, with the header `x-environment: sandbox`. It is not sent when the account has no Webhook URL or the URL is suspended. A failed delivery is retried for about 20 seconds, and the status change stays saved either way.
- **The history is replaced.** The `history` of the order is replaced with a ready-made trail of that courier for the target status, not a single made-up line. The dates of that trail are fixed reference dates, not today, and can be earlier than the order itself. `lastStatusChange` is the only real time.
- **Any order of statuses works.** You can go to `DELIVERED`, then `RTS`, then `ON DELIVERY`, or send the same status again. This is an override, not a real lifecycle.
- **A simulated order cannot be deleted.** [Delete orders](#delete-orders) answers that 0 orders were deleted, so simulate only the orders you want to keep.
- **Nothing real happens.** A simulation never sends a WhatsApp, SMS or email to a receiver, and never changes a balance, COD payout, refund, claim, invoice, fee or ticket. It never calls a real courier.

## Test flow

1. Create a sandbox order with [Create order](#create-order) and keep its `ORDER_ID`.
2. Simulate a status with this endpoint, for example `ON DELIVERY`.
3. Read the order back with [Get orders](#get-orders), using `order_id`. The `status`, `lastStatusChange` and `history` show the change.
4. Simulate `DELIVERED` or `RTS` the same way to test the other points of the flow, and check your Webhook URL if you use one.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| The API key is invalid or inactive, or has no `Check order status` permission | 401 | `{ "success": false, "message": "Unauthorized" }` |
| The deployment is not sandbox | 404 | `{ "success": false, "message": "Not Found" }` |
| `courier` is missing, has the wrong case, or is not supported, such as `Ninja` | 422 | `{ "success": false, "message": "courier is required and must be supported" }` |
| Both or neither of `orderId` and `trackingId` are sent | 422 | `{ "success": false, "message": "Provide exactly one of orderId or trackingId" }` |
| `orderId` or `trackingId` is empty | 422 | `{ "success": false, "message": "orderId or trackingId must be a non-empty string" }` |
| Both or neither of `statusCategory` and `status` are sent | 422 | `{ "success": false, "message": "Provide exactly one of statusCategory or status", "supportedValues": ["ON DELIVERY", "DELIVERED", "RTS"] }` |
| The target is not `ON DELIVERY`, `DELIVERED` or `RTS`, for example `PENDING` or `delivered` | 422 | `{ "success": false, "message": "Unsupported simulation status", "supportedValues": ["ON DELIVERY", "DELIVERED", "RTS"] }` |
| No order of that courier matches, or the order belongs to another account | 404 | `{ "success": false, "message": "Order not found" }` |
| The order was deleted | 409 | `{ "success": false, "message": "Order has been deleted" }` |
| The status could not be saved. Nothing is changed | 500 | - |
