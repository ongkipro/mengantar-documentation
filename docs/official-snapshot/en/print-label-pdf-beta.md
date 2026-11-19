# Print Label PDF (BETA)

Creates a PDF label in the background, in two steps with two endpoints. **Request** starts a generation and returns its id. **Get** returns the result of that generation. Request never returns a download URL: only Get does, once the status is `COMPLETED`.

> [!IMPORTANT]
> **Restricted access.** This endpoint is limited to whitelisted accounts. Requests from an API key whose account is not on the whitelist get `403 Not allowed`. Access is granted on request: contact Mengantar Customer Service (CS) to request access.

Permission required: Whitelisted account
Environment: Sandbox and production

## Request a label

`POST {BASE_URL}/api/public/{API_KEY}/label-generation`

Submit one paid order that has a tracking number. The order must belong to the account of the API key. The call accepts exactly one `orderId`: an array, or several ids separated by a comma, semicolon or space, is rejected. Keep the `labelGenerationId` of the answer and use it with Get. The answer has no `downloadUrl`, even when an earlier request for the same active order and format is reused.

### Example request

```bash
# Here is a curl example
curl -X POST '{BASE_URL}/api/public/{API_KEY}/label-generation' \
-H 'Content-Type: application/json' \
-d '{
  "orderId": "261113IBBQ4K",
  "courier": "JT",
  "format": "normal-1"
}'
```

### Example response

```json
{
    "success": true,
    "data": {
        "labelGenerationId": "6af6e184ce96b86fe958b5a7",
        "status": "PENDING"
    }
}
```

## Get the label status

`GET {BASE_URL}/api/public/{API_KEY}/label-generation/{labelGenerationId}`

`labelGenerationId` is the 24-character id returned by Request. Get only reads: it does not use the Print limit. Poll at a reasonable interval, a few seconds apart, and do not send a new Request just to check progress. In sandbox a label took about 25 seconds to be ready.

### Example request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/label-generation/6af6e184ce96b86fe958b5a7'
```

### Example response

```json
{
    "success": true,
    "data": {
        "labelGenerationId": "6af6e184ce96b86fe958b5a7",
        "status": "COMPLETED",
        "format": "normal-1",
        "downloadUrl": "https://storage.googleapis.com/mengantar-bucket/download/<user-id>/pdf/label-order-261113IBBQ4K-<attempt-id>.pdf?X-Goog-Algorithm=..."
    }
}
```

## Body parameters

| Field | Type | Description |
| --- | --- | --- |
| orderId | String | Required. The `ORDER_ID` of one existing order that is not deleted and belongs to the account of the API key. It is the order number, not the `_id`. |
| courier | String | Required. The courier of the order, for example `JNE`, `JT` or `spx`. The case does not matter here. |
| format | String | Required. The label layout, see Label formats below. |

## Path parameters

| Field | Type | Description |
| --- | --- | --- |
| labelGenerationId | String | The generation id returned by Request. |

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | `true` when the request was processed. |
| data | Object | The generation. |
| labelGenerationId | String | The id of the generation. Use it with Get. |
| status | String | `PENDING`, `PROCESSING`, `COMPLETED` or `FAILED`, see Status lifecycle. |
| format | String | Only when `COMPLETED`: the label layout that was made. |
| downloadUrl | String | Only when `COMPLETED`: the link to the PDF. It is valid for 15 minutes, and each poll gives a fresh one. |
| errorMessage | String | Only when `FAILED`: why the label could not be made. |

## Status lifecycle

| Status | Meaning | downloadUrl | Next action |
| --- | --- | --- | --- |
| `PENDING` | Queued, or waiting for a retry after a temporary failure. | Not present | Poll Get. |
| `PROCESSING` | A worker is preparing, rendering, checking or uploading the PDF. | Not present | Poll Get. |
| `COMPLETED` | The PDF was checked and stored. | Present, valid for 15 minutes | Download the PDF before the link expires. Poll again for a fresh link. |
| `FAILED` | The job cannot go on: the check failed or every attempt was used. | Never present | Read `errorMessage`, fix the cause, then send a new Request if it makes sense. |

A `FAILED` label still answers 200 with `success: true`: the failure is in `data.status`. An order that is not paid yet is accepted by Request, and its label ends `FAILED`.

## Label formats

| Format | Availability |
| --- | --- |
| `normal-1`, `normal-2`, `normal-4`, `normal-6` | Supported couriers. |
| `thermal-10x10`, `thermal-10x15`, `thermal-8x6` | Supported couriers. |
| `thermal-new-10x10`, `thermal-new-10x15` | J&T (`JT`) or SPX Express (`spx`) orders only. |

## Several orders

One request holds one order. To print several orders, send one Request per order, for any courier, and keep the `labelGenerationId` of each.

## Rate limit

Request is a final Print action. The limit is **8 Print actions per 60 seconds**, shared between Seller Web and the Public API for the same parent account. A valid Request uses one action, also when it returns a generation that is already active. Get does not use the limit.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| The API key is invalid or inactive, the IP is not allowed, or the account is not on the whitelist | 403 | `{ "success": false, "message": "Not allowed" }` |
| `orderId` is missing or blank | 400 | `{ "success": false, "message": "orderId is required and must be a non-empty string. Only one orderId is allowed per request" }` |
| More than one order id is sent, or it is an array | 400 | `{ "success": false, "message": "Only one orderId is allowed per request. Send one orderId as a non-empty string, not an array or a separated list." }` |
| `courier` is missing | 400 | `{ "success": false, "message": "courier is required and must be a non-empty string" }` |
| `format` is missing or empty | 400 | `{ "success": false, "message": "format is required and must be a non-empty string" }` |
| `format` is unknown | 400 | `{ "success": false, "message": "Invalid format" }` |
| A `thermal-new` format for a courier other than `JT` or `spx` | 400 | `{ "success": false, "message": "Format 'thermal-new-10x15' is only available for JT or SPX orders" }` |
| The order does not exist, or is not an order of that courier | 404 | `{ "success": false, "message": "Order not found" }` |
| The order belongs to another account | 403 | `{ "success": false, "message": "Order does not belong to this account" }` |
| Get: the generation id is malformed, does not exist, or is not yours | 404 | `{ "success": false, "message": "Data not found" }` |
| The Print limit is reached | 429 | `{ "success": false, "message": "Print limit exceeded: maximum 8 Print actions per minute..." }` |
