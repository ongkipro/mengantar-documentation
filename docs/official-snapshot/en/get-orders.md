# Get orders

`GET {BASE_URL}/api/public/{API_KEY}/order`

Lists your orders, newest first, with filters by courier, COD, status, date and batch. To read one order with its full tracking history, look it up by its tracking number or order number. Use [Pay unpaid](#pay-unpaid) and [Delete orders](#delete-orders) for the orders you read here.

A valid, active API key with the `Check order status` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`.

Permission required: Check order status
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order?size=1&courier=JT&cod=NON_COD'
```

## Example response

```json
{
    "success": true,
    "data": [
        {
            "assignee": null,
            "receiverScore": {
                "delivered": 1,
                "rts": 0,
                "undelivered": 0,
                "rate": 10
            },
            "isBreach": false,
            "COD_AMOUNT": 0,
            "status": "ON DELIVERY",
            "isDeleted": false,
            "isArchived": false,
            "isPaid": true,
            "ticketStatus": "none",
            "printedDates": [],
            "isDangerousGoods": false,
            "_id": "6af68834ce96b86fe95821e9",
            "destinationMark": "",
            "ORDER_ID": "261113IBBQ4K",
            "SHIPPER_NAME": "Gudang Utama",
            "SHIPPER_CONTACT": "Budi",
            "SHIPPER_PHONE": "081234567890",
            "RECEIVER_NAME": "Siti",
            "RECEIVER_ADDR1": "Jalan Melati No. 5",
            "RECEIVER_ADDR2": "",
            "RECEIVER_CITY": "JAKARTA SELATAN",
            "RECEIVER_REGION": "DKI JAKARTA",
            "RECEIVER_PHONE": "081234567890",
            "RECEIVER_SUBDISTRICT": "CIPETE UTARA",
            "RECEIVER_DISTRICT": "KEBAYORAN BARU",
            "ORIGIN_CODE": "BDO",
            "DESTINATION_CODE": "JKT",
            "WEIGHT": 1,
            "GOODS_DESC": "Kaos polos",
            "GOODS_AMOUNT": 100000,
            "cnote_no": "JJ6000001911",
            "user_id": "6af1a2b3c4d5e6f708192a3b",
            "batch": "26111310KDX9LE",
            "price": 11000,
            "estimatedPrice": 11000,
            "courier": "JT",
            "SERVICE_CODE": "REG",
            "lastStatusChange": "2026-11-13T09:15:00.000Z",
            "receiver_id": "6af3c4d5e6f708192a3b4c5d",
            "createdAt": "2026-11-13T03:47:00.448Z"
        }
    ],
    "nextCursor": "MjAyNi0xMS0xM1QwMzo0NzowMC40NDhafDZhZjY4ODM0Y2U5NmI4NmZlOTU4MjFlOQ"
}
```

## Find one order

Send `tracking_id` (the tracking number) or `order_id` (the order number) to get one order. Only this lookup returns `history`, the tracking history of the courier, and it also searches the archive, so it finds older orders too. A delivered order can also carry its proof of delivery: `JNE` adds the link to `history[].proofUrl`, as in the first example.

### Example request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order?tracking_id=0419332600020061'
```

### Example response

```json
{
    "success": true,
    "data": [
        {
            "assignee": null,
            "receiverScore": {
                "delivered": 2,
                "rts": 0,
                "undelivered": 0,
                "rate": 10
            },
            "isBreach": false,
            "COD_AMOUNT": 0,
            "status": "DELIVERED",
            "isDeleted": false,
            "isArchived": false,
            "isPaid": true,
            "ticketStatus": "none",
            "printedDates": [
                "2026-11-10T04:05:14.407Z"
            ],
            "isDangerousGoods": false,
            "_id": "6af2b7d4ce96b86fe95800a1",
            "destinationMark": "",
            "ORDER_ID": "261110KQ7M2D",
            "SHIPPER_NAME": "Gudang Utama",
            "SHIPPER_CONTACT": "Budi",
            "SHIPPER_PHONE": "081234567890",
            "RECEIVER_NAME": "Siti",
            "RECEIVER_ADDR1": "Jalan Melati No. 5",
            "RECEIVER_ADDR2": "",
            "RECEIVER_CITY": "JAKARTA SELATAN",
            "RECEIVER_REGION": "DKI JAKARTA",
            "RECEIVER_PHONE": "081234567890",
            "RECEIVER_SUBDISTRICT": "CIPETE UTARA",
            "RECEIVER_DISTRICT": "KEBAYORAN BARU",
            "ORIGIN_CODE": "BDO10000",
            "DESTINATION_CODE": "CGK20123",
            "WEIGHT": 1,
            "GOODS_DESC": "Kaos polos",
            "GOODS_AMOUNT": 100000,
            "cnote_no": "0419332600020061",
            "user_id": "6af1a2b3c4d5e6f708192a3b",
            "batch": "2611101960C365",
            "price": 20000,
            "estimatedPrice": 20000,
            "courier": "JNE",
            "lastStatusChange": "2026-11-11T10:27:00.000Z",
            "receiver_id": "6af3c4d5e6f708192a3b4c5d",
            "createdAt": "2026-11-10T03:47:00.448Z",
            "history": [
                {
                    "date": "10-11-2026 13:18",
                    "desc": "SHIPMENT RECEIVED AT [BANDUNG] [BDO, OUTBOUND CCC]",
                    "code": "RC1",
                    "location": "BANDUNG"
                },
                {
                    "date": "10-11-2026 14:08",
                    "desc": "PROCESSED AT SORTING CENTER [BDO, HUB OUTBOUND] [BDO, HUB OUTBOUND]",
                    "code": "OP2",
                    "location": "BDO, HUB OUTBOUND"
                },
                {
                    "date": "11-11-2026 08:21",
                    "desc": "SHIPMENT PICKED UP BY JNE COURIER [BANDUNG] []",
                    "code": "PU0"
                },
                {
                    "date": "11-11-2026 08:21",
                    "desc": "SHIPMENT RECEIVED AT [BANDUNG]",
                    "code": "RC1"
                },
                {
                    "date": "11-11-2026 08:21",
                    "desc": "RECEIVED AT SORTING CENTER [BANDUNG]",
                    "code": "OP1"
                },
                {
                    "date": "11-11-2026 08:26",
                    "desc": "RECEIVED AT WAREHOUSE [JAKARTA, CASH SALES (JAKARTA SELATAN)] [JAKARTA, CASH SALES (JAKARTA SELATAN)]",
                    "code": "IP1",
                    "location": "JAKARTA, CASH SALES (JAKARTA SELATAN)"
                },
                {
                    "date": "11-11-2026 09:35",
                    "desc": "WITH DELIVERY COURIER [KEBAYORAN BARU,JAKARTA SELATAN] [JAKARTA, CASH SALES (JAKARTA SELATAN)]",
                    "code": "IP3",
                    "location": "KEBAYORAN BARU,JAKARTA SELATAN"
                },
                {
                    "date": "11-11-2026 10:27",
                    "desc": "DELIVERED TO [SITI | 11-11-2026 10:27 | JAKARTA SELATAN ]",
                    "code": "D01",
                    "location": "JAKARTA SELATAN",
                    "proofUrl": "https://example.com/proof/7c1f2a9e.jpg"
                }
            ]
        }
    ],
    "nextCursor": ""
}
```

The proof of delivery is kept in `proofHistory`, by most couriers and not only by `spx`. It is only returned when you look the order up with `order_id`, as in this second example: a lookup by `tracking_id` and a list return `proofHistory` empty. Not every delivered order has a proof, so treat an empty `proofHistory` from an `order_id` lookup as no proof yet.

### Example request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order?order_id=261110HX4B6V'
```

### Example response

```json
{
    "success": true,
    "data": [
        {
            "assignee": null,
            "receiverScore": {
                "delivered": 2,
                "rts": 0,
                "undelivered": 0,
                "rate": 10
            },
            "isBreach": false,
            "COD_AMOUNT": 0,
            "status": "DELIVERED",
            "isDeleted": false,
            "isArchived": false,
            "isPaid": true,
            "ticketStatus": "none",
            "printedDates": [
                "2026-11-10T04:05:14.407Z"
            ],
            "isDangerousGoods": false,
            "_id": "6af2b7d4ce96b86fe95800b2",
            "destinationMark": "",
            "ORDER_ID": "261110HX4B6V",
            "SHIPPER_NAME": "Gudang Utama",
            "SHIPPER_CONTACT": "Budi",
            "SHIPPER_PHONE": "081234567890",
            "RECEIVER_NAME": "Siti",
            "RECEIVER_ADDR1": "Jalan Melati No. 5",
            "RECEIVER_ADDR2": "",
            "RECEIVER_CITY": "JAKARTA SELATAN",
            "RECEIVER_REGION": "DKI JAKARTA",
            "RECEIVER_PHONE": "081234567890",
            "RECEIVER_SUBDISTRICT": "CIPETE UTARA",
            "RECEIVER_DISTRICT": "KEBAYORAN BARU",
            "ORIGIN_CODE": "BDO10000",
            "DESTINATION_CODE": "CGK20123",
            "WEIGHT": 1,
            "GOODS_DESC": "Kaos polos",
            "GOODS_AMOUNT": 100000,
            "cnote_no": "SPXID06338721090A",
            "user_id": "6af1a2b3c4d5e6f708192a3b",
            "batch": "2611101960D471",
            "price": 12500,
            "estimatedPrice": 12500,
            "courier": "spx",
            "lastStatusChange": "2026-11-11T09:40:00.000Z",
            "receiver_id": "6af3c4d5e6f708192a3b4c5d",
            "createdAt": "2026-11-10T03:52:00.448Z",
            "history": [
                {
                    "date": "10-11-2026 14:06",
                    "desc": "Pengirim telah mengatur pengiriman. Menunggu pesanan diserahkan ke pihak jasa kirim.",
                    "code": "PENDING PICKUP"
                },
                {
                    "date": "10-11-2026 16:20",
                    "desc": "Pesanan tiba di lokasi transit  Bandung 2 First Mile Hub.",
                    "code": "PICKED UP"
                },
                {
                    "date": "10-11-2026 19:09",
                    "desc": "Pesanan dikirim dari lokasi transit  Bandung 2 First Mile Hub.",
                    "code": "ON TRANSIT"
                },
                {
                    "date": "10-11-2026 22:34",
                    "desc": "Pesanan diproses di lokasi sortir  Bandung DC.",
                    "code": "ON TRANSIT"
                },
                {
                    "date": "11-11-2026 02:21",
                    "desc": "Pesanan dikirim dari lokasi sortir  Bandung DC  Jakarta Hub  ",
                    "code": "ON TRANSIT"
                },
                {
                    "date": "11-11-2026 05:08",
                    "desc": "Pesanan diproses di lokasi transit  Jakarta Hub.",
                    "code": "ON TRANSIT"
                },
                {
                    "date": "11-11-2026 06:39",
                    "desc": "Pesanan dalam proses pengantaran.",
                    "code": "ON DELIVERY"
                },
                {
                    "date": "11-11-2026 09:40",
                    "desc": "Pesanan tiba di alamat tujuan. diterima oleh Yang bersangkutan.",
                    "code": "DELIVERED"
                }
            ],
            "proofHistory": [
                {
                    "status": "DELIVERED",
                    "date": "2026-11-11T02:40:45.566Z",
                    "photo": "https://example.com/proof/3b9d41c7.jpg"
                }
            ]
        }
    ],
    "nextCursor": ""
}
```

### History and proof fields

| Field | Type | Description |
| --- | --- | --- |
| history[].date | String | Status timestamp in `DD-MM-YYYY HH:mm` format (Asia/Jakarta timezone). |
| history[].desc | String | Human-readable status description. |
| history[].code | String | The status code of the courier, for example `D01` for delivered. |
| history[].location | String | Where the status happened. Not on every entry. |
| history[].proofUrl | String | Only on a delivered entry of `JNE`: the link to the proof of delivery photo. |
| proofHistory[].status | String | The status the proof belongs to, for example `DELIVERED`. |
| proofHistory[].date | String | When the proof was recorded, in ISO 8601 UTC. |
| proofHistory[].photo | String | The link to the proof photo. |
| proofHistory[].video | String | The link to the proof video, when the courier gave one. |

> [!WARNING]
> **Note:** Tracking history is sourced from third-party couriers, so the entries vary per courier. `date` and `desc` are the common fields of `history`. `code` and `location` are what `JNE` returns, and other couriers may return other fields. The `desc` text is provided by each courier and its wording may differ between them.

## Query parameters

| Field | Type | Description |
| --- | --- | --- |
| page | Number | The page number. Default `1`, maximum `100`. Ignored when `cursor` is sent. See Pagination. |
| size | Number | The number of orders per page. Default `50`, maximum `100`; a larger value is rejected with 400. A missing or non-numeric value gives the default. |
| cursor | String | The `nextCursor` of the previous response. Returns the orders that follow that page. Use it instead of `page` to read a long list; `page` is ignored when it is sent. An invalid value is rejected with 400. |
| courier | String | Only the orders of this courier: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos` or `spx`. `Ninja` was discontinued on 1 September 2026, but its past orders can still be read: they are in the list and you can filter them with `courier=Ninja`. Send the exact value: another value is not rejected and can return the wrong list. Without `courier`, the list covers every courier you use, `Ninja` included. |
| cod | String | `COD` for COD orders only, `NON_COD` for the others. Any other value is ignored. |
| status | String | Only the orders with these statuses. A JSON object such as `{"DELIVERED_PENDING":true,"RTS":true}`, or a comma list such as `DELIVERED_PENDING,RTS`. The keys are the status codes of the [Order Status Reference Sheet](https://docs.google.com/spreadsheets/d/1Z9MV8PEsqBCp7nNUyPdhypYSneVnzDR8pw3JDf6nQSw/edit?usp=sharing). |
| dateRange | String | Only the orders created in this range. A JSON string, `{"startDate":"2026-11-12T00:00:00.000Z","endDate":"2026-11-13T23:59:59.999Z"}`, URL-encoded. See Date range below. |
| batch | String | Only the orders of this batch. Send the batch number, for example `26111310KDX9LE`: the `batch` field of an order, not the `_id` of the batch. |
| tracking_id | String | The tracking number (`cnote_no`). Returns that order with its `history`. |
| order_id | String | The order number (`ORDER_ID`). Returns that order with its `history`. |
| keyword | String | Searches the order number, the tracking number and the receiver name. Not case sensitive. It is read as a regular expression, so characters such as `[`, `(` and `+` have a special meaning: escape them, or a name that contains them may not find itself. |

### Date range

`dateRange` filters on `createdAt`. It is read in Jakarta time (WIB) by whole days: `endDate` always runs to the end of its day. The edges are not exact: a `startDate` of `2026-11-13T00:00:00.000Z` only matches orders created from 07:00 UTC on 13 November. Start one day earlier than you need, and filter on `createdAt` yourself when you need to be exact. Only the `dateRange` form is supported; `dateRange.startDate` and `dateRange.endDate` with full datetimes are ignored. A value that is not valid JSON is rejected with 400. With curl, let `--data-urlencode` encode it:

```bash
curl -G '{BASE_URL}/api/public/{API_KEY}/order' \
--data-urlencode 'size=50' \
--data-urlencode 'dateRange={"startDate":"2026-11-12T00:00:00.000Z","endDate":"2026-11-13T23:59:59.999Z"}'
```

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | `true` when the request was processed. |
| data | Array | The orders of the page, newest first. An empty array when nothing matches. |
| nextCursor | String | The cursor of the next page, or an empty string on the last page. See Pagination. |
| _id | String | The `_id` of the order. |
| ORDER_ID | String | The order number. |
| cnote_no | String | The tracking number (AWB). Empty while the order is unpaid or when it failed. |
| courier | String | The courier of the order. |
| SERVICE_CODE | String | The courier service of the order, for example `REG` for J&T Regular or `ECO` for a J&T ECO order (the `courier` stays `JT` for both). Absent when the order has no service code. |
| batch | String | The batch number of the order. Use it as `batch` to filter. |
| status | String | The status of the order: the status text of the courier, such as `ON DELIVERY`, `DELIVERED` or `RTS`; `active` before the courier has any update; `error` when the courier refused the order. See the Order Status Reference Sheet. |
| lastStatusChange | String | When the status last changed, in ISO 8601. |
| isPaid | Boolean | `false` while the order is unpaid, see [Pay unpaid](#pay-unpaid). |
| isDeleted | Boolean | Always `false` here: deleted orders are not listed. |
| isArchived | Boolean | `true` for an order that has moved to the archive. |
| price | Number | The shipping fee before discount, in rupiah. |
| estimatedPrice | Number | `price` plus the COD fee. |
| COD_AMOUNT | Number | The COD amount. `0` for a non-COD order. |
| GOODS_AMOUNT | Number | The goods value in rupiah. For a COD order it is the COD amount. |
| GOODS_DESC | String | The `parcelContent` you sent. |
| WEIGHT | Number | The weight of the order in kg. |
| isDangerousGoods | Boolean | `true` for a dangerous goods order. |
| assignee | String | The `_id` of the team member the order is assigned to, or `null`. |
| destinationMark | String | The landmark of the destination you sent. |
| SHIPPER_NAME | String | The name of the pickup address. |
| SHIPPER_CONTACT | String | The contact person of the pickup address. |
| SHIPPER_PHONE | String | The phone number of the pickup address. |
| RECEIVER_* | String | The receiver as it was saved on the order: `RECEIVER_NAME`, `RECEIVER_PHONE`, `RECEIVER_ADDR1`, `RECEIVER_ADDR2`, `RECEIVER_SUBDISTRICT`, `RECEIVER_DISTRICT`, `RECEIVER_CITY` and `RECEIVER_REGION`. |
| ORIGIN_CODE | String | The origin code of the courier. |
| DESTINATION_CODE | String | The destination code of the courier. Not every courier has one. |
| createdAt | String | When the order was created, in ISO 8601 UTC. |
| user_id | String | The `_id` of your account. |
| receiver_id | String | The `_id` of the receiver, the same for the same phone number. |
| receiverScore | Object | How this receiver did on past orders: `delivered`, `rts` and `undelivered` counts, and a score in `rate`. See [Get receiver score by number](#get-receiver-score-number). |
| ticketStatus | String | The status of the courier ticket of the order. `none` when there is no ticket. |
| printedDates | Array | When the label was printed. |
| isBreach | Boolean | `true` when the order is flagged as late. |
| history | Array | Only when you look the order up with `tracking_id` or `order_id`: the tracking history. See Find one order. |
| proofHistory | Array | The proof photos and videos kept for the order, such as the proof of delivery. Each item has `photo` and `video` (links), `status` and `date`. Only filled when you look the order up with `order_id`; empty in a list and with `tracking_id`. See Find one order. |
| dropShipperId | String | Only on a dropship order: the ID of the dropshipper. |
| dropShipper | Object | Only on a dropship order: the `id`, `name` and `phone` of the dropshipper. |

The response also carries a few internal fields (`ticket`, `ticketRTS`, `ticketDamaged`, `count`, `total`, `lastUpdateHours` and `currentHour`) and each order a few more, such as `productOrders` and `customProductOrderIds`. You do not need them.

## Pagination

A page holds at most **100** records (`size`, default 50) and `page` goes up to **100**. Beyond that, or for any list longer than a few pages, read with `cursor`: send the `nextCursor` value of the previous response and repeat until it comes back empty. A cursor page is exact at any depth and costs the same whether it is the 2nd or the 500th.

```bash
# First page
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order?size=100'
# Next page: pass nextCursor from the previous response
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order?size=100&cursor=MjAyMi0wOS0xNVQw...'
```

The response carries `nextCursor`: an opaque string for the next page, or an empty string when the page returned is the last one.

Without `dateRange` the list covers orders that have not been archived yet (roughly the last 6 months), across the couriers your account has orders in. To read older orders, send a `dateRange` that covers them. Looking up a single order by `order_id` or `tracking_id` always searches the archive as well.

Without `courier` the page is merged across every courier your account uses, so `page` × `size` may not exceed **1,500** there (page 15 at size 100, page 30 at size 50). To go further back, name a `courier` or use `cursor`. The same ceiling applies to a single courier when the `dateRange` starts more than six months back (or a lookup sends no `dateRange`), because such a page is merged from current and archived orders.

Requests above the limits are rejected before any data is read:

```json
{ "success": false, "message": "size must not exceed 100; use cursor to fetch the next page" }
{ "success": false, "message": "page must not exceed 100; use cursor (or dateRange) to go further back" }
{ "success": false, "message": "page x size must not exceed 1500 without courier; send courier or use cursor to go further back" }
{ "success": false, "message": "page x size must not exceed 1500 when the date range reaches the archive; use cursor to go further back" }
{ "success": false, "message": "Invalid cursor; send the nextCursor value from the previous response" }
```

## Order status

The status of an order is the response of the courier. To keep it simple, you only need to know **DELIVERED**, **RTS**, and that everything else is **ON GOING**. For the full list of courier status codes and their meanings, see the [Order Status Reference Sheet](https://docs.google.com/spreadsheets/d/1Z9MV8PEsqBCp7nNUyPdhypYSneVnzDR8pw3JDf6nQSw/edit?usp=sharing).

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| The API key is invalid or inactive, has no `Check order status` permission, or the IP is not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
| `size`, `page` or `page` × `size` is over the limit, or `cursor` is invalid | 400 | One of the messages listed under Pagination. |
| `dateRange` is not valid JSON | 400 | `{ "success": false, "message": "Error on getOrders", "error": {} }` |
| `order_id` is not a single value, for example a repeated `order_id=A&order_id=B`, `order_id[]=` or `order_id[key]=x` | 400 | `{ "success": false, "message": "Invalid order_id" }` |
| Nothing matches | 200 | `{ "success": true, "data": [], "nextCursor": "" }` (plus the internal fields) |
