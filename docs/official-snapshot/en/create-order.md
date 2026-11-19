# Create order

`POST {BASE_URL}/api/public/{API_KEY}/order`

Creates a batch of orders for one courier and one pickup. Every order in `orders` is shipped by the courier you choose in `courier` and picked up at the same address and time. The response lists the created orders and the batch. Use [Check Shipping Fee](#check-shipping-fee) first to choose a courier and see the price.

A valid, active API key with the `Create order` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`. You also need a saved address ([Add user's address](#add-users-address)) and, for a scheduled pickup, a pickup time ([Add Time](#add-time)).

Permission required: Create order
Environment: Sandbox and production

## Example request

```bash
# Here is a COD curl example
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "pickup": {
    "type": "scheduledPickup",
    "volume": "volumeMotor",
    "address_id": "6af555fc8109274a92d72fb3",
    "time_id": "6af583fb9708e74dced0799e"
  },
  "orders": [
    {
      "COD": 100000,
      "customerName": "Siti",
      "customerAddress": "Jalan Melati No. 5",
      "customerAddressDataId": "5fc62f60f8f44b34aa4c0dc9",
      "customerPhone": "081234567890",
      "parcelContent": "Kaos polos",
      "weight": 1,
      "quantity": 1
    }
  ]
}'
```

## Example response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af68834ce96b86fe95821e9",
            "ORDER_ID": "261113IBBQ4K",
            "cnote_no": "JJ6000001911",
            "isPaid": true,
            "status": "active",
            "statusCategory": "active",
            "batch": "26111310KDX9LE",
            "batch_id": "6af68834ce96b86fe95821d1",
            "assignee": null,
            "COD_AMOUNT": 100000,
            "COD_FEE": 3329,
            "GOODS_AMOUNT": 100000,
            "price": 11000,
            "estimatedPrice": 14329,
            "estimatedSpecialPrice": 10479,
            "discountPercent": 30,
            "discountExtraPercent": 5,
            "discount": 3300,
            "discountExtra": 550,
            "WEIGHT": 1,
            "QTY": 1,
            "SERVICE_CODE": "REG",
            "GOODS_DESC": "Kaos polos",
            "isDangerousGoods": false,
            "cargo": false,
            "PICKUP_NAME": "Gudang Utama",
            "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
            "PICKUP_DISTRICT": "BABAKAN CIPARAY",
            "PICKUP_CITY": "BANDUNG",
            "PICKUP_PIC_PHONE": "081234567890",
            "RECEIVER_NAME": "Siti",
            "RECEIVER_ADDR1": "Jalan Melati No. 5",
            "RECEIVER_SUBDISTRICT": "CIPETE UTARA",
            "RECEIVER_DISTRICT": "KEBAYORAN BARU",
            "RECEIVER_CITY": "JAKARTA SELATAN",
            "RECEIVER_ZIP": "12150",
            "RECEIVER_PHONE": "081234567890",
            "address_id": "6af555fc8109274a92d72fb3",
            "time_id": "6af583fb9708e74dced0799e",
            "createdAt": "2026-11-13T03:47:00.448Z"
        }
    ],
    "batch": "26111310KDX9LE",
    "batch_id": "6af68834ce96b86fe95821d1",
    "courier": "JT",
    "errors": [],
    "ordersClosedDestination": []
}
```

`data` has one entry per created order. The response of each order has more fields than shown here. The example shows the ones you will use.

## Non-COD order

Send `goodsValue` instead of `COD`. The shipping fee is charged to your balance when the order is created.

### Example request

```bash
# Here is a Non-COD curl example
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "pickup": {
    "type": "scheduledPickup",
    "volume": "volumeMotor",
    "address_id": "6af555fc8109274a92d72fb3",
    "time_id": "6af583fb9708e74dced0799e"
  },
  "orders": [
    {
      "goodsValue": 100000,
      "customerName": "Siti",
      "customerAddress": "Jalan Melati No. 5",
      "customerAddressDataId": "5fc62f60f8f44b34aa4c0dc9",
      "customerPhone": "081234567890",
      "parcelContent": "Kaos polos",
      "weight": 1,
      "quantity": 1
    }
  ]
}'
```

