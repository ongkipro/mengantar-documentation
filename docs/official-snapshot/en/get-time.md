# Get Time

`GET {BASE_URL}/api/public/{API_KEY}/time`

Lists the upcoming pickup times you added with [Add Time](#add-time). Use the `_id` of one as `pickup.time_id` in [Create order](#create-order) when the pickup type is `scheduledPickup`.

A valid, active API key with the `Create order` permission is required in `{API_KEY}`. Without it the call is rejected with 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/time'
```

## Example response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af583fb9708e74dced0799e",
            "date": 1796043600000,
            "time": "13:00"
        },
        {
            "_id": "6af583fc9708e74dced079b0",
            "date": 1796115600000,
            "time": "09:00"
        },
        {
            "_id": "6af583fc9708e74dced079bb",
            "date": 1795982400000,
            "time": "20:00"
        }
    ]
}
```

## Filter by address and courier

Add `address` to get the times of one address, and `courier` to hide the times that courier cannot use. In this example `JNE` hides the Sunday `20:00` slot of the list above.

### Example request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/time?address=6af555fc8109274a92d72fb3&courier=JNE'
```

### Example response

```json
{
    "success": true,
    "data": [
        {
            "_id": "6af583fb9708e74dced0799e",
            "date": 1796043600000,
            "time": "13:00"
        },
        {
            "_id": "6af583fc9708e74dced079b0",
            "date": 1796115600000,
            "time": "09:00"
        }
    ]
}
```

## Query parameters

Both parameters are optional. Without them, the call returns all your upcoming pickup times, for every address.

| Field | Type | Description |
| --- | --- | --- |
| address | String | The `_id` of a saved address. Returns only the times added for that address. An address that does not exist, or has no times, returns an empty list. |
| courier | String | Hides the times that this courier cannot use. It is case sensitive. See the rules below. |

Times that have already passed are never returned. The `courier` rules are:

- `JNE`: no Sunday pickups, and no `19:00` or `20:00`.
- `anteraja`: no Sunday pickups.
- `iDexpress`: no `20:00`, and only times more than 90 minutes from now.
- Any other value, or no value: no extra filter.

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| data | Array | The pickup times, in the order they were added. An empty array when none match. |
| _id | String | The pickup time ID. Use it as `pickup.time_id` in Create order. |
| date | Number | The pickup date and hour as a Unix timestamp in milliseconds. The Jakarta date and hour are written as if they were UTC, so `1796043600000` is `2026-11-30 13:00` when you read it in UTC. Read it in UTC, not in your own time zone. |
| time | String | The pickup hour, for example `13:00`. |

## Limits

- A result does not say which address a time belongs to. To get the times of one address, send `address`.
- The list has no pagination and no sorting. Sort it by `date` on your side if you need an order.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| Invalid or inactive API key, no `Create order` permission, or IP not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
