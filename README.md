```text
  ███╗   ███╗███████╗███╗   ██╗ ██████╗  █████╗ ███╗   ██╗████████╗ █████╗ ██████╗ 
  ████╗ ████║██╔════╝████╗  ██║██╔════╝ ██╔══██╗████╗  ██║╚══██╔══╝██╔══██╗██╔══██╗
  ██╔████╔██║█████╗  ██╔██╗ ██║██║  ███╗███████║██╔██╗ ██║   ██║   ███████║██████╔╝
  ██║╚██╔╝██║██╔══╝  ██║╚██╗██║██║   ██║██╔══██║██║╚██╗██║   ██║   ██╔══██║██╔══██╗
  ██║ ╚═╝ ██║███████╗██║ ╚████║╚██████╔╝██║  ██║██║ ╚████║   ██║   ██║  ██║██║  ██║
  ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝

                   M U L T I - C O U R I E R   A P I
                      B Y   O N G K I . P R O

     "Official Partner Reference & High-Speed Indonesian Logistics Engine"

       [▶ SPECS] OpenAPI 3.1  ·  [● ENDPOINTS] 25 Operations + Webhook  ·  [MIT LICENSE]
```

<p align="center">
  <a href="https://ongki.pro"><img src="https://img.shields.io/badge/Mengantar-Official%20Partner-22d3ee?style=for-the-badge&logo=handshake&logoColor=white" alt="Official Partner" /></a>
  <a href="https://github.com/ongkipro/mengantar-documentation/actions/workflows/ci.yml"><img src="https://img.shields.io/badge/CI%2FCD-Passing-emerald?style=for-the-badge&logo=githubactions&logoColor=white" alt="CI Passing" /></a>
  <a href="./spec/openapi.yaml"><img src="https://img.shields.io/badge/OpenAPI-3.1-blue?style=for-the-badge&logo=openapiinitiative&logoColor=white" alt="OpenAPI 3.1" /></a>
  <a href="#endpoints-25-total--webhook"><img src="https://img.shields.io/badge/Endpoints-25%20Total%20%2B%20Webhook-purple?style=for-the-badge" alt="25 Endpoints + Webhook" /></a>
  <a href="https://ongki.pro"><img src="https://img.shields.io/badge/Curated%20by-ongki.pro-111111?style=for-the-badge" alt="ongki.pro" /></a>
</p>

<p align="center">
  <a href="#architecture"><b>Architecture</b></a> ·
  <a href="#core-flow"><b>Core Flow</b></a> ·
  <a href="#endpoints-25-total--webhook"><b>Endpoints</b></a> ·
  <a href="#repository-layout"><b>Repository Layout</b></a> ·
  <a href="#documentation-index"><b>Docs Index</b></a> ·
  <a href="#quick-start-after-you-receive-an-api-key"><b>Quick Start</b></a>
</p>

---

## What this is

Mengantar.com is an Indonesian logistics aggregator: one API for multi-courier shipping rates, shipment creation, pickup scheduling, and tracking.