### Example response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af68834ce96b86fe95821e9",
            "ORDER_ID": "261113IBBQ4K",
            "cnote_no": "JJ6000001911",
            "isPaid": true,
            "status": "active",
            "statusCategory": "active",
            "batch": "26111310KDX9LE",
            "batch_id": "6af68834ce96b86fe95821d1",
            "assignee": null,
            "COD_AMOUNT": 0,
            "GOODS_AMOUNT": 100000,
            "price": 11000,
            "estimatedPrice": 11000,
            "estimatedSpecialPrice": 7150,
            "discountPercent": 30,
            "discountExtraPercent": 5,
            "discount": 3300,
            "discountExtra": 550,
            "WEIGHT": 1,
            "QTY": 1,
            "SERVICE_CODE": "REG",
            "GOODS_DESC": "Kaos polos",
            "isDangerousGoods": false,
            "cargo": false,
            "PICKUP_NAME": "Gudang Utama",
            "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
            "PICKUP_DISTRICT": "BABAKAN CIPARAY",
            "PICKUP_CITY": "BANDUNG",
            "PICKUP_PIC_PHONE": "081234567890",
            "RECEIVER_NAME": "Siti",
            "RECEIVER_ADDR1": "Jalan Melati No. 5",
            "RECEIVER_SUBDISTRICT": "CIPETE UTARA",
            "RECEIVER_DISTRICT": "KEBAYORAN BARU",
            "RECEIVER_CITY": "JAKARTA SELATAN",
            "RECEIVER_ZIP": "12150",
            "RECEIVER_PHONE": "081234567890",
            "address_id": "6af555fc8109274a92d72fb3",
            "time_id": "6af583fb9708e74dced0799e",
            "createdAt": "2026-11-13T03:47:00.448Z"
        }
    ],
    "batch": "26111310KDX9LE",
    "batch_id": "6af68834ce96b86fe95821d1",
    "courier": "JT",
    "errors": [],
    "ordersClosedDestination": []
}
```

## Dropship order

Add the optional `dropShipper` object to an order to ship it under the name and phone number of a saved dropshipper. Get the dropshipper from [Add Dropshipper](#add-dropshipper) or [Search Dropshipper](#search-dropshipper) first.

### Example request

```bash
# Here is a dropship curl example
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "pickup": {
    "type": "scheduledPickup",
    "volume": "volumeMotor",
    "address_id": "6af555fc8109274a92d72fb3",
    "time_id": "6af583fb9708e74dced0799e"
  },
  "orders": [
    {
      "goodsValue": 100000,
      "customerName": "Siti",
      "customerAddress": "Jalan Melati No. 5",
      "customerAddressDataId": "5fc62f60f8f44b34aa4c0dc9",
      "customerPhone": "081234567890",
      "parcelContent": "Kaos polos",
      "weight": 1,
      "quantity": 1,
      "dropShipper": {
        "id": "66ab1234567890abcdef1234",
        "name": "Toko Partner",
        "phone": "081234567890"
      }
    }
  ]
}'
```

### Example response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af68834ce96b86fe95821ea",
            "ORDER_ID": "261113W04TMC",
            "cnote_no": "JJ6000001912",
            "isPaid": true,
            "status": "active",
            "statusCategory": "active",
            "batch": "26111310KDX9LE",
            "batch_id": "6af68834ce96b86fe95821d1",
            "assignee": null,
            "COD_AMOUNT": 0,
            "GOODS_AMOUNT": 100000,
            "price": 11000,
            "estimatedPrice": 11000,
            "estimatedSpecialPrice": 7150,
            "discountPercent": 30,
            "discountExtraPercent": 5,
            "discount": 3300,
            "discountExtra": 550,
            "WEIGHT": 1,
            "QTY": 1,
            "SERVICE_CODE": "REG",
            "GOODS_DESC": "Kaos polos",
            "isDangerousGoods": false,
            "cargo": false,
            "PICKUP_NAME": "Toko Partner",
            "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
            "PICKUP_DISTRICT": "BABAKAN CIPARAY",
            "PICKUP_CITY": "BANDUNG",
            "PICKUP_PIC_PHONE": "081234567890",
            "RECEIVER_NAME": "Siti",
            "RECEIVER_ADDR1": "Jalan Melati No. 5",
            "RECEIVER_SUBDISTRICT": "CIPETE UTARA",
            "RECEIVER_DISTRICT": "KEBAYORAN BARU",
            "RECEIVER_CITY": "JAKARTA SELATAN",
            "RECEIVER_ZIP": "12150",
            "RECEIVER_PHONE": "081234567890",
            "address_id": "6af555fc8109274a92d72fb3",
            "time_id": "6af583fb9708e74dced0799e",
            "createdAt": "2026-11-13T03:47:00.448Z",
            "dropShipperId": "66ab1234567890abcdef1234",
            "dropShipper": {
                "id": "66ab1234567890abcdef1234",
                "name": "Toko Partner",
                "phone": "081234567890"
            }
        }
    ],
    "batch": "26111310KDX9LE",
    "batch_id": "6af68834ce96b86fe95821d1",
    "courier": "JT",
    "errors": [],
    "ordersClosedDestination": []
}
```

