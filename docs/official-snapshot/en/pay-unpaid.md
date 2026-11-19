# Pay unpaid

`POST {BASE_URL}/api/public/{API_KEY}/order/pay-unpaid`

Pays the unpaid orders of a batch and creates their tracking numbers. An order is unpaid (`isPaid: false`, `cnote_no` empty) when it was created while your balance was lower than its price, see [Create order](#create-order). Top up your balance first, then call this endpoint with the batch of those orders. The batch comes from the `batch_id` of the Create order response.

A valid, active API key with the `Create order` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl \
-X POST '{BASE_URL}/api/public/{API_KEY}/order/pay-unpaid' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "batch_id": "6af68854ce96b86fe95825ef"
}'
```

## Example response

```json
{
    "success": true,
    "data": 1,
    "cnote_no": ["JJ6000001923"]
}
```

## Courier services: lion, anteraja, pos and spx

These four couriers answer in a different shape: `data` is an object that holds `cnote_no` and `count`.

### Example request

```bash
# Here is a curl example
curl \
-X POST '{BASE_URL}/api/public/{API_KEY}/order/pay-unpaid' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "lion",
  "batch_id": "6af6b86ece96b86fe9586371"
}'
```

### Example response

```json
{
    "success": true,
    "data": {
        "cnote_no": ["C15DQQW7"],
        "count": 1
    }
}
```

## Body parameters

| Field | Type | Description |
| --- | --- | --- |
| courier | String | The courier of the batch: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos` or `spx`. It is case sensitive. Optional for `JNE`, which is the default; required for every other courier. A courier that does not match the batch answers `batch not found`. `Ninja` is discontinued from 1 September 2026 and its unpaid orders can no longer be paid here, contact Mengantar support for the ones left from before. |
| batch_id | String | Required. The `_id` of the batch, from `batch_id` in [Create order](#create-order) or `_id` in [Get batches](#get-batches). |

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | `true` when the request was processed. |
| data | Number | For `JNE`, `SiCepat`, `Sap`, `iDexpress` and `JT`: the number of orders that were paid. For `lion`, `anteraja`, `pos` and `spx`: an object with `cnote_no` and `count`. |
| cnote_no | Array | The tracking numbers of the paid orders. At the top level for `JNE`, `SiCepat`, `Sap`, `iDexpress` and `JT`, inside `data` for the other couriers. Empty when nothing was paid. |
| count | Number | Only for `lion`, `anteraja`, `pos` and `spx`: the number of orders that were paid. |

## How the payment works

- The price of every unpaid order of the batch is added up and charged from your balance in one go. If the balance is lower than the total, nothing is paid.
- Orders of the batch that are already paid are skipped and never charged twice.
- The orders get their tracking number (`cnote_no`) and become `isPaid: true`. Read them with [Get orders](#get-orders).
- The balance in [Get invoices and balance](#get-invoices-and-balance) can take a few seconds to show the payment.

Paying a batch that has nothing left to pay does not charge anything. `JNE`, `SiCepat`, `Sap`, `iDexpress` and `JT` answer 200 with `data` `0` and an empty `cnote_no`; `lion`, `anteraja`, `pos` and `spx` answer 400 `no unpaid orders in this batch`.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| `batch_id` is missing, malformed, not yours, or of another courier, or `courier` is missing for a batch that is not `JNE` | 400 | `{ "success": false, "message": "batch not found" }` |
| `courier` is not a supported value, or has the wrong case | 400 | `{ "success": false, "message": "Invalid courier" }` |
| The balance is lower than the total price of the unpaid orders | 400 | `{ "success": false, "message": "balance is not enough" }` |
| Nothing is unpaid in the batch (`lion`, `anteraja`, `pos`, `spx`) | 400 | `{ "success": false, "message": "no unpaid orders in this batch" }` |
| The API key is invalid or inactive, has no `Create order` permission, or the IP is not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
