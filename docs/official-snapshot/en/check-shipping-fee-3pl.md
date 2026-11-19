# Check Shipping Fee 3PL

`GET {BASE_URL}/api/order/allEstimate3PL`

Returns the standard shipping price of every courier for one route, in one call, **without any discount or flat price**. It is meant for logistics partners and integrators that need the plain courier prices. Get `origin_id` and `destination_id` from [Search address data](#search-address-data).

This endpoint needs no API key and no permission. For prices with your discount, use [Check Shipping Fee](#check-shipping-fee). For the public prices with the base discount, use [Check Shipping Fee Public](#check-shipping-fee-public).

Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/order/allEstimate3PL?origin_id=5fc62de8f8f44b34aa4bdc49&destination_id=5fc62f60f8f44b34aa4c0dc9&weight=1&isDangerousGoods=true'
```

## Example response

```json
{
    "success": true,
    "data": {
        "JNE": {
            "unsupported": null,
            "unsupported_cod": null,
            "price": 13000,
            "estimatedDate": "1 - 2 days",
            "isDangerousGoodsSupported": false
        },
        "JNECargo": {
            "unsupported": null,
            "unsupported_cod": null,
            "price": 45000,
            "minimumWeightCargo": 10,
            "estimatedDate": "3 - 4 days",
            "isDangerousGoodsSupported": false
        },
        "SiCepat": {
            "unsupported": false,
            "unsupported_cod": null,
            "price": 11000,
            "estimatedDate": "1 - 2 days",
            "isDangerousGoodsSupported": true
        },
        "JT": {
            "unsupported": false,
            "unsupported_cod": false,
            "price": 11000,
            "estimatedDate": "2-4 days",
            "isDangerousGoodsSupported": false
        },
        "anteraja": {
            "unsupported": false,
            "unsupported_cod": false,
            "price": 11000,
            "isFlat": false,
            "estimatedDate": "2-4 Day",
            "isDangerousGoodsSupported": false
        }
    }
}
```

`data` holds one entry per courier, keyed by the courier name. The response has 15 entries: `JNE`, `JNECargo`, `SiCepat`, `SiCepatCargo`, `SAP`, `SAPLite`, `SapCargo`, `iDexpress`, `iDlite`, `JT`, `lion`, `iDexpressCargo`, `anteraja`, `spx`, `pos`. The example shows five of them. Each entry is short: only the fields below.

## Query parameters

| Field | Type | Description |
| --- | --- | --- |
| origin_id | String | Required. The `_id` of the pickup area, from [Search address data](#search-address-data). |
| destination_id | String | Required. The `_id` of the destination area, from [Search address data](#search-address-data). |
| weight | Number | Weight in kg. Default `1`. Decimals such as `0.5` are allowed, and the price grows with the weight. Send a positive number. |
| isDangerousGoods | Boolean | Optional. Default `false`. Send `true` or `1` to get the Dangerous Goods price and destination coverage of every courier. |

This endpoint has no `COD_AMOUNT`. It returns no COD fee, and a `COD_AMOUNT` you send is ignored.

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| price | Number | The standard shipping price in rupiah, without discount and without flat price. `0` when the courier cannot serve the request. |
| estimatedDate | String | The estimated delivery time as text, for example `1 - 2 days`. The format differs per courier. |
| unsupported | Boolean | `true` when the courier cannot serve this route at all. `null` when the courier does not report it. |
| unsupported_cod | Boolean | `true` when the courier cannot serve this route with COD. `null` when the courier does not report it. |
| isDangerousGoodsSupported | Boolean | Only returned when `isDangerousGoods` is on. Whether the courier carries dangerous goods. |
| minimumWeightCargo | Number | Only returned for the cargo entries. The minimum weight in kg for the cargo service. |
| isFlat | Boolean | Only returned for `anteraja`. Whether the price is a flat price. |

## Coverage

`unsupported` and `unsupported_cod` tell you what the courier can send to the destination. A `null` means the courier gives no answer, so do not treat it as a yes or a no.

| `unsupported` | `unsupported_cod` | What it means |
| --- | --- | --- |
| `false` | `false` | Can send both COD and non-COD. |
| `false` | `true` | Cannot send COD, but can still send non-COD. |
| `true` | `false` or `true` | Cannot send to this destination at all, COD or non-COD. |

For a Dangerous Goods request, `isDangerousGoodsSupported` shows whether the courier carries dangerous goods, while `unsupported` shows the destination coverage. Check both. Only `SiCepat` and `iDexpress` carry dangerous goods. The other couriers return `isDangerousGoodsSupported: false`.

## Limits and rules

- Courier limits, such as maximum COD, weight and goods value, are the same as in [Check Shipping Fee](#check-shipping-fee). `anteraja`, `pos` and `spx` return `price` `0` when the weight is above 50 kg.
- `Ninja` was discontinued on 1 September 2026, so `Ninja` is not in the response.
- J&T ECO is returned as its own `JTEco` entry next to `JT`, with the same fields. It is listed only when the route has a J&T ECO tariff and the request is not Dangerous Goods.
- The endpoint only checks that an id is well-formed. A well-formed id that matches no address still returns prices, so take the ids from Search address data.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| `origin_id` or `destination_id` is missing | 400 | `{ "success": false, "message": "from or to is empty" }` |
| `origin_id` or `destination_id` is not a valid id | 400 | `{ "success": false, "message": "origin_id is invalid" }` (or `destination_id is invalid`) |