As an **Official Partner Mengantar**, [ongki.pro](https://ongki.pro) maintains this documentation to help teams integrate Mengantar into storefronts, headless commerce projects, and backend systems.

> **Verified:** endpoints, parameters, and response shapes here are matched against the **official docs v2.0.0** (`api-public.mengantar.com/docs`, synced **2026-11-19**; a verbatim per-page snapshot lives in [docs/official-snapshot](docs/official-snapshot/README.md)) and verified live (production read-only 2026-07-03 / 07-19 / 09-25; **sandbox read-only 2026-11-19**). Write paths not exercised live are marked in [10-verification-checklist](docs/10-verification-checklist.md).
>
> ⚠️ **Courier Status:** **Ninja** is discontinued since 1 September 2026. **POS** is supported (COD depends on the account's delivered rate). **SPX (Shopee Express)** `spx` is supported for estimates (single-courier `courier=spx` returns 200 on sandbox, 2026-11-19), create-order, pay-unpaid, delete and simulation; a live create-order has not been observed by this repo yet. **J&T ECO** is booked with `eco: true` on a `JT` order. See [02 §1](docs/02-couriers-and-rules.md).

---

## Architecture

```mermaid
flowchart LR
    U["Customer"] -->|checkout| FE["Storefront<br/>Astro / Next.js / PHP / any frontend"]
    FE -->|call your own endpoint| SRV["Secure server / API route<br/>API key & Webhook secret stay here"]
    SRV -->|proxy + cache| MGT[("Mengantar API<br/>api-public.mengantar.com")]
    SRV --> DB[("DB: orders & shipments")]
    MGT -->|POST webhook (HMAC-SHA256)| SRV

    MGT -.->|rates / tracking / status| SRV
    style SRV fill:#fde68a,stroke:#d97706
    style MGT fill:#bfdbfe,stroke:#2563eb
```

**Key principle:** the API key must never reach the browser. All calls go through your server, with GET caching, key redaction in logs, queue/retry for shipment creation, and HMAC-SHA256 verified Webhooks for instant tracking updates.

---

## Core flow

```mermaid
sequenceDiagram
    autonumber
    participant C as Customer
    participant S as Your Server
    participant M as Mengantar API

    Note over C,M: Checkout — shipping rate estimate
    C->>S: choose destination area
    S->>M: GET /address/search?keyword=
    M-->>S: destination_id
    S->>M: GET /order/estimate?courier=all&weight=
    M-->>S: rates by courier
    S-->>C: show shipping options

    Note over C,M: Order — create shipment asynchronously
    C->>S: pay / place order
    S->>M: POST /order {courier, pickup, orders[]}
    M-->>S: cnote_no + ORDER_ID
    Note over S,M: Real-time status update via Webhook
    M->>S: POST /webhook (x-timestamp, x-signature, status_category)
    S-->>M: HTTP 200 OK
    S-->>C: show tracking number and status
```

---

## Endpoints (25 total + Webhook)

| Method | Endpoint (`{BASE}/api/public/{KEY}`) | Purpose |
| --- | --- | --- |
| GET | `/address/search?keyword=` | Search area → `origin_id` / `destination_id` |
| POST · GET · DELETE | `/address` | Create/update · list · delete pickup addresses |
| PUT | `/address/{id}` | Update specific pickup address by ID |
| POST · GET | `/time` | Add · list pickup schedule (`MM-DD-YYYY` or Unix ms; two-digit hours `09:00`–`20:00`) |
| GET | `/order/estimate?...` | Shipping rate (single / `all`, supports Dangerous Goods) |
| GET | `/api/order/allEstimatePublic` · `…/allEstimate3PL` **(no-key)** | All couriers (flat 20% · 3PL, supports DG) |
| POST | `/order/getPerformancePublic` | Courier performance score |
| GET | `/invoices` | Invoices + balance (keyword & date filter) |
| POST · GET | `/dropshippers` | Add · search master dropshippers (dedup by name+phone) |
| POST | `/order` | Create shipment → `cnote_no` + `ORDER_ID` (supports DG & dropship; optional `idempotencyKey` header for safe retries) |
| GET | `/my-users` | List assignees |
| POST | `/order/pay-unpaid` | Pay unpaid orders |
| GET · DELETE | `/order` | List/track · delete orders |
| GET · DELETE | `/batch` | List · delete batches |
| GET | `/getReceiverScoreByNumberUser?search=` | Receiver score (RTS risk prevention) |
| POST | `/label-generation` | Request async PDF label generation (whitelist, 8 print/min) |
| GET | `/label-generation/{id}` | Poll PDF label status & downloadUrl |
| POST | `/order/simulation` | **Sandbox only** (404 in production): move an own order to ON DELIVERY / DELIVERED / RTS and send one webhook |
| POST | *Your Webhook Endpoint* | Event-driven order status updates (HMAC-SHA256 signature) |

**Auth:** API key is placed in the path (`/api/public/{KEY}/...`), not in headers; sandbox and production keys are separate. **Errors:** a rejected key, missing permission, non-allowed IP or whitelist-only endpoint is always `403 {"success":false,"message":"Not allowed"}`; validation is `400` with `field`/`message`; plus `409` (batch concurrency), `429` (print limit, receiver-score daily limit) and body `code` values such as `COURIER_DISABLED` and `IDEMPOTENCY_*`. *(The `X000`–`X003` codes in releases ≤ 0.4.0 are not in the official docs.)* Full reference → [01](docs/01-api-reference.md).

---

## Repository layout

```
.
├── README.md                 # this file
├── AGENTS.md  (= CLAUDE.md)   # contract for AI coding agents (integration golden rules)
├── Makefile                  # terminal entrypoint: make check | client-check | client-test | smoke
├── docs/                     # 01–14 canonical documentation
├── spec/openapi.yaml         # OpenAPI 3.1 — 25 operations + Webhooks
├── examples/                 # server-only TypeScript client + usage, recipes, test suites
├── scripts/                  # check-links.sh (validation) · smoke.sh (read-only API test)
├── requests.http             # REST-client file (VS Code / JetBrains)
├── .env.example              # credential template (→ .env)
└── CONTRIBUTING.md · SECURITY.md · CHANGELOG.md · LICENSE
```

---

## Where it can be implemented

The API is stack-agnostic. You only need server-side HTTP calls and standard HMAC-SHA256 verification.

| Target | Pattern | Status in this repo |
| --- | --- | --- |
| **Astro** + Cloudflare/Node | Server endpoints (`src/pages/api/*`) + Webhook | Complete example → [05](docs/05-integration-astro.md) |
| **Next.js** App Router / Vercel | Route Handlers / Server Actions + Webhook | Complete example → [06](docs/06-integration-nextjs.md) |
| **PHP / Laravel** | cURL client wrapper + HMAC-SHA256 Webhook Controller | Complete example → [13](docs/13-integration-php.md) |
| **Node.js (Express, Fastify, Vanilla)** | Raw body verify hook + fetch client | Complete example → [14](docs/14-integration-node-js.md) |
| **Serverless** Cloudflare Workers, Vercel, Lambda | Proxy + cache at edge/function layer | Follow server-only pattern |
| **Database** Supabase/Postgres/MySQL | Shipments model + SQL schema | Data model → [03](docs/03-data-model.md) §0 |
| **Automation** queue/cron | Async create + tracking polling | Flow → [04](docs/04-how-it-works.md) |
| **Codegen client** | OpenAPI 3.1, 25 operations + Webhook | [spec/openapi.yaml](spec/openapi.yaml) · typed TS: `examples/mengantar-client.ts` |

---

## Documentation index

| # | File | Contents |
| --- | --- | --- |
| 01 | [api-reference](docs/01-api-reference.md) | REST auth, **25 operations** (official docs, incl. idempotency & sandbox simulation), Webhook HMAC-SHA256, request/response, error codes, caching |
| 02 | [couriers-and-rules](docs/02-couriers-and-rules.md) | Courier mapping (estimate key ↔ shipment name, Ninja discontinued, POS active, SPX in estimates), Dangerous Goods, Cargo, limits |
| 03 | [data-model](docs/03-data-model.md) | Order object (API) + SQL schema, Dropshipper, Label, Webhook, area normalisation |
| 04 | [how-it-works](docs/04-how-it-works.md) | Architecture and workflow: checkout→rate, order→shipment, Webhook event-driven tracking, async labels |
| 05 | [integration-astro](docs/05-integration-astro.md) | Astro integration with server-only client, endpoints, and Webhook handler |
| 06 | [integration-nextjs](docs/06-integration-nextjs.md) | Next.js App Router Route Handlers, Server Actions, and Webhook Route Handler |
| 07 | [reference](docs/07-reference.md) | Glossary, required/optional fields, enums, configuration matrix |
| 08 | [error-catalog](docs/08-error-catalog.md) | API/validation/operational errors and handling patterns |
| 09 | [curl-examples](docs/09-curl-examples.md) | Ready-to-run cURL examples and smoke-test order |
| 10 | [verification-checklist](docs/10-verification-checklist.md) | Verification steps + what is already confirmed live |
| 11 | [prd](docs/11-prd.md) | Product requirements, goals/non-goals, requirements, and verification matrix |
| 12 | [development](docs/12-development.md) | Development workflow, invariants, validation, and release checklist |
| 13 | [integration-php](docs/13-integration-php.md) | Native PHP & Laravel implementation (cURL client + HMAC-SHA256 Webhooks) |
| 14 | [integration-node-js](docs/14-integration-node-js.md) | Node.js, Express, Fastify, and Vanilla JS fetch client & Webhook receivers |
| — | [spec/openapi.yaml](spec/openapi.yaml) | OpenAPI 3.1 spec — 25 operations + Webhook, matched to official live docs |

---

## Important implementation notes

- Tracking number is `cnote_no` (not `tracking_id`); create-order `data` is an **array**, but keep the top-level `batch_id` and `errors[]` for unpaid and partial-failure handling.
- **Two different "origin" IDs** (live-verified): estimate `origin_id`/`destination_id` are **area `_id`s** (from `/address/search`, or a pickup's `PICKUP_AUTOFILL`) — *not* the pickup-address `_id`. Create-order `pickup.address_id` and `/time?address=` use the **pickup-address `_id`**. Mixing them up returns `success:false`.
- Courier names for create-order use Mengantar's official casing: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `lion`, `anteraja`, `pos`, `spx` (in the official docs; live create-order not yet observed). *(Ninja is discontinued from 1 September 2026)*.
- **`GET /order/estimate?courier=all` returns `data` as a per-courier map**, **not an array** — iterate with `Object.entries(data)`. Map keys use a **different casing** from shipment names (`SAP`/`SAPLite`/`SapCargo` → `Sap`, `JNECargo` → `JNE`, `JTEco` → `JT` + `eco:true`, …) — map them via [02 §1.1](docs/02-couriers-and-rules.md). `estimatedSpecialPrice` is what you pay; fields vary per courier.
- Single-courier estimates are **case-sensitive** against shipment names (`Sap` ✅, `SAP` ❌ → `400 Invalid courier`); `courier=spx` works (sandbox 2026-11-19). Treat the undocumented `unsupportedOriginSpx: true` like `unsupported: true`.
- `POST /time` takes `date` as **`MM-DD-YYYY`** (or a Unix-ms number) and two-digit hours `09:00`–`20:00` (`9:00` is rejected). Each call creates a new slot — reuse its `_id`. `GET /time` returns `date` as Unix ms with Jakarta time written as UTC.
- **Check the real outcome, not `success`:** create-order (per-order `status`/`cnote_no`/`isPaid`, `ordersClosedDestination`), delete order/batch (`deletedCount`), label status (`FAILED` is still 200).
- Long lists: use **`cursor`** (`nextCursor`) on `GET /order` and `GET /invoices`; `page`/`size` cap at 100.
- **JT Premium & SiCepat**: one batch per account — parallel batches return `409 Conflict`.
- COD estimate param is **`COD_AMOUNT`** (uppercase) = item value + shipping; low balance → order stays **unpaid** (pay via `/order/pay-unpaid`).
- **Sandbox Traps:** SPX in sandbox only serves Jakarta pickups and destinations (the order is created, then `status:"error"`). Earlier JNE/SAP sandbox restrictions (Jakarta-only origin, SAP without COD) came from older docs and are no longer listed in v2 — re-verify before relying on them. Simulated orders cannot be deleted.
- API requests arriving from WooCommerce origins **must** include the header `x-client-source: woocommerce`.
- API area names may not be standardised; normalisation is required.
- No dedicated key-validation endpoint; use a safe estimate smoke test.
- **Webhooks** use HMAC-SHA256 signature verification (`x-signature`, `x-timestamp`). In production they are enabled per account during the staged rollout; in sandbox every account has them, deliveries carry an unsigned `x-environment: sandbox` header, and `POST /order/simulation` drives test statuses. Keep `GET /order` polling for reconciliation (delivery is best effort).

---

## API access request

To use this documentation against the real Mengantar API, request access directly from the official Mengantar platform/team.

This repository is documentation and integration guidance only. It does not include or distribute API keys — see [SECURITY.md](SECURITY.md) for key handling.

After access is granted:

1. run the smoke tests in [09-curl-examples](docs/09-curl-examples.md) (or `make smoke`)
2. complete the [10-verification-checklist](docs/10-verification-checklist.md)
3. update the OpenAPI schema if any real responses differ
4. keep the API key server-side only

---

## Changelog

**Last updated: 2026-11-19.** Recent highlights — full history in [CHANGELOG.md](CHANGELOG.md).

| Date | Change |
| --- | --- |
| 2026-11-19 | **0.5.0 — official docs v2.0.0 sync:** per-page Markdown snapshot + new `docs-watch`; `X000`–`X003` replaced by the uniform `403 Not allowed`; pickup hours `09:00`–`20:00`; cursor pagination; J&T ECO (`eco`); corrected COD limits; `courier=spx` and `allEstimatePublic` re-verified on sandbox; client helpers `isNotAllowed`, `iterateOrders`, `paidResult`. |
| 2026-11-12 | **0.4.0 — official docs sync:** `idempotencyKey` for safe create-order retries (codes + client support), sandbox-only `POST /order/simulation`, sandbox notes read from the sandbox host (webhooks are active there), Dangerous Goods narrowed to the couriers the docs agree on. |
| 2026-09-25 | **SPX correction (live, read-only):** `spx` returned by `estimate?courier=all` with new `unsupportedOriginSpx` / `unsupportedPickup` / `pickupSchedule` fields; observed estimate-key casing documented; single-courier `400 Invalid courier` documented; `spx` shipment name marked support-confirmed, not yet observed. |
| 2026-09-25 | **Official 24-Endpoint & Webhook Audit:** 24 endpoints synchronized from official docs, official HMAC-SHA256 Webhook engine & test vector, PHP Native/Laravel & Node.js guides, POS Indonesia active, Ninja discontinued per 1 Sept 2026, Dropshipper module, and Async Label Generation. |
| 2026-08-07 | **Contract audit:** aligned write payloads with official JSON examples, fixed unpaid handling, added WooCommerce header support, strict date validation/tests, and warning-free OpenAPI lint. |
| 2026-08-05 | **Sandbox & Architecture Audit:** Mapped the strict JNE/SAP Sandbox constraints and documented the `x-client-source: woocommerce` header requirement. |
| 2026-07-19 | **Re-verified live** against production during the Formalin integration: base URL confirmed working, `courier=all` returns a **per-courier map** (not an array), and `/order/estimate` has **no ETD field** (prices only). |
| 2026-07-03 | **Live-verified** against the production API (read-only): base URL confirmed, the two-origin-ID rule fixed across docs & client, `courier=all` returns 14–15 couriers. |
| 2026-07-03 | **Dev-ready repo:** `docs/` `spec/` `examples/` `scripts/`, AGENTS.md, TypeScript client, Makefile, smoke test, `requests.http`, CI, LICENSE/SECURITY/CONTRIBUTING. |
| 2026-07-03 | **Aligned with official docs:** 18 endpoints, error codes `X000`–`X003` + `409`, fixed `mm-dd-yyyy` date & `COD_AMOUNT` casing; OpenAPI 3.1 spec. |

---

## About

This documentation and toolkit is curated by **[ongki.pro](https://ongki.pro)** — Official Partner Mengantar.

We help teams integrate Mengantar into headless storefronts, ecommerce backends, and automation systems for shipping rates, shipment creation, pickup scheduling, and tracking.

**Governance:** [AGENTS.md](AGENTS.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) · [CHANGELOG.md](CHANGELOG.md) · [LICENSE](LICENSE)

<div align="center">

[ongki.pro](https://ongki.pro) · Official Partner Mengantar

</div>
