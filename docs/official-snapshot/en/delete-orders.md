# Delete orders

`DELETE {BASE_URL}/api/public/{API_KEY}/order`

Deletes one or more of your orders of one courier. The balance of a paid order is returned to you. An order can only be deleted while its status is still `active`, `error`, `PENDING PICKUP`, `PICKUP FAILED` or `PICKUP_FAILED_API` (or empty). This is the same for every courier: once an order moves past pickup, it can no longer be deleted.

A valid, active API key with the `Create order` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`.

> [!WARNING]
> **Check `deletedCount`, not `success`.** The call can answer 200 with `success: true` and still delete nothing, or only part of what you sent. `deletedCount` and `deletedOrderIds` say what was really deleted.

Permission required: Create order
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/order' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "ids": ["6af68834ce96b86fe95821e9", "6af68834ce96b86fe95821ea"]
}'
```

## Example response

```json
{
    "success": true,
    "message": "2 orders are deleted from 2 selected orders",
    "deletedCount": 2,
    "deletedOrderIds": ["6af68834ce96b86fe95821e9", "6af68834ce96b86fe95821ea"],
    "deletedOrderIdsHumanReadable": ["261113IBBQ4K", "261113W04TMC"]
}
```

## Delete by order number

Send `orderIds` (the `ORDER_ID` of each order) instead of `ids`. If you send both, `orderIds` is used and `ids` is ignored.

### Example request

```bash
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/order' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "orderIds": ["261113IBBQ4K"]
}'
```

### Example response

```json
{
    "success": true,
    "message": "1 orders are deleted from 1 selected orders",
    "deletedCount": 1,
    "deletedOrderIds": ["6af68834ce96b86fe95821e9"],
    "deletedOrderIdsHumanReadable": ["261113IBBQ4K"]
}
```

## Anteraja, lion, pos and spx

These four couriers add `errorMessages`, `ordersCount` and `totalBalanceRefund` to the response. `errorMessages` lists the orders the courier refused to cancel, with the reason. Anteraja only lets you delete an order 5 minutes after it was created; deleting sooner answers like this:

### Example request

```bash
curl -X DELETE '{BASE_URL}/api/public/{API_KEY}/order' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "anteraja",
  "ids": ["6af68834ce96b86fe95821eb"]
}'
```

### Example response

```json
{
    "success": true,
    "message": "0 orders are deleted from 1 selected orders",
    "deletedCount": 0,
    "deletedOrderIds": [],
    "errorMessages": ["45612446392831: Gagal menghapus pesanan Anteraja. Harap tunggu 5 menit setelah pesanan terbuat untuk menghapusnya."],
    "ordersCount": 1,
    "totalBalanceRefund": 0
}
```

## Body parameters

| Field | Type | Description |
| --- | --- | --- |
| courier | String | The courier of the orders: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos` or `spx`. It is case sensitive. Optional for `JNE`, which is the default. For every other courier it is required: without it the call looks for the orders among `JNE` orders and answers `Orders already deleted`, and nothing is deleted. All the orders of one call must belong to this courier. `Ninja` is discontinued from 1 September 2026 and is still accepted for its old orders. |
| ids | Array | The `_id` of each order to delete. Required, unless you send `orderIds`. The field is `ids`, plural: `id` is not accepted, which is the opposite of [Delete batch](#delete-batch). |
| orderIds | Array | Optional. The `ORDER_ID` of each order to delete, instead of `ids`. When it is sent, `ids` is ignored. |

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | `true` when the request was processed. It does not mean that something was deleted. |
| message | String | A summary, for example `1 orders are deleted from 2 selected orders`. |
| deletedCount | Number | The number of orders that were really deleted. |
| deletedOrderIds | Array | The `_id` of the deleted orders. |
| deletedOrderIdsHumanReadable | Array | The `ORDER_ID` of the deleted orders. Not returned by `lion`, `anteraja`, `pos` and `spx`. |
| errorMessages | Array | Only for `lion`, `anteraja`, `pos` and `spx`: the orders the courier refused to cancel, with the reason. Empty when there is none. |
| ordersCount | Number | Only for `lion`, `anteraja`, `pos` and `spx`: the number of orders that were considered. |
| totalBalanceRefund | Number | Only for `lion`, `anteraja`, `pos` and `spx`: the balance returned, in rupiah. |

## What gets deleted

- **Only some of the orders can be deleted.** An order that is past pickup is skipped, and the others are still deleted. Compare `deletedCount` with the number you sent.
- **The balance comes back.** A paid order is refunded when it is deleted. `JNE`, `SiCepat`, `Sap`, `iDexpress` and `JT` do not say how much in the response: read it in [Get invoices and balance](#get-invoices-and-balance), where the balance can take a few seconds to show it. An order with status `error` was never charged, so nothing is refunded.
- **A simulated order cannot be deleted.** An order that you moved with [Simulate Order Status](#simulate-order-status) is refused: `deletedCount` is `0`.
- **Other couriers.** `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `pos` and `spx` have no waiting time on Mengantar's side. The delete is passed on to the courier, and it works or fails by the rules of that courier. Only Anteraja has the 5 minutes wait.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| The API key is invalid or inactive, has no `Create order` permission, or the IP is not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
| `courier` is not a supported value, or has the wrong case | 400 | `{ "success": false, "message": "Invalid courier" }` |
| `ids` is missing or empty, or you sent `id` instead | 400 | `{ "success": false, "message": "ids array is required" }` |
| An id is not a valid `_id` | 400 | `{ "success": false, "message": "ids array is invalid" }` |
| Nothing matched, for `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT` and `Ninja`: the id does not exist, belongs to another account, was already deleted, or `courier` is missing for an order that is not `JNE` | 200 | `{ "success": false, "message": "Orders already deleted" }` |
| Nothing matched, for `lion`, `anteraja`, `pos` and `spx` | 400 | `{ "success": false, "message": "There is no order to delete" }` |
