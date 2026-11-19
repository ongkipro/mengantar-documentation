# Get batches

`GET {BASE_URL}/api/public/{API_KEY}/batch`

Lists your batches, newest first. A batch is what one [Create order](#create-order) call makes: its orders, one courier and one pickup. Use the `_id` of a batch as `batch_id` in [Pay unpaid](#pay-unpaid) and as `id` in [Delete batch](#delete-batch), and its `id` (the batch number) as `batch` in [Get orders](#get-orders).

A valid, active API key with the `Check order status` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`.

Permission required: Check order status
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/batch?size=1&courier=JT'
```

## Example response

```json
{
    "success": true,
    "count": 2065,
    "data": [
        {
            "isDraft": false,
            "isDeleted": false,
            "isArchived": false,
            "orders": 1,
            "error": 0,
            "unpaid": 0,
            "delivered": 0,
            "undelivered": 1,
            "rts": 0,
            "reconciled": 0,
            "active": 1,
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
            "orderData": [
                {
                    "orderId": "261113IBBQ4K",
                    "cnote_no": "JJ6000001911",
                    "status": "active",
                    "SPECIAL_INS": null
                }
            ],
            "createdAt": "2026-11-13T03:47:00.448Z",
            "updatedAt": "2026-11-13T03:47:01.102Z",
            "courier": "JT"
        }
    ]
}
```

## Find the batches that are unpaid

Send `batchFilter=unpaid` to list only the batches that still have an unpaid order. `totalToPay` and `totalToPaySpecial` then show what [Pay unpaid](#pay-unpaid) will charge for the batch.

### Example request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/batch?size=1&batchFilter=unpaid'
```

### Example response

```json
{
    "success": true,
    "count": 156,
    "data": [
        {
            "isDraft": false,
            "isDeleted": false,
            "isArchived": false,
            "orders": 1,
            "error": 0,
            "unpaid": 1,
            "delivered": 0,
            "undelivered": 1,
            "rts": 0,
            "reconciled": 0,
            "active": 1,
            "totalToPay": 82400,
            "totalToPaySpecial": 57680,
            "printedDates": [],
            "_id": "6af68854ce96b86fe95825ef",
            "address": {
                "PICKUP_NAME": "Gudang Utama",
                "PICKUP_PIC": "Budi",
                "PICKUP_PIC_PHONE": "081234567890",
                "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
                "PICKUP_DISTRICT": "BABAKAN CIPARAY",
                "PICKUP_CITY": "BANDUNG"
            },
            "address_id": "6af555fc8109274a92d72fb3",
            "id": "26111310VLRPUZ",
            "orderData": [
                {
                    "orderId": "261113W04TMC",
                    "cnote_no": null,
                    "status": "active",
                    "SPECIAL_INS": null
                }
            ],
            "createdAt": "2026-11-13T03:47:00.448Z",
            "updatedAt": "2026-11-13T03:47:01.102Z",
            "courier": "JT"
        }
    ]
}
```

## Query parameters

| Field | Type | Description |
| --- | --- | --- |
| page | Number | The page number. Default `1`, maximum `100`. `0` is rejected with 400. |
| size | Number | The number of batches per page. Default `50`, maximum `100`; a larger value is rejected with 400. A missing or non-numeric value gives the default. Batches have no cursor: to read further back, narrow the list with `dateRange` or the other filters. |
| courier | String | Only the batches of this courier: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos` or `spx`. `Ninja` was discontinued on 1 September 2026, but its past batches can still be read: they are in the list and you can filter them with `courier=Ninja`. Send the exact value: another value is not rejected and can return the wrong list. Without `courier`, the list covers every courier you use. |
| dateRange | String | Only the batches created in this range. A JSON string, `{"startDate":"2026-11-12T00:00:00.000Z","endDate":"2026-11-13T23:59:59.999Z"}`, URL-encoded. Both bounds are exclusive and read as UTC. A value that is not valid JSON is rejected with 400. |
| batchFilter | String | Only the batches where this counter is above `0`: `unpaid`, `error`, `active`, `delivered`, `undelivered`, `rts` or `reconciled`. See the counters below. |
| keyword | String | Searches the batch number. Not case sensitive, and matched as plain text, not as a regular expression. |
| address_id | String | Only the batches picked up at this address: the `_id` from [Get user's addresses](#get-users-addresses). |

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | `true` when the request was processed. |
| count | Number | The total number of batches that match your filters, not only the ones on this page. |
| data | Array | The batches of the page, newest first. An empty array when nothing matches. |
| _id | String | The `_id` of the batch. Use it as `batch_id` in Pay unpaid and as `id` in Delete batch. |
| id | String | The batch number, for example `26111310KDX9LE`. Use it as `batch` in Get orders. Some batches have a suffix, such as `26102713FA471O-1`. |
| courier | String | The courier of the batch. |
| orders | Number | The number of orders in the batch. |
| error | Number | The number of orders that the courier refused. |
| unpaid | Number | The number of orders that are not paid yet, see [Pay unpaid](#pay-unpaid). |
| delivered | Number | The number of orders that are delivered. |
| active | Number | The number of orders that wait for pickup: `active`, `PENDING PICKUP` or `PICKUP FAILED`. |
| undelivered | Number | The number of orders that are not delivered yet: every status other than `DELIVERED`. |
| rts | Number | The number of orders returned to the sender. |
| reconciled | Number | The number of orders that are reconciled. |
| totalToPay | Number | The shipping fee before discount of the unpaid orders, in rupiah. |
| totalToPaySpecial | Number | What you pay for the unpaid orders after the discount, in rupiah. This is what Pay unpaid charges. |
| address | Object | The pickup address of the batch, as it was saved: `PICKUP_NAME`, `PICKUP_PIC`, `PICKUP_PIC_PHONE`, `PICKUP_ADDRESS`, `PICKUP_DISTRICT` and `PICKUP_CITY`. |
| address_id | String | The `_id` of the pickup address. |
| isDeleted | Boolean | Always `false` here: deleted batches are not listed. |
| isArchived | Boolean | `true` for a batch that has moved to the archive. |
| isDraft | Boolean | `true` for a draft batch that has no order yet. |
| printedDates | Array | When the labels of the batch were printed. |
| createdAt | String | When the batch was created, in ISO 8601 UTC. |
| updatedAt | String | When the batch was last changed, in ISO 8601 UTC. |
| orderData | Array | The orders inside the batch. An empty array when the batch has no order. |
| orderData[].orderId | String | The `ORDER_ID` of the order. |
| orderData[].cnote_no | String | The tracking number (AWB). `null` when the order has none yet, for example while it is unpaid. |
| orderData[].status | String | The current status of the order. |
| orderData[].SPECIAL_INS | String | The delivery instruction, as sent in `deliveryInstruction` when the order was created. Some couriers store a default instruction when none was sent; otherwise `null`. |

The response also carries a few more fields for internal use, such as `currentHour`, `user`, `user_id`, `newBatchId` and `draftData`. You do not need them.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| The API key is invalid or inactive, has no `Check order status` permission, or the IP is not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
| `size` is above 100 | 400 | `{ "success": false, "message": "size must not exceed 100; use cursor to fetch the next page" }` |
| `page` is `0` or below | 400 | `{ "success": false, "message": "page must be greater than 0" }` |
| `page` is above 100 | 400 | `{ "success": false, "message": "page must not exceed 100; use cursor (or dateRange) to go further back" }` |
| `dateRange` is not valid JSON | 400 | `{ "success": false, "message": "Error on getBatch" }` |
| Nothing matches | 200 | `{ "success": true, "count": 0, "data": [] }` |
