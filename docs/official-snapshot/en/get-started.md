# Get started

To use this API you need an **API key**. A key identifies your account on every request.

## Get your API key

Open **Pengaturan Akun (Account Settings)** → **Integrasi Public API** in the Mengantar app and select **Generate API Key**. The button is active once your email and phone number are verified.

- A key starts with `API-` followed by 16 random letters and numbers. It is part of every request address, not a header.
- Each account has one key. Regenerate replaces the old key immediately, so update it in your system. If you use a Webhook URL, regenerate also replaces the Webhook Secret.
- Sandbox and production issue separate keys.

## Base URL

- Production: `https://api-public.mengantar.com`
- Sandbox: `https://sandbox.mengantar.com`

Every request address has the form `{BASE_URL}/api/public/{API_KEY}`. The base URL in the examples follows the host you opened.

## For AI agents

Every page also exists as plain Markdown. Point your agent to `llms.txt` to list them all, or switch to the **Agent** view on any page.

```text
{BASE_URL}/docs/llms.txt
```

## Permissions

| Permission | Default | What it controls |
| --- | --- | --- |
| `Create order` | On | Create and delete orders, pay unpaid orders, delete batches, search, read, add and delete addresses, read and add pickup times, add and search dropshippers. |
| `Check order status` | On | Read the order list and the batch list. Order status simulation (sandbox only). |
| `Check shipping fee` | On | Shipping fee with an API key, and courier performance. |
| `Check balance` | On | Read invoices and balance. |
| `Check batch load` | Off | Special permission set by admin. The endpoint it controls is not published. |

My Users and Update address only check that the key is known, active and called from an allowed IP.

## Whitelisted access

Some endpoints are open only to accounts on a whitelist, on top of the permissions above. A key whose account is not on the list gets `403 Not allowed`. Access is granted on request: contact Mengantar Customer Service (CS).

| Endpoint | Who can call it |
| --- | --- |
| [Get Courier Performance](#get-courier-performance) | Whitelisted accounts only. Not applied in sandbox. |
| [Get Receiver Score Number](#get-receiver-score-number) | Whitelisted accounts only, with a daily limit. Neither is applied in sandbox. |
| [Print Label PDF (BETA)](#print-label-pdf-beta) | Whitelisted accounts only. |
| [Webhook](#webhook) | Enabled per account in production while the rollout is staged. Open to every sandbox account. |

> [!IMPORTANT]
> **403 Not allowed.** The call is rejected when the API key is unknown or inactive, the key does not have the permission the endpoint needs, your IP is not on the key's allowlist (request IP whitelisting through CS), or the endpoint is for whitelisted accounts only and yours is not on the list.

> [!NOTE]
> **Sandbox vs production.** The order status simulation endpoint exists only in sandbox. The base URL in the examples follows the host you opened.

> [!NOTE]
> **Ninja Express is no longer available.** Ninja Express stopped working with Mengantar on 1 September 2026. Endpoints that create or pay shipments, such as [Create order](#create-order), [Pay unpaid](#pay-unpaid) and [Check shipping fee](#check-shipping-fee), no longer accept it. Read endpoints such as [Get orders](#get-orders) and [Get batches](#get-batches) still return Ninja data created before that date.