## Order with custom products

Add `customProducts` to list the products in the parcel. They are printed in the product table of the label. The `weight` and the `quantity` of the order must equal the totals of the products: here `0.5 × 2 + 1 × 1 = 2` kg and `2 + 1 = 3` items. The products are saved right after the order is created, so `customProductOrderIds` is still empty in this response; it is filled in when you read the order with [Get orders](#get-orders).

### Example request

```bash
# Here is a custom products curl example
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order' \
-H 'Content-Type: application/json' \
-d '{
  "courier": "JT",
  "pickup": {
    "type": "scheduledPickup",
    "volume": "volumeMotor",
    "address_id": "6af555fc8109274a92d72fb3",
    "time_id": "6af583fb9708e74dced0799e"
  },
  "orders": [
    {
      "goodsValue": 125000,
      "customerName": "Siti",
      "customerAddress": "Jalan Melati No. 5",
      "customerAddressDataId": "5fc62f60f8f44b34aa4c0dc9",
      "customerPhone": "081234567890",
      "parcelContent": "Kaos polos dan topi",
      "weight": 2,
      "quantity": 3,
      "customProducts": [
        { "name": "Kaos polos", "variant": "M", "qty": 2, "price": 50000, "weight": 0.5 },
        { "name": "Topi", "variant": "Hitam", "qty": 1, "price": 25000, "weight": 1 }
      ]
    }
  ]
}'
```

### Example response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af68834ce96b86fe95821eb",
            "ORDER_ID": "261113XPCRD8",
            "cnote_no": "JJ6000001913",
            "isPaid": true,
            "status": "active",
            "statusCategory": "active",
            "batch": "26111310KDX9LE",
            "batch_id": "6af68834ce96b86fe95821d1",
            "assignee": null,
            "COD_AMOUNT": 0,
            "GOODS_AMOUNT": 125000,
            "price": 22000,
            "estimatedPrice": 22000,
            "estimatedSpecialPrice": 14300,
            "discountPercent": 30,
            "discountExtraPercent": 5,
            "discount": 6600,
            "discountExtra": 1100,
            "WEIGHT": 2,
            "QTY": 3,
            "SERVICE_CODE": "REG",
            "GOODS_DESC": "Kaos polos",
            "isDangerousGoods": false,
            "cargo": false,
            "PICKUP_NAME": "Gudang Utama",
            "PICKUP_ADDRESS": "Jl. Margasuka Raya No. 12",
            "PICKUP_DISTRICT": "BABAKAN CIPARAY",
            "PICKUP_CITY": "BANDUNG",
            "PICKUP_PIC_PHONE": "081234567890",
            "RECEIVER_NAME": "Siti",
            "RECEIVER_ADDR1": "Jalan Melati No. 5",
            "RECEIVER_SUBDISTRICT": "CIPETE UTARA",
            "RECEIVER_DISTRICT": "KEBAYORAN BARU",
            "RECEIVER_CITY": "JAKARTA SELATAN",
            "RECEIVER_ZIP": "12150",
            "RECEIVER_PHONE": "081234567890",
            "address_id": "6af555fc8109274a92d72fb3",
            "time_id": "6af583fb9708e74dced0799e",
            "createdAt": "2026-11-13T03:47:00.448Z",
            "customProductOrderIds": []
        }
    ],
    "batch": "26111310KDX9LE",
    "batch_id": "6af68834ce96b86fe95821d1",
    "courier": "JT",
    "errors": [],
    "ordersClosedDestination": []
}
```

## Body parameters

| Field | Type | Description |
| --- | --- | --- |
| courier | String | Required. `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos` or `spx`. It is case sensitive. `Ninja` is discontinued from 1 September 2026 and is rejected with 400. |
| pickup | Object | Required. How and where the courier picks up the orders. |
| pickup.type | String | Required. `scheduledPickup` or `dropOff`. For `JNE` and `spx`, `dropOff` is only accepted when Drop Off is enabled for your account, contact admin to enable it. `anteraja` does not support `dropOff`. |
| pickup.address_id | String | Required. The `_id` of one of your saved addresses, from [Get user's addresses](#get-users-addresses) or [Add user's address](#add-users-address). |
| pickup.time_id | String | Required for `scheduledPickup`, not needed for `dropOff`. The `_id` of a pickup time, from [Get Time](#get-time) or [Add Time](#add-time). The pickup must be at least 90 minutes from now. For `spx`, the time must also fall inside a slot SPX has open for that day. |
| pickup.volume | String | Required for `scheduledPickup`, not needed for `dropOff`. `volumeMotor`, `volumeMobil` or `volumeTruck`. |
| orders | Array | Required. The orders of the batch. It cannot be empty. |
| orders.COD | Number | The COD amount: goods value plus shipping fee plus COD fee. At least Rp1,000, and at most the COD limit of the courier, see the courier limits in [Check Shipping Fee](#check-shipping-fee). Send `COD` or `goodsValue`, not both. If you send both, `COD` is used. |
| orders.goodsValue | Number | The goods value, for a non-COD order. Required when `COD` is empty. It must be a number. |
| orders.customerName | String | Required. The receiver name. |
| orders.customerAddress | String | Required. The receiver street address. |
| orders.customerAddressDataId | String | Required. The `_id` of the destination area, from [Search address data](#search-address-data). |
| orders.customerPhone | String | Required. The receiver phone number, 10 to 15 digits. The country code counts, so `62` and `+62` are digits of the number. Dashes and spaces are accepted. An extension such as `x12` is accepted, but its digits do not count. |
| orders.parcelContent | String | Required. What is in the parcel, for example the product name. |
| orders.weight | Number | The total weight in kg. Send a positive number: a negative number is rejected with 400. `JT` rejects more than `50` kg, and `anteraja`, `pos` and `spx` accept 1 to 50 kg, see the courier limits in [Check Shipping Fee](#check-shipping-fee). When you send `customProducts`, it must equal the sum of `qty` × `weight` of all items. |
| orders.quantity | Number | The number of items. When you send `customProducts`, it must equal the sum of the `qty` of all items. |
| orders.assignee | String | Optional. The `_id` of a team member, from [Get My Users](#get-my-users-assignee). |
| orders.destinationMark | String | Optional. A landmark of the destination. |
| orders.deliveryInstruction | String | Optional. A note for the courier. |
| orders.dontIncludeSubdistrict | Boolean | Optional. Leave the subdistrict out of the receiver address on the label. |
| orders.cargo | Boolean | Optional. `true` ships the order with the cargo service. Cargo is available for `JNE`, `SiCepat`, `Sap` and `iDexpress`. |
| orders.eco | Boolean | Optional. Only for `courier` `JT`. `true` books the J&T ECO service. Omitted, `false` or `null` books the regular service (REG). Each order of a batch picks its own service. It cannot be combined with `cargo` or `isDangerousGoods`. ECO is only available on some routes: it is the `JTEco` entry of the estimate. An ECO order to a route without ECO is not created and comes back in `ordersClosedDestination`; it is never switched to REG. `JTEco` is not a value of `courier`. |
| orders.isDangerousGoods | Boolean | Optional. Default `false`. `true` creates a dangerous goods order. It must be a JSON Boolean, not a string. Only `SiCepat` and `iDexpress` accept it, see below. |
| orders.dropShipper | Object | Optional. A saved dropshipper, with `id`, `name` and `phone`. All three are required and must match the saved dropshipper exactly. |
| orders.customProducts | Array | Optional. The products in the parcel, shown on the label. Each item has `name` (required), `qty` (required), and optional `variant`, `price` and `weight` (default `1`). `quantity` and `orderQuantity` are accepted instead of `qty`, and `harga` or `regularPrice` instead of `price`. |

Fields that the system sets are rejected with 400 `Fields not allowed in public API request`, followed by the names of the fields: `price`, `estimatedPrice`, `estimatedSpecialPrice`, `isFlat`, `discount`, `discountPercent`, `discountExtra`, `discountExtraPercent`, `allEstimateData`, `iDlite` and `iDliteDiscount`. It is refused as soon as the key is there, even with the value `0`, `null` or an empty string, and wherever you put it: in the body, in `pickup` or in an order.

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| data | Array | The orders that were created. |
| batch | String | The batch number, for example `26111310KDX9LE`. |
| batch_id | String | The `_id` of the batch. Use it as `batch_id` in [Pay unpaid](#pay-unpaid) and as `id` in [Delete batch](#delete-batch). |
| courier | String | The courier of the batch. |
| errors | Array | Empty when the batch was created. |
| ordersClosedDestination | Array | The orders that were not created because the courier does not serve their destination. See below. |
| _id | String | The `_id` of the order. |
| ORDER_ID | String | The order number. |
| cnote_no | String | The tracking number (AWB). `null` or empty while the order is unpaid or when it failed. |
| isPaid | Boolean | `false` when your balance was not enough, see below. |
| status | String | `active` for a created order, `error` when the courier refused it, see below. |
| error | String | Only when `status` is `error`: the message of the courier. |
| price | Number | The shipping fee before discount, in rupiah. |
| COD_AMOUNT | Number | The COD amount. `0` for a non-COD order. |
| COD_FEE | Number | The COD service fee. `0` for a non-COD order. |
| estimatedPrice | Number | `price` plus the COD fee. Same as in [Check Shipping Fee](#check-shipping-fee). |
| estimatedSpecialPrice | Number | What you pay after the discount. Same as in [Check Shipping Fee](#check-shipping-fee). |
| discountPercent | Number | The discount in percent. |
| discount | Number | The discount in rupiah. |
| discountExtraPercent | Number | The extra discount in percent. |
| discountExtra | Number | The extra discount in rupiah. |
| SERVICE_CODE | String | The service that was booked: `REG`, or `ECO` for a J&T ECO order. |
| statusCategory | String | The status group of the order, such as `active` or `error`. |
| GOODS_AMOUNT | Number | The goods value in rupiah. For a COD order it is the COD amount. |
| GOODS_DESC | String | The `parcelContent` you sent. |
| WEIGHT | Number | The weight of the order in kg. |
| QTY | Number | The number of items. |
| assignee | String | The `_id` of the team member the order is assigned to, or `null`. |
| cargo | Boolean | `true` when the order uses the cargo service. |
| isDangerousGoods | Boolean | `true` when the order is a dangerous goods order. |
| address_id | String | The `_id` of the pickup address you sent. |
| time_id | String | The `_id` of the pickup time you sent. |
| createdAt | String | When the order was created, in ISO 8601 UTC. |
| PICKUP_* | String | The pickup address as it was saved on the order, for example `PICKUP_NAME`, `PICKUP_ADDRESS` and `PICKUP_CITY`. |
| RECEIVER_* | String | The receiver as it was saved on the order, for example `RECEIVER_NAME`, `RECEIVER_ADDR1` and `RECEIVER_PHONE`. |
| dropShipperId | String | Only on a dropship order: the ID of the dropshipper. |
| dropShipper | Object | Only on a dropship order: the `id`, `name` and `phone` of the dropshipper. |

## Read the result

HTTP `200` and `success: true` mean the batch was processed, not that every order was shipped. Check each order:

- **`status: "active"` with a `cnote_no`:** the order is created and has its tracking number.
- **`isPaid: false`:** your balance was not enough, see Unpaid orders below. No tracking number yet.
- **`status: "error"` and an `error` message:** the courier refused the order, for example because it does not serve the route. The batch is still created. Delete it with [Delete batch](#delete-batch) or fix the order and send it again.
- **An order in `ordersClosedDestination`:** the destination is not served by the courier. The order is not created and is not in `data`.

## Unpaid orders

For a non-COD order, the shipping fee is charged to your balance. If the balance is not enough, the order is still created with `isPaid: false` and `cnote_no: null`, and nothing is charged. After you top up your balance, pay it with [Pay unpaid](#pay-unpaid) and the tracking number is created. COD orders are not charged when they are created.

> [!SANDBOX]
> To add balance in the sandbox, use **Top Up Saldo** in the Mengantar app, then complete the payment in the Midtrans sandbox simulator: [https://simulator.sandbox.midtrans.com/](https://simulator.sandbox.midtrans.com/)

## Dangerous Goods

Before creating a DG order, call a shipping estimate endpoint with `isDangerousGoods=true`. Proceed only when `isDangerousGoodsSupported` is `true` and `unsupported` is `false`.

| Courier | Create Order DG | Service |
| --- | --- | --- |
| `SiCepat` | `true` | `HALU` |
| `iDexpress` | `true` | Regular service |

**Validation errors return HTTP 400:**

```json
{
  "success": false,
  "message": "orders[0].isDangerousGoods must be a boolean"
}
```

- `Dangerous goods cannot be combined with cargo service`
- `Dangerous goods service is not supported by courier {courier}`
- `Dangerous goods service is not available for destination of orders[{index}]`

## Dropshipper

Enable the Dropshipper feature through Seller Web before you use `dropShipper`. The name and phone number of the saved dropshipper become the sender identity on the shipment and the label. The pickup address stays the address you chose in the request, and the saved address is not changed. Create order never creates a dropshipper, and in a batch with several orders the other orders keep your own identity. Dropshipper validation runs for the whole batch before any order is created. If one order has an invalid reference, the whole request is rejected and nothing is created.

| HTTP status | Condition |
| --- | --- |
| 200 | The order batch was created. Every dropship order includes `dropShipperId` and the matching `dropShipper` reference in its response item. |
| 400 | A dropshipper field is missing, the ID is invalid or not owned by the API Key account, or the submitted name/phone does not exactly match the saved master. No order in the batch is created. |
| 403 | The account's Dropshipper feature is disabled. No order in the batch is created. |
| 500 | Dropshipper validation could not be completed because of an internal error. No order is dispatched. |

```json
Invalid dropshipper example (HTTP 400):
{
    "success": false,
    "message": "Invalid dropshipper data",
    "errors": [
        {
            "order": 1,
            "path": "orders[0].dropShipper",
            "message": "name or phone does not match the saved dropshipper"
        }
    ]
}
```

## Idempotency key (optional)

A create order request can time out on your side while Mengantar is still creating the batch. Retrying it then creates the same orders a second time. To retry safely, send the `idempotencyKey` header with a reference from your own system for this request, for example your order or batch number, and send the same value again on every retry of that request.

```bash
curl --location '{BASE_URL}/api/public/{API_KEY}/order' \
--header 'Content-Type: application/json' \
--header 'idempotencyKey: INV-2026-0001' \
--data '{ ...same body as above... }'
```

| Header | Type | Description |
| --- | --- | --- |
| idempotencyKey | String | (Optional). 1–50 characters; leading and trailing spaces are ignored. A key is remembered for **24 hours** from the first request that used it, per API Key account: the same key from another account is unrelated. Without this header the request is processed exactly as before. It is read from the header only, never from the body, and is ignored on a `validate` request. |

Two requests are the same request when they carry the same key and the same body (the order of JSON fields does not matter).

| HTTP status | Condition |
| --- | --- |
| Same as the first request | The key was already used with the same body and that request has finished. The first response is returned again, with the same `batch`, `batch_id` and per-order results, and no new batch or order is created. The response carries the header `Idempotent-Replayed: true` and the field `"idempotentReplayed": true`. The orders are as they were when first created; use `GET /order` for their current status. This applies to a first request that failed with a 5xx too: it may have created part of the batch, so it is not run again. |
| 400 | `code: IDEMPOTENCY_KEY_INVALID`. The header is empty or longer than 50 characters. No batch is created. |
| 409 | `code: IDEMPOTENCY_REQUEST_IN_PROGRESS`. The first request with this key is still being processed. No batch is created. Retry with the same key after the number of seconds in the `Retry-After` header to get its result. |
| 409 | `code: IDEMPOTENCY_REQUEST_UNRESOLVED`. The first request with this key never finished. It may have created some orders, so it is not run again: check `GET /order` and send any missing orders with a new key. |
| 422 | `code: IDEMPOTENCY_KEY_REUSED`. The key was already used for a request with a different body. No batch is created. |
| 503 | `code: IDEMPOTENCY_UNAVAILABLE`. The key could not be checked. No batch is created; retry with the same key. |

When the first request is rejected with a 4xx before any order is created (for example a validation error), the key is released: fix the body and send it again with the same key.

A replay is a copy of the first response, not the current state of its orders. Deleting the batch or its orders (see [Delete Batch](#delete-batch)) does not release the key: sending the same key again still returns the old response, with `"idempotentReplayed": true` and the old `batch_id` and AWB numbers, and no new order is created. To create the orders again after a delete, send them with a **new** key. Use `GET /order` to check whether the orders are still active.

**Recommended retry flow**

1. Send the request with `idempotencyKey` set to your own reference, for example `INV-2026-0001`.
2. If the connection times out or drops, send the **exact same body** again with the **same key**. Do not regenerate values that change on every call (timestamps, random IDs), or the retry is seen as a different request.
3. On `409 IDEMPOTENCY_REQUEST_IN_PROGRESS`, wait for the `Retry-After` seconds and retry with the same key.
4. Stop when you get the batch back (a first response, or a replay with `"idempotentReplayed": true`).
5. On a replayed 5xx or `409 IDEMPOTENCY_REQUEST_UNRESOLVED`, check `GET /order` first, then send only the missing orders with a **new** key.

```json
Replayed result, same key and same body after the first request finished (HTTP 200).
Response header: Idempotent-Replayed: true
{
    "success": true,
    "data": [
        {
            "_id": "697c58034fa61abe7c700da9",
            "batch_id": "697c58034fa61abe7c700da6",
            "batch": "26013014BBQFMM",
            "ORDER_ID": "260130OVBBOO",
            "cnote_no": "11000009548385",
            ...same order fields as the first response...
        }
    ],
    "batch": "26013014BBQFMM",
    "batch_id": "697c58034fa61abe7c700da6",
    "courier": "JNE",
    "errors": [],
    "idempotentReplayed": true
}
```

```json
First request still being processed (HTTP 409).
Response header: Retry-After: 10
{
    "success": false,
    "code": "IDEMPOTENCY_REQUEST_IN_PROGRESS",
    "message": "The earlier request with this idempotencyKey is still being processed, retry later"
}
```

```json
First request never finished (HTTP 409):
{
    "success": false,
    "code": "IDEMPOTENCY_REQUEST_UNRESOLVED",
    "message": "The earlier request with this idempotencyKey did not finish. Check GET /order for orders it created before sending them again with a new idempotencyKey"
}
```

```json
Replayed server error, the first request failed with a 5xx (HTTP 500).
Response header: Idempotent-Replayed: true
{
    "success": false,
    "message": "Error on createOrderFunction",
    "idempotentReplayed": true
}
```

```json
Key reused with a different body (HTTP 422):
{
    "success": false,
    "code": "IDEMPOTENCY_KEY_REUSED",
    "message": "idempotencyKey has already been used for a different request"
}
```

```json
Invalid key (HTTP 400):
{
    "success": false,
    "code": "IDEMPOTENCY_KEY_INVALID",
    "message": "idempotencyKey header must not exceed 50 characters"
}
```

```json
Key could not be checked, nothing was created (HTTP 503):
{
    "success": false,
    "code": "IDEMPOTENCY_UNAVAILABLE",
    "message": "Order could not be processed right now, please retry with the same idempotencyKey"
}
```

## Pos Indonesia (`pos`)

Use the exact lowercase courier value `pos`. For a scheduled pickup, the selected pickup address must contain valid `pinpointData.lat` and `pinpointData.lng`.

Pos Indonesia COD requires a delivered rate of at least **82%**, calculated from orders created during the rolling **21–60 day** period across all couriers. COD is blocked once the last three evaluation periods are all below the threshold. Non-COD orders remain available.

**COD eligibility statuses:**

**Blocked (403 Forbidden response):** The `status` field indicates the reason COD is blocked. All three statuses return the same generic message; use the `status` field to distinguish the reason:

- **new_seller:** The account has no shipping history yet — no parcels, or none delivered. COD blocked. `deliveredRate` is `0` (no shipping history yet).
- **insufficient:** Not enough data to evaluate yet: no rate period has been generated, the latest period spans fewer than 21 days, or it contains no parcels. This is not a performance issue. COD blocked. `deliveredRate` shows the account's overall delivered rate, which does not reflect the evaluation period.
- **blocked:** All of the last three evaluation periods are below 82%. COD blocked. `deliveredRate` shows actual rate (e.g., 70%).

**Available (200 OK):** When one of the following statuses is returned, the order succeeds normally without a 403 response:

- **eligible:** The latest evaluation period has a delivered rate of 82% or above. COD available.
- **warning:** The latest period is below 82%, but not all of the last three periods are. COD still available. `deliveredRate` shows actual rate (e.g., 75%).

**Example: new_seller status**

```json
{
  "success": false,
  "message": "Pos Indonesia COD is not available for this account",
  "status": "new_seller",
  "deliveredRate": 0,
  "minimumDeliveredRate": 82
}
```

**Example: insufficient status**

```json
{
  "success": false,
  "message": "Pos Indonesia COD is not available for this account",
  "status": "insufficient",
  "deliveredRate": 40,
  "minimumDeliveredRate": 82
}
```

**Example: blocked status**

```json
{
  "success": false,
  "message": "Pos Indonesia COD is not available for this account",
  "status": "blocked",
  "deliveredRate": 70,
  "minimumDeliveredRate": 82
}
```

## Important — JT Premium & SiCepat: Batch Concurrency

For couriers where the tracking number (`cnote_no` / resi) is **generated on our side** — currently **JT Premium** and **SiCepat** — the system assigns numbers sequentially per account. To ensure tracking numbers are unique and correctly assigned, **only one batch can be processed at a time per account**.

**Do not send multiple batch requests concurrently** (e.g. firing several API calls in parallel from your system). Instead, group all orders into a single batch and send them in one request.

**If a concurrent request is detected (JT Premium), the API will respond with:**

```json
{
  "success": false,
  "message": "Sedang ada proses pembuatan order JT Premium yang berjalan. Mohon gabungkan semua order dalam 1 batch yang sama daripada mengirim beberapa batch secara bersamaan."
}
```

HTTP status: `409 Conflict`

## SPX Express (`spx`)

Use the exact lowercase courier value `spx`. `dropOff` is only available for accounts with SPX Drop Off enabled, contact admin to enable it. The `pickup.time_id` is checked against the pickup slots SPX has open for the day: the date and time must fall inside one of them, otherwise the request is rejected with 400 and the slots that are open. The slots are also in `pickupSchedule` of [Check Shipping Fee](#check-shipping-fee).

In the sandbox, SPX only works for pickup and destination areas in **Jakarta**. For another area, SPX refuses the order after it is created. The call still returns 200, and the order has `status: "error"` and the message of SPX in `error`. This does not happen in production.

> [!SANDBOX]
> **Sandbox-only known errors**
>
> These messages appear in the `error` of the order when you test SPX in the sandbox, because of limits of the courier dev API.
>
> | Message | Cause and action |
> | --- | --- |
> | `station not FIRST_MILE_HUB or DC or AM_HUB, or station not InOperation, or no match pickupStationId` | The SPX sandbox only has pickup stations in Jakarta. Use a pickup address in **Jakarta**. |
> | `buyer address not support delivery` | The SPX sandbox covers fewer destinations than production. Use a destination in **Jakarta**. |

## Error responses

Most errors return 400 with `success: false`, a `message` and the `courier`. A validation error in the orders returns `message: "Error in orders"`, with `errors` in English and `errorsFront` in Indonesian, one entry per problem.

| Situation | Status | `message` |
| --- | --- | --- |
| `courier` is missing | 400 | `courier is required` |
| The `weight` of an order is negative | 400 | `orders[0].weight must not be negative` (with the position of the order in `orders`) |
| `courier` is not one of the allowed values | 400 | `Invalid courier` |
| `courier` is `Ninja` | 400 | `Ninja Xpress is no longer available for new shipments` |
| A field of the system is in the body | 400 | `Fields not allowed in public API request: price` |
| `pickup.address_id`, `pickup.time_id`, `pickup.type` or `pickup.volume` is missing or not valid | 400 | `pickup.address_id is required` |
| The saved address does not exist, or belongs to another account | 400 | `Pickup address not found` |
| `COD` is below Rp1,000 | 400 | `Error in orders (`COD value is less than Rp1,000 or empty`)` |
| `COD` is above the limit of the courier | 400 | `Error in orders (for example `Anteraja COD value is more than Rp2.000.000`)` |
| The courier does not pick up on that day, for example `anteraja` on a Sunday | 400 | `Ekspedisi Anteraja tidak mendukung penjemputan pada hari Minggu` |
| The pickup is less than 90 minutes from now | 400 | `Waktu Penjemputan harus minimal 90 menit dari sekarang` |
| `orders` is empty | 400 | `orders are empty` |
| An order lacks `COD` and `goodsValue`, `customerName`, `customerAddress`, `customerAddressDataId`, `customerPhone` or `parcelContent`, or the phone number is not valid | 400 | `Error in orders` |
| The weight is above the limit of the courier, for example 50 kg for `JT` | 400 | `Error in orders (`orders[Siti] weight max is 50`)` |
| `weight` or `quantity` does not match `customProducts` | 400 | `Error in orders` |
| `isDangerousGoods` is not a Boolean, or the courier or destination does not support dangerous goods | 400 | `orders[0].isDangerousGoods must be a boolean` |
| `eco` is used with a courier other than `JT`, with `cargo`, or is not a Boolean | 400 | `orders[0].eco is only available for courier JT` |
| The dropshipper is invalid | 400 | `Invalid dropshipper data` |
| Invalid or inactive API key, no `Create order` permission, or IP not allowed | 403 | `Not allowed` |

Some messages follow the language of your account (Mengantar web app, account settings), so the same error can come in Indonesian or in English, for example `Nilai COD kurang dari Rp1,000` or `COD value is less than Rp1,000 or empty`. Match on the status and the field, not on the exact text. The idempotency, dropshipper, Pos Indonesia and concurrency errors have their own status codes, described in their sections above.
