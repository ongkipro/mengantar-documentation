# Get Invoices and Balance

`GET {BASE_URL}/api/public/{API_KEY}/invoices`

Lists the invoices of your account, newest first, together with your current balance. An invoice is one balance movement: a payment for a batch, a refund, a top up, a withdrawal or a reconciliation. Use it to reconcile your balance with your own system.

A valid, active API key with the `Check balance` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`.

Permission required: Check balance
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/invoices?size=2'
```

## Example response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af6011b7c3d9e4a52f8b001",
            "user": {
                "name": "Budi",
                "email": "budi@example.com"
            },
            "inv_number": "SS121126032870107",
            "type": "typePayment",
            "status": "statusCleared",
            "courier": "lion",
            "amount": 68000,
            "total": 68000,
            "description": "Payment for Non-COD batch 26111210ZWUD21",
            "subItems": [
                {
                    "type": "typePayment",
                    "description": "261112VCA1IF",
                    "amount": -68000,
                    "COD_AMOUNT": 0,
                    "COD_FEE": 0,
                    "estimatedSpecialPrice": 68000,
                    "estimatedPrice": 85000,
                    "status": "statusCompleted",
                    "cnote_no": "C1HR6W0U",
                    "RECEIVER_NAME": "Siti",
                    "RECEIVER_PHONE": "081234567890",
                    "GOODS_DESC": "Kaos polos",
                    "QTY": 1,
                    "PICKUP_NAME": "Gudang Utama"
                }
            ],
            "createdAt": "2026-11-12T03:28:39.657Z",
            "updatedAt": "2026-11-12T03:28:40.185Z",
            "balanceAmount": 294009
        },
        {
            "_id": "6af6021b7c3d9e4a52f8b001",
            "user": {
                "name": "Budi",
                "email": "budi@example.com"
            },
            "inv_number": "SS111126130000845",
            "type": "typeReconciliation",
            "status": "statusCleared",
            "courier": "JT",
            "amount": 66588,
            "total": 66588,
            "description": "Auto Reconciliation",
            "subItems": [
                {
                    "courier": "JT",
                    "type": "typeRevenue",
                    "description": "261111FFW527",
                    "amount": 66588,
                    "COD_AMOUNT": 125000,
                    "COD_FEE": 4162.499999999999,
                    "estimatedSpecialPrice": 58412,
                    "estimatedPrice": 81662,
                    "status": "statusCompleted",
                    "cnote_no": "JJ6000001910",
                    "RECEIVER_NAME": "Siti",
                    "RECEIVER_PHONE": "081234567890",
                    "GOODS_DESC": "Kaos polos",
                    "QTY": 1,
                    "PICKUP_NAME": "Gudang Utama"
                }
            ],
            "createdAt": "2026-11-11T13:00:00.725Z",
            "updatedAt": "2026-11-11T13:00:00.725Z"
        }
    ],
    "count": 5614,
    "balance": 294009,
    "nextCursor": "MjAyNi0xMS0xMVQxMzowMDowMC43MjVafDZhZjYwMjFiN2MzZDllNGE1MmY4YjAwMQ"
}
```

## Filter by type

Add `invoiceFilter` to see only one type of invoice. This example lists withdrawals. `count` is then the number of withdrawals, while `balance` is still your balance.

### Example request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/invoices?invoiceFilter=typeWithdraw&size=1'
```

