# Check Shipping Fee Public

`GET {BASE_URL}/api/order/allEstimatePublic`

Returns the shipping fee of every courier for one route, in one call. It is the estimate behind the public [Cek Ongkos Kirim Mengantar](https://www.mengantar.com/cek-ongkos-kirim/) page. Get `origin_id` and `destination_id` from [Search address data](#search-address-data).

This endpoint needs no API key and no permission. For an estimate tied to your API key, use [Check Shipping Fee](#check-shipping-fee).

Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/order/allEstimatePublic?origin_id=5fc62de8f8f44b34aa4bdc49&destination_id=5fc62f60f8f44b34aa4c0dc9&weight=1&COD_AMOUNT=100000'
```

## Example response

```json
{
    "success": true,
    "data": {
        "JNE": {
            "price": 11000,
            "estimate_delivery": "1 - 2 days",
            "currency": "IDR",
            "isFlat": true,
            "weight": "1",
            "JNE_zone": "A",
            "discountPercent": 0,
            "cargoDiscountPercent": 5,
            "discount": 100,
            "cargoDiscount": 0,
            "codFee": 3329,
            "estimatedPrice": 14329,
            "estimatedSpecialPrice": 14229,
            "cargoEstimatedPrice": 0,
            "cargoEstimatedSpecialPrice": 0,
            "estimatedDate": "2-4 hari",
            "discountExtraPercent": 0,
            "discountExtra": 0,
            "cargoDiscountExtraPercent": 0,
            "cargoDiscountExtra": 0,
            "estimate_delivery_cargo": "1 - 2 days"
        },
        "SiCepat": {
            "price": 62900,
            "currency": "IDR",
            "cargoPrice": 445000,
            "estimate_delivery": "1 - 2 Days",
            "estimate_delivery_cargo": "2 - 3 Days",
            "weight": "1",
            "discountPercent": 20,
            "cargoDiscountPercent": 5,
            "discount": 12580,
            "cargoDiscount": 22250,
            "codFee": 3329,
            "estimatedPrice": 66229,
            "estimatedSpecialPrice": 53649,
            "cargoEstimatedPrice": 448330,
            "cargoEstimatedSpecialPrice": 426080,
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
            "unsupportedFlag": "",
            "isDangerousGoodsSupported": true
        },
        "JT": {
            "unsupported": false,
            "unsupported_cod": false,
            "price": 64700,
            "estimate_delivery": "-",
            "discountPercent": 20,
            "cargoDiscountPercent": 0,
            "discount": 12940,
            "cargoDiscount": 0,
            "codFee": 3329,
            "estimatedPrice": 68029,
            "estimatedSpecialPrice": 48619,
            "cargoEstimatedPrice": 0,
            "cargoEstimatedSpecialPrice": 0,
            "estimatedDate": "2-4 hari",
            "discountExtraPercent": 10,
            "discountExtra": 6470,
            "cargoDiscountExtraPercent": 10,
            "cargoDiscountExtra": 0
        },
        "pos": {
            "currency": "IDR",
            "unsupported": false,
            "unsupported_cod": false,
            "estimate_delivery": "2 HARI",
            "price": 5900,
            "discountPercent": 10,
            "cargoDiscountPercent": 0,
            "discount": 590,
            "cargoDiscount": 0,
            "codFee": 3329,
            "estimatedPrice": 9229,
            "estimatedSpecialPrice": 8639,
            "cargoEstimatedPrice": 0,
            "cargoEstimatedSpecialPrice": 0,
            "estimatedDate": "2-4 hari",
            "discountExtraPercent": 0,
            "discountExtra": 0,
            "cargoDiscountExtraPercent": 0,
            "cargoDiscountExtra": 0
        }
    }
}
```

`data` holds one entry per courier, keyed by the courier name. The response has 15 entries: `JNE`, `JNECargo`, `SiCepat`, `SiCepatCargo`, `SAP`, `SAPLite`, `SapCargo`, `iDexpress`, `iDlite`, `JT`, `lion`, `iDexpressCargo`, `anteraja`, `spx`, `pos`. The example shows four of them, with all their fields. `iDlite` is an extra rate next to `iDexpress`, and Create order has no `iDlite` courier value.

## Query parameters

| Field | Type | Description |
| --- | --- | --- |
| origin_id | String | Required. The `_id` of the pickup area, from [Search address data](#search-address-data). |
| destination_id | String | Required. The `_id` of the destination area, from [Search address data](#search-address-data). |
| weight | Number | Weight in kg. Default `1`. Decimals such as `0.5` are allowed, and the price grows with the weight. Send a positive number. |
| COD_AMOUNT | Number | The COD amount: goods value plus shipping fee. It is only used to calculate `codFee`. For the shipping fee itself, use `price`. |
| isDangerousGoods | Boolean | Optional. Default `false`. Send `true` or `1` to get the Dangerous Goods rate and destination coverage of every courier. |
| withCourierServices | Boolean | Optional. Default `false`. Send `true` to also get the courier services that are not in the list by default. Today that is J&T ECO, returned as its own `JTEco` entry next to `JT`, with the same fields. Without it, `JTEco` is not returned. |

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| price | Number | The shipping fee before discount, in rupiah. |
| discountPercent | Number | The discount in percent. Usually the 20% base discount, see below. |
| discount | Number | The discount in rupiah: `price` × `discountPercent`. |
| discountExtraPercent | Number | An extra discount in percent, for the couriers that have one. |
| discountExtra | Number | The extra discount in rupiah. |
| codFee | Number | The COD service fee for `COD_AMOUNT`. `0` when you send no `COD_AMOUNT`. |
| estimatedPrice | Number | `price` plus `codFee`. |
| estimatedSpecialPrice | Number | What you pay: `estimatedPrice` minus `discount` and `discountExtra`. |
| estimate_delivery | String | The estimated delivery time as text. Some couriers return `-`, so do not rely on it. |
| estimatedDate | String | A general estimate of the delivery time as text, for example `2-4 hari`. It is the same for most couriers, and some couriers, such as `lion`, return their own. For the estimate of one courier, use `estimate_delivery` when it is not `-`. |
| unsupported | Boolean | `true` when the courier cannot serve this route at all. `null` for `JNE`, `JNECargo` and `SapCargo`, which do not report it. |
| unsupported_cod | Boolean | `true` when the courier cannot serve this route with COD. |
| isDangerousGoodsSupported | Boolean | Whether the courier carries dangerous goods. Always returned for `SiCepat`, `iDexpress` and `iDlite`, and for every courier when `isDangerousGoods` is on. |

The `cargo...` fields are for cargo shipments and are `0` otherwise. Each courier returns the fields that apply to it, so check that a field exists before you read it. See [Check Shipping Fee](#check-shipping-fee) for the full list.

## Discount

No account is involved, so the discount does not depend on your shipping volume. The discount is the **base discount of 20%** that every new Mengantar account starts with. A courier can show a different value because it has a flat price or a lite price, or because it carries an extra discount in `discountExtraPercent`. The values can differ between sandbox and production, so always read `discountPercent` and `discountExtraPercent` from the response. The price you pay is `estimatedSpecialPrice`.

## Coverage

`unsupported` and `unsupported_cod` tell you what the courier can send to the destination.

| `unsupported` | `unsupported_cod` | What it means |
| --- | --- | --- |
| `false` | `false` | Can send both COD and non-COD. |
| `false` | `true` | Cannot send COD, but can still send non-COD. |
| `true` | `false` or `true` | Cannot send to this destination at all, COD or non-COD. |

For a Dangerous Goods request, `isDangerousGoodsSupported` shows whether the courier carries dangerous goods, while `unsupported` shows the destination coverage. Check both. Only `SiCepat` and `iDexpress` carry dangerous goods. The other couriers return `isDangerousGoodsSupported: false`.

## Limits and rules

- Courier limits, such as maximum COD, weight and goods value, are the same as in [Check Shipping Fee](#check-shipping-fee). `anteraja`, `pos` and `spx` return `unsupported: true` and `price` `0` when the weight is above 50 kg.
- The estimate does not check the COD amount against the maximum of the courier. Create order rejects an order above it.
- `Ninja` was discontinued on 1 September 2026, so `Ninja` is not in the response.
- With `withCourierServices=true`, J&T ECO is returned as its own `JTEco` entry next to `JT`. It is listed only when the route has a J&T ECO tariff and the request is not Dangerous Goods. `JTEco` is not a value of `courier`.
- The endpoint only checks that an id is well-formed. A well-formed id that matches no address still returns rates, so take the ids from Search address data.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| `origin_id` or `destination_id` is missing | 400 | `{ "success": false, "message": "from or to is empty" }` |
| `origin_id` or `destination_id` is not a valid id | 400 | `{ "success": false, "message": "origin_id is invalid" }` (or `destination_id is invalid`) |
