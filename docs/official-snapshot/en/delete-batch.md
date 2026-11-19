# Delete batch

`DELETE {BASE_URL}/api/public/{API_KEY}/batch`

Deletes a batch and every order inside it that can still be deleted. It is the quick way to delete a whole [Create order](#create-order) call at once. The balance of the paid orders is returned to you. The status rule is the same as in [Delete orders](#delete-orders): an order can only be deleted while its status is `active`, `error`, `PENDING PICKUP`, `PICKUP FAILED` or `PICKUP_FAILED_API` (or empty).

A valid, active API key with the `Create order` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`.

> [!WARNING]
> **Check `deletedCount`, not `success`.** The call answers 200 with `success: true` even when nothing was deleted, for example when the batch was already deleted or its orders are past pickup. `deletedCount` and `unDeletedCount` say what really happened.

Permission required: Create order
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/batch' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "id": "6af68834ce96b86fe95821d1"
}'
```

## Example response

```json
{
    "success": true,
    "data": {
        "isDraft": false,
        "isDeleted": true,
        "isArchived": false,
        "orders": 0,
        "error": 0,
        "unpaid": 0,
        "delivered": 0,
        "undelivered": 2,
        "rts": 0,
        "reconciled": 0,
        "active": 2,
        "totalToPay": 0,
        "totalToPaySpecial": 0,
        "printedDates": [],
        "_id": "6af68834ce96b86fe95821d1",
        "address": {
            "PICKUP_NAME": "Gudang Utama",
            "PICKUP_PIC": "Budi",
            "PICKUP_PIC_PHONE": "081234567890",
            "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
            "PICKUP_DISTRICT": "BABAKAN CIPARAY",
            "PICKUP_CITY": "BANDUNG"
        },
        "address_id": "6af555fc8109274a92d72fb3",
        "id": "26111310KDX9LE",
        "createdAt": "2026-11-13T03:47:00.448Z",
        "updatedAt": "2026-11-13T04:10:12.731Z"
    },
    "deletedCount": 2,
    "unDeletedCount": 0,
    "totalCount": 2,
    "message": "2 orders are deleted from 2 orders"
}
```

## Lion, anteraja, pos and spx

These four couriers add `ordersCount`, `totalBalanceRefund` and `errorMessages` to the response.

### Example request

```bash
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/batch' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "lion",
  "id": "26111310LNQ4A2"
}'
```

### Example response

```json
{
    "success": true,
    "data": {
        "isDraft": false,
        "_id": "6af68834ce96b86fe95821d2",
        "id": "26111310LNQ4A2",
        "isDeleted": true,
        "orders": 0
    },
    "deletedCount": 1,
    "unDeletedCount": 0,
    "totalCount": 1,
    "message": "1 orders are deleted from 1 orders",
    "ordersCount": 1,
    "totalBalanceRefund": 31200,
    "errorMessages": []
}
```

## Body parameters

| Field | Type | Description |
| --- | --- | --- |
| courier | String | The courier of the batch: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos` or `spx`. It is case sensitive. Optional for `JNE`, which is the default. For every other courier it is required: without it the batch is looked for among the `JNE` batches and the call answers `batch not found`. `Ninja` is discontinued from 1 September 2026 and is still accepted for its old batches. |
| id | String | Required. The `_id` of the batch, or its batch number such as `26111310KDX9LE`, from [Create order](#create-order) or [Get batches](#get-batches). It is a single value: `id` here is the opposite of the `ids` array of [Delete orders](#delete-orders). |

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | `true` when the request was processed. It does not mean that something was deleted. |
| data | Object | The batch after the deletion, see [Get batches](#get-batches). `isDeleted` is `true` and `orders` is `0` once every order is deleted; the other counters are not recalculated. `lion`, `anteraja`, `pos` and `spx` return a shorter object. |
| deletedCount | Number | The number of orders that this request deleted. |
| unDeletedCount | Number | The number of orders of the batch that were not deleted. |
| totalCount | Number | The number of orders of the batch that were considered. |
| message | String | A summary, for example `2 orders are deleted from 3 orders`. |
| ordersCount | Number | Only for `lion`, `anteraja`, `pos` and `spx`: the same as `totalCount`. |
| totalBalanceRefund | Number | Only for `lion`, `anteraja`, `pos` and `spx`: the balance returned, in rupiah. When the courier refuses to cancel an order, as Anteraja does in the first 5 minutes, it can still show an amount although nothing was returned: trust `deletedCount` and your balance. |
| errorMessages | Array | Only for `lion`, `anteraja`, `pos` and `spx`: the orders the courier refused to cancel, with the reason. |

## What gets deleted

- **Only some of the orders can be deleted.** An order that is past pickup is skipped and the others are still deleted. `unDeletedCount` counts the ones that stayed.
- **The balance comes back.** A paid non-COD order is refunded when it is deleted. `JNE`, `SiCepat`, `Sap`, `iDexpress` and `JT` do not say how much: read it in [Get invoices and balance](#get-invoices-and-balance), where the balance can take a few seconds to show it. An order with status `error` was never charged, so nothing is refunded.
- **A simulated order stays.** An order that you moved with [Simulate Order Status](#simulate-order-status) is skipped: `deletedCount` is `0` and `unDeletedCount` counts it.
- **Deleting twice is not refused.** A batch that is already deleted answers 200 with `deletedCount` `0` and `totalCount` `0`.
- **Anteraja** only allows an order to be deleted 5 minutes after it was created. Deleting sooner answers 200 with `deletedCount` `0` and the reason in `errorMessages`.
- **A draft batch** has no orders yet: `deletedCount`, `unDeletedCount` and `totalCount` are `0`, and the response adds `isBatchDraft: true`.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| The API key is invalid or inactive, has no `Create order` permission, or the IP is not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
| `courier` is not a supported value, or has the wrong case | 400 | `{ "success": false, "message": "Invalid courier" }` |
| `id` is missing or empty | 400 | `{ "success": false, "message": "id is required" }` |
| The batch does not exist, is not yours, `id` is malformed or sent as an array, or `courier` is missing for a batch that is not `JNE`, for `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT` and `Ninja` | 400 | `{ "success": false, "message": "batch not found" }` |
| The batch belongs to another courier, for `lion`, `anteraja`, `pos` and `spx` | 404 | `{ "success": false, "message": "Batch not found" }` |
