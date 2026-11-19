# Search Dropshipper

`GET {BASE_URL}/api/public/{API_KEY}/dropshippers`

Lists the dropshippers saved in your account, optionally filtered by the start of the name or the phone number. Use the `id` of one result as `dropShipper.id` in [Create order](#create-order), or [add a dropshipper](#add-dropshipper) first if it is not saved yet.

A valid, active API key with the `Create order` permission is required in `{API_KEY}`, and the Dropshipper feature must be enabled for your account through Seller Web. Without a valid key the call is rejected with 403 `Not allowed`.

Permission required: Create order
Environment: Sandbox and production

## Example request

```bash
curl -X GET '{BASE_URL}/api/public/{API_KEY}/dropshippers?search=Toko&page=1&perPage=20'
```

## Example response

```json
{
  "success": true,
  "data": [
    {
      "id": "66ab1234567890abcdef1234",
      "name": "Toko Partner",
      "phone": "081234567890"
    },
    {
      "id": "66ab1234567890abcdef1235",
      "name": "Toko Sahabat",
      "phone": "081298765432"
    }
  ],
  "pagination": { "page": 1, "perPage": 20 }
}
```

## Query parameters

All parameters are optional. Without any, you get the first 20 dropshippers, sorted by name.

| Field | Type | Description |
| --- | --- | --- |
| search | String | The start of a name or of a phone number. It is not case sensitive. Send plain text: characters such as `(` and `[` make the request fail with 500. To search a number that starts with `+`, write it as `%2B`, because a plain `+` becomes a space. |
| page | Number | Page number. Default `1`. A value that is not a positive number gives `1`. |
| perPage | Number | Records per page. Default `20`, maximum `100`. A larger value is rejected with 400. A value that is not a positive number gives `20`. |

With a search of several words, such as `Toko Partner`, the result also includes the names that start with the first word, `Toko`. The best matches come first in the page.

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| data | Array | The dropshippers of this page. An empty array when nothing matches. |
| id | String | The ID of the dropshipper. Send it as `dropShipper.id` in Create order. |
| name | String | The saved name. |
| phone | String | The saved phone number. |
| pagination | Object | The `page` and `perPage` that were used. |

The response has no total. When a page returns fewer records than `perPage`, it is the last page.

## Error responses

| Situation | Status | Response |
| --- | --- | --- |
| `perPage` is above 100 | 400 | `{ "success": false, "message": "perPage cannot be greater than 100" }` |
| Invalid or inactive API key, no `Create order` permission, or IP not allowed | 403 | `{ "success": false, "message": "Not allowed" }` |
| The Dropshipper feature is not enabled for the account | 403 | `{ "success": false, "message": "Dropshipper Feature is not enabled. Enable it through Seller Web." }` |
| `search` has a character such as `(` or `[` | 500 | `{ "success": false, "message": "Invalid regular expression: /^(/: Unterminated group" }` |
