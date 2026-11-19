# Get My Users (assignee)

`GET {BASE_URL}/api/public/{API_KEY}/my-users`

Lists the team members (sub-users) of your account. Use the `_id` of one of them as `assignee` in [Create order](#create-order) to assign the order to that team member. You manage your team members in the Mengantar app, under **Settings** → **User Management** (the `/users` page), where you can add a user and edit or remove existing ones.

A valid, active API key called from an allowed IP is required in `{API_KEY}`. No other permission is needed. Without it the call is rejected with 403 `Not allowed`.

Permission required: None beyond an active API key called from an allowed IP
Environment: Sandbox and production

## Example request

```bash
# Here is a curl example
curl -X GET '{BASE_URL}/api/public/{API_KEY}/my-users'
```

## Example response

```json
{
    "success": true,
    "data": [
        {
            "_id": "67d116f5b68d715ee586ab96",
            "name": "Rina",
            "email": "rina@example.com"
        },
        {
            "_id": "67c58e190a9a21d23e220207",
            "name": "Udin",
            "email": "udin@example.com"
        }
    ]
}
```

The call has no parameters. It returns all your team members at once, without pagination, and an empty `data` when you have none.

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| data | Array | The team members of your account. |
| _id | String | The ID of the team member. Send it as `assignee` in Create order. |
| name | String | The name of the team member. |
| email | String | The email of the team member. |

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| Invalid or inactive API key, or IP not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
| The method is not `GET` | 405 | `{ "success": false, "message": "POST not allowed on this route" }` |