### Example response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af6051b7c3d9e4a52f8b001",
            "user": {
                "name": "Budi",
                "email": "budi@example.com"
            },
            "inv_number": "SS1310261007202",
            "type": "typeWithdraw",
            "status": "statusPending",
            "courier": "spx",
            "amount": 1001000,
            "total": 1001000,
            "subItems": [],
            "expiration_date": "2026-10-15T03:07:00.000Z",
            "createdAt": "2026-10-13T03:07:25.167Z",
            "updatedAt": "2026-10-13T03:07:25.449Z",
            "balanceAmount": 0
        }
    ],
    "count": 72,
    "balance": 294009,
    "nextCursor": "MjAyNi0xMC0xM1QwMzowNzoyNS4xNjdafDZhZjYwNTFiN2MzZDllNGE1MmY4YjAwMQ"
}
```

## Read the next page

Send the `nextCursor` of the previous response as `cursor` and repeat until `nextCursor` comes back empty. A cursor page is exact at any depth and costs the same whether it is the 2nd or the 500th. Use it instead of `page` for any list longer than a few pages.

### Example request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/invoices?size=2&cursor=MjAyNi0xMS0xMVQxMzowMDowMC43MjVafDZhZjYwMjFiN2MzZDllNGE1MmY4YjAwMQ'
```

