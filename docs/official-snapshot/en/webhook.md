# Webhook

Instead of polling `GET {BASE_URL}/api/public/{API_KEY}/order`, you can have Mengantar push order status updates to your own URL.

Environment: Sandbox and production

> [!SANDBOX]
> Webhooks are open to every sandbox account, with no whitelist and nothing to request. Sandbox orders never move on their own, so you trigger the delivery yourself: every successful [Simulate order status](#simulate-order-status) call sends one webhook carrying the new `status_category`, even when it is the same as before. Every delivery from the sandbox carries the header `x-environment: sandbox`; production deliveries carry no such header. Still use a different Webhook URL in sandbox than in production, so a rehearsal can never be mistaken for a real shipment update. Everything below behaves the same in both environments.

## Set up your Webhook URL

Set your Webhook URL in **Settings → Account → Integrasi Public API**. Saving it requires a verification code, and generates your **Webhook Secret** the first time. The URL must use HTTPS, must not point to an internal address, and is limited to 512 characters.

In **sandbox** every account can set one, with nothing to request. In **production** webhooks are enabled per account while the rollout is staged, so the Webhook section only appears once your account has been enabled — ask the Mengantar team if you do not see it yet.

## What we send

We send a `POST` with a JSON body every time the order status changes.

```http
POST https://your-domain.com/webhook
Content-Type: application/json
x-timestamp: 1787548800000
x-signature: 05826dec707ea7164801d952cb7eaf7ce9adc0c8aa0b93366480434164a1a111

{
    "cnote_no": "JNE1234567890",
    "order_id": "ORD-000123",
    "courier": "JNE",
    "status_category": "DELIVERED"
}
```

| Field | Description |
| --- | --- |
| `cnote_no` | Tracking number (AWB) of the order. |
| `order_id` | Mengantar order number. |
| `courier` | Courier handling the order. |
| `service_code` | Courier service of the order, the same value as `SERVICE_CODE` in [Get orders](#get-orders), for example `REG` for a regular service or `ECO` for a J&T ECO order (the `courier` stays `JT` for both). `null` when the order has no service code. The examples on this page leave the field out to keep the signature walkthrough short; the real body always carries it, and the signature covers the whole raw body you receive. |
| `status_category` | The only status we send, and the one to build your logic on. The raw courier status is deliberately not included: its wording is open-ended and differs per courier, so branching on it would mean writing per-courier handling. This is the same status category your orders already carry, so the values differ per courier. For the complete per-courier list, refer to the [Order Status Reference Sheet](https://docs.google.com/spreadsheets/d/1Z9MV8PEsqBCp7nNUyPdhypYSneVnzDR8pw3JDf6nQSw/edit?usp=sharing). The values you will see most often are `PENDING PICKUP`, `PICKED UP`, `ON DELIVERY`, `DELIVERED`, `UNDELIVERED`, `PICKUP FAILED`, and `RTS`. Two values come from us rather than from a courier: `ACTIVE/WAITING NEXT PROCESS` (we accepted the order but the courier has not reported anything yet) and `ERROR` (we have no usable status for this order). Neither appears in the reference sheet. **Treat the list as open-ended.** Couriers add states over time, so always keep a default branch rather than matching an exhaustive list. One case deserves particular care: a cancellation arrives as `CANCELED` from some couriers and `CANCELLED` from others — handle both spellings. |

## Telling sandbox from production

A delivery sent from the sandbox environment carries one extra header, `x-environment: sandbox`. A production delivery carries no `x-environment` header at all. The body is identical in both environments and the header is not part of the signature, so a receiver that ignores it keeps working; one that reads it can refuse to act on a sandbox update even if it ever reaches a production URL. We still recommend a separate Webhook URL per environment rather than relying on the header alone.

```http
POST https://your-domain.com/webhook
Content-Type: application/json
x-environment: sandbox
x-timestamp: 1787548800000
x-signature: 05826dec707ea7164801d952cb7eaf7ce9adc0c8aa0b93366480434164a1a111
```

## Verifying the request

Every request carries `x-signature` and `x-timestamp`. Checking them is **optional** — your endpoint receives updates either way — but we strongly recommend it, and it takes about ten lines.

### Why it matters

Your Webhook URL sits on the public internet, and anyone who learns it can send it a request. A leaked log, a screenshot in a support ticket, a former employee, or simply a guessable path is enough.

If you act on whatever arrives, someone who knows your URL can post a fake `DELIVERED` and mark an order complete in your system before it ever shipped. We do not send from a fixed set of IP addresses, so an IP allowlist is not an option: the shared secret is the only thing that separates a genuine update from a forged one.

The two headers give you two different guarantees:

| Header | What it proves |
| --- | --- |
| `x-signature` | The request came from Mengantar and the body was not modified along the way. Only someone holding your Webhook Secret can produce it. |
| `x-timestamp` | When we sent it. Lets you reject an old, genuine request that someone captured and is replaying now. |

### How to verify

The signature is an HMAC-SHA256, in hex, of `{x-timestamp}.{raw request body}`, keyed with your Webhook Secret. Three steps:

1. Capture the **raw request body**, before any JSON parsing.
2. Compute the HMAC over `{x-timestamp}.{raw body}` using your Webhook Secret as the key.
3. Compare it to `x-signature` with a constant-time comparison, and reject the request if they differ.

Compute it over the **raw body exactly as received**. Re-serialising the parsed JSON can reorder or reformat it and will not match.

### Test vector

Check your implementation against this before going live. If your code turns these inputs into the same signature, it will verify our real requests correctly. The secret below is only for this example — use your own Webhook Secret in production.

```text
Webhook Secret : testsecret
x-timestamp    : 1787548800000

raw body, exactly these bytes, one line, no spaces:
{"cnote_no":"JNE1234567890","order_id":"ORD-000123","courier":"JNE","status_category":"DELIVERED"}

the string you sign, {x-timestamp} + "." + raw body:
1787548800000.{"cnote_no":"JNE1234567890","order_id":"ORD-000123","courier":"JNE","status_category":"DELIVERED"}

expected x-signature:
05826dec707ea7164801d952cb7eaf7ce9adc0c8aa0b93366480434164a1a111
```

The sample request further up is this same vector, so you can replay it against your endpoint and it should pass. **Note the body there is indented only to be readable** — what we actually send, and what you must sign, is the single line above.

From a terminal, without writing any code:

```bash
echo -n '1787548800000.{"cnote_no":"JNE1234567890","order_id":"ORD-000123","courier":"JNE","status_category":"DELIVERED"}' \
    | openssl dgst -sha256 -hmac 'testsecret'

SHA2-256(stdin)= 05826dec707ea7164801d952cb7eaf7ce9adc0c8aa0b93366480434164a1a111
```

### Code examples

Node.js (Express):

```javascript
const crypto = require('crypto');

// express: keep the raw body so the signature can be checked
app.use(express.json({
    verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));

app.post('/webhook', (req, res) => {
    const expected = crypto
        .createHmac('sha256', process.env.MENGANTAR_WEBHOOK_SECRET)
        .update(`${req.get('x-timestamp')}.${req.rawBody}`)
        .digest('hex');

    const received = req.get('x-signature') || '';

    const valid =
        expected.length === received.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));

    if (!valid) return res.sendStatus(401);

    // optional: reject anything older than a few minutes
    if (Date.now() - Number(req.get('x-timestamp')) > 5 * 60 * 1000) {
        return res.sendStatus(401);
    }

    // ... update your order here ...
    res.sendStatus(200);
});
```

PHP:

```php
<?php
$secret = getenv('MENGANTAR_WEBHOOK_SECRET');

// raw body, before json_decode
$rawBody   = file_get_contents('php://input');
$timestamp = $_SERVER['HTTP_X_TIMESTAMP'] ?? '';
$received  = $_SERVER['HTTP_X_SIGNATURE'] ?? '';

$expected = hash_hmac('sha256', $timestamp . '.' . $rawBody, $secret);

if (!hash_equals($expected, $received)) {
    http_response_code(401);
    exit;
}

// optional: reject anything older than a few minutes
if (abs(round(microtime(true) * 1000) - (int) $timestamp) > 5 * 60 * 1000) {
    http_response_code(401);
    exit;
}

$payload = json_decode($rawBody, true);

// ... update your order here ...
http_response_code(200);
```

Python (Flask):

```python
import hashlib, hmac, os, time
from flask import Flask, request

app = Flask(__name__)
SECRET = os.environ['MENGANTAR_WEBHOOK_SECRET'].encode()

@app.post('/webhook')
def webhook():
    raw = request.get_data()          # bytes, before any JSON parsing
    timestamp = request.headers.get('x-timestamp', '')
    received = request.headers.get('x-signature', '')

    expected = hmac.new(
        SECRET, f'{timestamp}.'.encode() + raw, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, received):
        return '', 401

    # optional: reject anything older than a few minutes
    if abs(time.time() * 1000 - int(timestamp)) > 5 * 60 * 1000:
        return '', 401

    payload = request.get_json()

    # ... update your order here ...
    return '', 200
```

## If the signature never matches

Almost every failed integration is one of these:

- **Signing a re-serialised body.** By far the most common cause. Parsing the JSON and dumping it again changes key order and spacing, so the bytes you sign are not the bytes we signed. Keep the raw body.
- **The framework consumed the body first.** In Express you need the `verify` hook shown above, because `express.json()` discards the raw stream. Laravel keeps it — use `$request->getContent()`.
- **Forgetting the timestamp prefix.** The signed string is `{x-timestamp}.{raw body}`, not the body on its own. The separator is a single dot.
- **Using the wrong secret.** Regenerating your API key also replaces the Webhook Secret. If verification broke suddenly and nothing else changed, check this first.
- **A plain `==` comparison.** It works, but it leaks timing information. Use `hash_equals`, `hmac.compare_digest`, or `crypto.timingSafeEqual`.

If you choose not to verify at all, at least make your Webhook URL path long and unguessable. That is a speed bump, not a substitute: the path travels with every request we send and is not a secret.

## Responding and retries

Answer with any `2xx` status. We wait at most 5 seconds, so acknowledge first and do your processing afterwards. Redirects are not followed.

A failed delivery is retried up to 3 times, roughly 1s, 5s and 15s later. Delivery is best effort: if all attempts fail the update is not resent, so keep `GET {BASE_URL}/api/public/{API_KEY}/order` as your reconciliation path.

Deliveries are independent, so they can arrive out of order after a retry. Use `x-timestamp` to decide which update is newer rather than the order of arrival, and expect the same status to arrive more than once.

## If delivery is paused

If your endpoint fails to take 20 updates in a row within 24 hours, we pause delivery to it automatically. A URL that has stopped responding otherwise costs four outbound attempts on every status change, indefinitely. Any successful delivery resets the count, so occasional failures never accumulate toward it.

While delivery is paused, **Settings → Account → Integrasi Public API** shows a notice saying so and when it happened, and we send a notification to the bell in your dashboard. If updates stop arriving, check there first.

To resume, make sure your endpoint accepts requests again, then press **Aktifkan kembali** ("Reactivate") in that same section. Saving your Webhook URL again has the same effect. Either way your Webhook URL and Webhook Secret are kept as they are, and resuming does not require a verification code.

Updates whose status changed while delivery was paused are **not** resent. Use `GET {BASE_URL}/api/public/{API_KEY}/order` to reconcile anything you missed.

Pausing affects webhook delivery only. Your API key keeps working, so creating orders and every other endpoint are unaffected.

## Rotating the secret

You can regenerate the Webhook Secret on its own, without touching your API key. Note that regenerating the **API key** also replaces the Webhook Secret — your Webhook URL is kept, but you will need to update the secret in your system.
