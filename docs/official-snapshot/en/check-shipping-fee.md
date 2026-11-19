# Check Shipping Fee

`GET {BASE_URL}/api/public/{API_KEY}/order/estimate`

Estimates the shipping fee between two addresses for one courier, or for all couriers at once, with **your own discount applied**. The discount differs from seller to seller, so the price you get here is the price your account pays. Get `origin_id` and `destination_id` from [Search address data](#search-address-data). Use the courier and the price from the result when you [create an order](#create-order).

The discount depends on your shipping volume, see [Diskon Ongkos Kirim](https://help.mengantar.com/id/articles/5207011-apa-kelebihan-mengantar). The public estimate without an API key, [Check Shipping Fee Public](#check-shipping-fee-public), gives the 20% base discount that every new account starts with, whatever your volume.

A valid, active API key with the `Check shipping fee` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`.

Permission required: Check shipping fee
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order/estimate?origin_id=5fc62de8f8f44b34aa4bdc49&destination_id=5fc62f60f8f44b34aa4c0dc9&courier=JT&weight=1&COD_AMOUNT=100000'
```

## Example response

```json
{
    "success": true,
    "data": {
        "price": 11000,
        "currency": "IDR",
        "discountPercent": 30,
        "cargoDiscountPercent": 0,
        "discount": 3300,
        "cargoDiscount": 0,
        "codFee": 3329,
        "estimatedPrice": 14329,
        "estimatedSpecialPrice": 10479,
        "cargoEstimatedPrice": 0,
        "cargoEstimatedSpecialPrice": 0,
        "estimatedDate": "2-4 hari",
        "discountExtraPercent": 5,
        "discountExtra": 550,
        "cargoDiscountExtraPercent": 5,
        "cargoDiscountExtra": 0,
        "estimate_delivery": "undefined",
        "unsupported": false,
        "unsupported_cod": false
    }
}
```

## All couriers

With `courier=all`, `data` holds one entry per courier, keyed by the courier name. Each courier returns the fields that apply to it. The response has 14 entries: `JNE`, `JNECargo`, `SiCepat`, `SiCepatCargo`, `SAP`, `SAPLite`, `SapCargo`, `iDexpress`, `JT`, `lion`, `iDexpressCargo`, `anteraja`, `spx`, `pos`. The example shows four of them, with all their fields.

### Example request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/order/estimate?origin_id=5fc62de8f8f44b34aa4bdc49&destination_id=5fc62f60f8f44b34aa4c0dc9&courier=all&weight=1'
```

### Example response

```json
{
    "success": true,
    "data": {
        "JNE": {
            "price": 13000,
            "estimate_delivery": "1 - 2 days",
            "currency": "IDR",
            "isFlat": false,
            "weight": "1",
            "JNE_zone": "A",
            "discountPercent": 30,
            "cargoDiscountPercent": 5,
            "discount": 3900,
            "cargoDiscount": 0,
            "codFee": 0,
            "estimatedPrice": 13000,
            "estimatedSpecialPrice": 9100,
            "cargoEstimatedPrice": 0,
            "cargoEstimatedSpecialPrice": 0,
            "estimatedDate": "2-4 hari",
            "discountExtraPercent": 0,
            "discountExtra": 0,
            "cargoDiscountExtraPercent": 0,
            "cargoDiscountExtra": 0,
            "estimate_delivery_cargo": "3 - 4 days"
        },
        "SiCepat": {
            "price": 11000,
            "currency": "IDR",
            "cargoPrice": 35000,
            "estimate_delivery": "1 - 2 Days",
            "estimate_delivery_cargo": "2 - 4 Days",
            "weight": "1",
            "discountPercent": 30,
            "cargoDiscountPercent": 5,
            "discount": 3300,
            "cargoDiscount": 1750,
            "codFee": 0,
            "estimatedPrice": 11000,
            "estimatedSpecialPrice": 7699,
            "cargoEstimatedPrice": 35000,
            "cargoEstimatedSpecialPrice": 33250,
            "estimatedDate": "2-4 hari",
            "discountExtraPercent": 0,
            "discountExtra": 0,
            "cargoDiscountExtraPercent": 0,
            "cargoDiscountExtra": 0,
            "unsupported": false,
            "unsupportedOriginSicepat": false,
            "originId": "5fc62de8f8f44b34aa4bdc49",
            "destinationId": "5fc62f60f8f44b34aa4c0dc9",
            "unsupportedPickup": false,
            "unsupportedFlag": ""
        },
        "JT": {
            "unsupported": false,
            "unsupported_cod": false,
            "price": 11000,
            "estimate_delivery": "-",
            "discountPercent": 30,
            "cargoDiscountPercent": 0,
            "discount": 3300,
            "cargoDiscount": 0,
            "codFee": 0,
            "estimatedPrice": 11000,
            "estimatedSpecialPrice": 7149,
            "cargoEstimatedPrice": 0,
            "cargoEstimatedSpecialPrice": 0,
            "estimatedDate": "2-4 hari",
            "discountExtraPercent": 5,
            "discountExtra": 550,
            "cargoDiscountExtraPercent": 5,
            "cargoDiscountExtra": 0
        },
        "spx": {
            "currency": "IDR",
            "unsupported": false,
            "unsupported_cod": false,
            "estimate_delivery": "1 - 2 days",
            "price": 10700,
            "pickupSchedule": {
                "2026-11-13": [
                    {
                        "timeRangeId": 1,
                        "start": "14:00",
                        "end": "22:00",
                        "timeEpoch": 1794560400
                    }
                ],
                "2026-11-14": [
                    {
                        "timeRangeId": 1,
                        "start": "14:00",
                        "end": "22:00",
                        "timeEpoch": 1794646800
                    }
                ],
                "2026-11-15": [
                    {
                        "timeRangeId": 1,
                        "start": "14:00",
                        "end": "22:00",
                        "timeEpoch": 1794733200
                    }
                ]
            },
            "discountPercent": 30,
            "cargoDiscountPercent": 0,
            "discount": 3210,
            "cargoDiscount": 0,
            "codFee": 0,
            "estimatedPrice": 10700,
            "estimatedSpecialPrice": 6954,
            "cargoEstimatedPrice": 0,
            "cargoEstimatedSpecialPrice": 0,
            "estimatedDate": "2-4 hari",
            "discountExtraPercent": 5,
            "discountExtra": 535,
            "cargoDiscountExtraPercent": 5,
            "cargoDiscountExtra": 0,
            "unsupportedOriginSpx": false,
            "unsupportedPickup": false
        }
    }
}
```

## Query parameters

| Field | Type | Description |
| --- | --- | --- |
| origin_id | String | Required. The `_id` of the pickup area, from [Search address data](#search-address-data). |
| destination_id | String | Required. The `_id` of the destination area, from [Search address data](#search-address-data). |
| courier | String | One of `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, `spx` or `all`. It is case sensitive and can be sent only once. The default is `JNE`. `all` returns the estimate of every available courier. |
| weight | Number | Weight in kg. Default `1`. Decimals such as `0.5` are allowed, and the price grows with the weight. Send a positive number. |
| COD_AMOUNT | Number | The COD amount: goods value plus shipping fee. It is only used to calculate `codFee`. For the shipping fee itself, use `price`. |
| isDangerousGoods | Boolean | Optional. Default `false`. Send `true` or `1` to get the Dangerous Goods rate and destination coverage of the courier. |

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| price | Number | The shipping fee before discount, in rupiah. |
| currency | String | Always `IDR`. |
| discountPercent | Number | The discount in percent. It depends on your shipping volume, see below. |
| discount | Number | The discount in rupiah: `price` × `discountPercent`. |
| discountExtraPercent | Number | An extra discount in percent, when your account has one. |
| discountExtra | Number | The extra discount in rupiah. |
| codFee | Number | The COD service fee for `COD_AMOUNT`. `0` when you send no `COD_AMOUNT`. |
| estimatedPrice | Number | `price` plus `codFee`. |
| estimatedSpecialPrice | Number | What you pay: `estimatedPrice` minus `discount` and `discountExtra`. |
| estimate_delivery | String | The estimated delivery time as text. Some couriers return `-`, so do not rely on it. |
| estimatedDate | String | A general estimate of the delivery time as text, for example `2-4 hari`. It is the same for most couriers, and some couriers, such as `lion`, return their own. For the estimate of one courier, use `estimate_delivery` when it is not `-`. |
| unsupported | Boolean | `true` when the courier cannot serve this route at all. |
| unsupported_cod | Boolean | `true` when the courier cannot serve this route with COD. |
| isDangerousGoodsSupported | Boolean | Only returned when `isDangerousGoods` is on. Whether the courier carries dangerous goods. |
| pickupSchedule | Object | Only returned for `spx`. The pickup slots SPX has open for today, tomorrow and the day after, grouped by date (`YYYY-MM-DD`). Each slot has a `timeRangeId`, a `start` and `end` time, and a `timeEpoch` in Unix seconds. |

The `cargo...` fields are for cargo shipments and are `0` otherwise. Each courier returns the fields that apply to it, so check that a field exists before you read it.

## Coverage

`unsupported` and `unsupported_cod` tell you what the courier can send to the destination.

| `unsupported` | `unsupported_cod` | What it means |
| --- | --- | --- |
| `false` | `false` | Can send both COD and non-COD. |
| `false` | `true` | Cannot send COD, but can still send non-COD. |
| `true` | `false` or `true` | Cannot send to this destination at all, COD or non-COD. |

For a Dangerous Goods request, `isDangerousGoodsSupported` shows whether the courier carries dangerous goods, while `unsupported` shows the destination coverage. Check both before you create an order. Only `SiCepat` and `iDexpress` carry dangerous goods. The other couriers return `isDangerousGoodsSupported: false`.

## Courier limits

Each courier has its own limits. A dash means the courier has no limit of its own.

| Courier | Maximum COD | Weight | Goods value without COD |
| --- | --- | --- | --- |
| `JNE` | Rp5,000,000 | - | - |
| `SiCepat` | Rp5,000,000 | - | - |
| `Sap` | Rp2,000,000 | - | - |
| `iDexpress` | Rp5,000,000 | - | - |
| `JT` | Rp5,000,000 | - | - |
| `lion` | Rp5,000,000 | - | - |
| `anteraja` | Rp2,000,000 | 1 to 50 kg | Rp1,000 to Rp10,000,000 |
| `pos` | Rp2,000,000 | 1 to 50 kg | Rp1,000 to Rp10,000,000 |
| `spx` | Rp5,000,000 | 1 to 50 kg | Rp1,000 to Rp10,000,000 |

- The minimum COD amount is Rp1,000, and Rp10,000 for `lion`.
- `anteraja`, `pos` and `spx` bill a weight under 1 kg as 1 kg.
- The estimate itself only enforces some of the limits. `anteraja`, `pos` and `spx` return `unsupported: true` and `price` `0` when the weight is above 50 kg (in sandbox `pos` still returns a price), and `spx` does the same when the COD amount is above its maximum. For the other limits the estimate still returns a price.
- Create order rejects an order whose COD amount is above the maximum of its courier.

## Courier rules

| Courier | Rule |
| --- | --- |
| `pos` | COD needs a delivered rate of at least **82%**, calculated across the orders of all couriers created in the rolling **21 to 60 day** window. If the rate stays below the limit, a **three-day grace period** applies before Pos Indonesia COD is blocked. Non-COD is not affected. |
| `JTEco` | Returned as its own entry next to `JT` when you send `courier=all`, with the same fields. It is listed only when the route has a J&T ECO tariff and the request is not Dangerous Goods. `JTEco` is not a value of `courier`: to book it, send `eco: true` on a `JT` order in [Create order](#create-order). |
| `Ninja` | Discontinued on 1 September 2026. A request with `courier=Ninja` returns HTTP 400 with `code: "COURIER_DISABLED"`, and `courier=all` leaves out `Ninja`. The read endpoints for past orders and batches still accept them. |

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| `origin_id` or `destination_id` is missing | 400 | `{ "success": false, "message": "origin_id or destination_id is empty" }` |
| `origin_id` or `destination_id` does not match any address data | 400 | `{ "success": false, "message": "origin not found" }` (or `destination not found`) |
| `courier` is not one of the allowed values, has the wrong case, or is sent more than once | 400 | `{ "success": false, "message": "Invalid courier" }` |
| `courier` is `Ninja`, or `spx` while SPX is switched off | 400 | `{ "success": false, "message": "Courier is not available", "code": "COURIER_DISABLED" }` |
| Invalid or inactive API key, no `Check shipping fee` permission, or IP not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