### Example response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af6031b7c3d9e4a52f8b001",
            "user": {
                "name": "Budi",
                "email": "budi@example.com"
            },
            "inv_number": "SS111126130000427",
            "type": "typeReconciliation",
            "status": "statusCleared",
            "courier": "spx",
            "amount": 119695,
            "total": 119695,
            "description": "Auto Reconciliation",
            "subItems": [
                {
                    "courier": "spx",
                    "type": "typeRevenue",
                    "description": "261111MF13NE",
                    "amount": 119695,
                    "COD_AMOUNT": 128000,
                    "COD_FEE": 4262,
                    "estimatedSpecialPrice": 8305,
                    "estimatedPrice": 9652,
                    "status": "statusCompleted",
                    "cnote_no": "SPXID06563649935B",
                    "RECEIVER_NAME": "Siti",
                    "RECEIVER_PHONE": "081234567890",
                    "GOODS_DESC": "Kaos polos",
                    "QTY": 1,
                    "PICKUP_NAME": "Gudang Utama"
                }
            ],
            "createdAt": "2026-11-11T13:00:00.101Z",
            "updatedAt": "2026-11-11T13:00:00.101Z"
        },
        {
            "_id": "6af6041b7c3d9e4a52f8b001",
            "user": {
                "name": "Budi",
                "email": "budi@example.com"
            },
            "inv_number": "SS111126062985822",
            "type": "typePayment",
            "status": "statusCleared",
            "courier": "iDexpress",
            "amount": 1067625,
            "total": 1067625,
            "description": "Payment for Non-COD batch 26111113542FR2",
            "subItems": [
                {
                    "type": "typePayment",
                    "description": "261111MTBCUC",
                    "amount": -1067625,
                    "COD_AMOUNT": 0,
                    "COD_FEE": 0,
                    "estimatedSpecialPrice": 1067625,
                    "estimatedPrice": 1186250,
                    "status": "statusCompleted",
                    "cnote_no": "IDE4378561901409",
                    "RECEIVER_NAME": "Siti",
                    "RECEIVER_PHONE": "081234567890",
                    "GOODS_DESC": "Kaos polos",
                    "QTY": 1,
                    "PICKUP_NAME": "Gudang Utama"
                }
            ],
            "createdAt": "2026-11-11T06:29:21.941Z",
            "updatedAt": "2026-11-11T06:29:22.298Z",
            "balanceAmount": 175726
        }
    ],
    "count": 5614,
    "balance": 294009,
    "nextCursor": "MjAyNi0xMS0xMVQwNjoyOToyMS45NDFafDZhZjYwNDFiN2MzZDllNGE1MmY4YjAwMQ"
}
```

## Query parameters

All parameters are optional. Without any, you get the newest 50 invoices.

| Field | Type | Description |
| --- | --- | --- |
| page | Number | Page number. Default `1`, maximum `100`, and it must be above `0`. Ignored when `cursor` is sent. |
| size | Number | Records per page. Default `50`, maximum `100`. A larger value is rejected with 400. `0` or a value that is not a number gives the default. |
| cursor | String | The `nextCursor` of the previous response. Returns the records after that page. An unrecognised value is rejected with 400. |
| keyword | String | Finds invoices by a part of the invoice number, ORDER_ID, tracking number (`cnote_no`) or item description, or by the exact amount. Send plain text: characters such as `(` make the request fail with 400. |
| ids | String | Invoice numbers (`inv_number`) separated by a comma, for example `SS121126032870107,SS111126130000845`. Returns only those invoices. |
| dateRange | String | A JSON object with both `startDate` and `endDate`, for example `{"startDate":"2026-11-01T00:00:00.000Z","endDate":"2026-11-30T23:59:59.999Z"}`. Returns the invoices created after `startDate` and before `endDate`. Without both dates the request fails with 400. |
| invoiceFilter | String | One invoice type, see below. Omit it or send `all` for every type. An unknown type returns an empty list. |

Invoices are always newest first. There is no sorting parameter, so `sort` and `asc` have no effect.

A page holds at most 100 invoices, and `page` goes up to 100. To go further back, use `cursor` or narrow the list with `dateRange`.

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| data | Array | The invoices of this page. An empty array when nothing matches. |
| count | Number | The number of invoices that match your filters, across all pages. |
| balance | Number | Your current balance in rupiah. It does not depend on the filters. |
| nextCursor | String | Send it as `cursor` to read the next page. Empty when the page is the last one. |
| _id | String | The internal ID of the invoice. |
| inv_number | String | The invoice number. |
| type | String | The invoice type, see below. |
| status | String | The invoice status, see below. |
| courier | String | The courier of the invoice, or `system` for a top up. |
| amount | Number | The invoice amount in rupiah. |
| total | Number | The invoice total in rupiah. |
| description | String | What the invoice is for, for example the batch it pays. |
| subItems | Array | The orders in the invoice, each with its `description` (the ORDER_ID), `cnote_no`, `amount`, `status`, `COD_AMOUNT`, `COD_FEE`, `estimatedPrice`, `estimatedSpecialPrice` and receiver details. Empty when the invoice has no orders. |
| user | Object | The `name` and `email` of the account that owns the invoice. |
| ORDER_ID | String | Only on a refund: the order the refund is for. A refund also has `cnote_no`. |
| balanceAmount | Number | Your balance right after this invoice, in rupiah. Not present on every invoice. |
| expiration_date | String | Only on a withdrawal: when the request expires. |
| createdAt | String | When the invoice was created, in ISO 8601 UTC. |
| updatedAt | String | When the invoice was last updated, in ISO 8601 UTC. |

## Invoice types

| `invoiceFilter` | What it is |
| --- | --- |
| `typePayment` | A payment for a batch of orders. |
| `typeRefund` | A refund to your balance, for example for a deleted order. |
| `typeAddBalance` | A top up of your balance. |
| `typeWithdraw` | A withdrawal of your balance. |
| `typeReconciliation` | The automatic settlement of the COD money of delivered orders into your balance. |

## Invoice statuses

| `status` | What it means |
| --- | --- |
| `statusCleared` | Done. |
| `statusPending` | Waiting to be processed. Seen on a withdrawal. |
| `statusProcessing` | Being processed. Seen on a withdrawal. |
| `statusFailed` | Failed. Seen on a withdrawal. |
| `statusExpired` | Expired before it was paid. Seen on a top up. |

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| `size` is above 100 | 400 | `{ "success": false, "message": "size must not exceed 100; use cursor to fetch the next page" }` |
| `page` is above 100 | 400 | `{ "success": false, "message": "page must not exceed 100; use cursor (or dateRange) to go further back" }` |
| `page` is `0` or below | 400 | `{ "success": false, "message": "page must be greater than 0" }` |
| `cursor` is not a `nextCursor` value | 400 | `{ "success": false, "message": "Invalid cursor; send the nextCursor value from the previous response" }` |
| `dateRange` is not valid JSON or lacks a date, or `keyword` has a character such as `(` | 400 | `{ "success": false, "message": "Error on get invoice" }` |
| Invalid or inactive API key, no `Check balance` permission, or IP not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
