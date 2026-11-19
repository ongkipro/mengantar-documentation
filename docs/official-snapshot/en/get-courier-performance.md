# Get Courier Performance

`POST {BASE_URL}/api/public/{API_KEY}/order/getPerformancePublic`

Scores every courier for a destination city by its delivery performance, and tells you which courier is the best choice. It is the score shown next to the prices on the public [Cek Ongkos Kirim Mengantar](https://www.mengantar.com/cek-ongkos-kirim/) page. Send it the estimate you got from [Check Shipping Fee](#check-shipping-fee) or [Check Shipping Fee Public](#check-shipping-fee-public), so it only picks a courier that can serve the route.

A valid, active API key with the `Check shipping fee` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`.

Permission required: Check shipping fee
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X POST '{BASE_URL}/api/public/{API_KEY}/order/getPerformancePublic' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-d '{"city": "BANDUNG", "allEstimateData": {"JNE": {"price": 11000, "unsupported": false, "unsupported_cod": false}, "SiCepat": {"price": 62900, "unsupported": false, "unsupported_cod": false, "isDangerousGoodsSupported": true}, "JT": {"price": 64700, "unsupported": false, "unsupported_cod": false}}}'
```

## Example response

```json
{
    "success": true,
    "data": {
        "couriers": [
            {
                "key": "JNE",
                "score": 96
            },
            {
                "key": "SiCepat",
                "score": 100
            },
            {
                "key": "Sap",
                "score": 91
            },
            {
                "key": "iDexpress",
                "score": 96
            },
            {
                "key": "JT",
                "score": 97
            },
            {
                "key": "lion",
                "score": 102
            },
            {
                "key": "anteraja",
                "score": 0
            },
            {
                "key": "pos",
                "score": 0
            },
            {
                "key": "spx",
                "score": 0
            }
        ],
        "bestCourier": "SiCepat",
        "recommendedDGCourier": "SiCepat",
        "recommended": "JNE"
    }
}
```

## Body parameters

| Field | Type | Description |
| --- | --- | --- |
| city | String | Required. The destination city, as the `CITY_NAME` of the address data from [Search address data](#search-address-data). It is case sensitive and must match exactly, for example `BANDUNG`. |
| allEstimateData | Object | Required. The `data` object of a Check Shipping Fee response with `courier=all`, or of Check Shipping Fee Public. Send it whole, as `allEstimateData`. |

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| couriers | Array | One entry per courier: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos` and `spx`. |
| key | String | The courier name. |
| score | Number | The delivery performance of the courier in the destination city. Higher is better, and `0` means there is no score. |
| bestCourier | String | The courier with the highest score that can serve the route. `JNE` when no courier qualifies. |
| recommendedDGCourier | String | The best courier for dangerous goods: the highest score among the couriers whose `isDangerousGoodsSupported` is `true` in your estimate. `iDexpress` when none qualifies. |
| recommended | String | Currently always `JNE`. Use `bestCourier` to pick a courier. |

## How the score works

- The score comes from the delivery rate of each courier in the city. It is then shifted so that the best qualifying courier gets `100`.
- A courier that is not in your `allEstimateData`, or that is `unsupported`, or has `unsupported_cod` set to `true`, cannot be `bestCourier`. It can still show a score above `100`, as `lion` does in the example.
- `anteraja`, `pos` and `spx` always have a score of `0`, so they are never the best courier.
- A `city` that does not match any city, or is missing, gives a score of `0` to every courier and `bestCourier` is `JNE`. Check the spelling and the case first.
- `Ninja` is discontinued and is not scored, even when it is in `allEstimateData`.
- Sandbox scores come from non-production data, so they can differ from production.

> [!IMPORTANT]
> **Restricted access.** This endpoint is limited to whitelisted accounts. Requests from an API key whose account is not on the whitelist get `403 Not allowed`. Access is granted on request: contact Mengantar Customer Service (CS) to request access.
>
> **Sandbox:** the whitelist is not applied there, so any sandbox API key can call this endpoint while you build your integration. The whitelist still applies once you move to production.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| `allEstimateData` is missing | 400 | `{ "success": false, "message": "allEstimateData is required" }` |
| Invalid or inactive API key, no `Check shipping fee` permission, IP not allowed, or the account is not on the whitelist in production | 403 | `{ "success": false, "message": "Not allowed" }` |
| The method is not `POST` | 405 | `{ "success": false, "message": "GET not allowed on this route" }` |
| The body is not valid JSON | 500 | `{ "success": false, "name": "InternalError", "message": "Something went wrong, please try again later." }` |
