# Product Requirements Document (PRD)

Dokumen ini mendefinisikan tujuan produk, batasan, dan requirements untuk **Mengantar API Integration Documentation & Toolkit**. Repo ini adalah dokumentasi + toolkit integrasi, bukan aplikasi runtime.

---

## 1. Ringkasan Produk

Mengantar API Integration Documentation & Toolkit membantu developer membangun integrasi server-side dengan Mengantar API untuk cek ongkir, pembuatan shipment, pickup scheduling, tracking, receiver score, dan pengelolaan batch tanpa menebak endpoint, parameter, atau gotcha operasional.

Produk utama repo ini:

- dokumentasi endpoint dan aturan bisnis di `docs/`;
- OpenAPI 3.1 contract di `spec/openapi.yaml`;
- TypeScript client server-only tanpa dependensi di `examples/mengantar-client.ts`;
- cURL dan smoke-test script untuk validasi akun;
- governance untuk AI coding agent di `AGENTS.md`.

---

## 2. Goals

| ID | Goal |
| --- | --- |
| G-1 | Developer dapat memahami semua endpoint Mengantar yang relevan tanpa membuka banyak sumber berbeda. |
| G-2 | Developer dapat membedakan `_id` wilayah untuk ongkir dari `_id` alamat pickup untuk pickup/order. |
| G-3 | Integrasi produksi aman dari API key leak, request batch paralel, COD unsupported route, dan unpaid order trap. |
| G-4 | Toolkit menyediakan client TypeScript dan OpenAPI yang sinkron dengan dokumen manusia. |
| G-5 | Repo dapat divalidasi lokal lewat `make all`, dan smoke-test live hanya berjalan saat API key tersedia. |

## 3. Non-Goals

| ID | Non-Goal |
| --- | --- |
| NG-1 | Repo ini tidak menyimpan API key, kredensial, response customer nyata, atau data pembayaran. |
| NG-2 | Repo ini tidak menyediakan aplikasi dashboard, database, job queue, atau deployment produksi. |
| NG-3 | Repo ini tidak menggantikan konfirmasi final dari docs resmi Mengantar atau tim Mengantar untuk base URL/kontrak akun. |
| NG-4 | Repo ini tidak menjalankan operasi tulis live; operasi tulis hanya berupa contoh manual yang wajib diarahkan ke sandbox terkonfirmasi. |

---

## 4. Requirements

### REQ-1 — Server-only API key handling
- **Statement:** Ketika dokumentasi atau client menunjukkan pemanggilan Mengantar API, maka API key harus berada di server-side path `/api/public/{API_KEY}` dan tidak boleh diarahkan ke browser bundle.
- **Acceptance:** `examples/mengantar-client.ts` meredaksi key pada `onRequest`; `README.md`, `docs/01-api-reference.md`, dan `examples/README.md` menyebut server-only.

### REQ-2 — Endpoint catalog completeness
- **Statement:** Ketika endpoint resmi Mengantar didokumentasikan, maka daftar endpoint harus berjumlah 18 operasi dan sinkron antara README, `docs/01-api-reference.md`, OpenAPI, dan client TypeScript.
- **Acceptance:** `make check` melaporkan OpenAPI `paths: 13`; `make client-check` dan `make client-test` lulus.

### REQ-3 — Area ID vs pickup address ID separation
- **Statement:** Ketika flow menggunakan origin, maka docs harus membedakan `origin_id` ongkir (`PICKUP_AUTOFILL`, wilayah `_id`) dari `pickup.address_id` (`_id` alamat pickup dari `GET /address`).
- **Acceptance:** cURL examples, examples README, OpenAPI `Pickup.address_id`, dan courier checklist memakai istilah `ORIGIN_WILAYAH_ID` vs `PICKUP_ADDRESS_ID`.

### REQ-4 — Estimation route gating
- **Statement:** Ketika checkout menampilkan kurir atau COD, maka integrator harus mengevaluasi `unsupported` dan `unsupported_cod` sebelum opsi dikirim ke customer.
- **Acceptance:** `docs/01-api-reference.md`, `docs/02-couriers-and-rules.md`, dan `examples/README.md` menjelaskan filter unsupported.

### REQ-5 — Batch order concurrency safety
- **Statement:** Ketika membuat shipment untuk JT Premium, Ninja, atau SiCepat, maka integrator tidak boleh mengirim `POST /order` paralel per akun.
- **Acceptance:** `docs/01-api-reference.md`, `docs/02-couriers-and-rules.md`, `examples/README.md`, dan OpenAPI response `409` menyebut gabung ke satu batch.

### REQ-6 — Unpaid order handling
- **Statement:** Ketika saldo wallet kurang pada non-COD shipment, maka integrator harus menangani order unpaid dengan `cnote_no` kosong dan menyediakan flow `POST /order/pay-unpaid`.
- **Acceptance:** `docs/01-api-reference.md`, `docs/08-error-catalog.md`, `docs/09-curl-examples.md`, dan examples README mencantumkan pay-unpaid flow.

### REQ-7 — Pickup time constraints
- **Statement:** Ketika membuat slot pickup via `POST /time`, maka format `date` harus `mm-dd-yyyy`, `time` harus slot 9:00-18:00, dan jadwal harus minimal 90 menit dari waktu saat ini.
- **Acceptance:** `docs/09-curl-examples.md`, `spec/openapi.yaml`, and `examples/mengantar-client.ts` encode date format/slot.

### REQ-8 — Sandbox traps visibility
- **Statement:** Ketika integrator memakai sandbox, maka docs harus menjelaskan batas JNE origin Jakarta, SAP non-COD Jakarta-Jakarta, dan top-up sandbox wallet.
- **Acceptance:** README, `docs/02-couriers-and-rules.md`, and verification checklist surface sandbox-specific traps.

### REQ-9 — Documentation validation
- **Statement:** Ketika repo berubah, maka contributor harus menjalankan `make all` sebelum menandai pekerjaan selesai.
- **Acceptance:** `AGENTS.md`, `Makefile`, and CI workflow reference `make check` + `client-check`.

---

## 5. Technical Decisions

| ID | Decision | Reason |
| --- | --- | --- |
| TD-1 | Keep the TypeScript client dependency-free. | Global `fetch`, `URLSearchParams`, and native types are enough for a docs toolkit. |
| TD-2 | Keep OpenAPI as the machine-readable contract. | It enables codegen/review while docs remain readable for implementers. |
| TD-3 | Keep the live smoke test read-only and opt-in via process environment. | Prevent accidental writes and avoid parsing credential files. |
| TD-4 | Keep docs in Bahasa Indonesia with exact API names in English. | The target implementers are Indonesian teams; API casing must stay exact. |

---

## 6. Verification Matrix

| Check | Command | Covers |
| --- | --- | --- |
| Local repository contract | `npm ci --ignore-scripts && make all` | Redocly OpenAPI lint, internal links, credential hygiene, strict TS client, dan contract tests dari lockfile. |
| Shell syntax check | `bash -n scripts/check-links.sh scripts/smoke.sh` | Script parse safety. |
| Live read-only API smoke | `make smoke` | Key validity, address search, pickup address list, estimate, invoices; key hanya dari process environment. |

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
