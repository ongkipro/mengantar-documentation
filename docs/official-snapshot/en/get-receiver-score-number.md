# Get Receiver Score Number

`GET {BASE_URL}/api/public/{API_KEY}/getReceiverScoreByNumberUser`

Returns the delivery record of a receiver, found by phone number, per courier, with one `summary` for all couriers. The record covers the orders of every seller on Mengantar, not only yours, so you can check how a receiver has done before you ship to them, for example before you offer COD.

Permission required: None beyond an active API key called from an allowed IP
Environment: Sandbox and production

> [!SANDBOX]
> In sandbox this endpoint is open to every API key and returns **sample data**, not real receiver history. The same number always returns the same sample, in the same response shape as production, including `data.summary`. A number ending in `0` returns the "no valid courier" response (the second example).
>
> The restricted access and daily limit described below are not applied in sandbox, but **they apply in production**: your account must be on the whitelist (otherwise `403 Not allowed`), and requests beyond your daily allowance get `429` until midnight (WIB). One phone number per request applies in both environments: a missing or repeated `search` parameter gets `422`.

> [!IMPORTANT]
> **Restricted access.** This endpoint is limited to whitelisted accounts. Requests from an API key whose account is not on the whitelist get `403 Not allowed`. Access is granted on request: contact Mengantar Customer Service (CS) to request access.

> [!NOTE]
> **Daily limit.** The number of checks allowed per day is based on your active order volume in Mengantar, counted across your account and its sub-accounts. Once the day's allowance is used up, further requests get `429` with a message saying so, and the allowance is full again after midnight (WIB). To request a higher daily limit, contact Mengantar Customer Service (CS).
>
> One phone number per request. A request carrying a list of numbers - for example a repeated `search` parameter - gets `422`.

## Example request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/getReceiverScoreByNumberUser?search=8123456789'
```

## Example response

```json
{
    "success": true,
    "data": {
        "_id": "6af3c4d5e6f708192a3b4c5e",
        "phone": "8123456789",
        "JNE": {
            "total": 12,
            "value": 1850000,
            "inProgress": 1,
            "delivered": 11,
            "rts": 1,
            "undelivered": 0,
            "rate": 9.2
        },
        "SiCepat": {
            "total": 4,
            "value": 520000,
            "inProgress": 0,
            "delivered": 3,
            "rts": 1,
            "undelivered": 0,
            "rate": 7.5
        },
        "Sap": {
            "total": 3,
            "value": 310000,
            "inProgress": 1,
            "delivered": 2,
            "rts": 0,
            "undelivered": 1,
            "rate": 6.7
        },
        "iDexpress": {
            "total": 2,
            "value": 180000,
            "inProgress": 0,
            "delivered": 2,
            "rts": 0,
            "undelivered": 0,
            "rate": 10.0
        },
        "JT": {
            "total": 3,
            "value": 450000,
            "inProgress": 0,
            "delivered": 2,
            "rts": 1,
            "undelivered": 0,
            "rate": 6.7
        },
        "lion": {
            "total": 5,
            "value": 760000,
            "inProgress": 2,
            "delivered": 4,
            "rts": 1,
            "undelivered": 0,
            "rate": 8.0
        },
        "anteraja": {
            "total": 2,
            "value": 150000,
            "inProgress": 0,
            "delivered": 1,
            "rts": 1,
            "undelivered": 0,
            "rate": 5.0
        },
        "pos": {
            "total": 1,
            "value": 95000,
            "inProgress": 0,
            "delivered": 1,
            "rts": 0,
            "undelivered": 0,
            "rate": 10.0
        },
        "spx": {
            "total": 6,
            "value": 920000,
            "inProgress": 1,
            "delivered": 5,
            "rts": 0,
            "undelivered": 1,
            "rate": 8.3
        },
        "createdAt": "2025-01-15T03:00:00.000Z",
        "updatedAt": "2026-11-10T03:00:00.000Z",
        "summary": {
            "average_number": 7.9,
            "average_score": "B"
        }
    }
}
```

## A receiver with no courier data

A number with no transaction at any courier still answers 200 `success: true`, never 404. The couriers are empty objects, and `summary` is `null` and `"-"`.

### Example request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/getReceiverScoreByNumberUser?search=8123456780'
```

### Example response

```json
{
    "success": true,
    "data": {
        // Which courier keys appear can differ: a number already in the rollup only
        // returns the couriers that have data, none here. `summary` is the stable part.
        "JNE": {},
        "SiCepat": {},
        "Sap": {},
        "iDexpress": {},
        "JT": {},
        "lion": {},
        "anteraja": {},
        "pos": {},
        "spx": {},
        "summary": {
            "average_number": null,
            "average_score": "-"
        }
    }
}
```

## Query parameters

| Field | Type | Description |
| --- | --- | --- |
| search | String | Required. The receiver phone number, one per request. `08123456789`, `8123456789`, `628123456789` and `+628123456789` find the same record. The format is not validated: a value that is not a phone number is looked up like any other and finds a record or the empty shape. A missing or empty `search` is rejected with 422, and a list of numbers, such as a repeated `search`, with 422. |

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | `true` when the request was processed. |
| data | Object | The record of the receiver. |
| _id | String | The `_id` of the record. Not returned when the number has no record. |
| phone | String | The phone number as it is stored: without the leading `0`, `62` or `+62`. |
| JNE | Object | The record at one courier, with the fields below. The key is the courier: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos` or `spx`. Only the couriers that have data are guaranteed to be there; an empty object `{}` means no data. |
| total | Number | Per courier: `delivered` + `rts` + `undelivered`. Only COD orders are counted. |
| delivered | Number | Per courier: the COD orders that were delivered. |
| rts | Number | Per courier: the COD orders that were returned to the sender. |
| undelivered | Number | Per courier: the COD orders that failed delivery or ran late. |
| inProgress | Number | Per courier: the COD orders that are still on the way. |
| value | Number | Per courier: the total value of the orders in rupiah, COD or non-COD. It is the COD amount, or the goods value when there is no COD. |
| rate | Number | Per courier: the delivered rate on a 0 to 10 scale, `10 × delivered ÷ total`. |
| createdAt | String | When the record was created, in ISO 8601 UTC. |
| updatedAt | String | When the record was last updated, in ISO 8601 UTC. |
| summary | Object | The score across couriers, see Summary below. Always returned. |

### Summary

`data.summary` is the receiver score aggregated across couriers, so you do not have to compute it yourself. Only couriers with more than 0 transactions are counted, and every counted courier weighs the same regardless of how many transactions it has.

| Field | Type | Description |
| --- | --- | --- |
| average_number | Number / null | Average of the `rate` of every counted courier, rounded to one decimal. It is a score on a **0-10 scale** — the same scale as the per-courier `rate` — not a transaction count and not a percentage. For example `8.4` means an average rate of 8.4 out of 10. `null` when no courier has data. |
| average_score | String | Letter grade for `average_number`: `A` from 9, `A-` from 8, `B` from 7, `B-` from 6, `C` from 5, `C-` from 4, `D` from 3, `D-` from 2, `E` from 1, `E-` below 1. Prefixed with `≈` when the counted couriers have fewer than 4 transactions combined — the grade is still returned, but it is an approximation from too little history to be stable yet. So the value can come back as `"≈A"`, `"≈D-"` or `"≈E-"`, and your parser has to accept that prefix on any of the grades above. Note the threshold counts *transactions*, not couriers: one courier with 3 transactions still gets the prefix. The value is `"-"` when no courier has data. |

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| The API key is invalid or inactive, or the IP is not allowed. In production also an account that is not on the whitelist | 403 | `{ "success": false, "message": "Not allowed" }` |
| `search` is missing or empty | 422 | `{ "success": false, "message": "Missing 'search' in the query param." }` |
| `search` is a list of numbers | 422 | `{ "success": false, "message": "'search' must be a single phone number." }` |
| Production only: the daily limit is used up | 429 | A message that says so. The allowance is full again after midnight (WIB). |
