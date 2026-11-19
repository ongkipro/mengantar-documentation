# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/). Versi mengacu ke spec (`spec/openapi.yaml`).

## [Unreleased]

## [0.5.0] — 2026-11-19

Disinkronkan dengan **docs resmi v2.0.0** (`https://api-public.mengantar.com/docs/llms.txt`, satu halaman Markdown per endpoint,
EN + ID) dan dicek read-only di sandbox 2026-11-19.

### Added
- `docs/official-snapshot/`: salinan **verbatim** 27 halaman × EN/ID + `llms.txt`. `scripts/docs-watch.mjs` (dipanggil `make docs-watch`)
  membandingkan semua halaman; exit 0/1/2; `--update` semua-atau-tidak-sama-sekali; host sandbox dibandingkan sebagai info.
- Permission key, penolakan seragam `403 Not allowed`, dan daftar endpoint whitelist ([01 §1](docs/01-api-reference.md)).
- Parameter baru: `GET /address` (`keyword`, `page`+`size`, `fields`); `GET /time` (`courier`, `address` opsional);
  `allEstimatePublic` (`withCourierServices` → `JTEco`); `GET /invoices` (`cursor`, `ids`); `GET /order` (`cursor`, `keyword`);
  `GET /batch` (`batchFilter`, `keyword`, `address_id`); `orders[].eco` (J&T ECO).
- Respons: `nextCursor`, `ordersClosedDestination`, `SERVICE_CODE`, `proofHistory`, `recommendedDGCourier`, `summary` skor penerima,
  bentuk ganda pay-unpaid, `deletedCount`/`unDeletedCount`, webhook `service_code`, skema `Batch`.
- Client: `isNotAllowed()`, `paidResult()`, `listOrders()` + `iterateOrders()`, `iterateInvoices()`, `deleteOrdersByOrderId()`,
  `addOrigin()`; `listOrigins()`/`listPickupTimes()`/`listBatches()`/`listInvoices()` menerima parameter baru. 8 contract test baru (23 total)
  + cek tipe (`"9:00"` ditolak, `spx` di estimasi, `eco`).
- [08 §A4](docs/08-error-catalog.md): respons "sukses" yang tidak berarti berhasil.

### Changed
- **Kode error `X000`–`X003` dihapus** dari docs, spec dan client: tidak ada di docs v2 maupun `/docs/v1` saat ini, dan sandbox menjawab
  `403 Not allowed` / `400` + pesan. `MengantarError.code` tidak lagi mencari `X00*` di teks pesan.
- **Jam pickup `09:00`–`20:00` dua digit** (`9:00` ditolak); `date` juga boleh Unix ms (number). Add Time membuat slot baru tiap panggilan;
  batas 90 menit dicek saat create order.
- **Batas COD dikoreksi** ke tabel docs v2: SiCepat & J&T 5 jt (dulu 2,5 jt / 2 jt), Sap 2 jt; minimum Rp1.000 (lion Rp10.000);
  batas berat `JT` ≤ 50, `anteraja`/`pos`/`spx` 1–50 kg.
- **SPX:** `courier=spx` tunggal → 200 (sandbox), `EstimateCourier` kini memuat `spx`. `allEstimatePublic` (path resmi) → 200 (catatan 404 lama keliru path).
- Dangerous Goods: hanya `SiCepat` & `iDexpress` (docs v2 konsisten; status `[verifikasi]` untuk JT dicabut).
- `POST /address` hanya menambah; `_id` "in-place update" ditandai deprecated (pakai `PUT /address/{id}`; `updateAddress` bertipe `PickupAddressUpdateInput`).
- `/address/search` butuh permission Create order (catatan "key tidak divalidasi" dicabut); field kode kurir internal tidak lagi didokumentasikan.
- `invoiceFilter` resmi: `typeAddBalance` (bukan `typeAddSaldo`), plus `typeRefund`, `typeReconciliation`.
- Label request: kode sukses 2xx (docs v2 tidak menyebut 202); `FAILED` tetap 200.
- Parameter `GET /order` asal plugin (`category`, `ticketFilter`, `receiverFilter`, `no_update_after_*`, `reseller`) ditandai deprecated.
- Catatan sandbox JNE/SAP (Jakarta-only) diarsipkan: tidak lagi ada di docs v2. SPX sandbox: Jakarta pickup & tujuan.
- Client: kegagalan membaca body respons kini `MengantarError` status 0, bukan exception mentah.

### Removed
- `docs/official-snapshot/official-docs.txt` (dump HTML yang tidak lagi bisa diambil karena docs v2 dirender JavaScript).

## [0.4.0] — 2026-11-12

Disinkronkan dengan docs resmi per 2026-11-11 (`api-public.mengantar.com/docs/`; catatan khusus sandbox dibaca dari
`sandbox.mengantar.com/docs/`, karena di host produksi bagian itu disembunyikan).

### Added
- **Idempotency key** untuk `POST /order`: header `idempotencyKey` (1–50 karakter, 24 jam per akun), aturan replay
  (`Idempotent-Replayed`, respons 5xx pertama juga di-replay, 4xx melepas kunci, hapus batch tidak melepas kunci) dan
  kode `IDEMPOTENCY_KEY_INVALID` / `_REQUEST_IN_PROGRESS` / `_REQUEST_UNRESOLVED` / `_KEY_REUSED` / `_UNAVAILABLE`.
  Di [01 §8.1a](docs/01-api-reference.md), [08 §A1a](docs/08-error-catalog.md), [09 §10a](docs/09-curl-examples.md), spec.
- **`POST /order/simulation`** (sandbox saja, produksi 404): endpoint ke-25 di 01, 09 §14a dan spec.
- Client contoh: `createOrder(payload, { idempotencyKey })` (validasi panjang sebelum request), `simulateOrderStatus()`,
  `MengantarError.retryAfter` dan `.idempotentReplayed`, `CreateOrderResponse.idempotentReplayed`; empat contract test baru
  (15 total) dan `examples/mengantar-client.typecheck.ts` (cek tipe `@ts-expect-error`, ikut `make client-check`).
- Spec: `idempotentReplayed` di `CreateOrderResponse`, header `Idempotent-Replayed` / `Retry-After`, `IDEMPOTENCY_KEY_INVALID`
  pada 400, aturan "tepat satu" pada `/order/simulation`, header webhook `x-environment` (sandbox).
- `requests.http` #28 (simulasi, sandbox) dan header `idempotencyKey` pada #18; README tabel endpoint + baris simulasi.

### Changed
- `MengantarError.code` kini mengutamakan field `code` body: 409 idempotency tidak lagi tertutup sebagai `"409"`
  (409 konkurensi batch tanpa `code` tetap `"409"`).
- [02 §6](docs/02-couriers-and-rules.md) Sandbox: webhook **aktif** di sandbox (dulu tercatat belum aktif), header
  `x-environment: sandbox`, batas SPX, top-up via Midtrans simulator, endpoint whitelist terbuka dengan data contoh.
- Dangerous Goods: hanya `SiCepat` (HALU) dan `iDexpress` konsisten di docs resmi; `JT` ditandai **[verifikasi]**
  karena tabel DG Create Order tidak mencantumkannya.
- **SPX** kini tercantum di docs resmi (9 nama shipment, cek 2026-11-11) di 01, 02, 05, 06, 07, 10, README, spec dan client;
  create-order SPX tetap **[verifikasi]** (belum teramati live), dan hasil live 2026-09-25 (`400 Invalid courier` untuk
  estimasi single-courier SPX) dicatat sebagai belum dicek ulang.
- Webhook: 01 §11 tidak lagi berjudul "Production"; aktivasi per akun di produksi, aktif di sandbox, header
  `x-environment: sandbox`. README tidak lagi menyebut webhook hanya untuk produksi.
- 08 §E: retry `POST /order` lewat `idempotencyKey`; 409 dibedakan menurut `code`.
- Label: format resmi (`normal-*`, `thermal-*`, `thermal-new-*` untuk JT/SPX) dan satu `orderId` per request
  menggantikan `A6`/`A4`/`type` yang sudah usang di 03, 07 dan 09.
- Jumlah endpoint 25 di README, 10, 11 (REQ-2: `paths: 18`), 12, examples/README dan requests.http.
- SPX: batas COD maksimum Rp5.000.000 masuk tabel COD 02 §3.2; format `thermal-new-*` berlaku untuk JT **dan** SPX (01 §10.1);
  semua pernyataan "estimasi single-courier SPX ditolak" kini bertanggal 2026-09-25 dan menyebut bahwa docs resmi sudah
  mencantumkan `spx` (02, 07, 09, 10, 12, AGENTS, README, requests.http, examples, PHP guide).
- Skema contoh `label_generations` (03): `order_ids text[]` → `order_id text` (satu order per request).

### Fixed
- `MengantarError.code`: field `code` kosong tidak lagi menimpa status `409`/`429`.
- Tipe `LabelGenerationPendingResponse` / `LabelGenerationStatusResponse` kini bentuk `data` yang benar-benar
  dikembalikan client (dulu bertipe envelope, sehingga `res.status` tidak terketik); contoh label di
  `examples/README.md` (`orderIds`/`A6`/`type`) diganti ke kontrak resmi dan ikut dicek di `mengantar-client.typecheck.ts`.

## [0.3.3] — 2026-09-25

### Added
- Pola penanganan blokir COD Pos Indonesia (403) di [02](docs/02-couriers-and-rules.md) §3.3: kenali persis
  (403 + tiga status), jangan retry, simpan alasan di order, matikan COD `pos` di kebijakan kurir karena estimasi
  tidak mencerminkannya, aktifkan kembali secara manual. Langkah 3c di [08](docs/08-error-catalog.md) §E dan item
  rekam-body-asli di [10](docs/10-verification-checklist.md) §3.
- Client contoh: `posCodIneligibility(error)` → `{ status, deliveredRate, minimumDeliveredRate }` atau `null`,
  dengan test (403 lain dan status di luar tiga nilai resmi tidak dikenali).

## [0.3.2] — 2026-09-25

### Added
- Kelayakan COD Pos Indonesia per akun (docs resmi): ambang delivered rate 82% atas order semua kurir di jendela
  21–60 hari; status `eligible`/`warning` (200) dan `new_seller`/`insufficient`/`blocked` (403). Tercatat di
  [02](docs/02-couriers-and-rules.md) §3.3, [08](docs/08-error-catalog.md) §A3, dan spec (`403` di `createOrder`,
  schema `PosCodIneligible`). Dua kalimat docs resmi soal ambang blokir saling berbeda — ditandai **[verifikasi]**.

### Changed
- `app.mengantar.com/docs` dan `api-public.mengantar.com/docs` dicatat sebagai mirror dokumen yang sama
  (keduanya 200, konten sama per 2026-09-25).
- `examples/package.json` diselaraskan ke versi spec (0.2.0 → 0.3.2).

## [0.3.1] — 2026-09-25

Koreksi status SPX berdasarkan pemanggilan **read-only** ke produksi (2026-09-25, tanpa order dibuat) + konfirmasi support Mengantar.

### Changed
- **SPX (Shopee Express) tidak lagi ditandai unsupported.** `GET /order/estimate?courier=all` (dengan/tanpa `COD_AMOUNT`)
  mengembalikan key `spx` (contoh Jakarta → Jakarta Selatan: `price` 13700, `"1 - 3 days"`, COD didukung; rute Jayapura: 34000).
- Nama shipment `spx` untuk `POST /order` ditambahkan dengan tanda **dikonfirmasi support Mengantar, belum ada di docs resmi,
  belum teramati di create-order live** — `docs/01`, `docs/02` §1.2, `docs/07`, `spec` (`CreateOrderRequest.courier`), client (`Courier`).
- Tabel pemetaan kurir `docs/02` §1.1 memakai **casing key estimasi yang teramati live**: `JNE`, `JNECargo`, `SiCepat`,
  `SiCepatCargo`, `SAP`, `SAPLite`, `SapCargo`, `iDexpress`, `iDexpressCargo`, `JT`, `lion`, `anteraja`, `spx`, `pos`
  (sebelumnya lowercase dari plugin). Key `idlite`/`idl`/`paxel`/`wahana` tidak muncul lagi.
- Catatan "estimasi akun tanpa ETD" diperbarui: entri `spx` membawa `estimate_delivery` & `estimatedDate`.
- Klaim changelog 0.3.0 yang tidak didukung docs resmi maupun observasi live dihapus (`lionCargo`, `anterajaCargo`,
  batas panjang `customerName`/alamat).

### Added
- Field entri `spx`: `unsupportedOriginSpx` (perlakukan seperti `unsupported`), `unsupportedPickup` (arti belum dipastikan),
  `pickupSchedule` — di `docs/01` §5.1, `spec` `CourierRate`, dan tipe client. Juga `isDangerousGoodsSupported`,
  `discountExtra*` (docs resmi) di `CourierRate`, dan `code` di `Envelope`.
- Error `400 Invalid courier` (estimasi single-courier case-sensitive: `JT`/`Sap` ✅, `SAP`/`sap`/`jt` ❌; semua 16 ejaan SPX ❌)
  dan `400 COURIER_DISABLED` (Ninja, docs resmi) di `docs/08` §A2 dan `docs/01` §12.
- Client: `isRateAvailable(rate, cod)`; `EstimateCourier` mengecualikan `spx`; `MengantarError.code` membawa field `code`
  body (mis. `COURIER_DISABLED`). Dua contract test baru.
- `docs/10` §0d: temuan live 2026-09-25 + daftar yang masih terbuka untuk SPX.

### Observed (belum disimpulkan)
- `…/order/allEstimatePublic` dengan parameter yang sama → `404 Not Found` pada akun uji. Belum dipastikan global.

### Fixed
- Referensi silang basi: `docs/05`/`docs/06` §7.5 → §8, `docs/03` §9.2 → §9 & §11.3, `AGENTS.md` webhook §3 → §11.
- Footer `docs/01` dikembalikan ke format standar (tautan `../README.md`).

## [0.3.0] — 2026-09-25

Penyelarasan penuh 24 endpoint resmi dari `https://api-public.mengantar.com/docs/` + Webhook Resmi HMAC-SHA256 + Panduan Lengkap Multi-Framework (Astro, Next.js, PHP/Laravel, Node.js/Express/Fastify).

### Added
- **6 Endpoint Baru:**
  - `DELETE /address` (Hapus alamat penjemputan).
  - `PUT /address` (Update alamat penjemputan).
  - `POST /dropshippers` (Tambah identitas pengirim dropshipper).
  - `GET /dropshippers` (Pencarian dropshipper berdasarkan nama).
  - `POST /label-generation` (Request cetak thermal/standard PDF label secara asinkron, HTTP 202, rate limit 8/menit).
  - `GET /label-generation/{id}` (Polling status async label generation, return signed URL GCS 15 menit saat `COMPLETED`).
- **Webhook Resmi:**
  - Spesifikasi payload event status shipment (`DELIVERED`, `RETURNED`, `ON_PROCESS`, dll).
  - Skema verifikasi signature HMAC-SHA256 via header `x-timestamp` dan `x-signature` terhadap `${timestamp}.${raw_body}`.
  - Helper `verifyMengantarWebhookSignature()` di `examples/mengantar-client.ts` menggunakan Web Crypto API standar.
  - Contract test di `examples/mengantar-client.test.ts` memvalidasi test vector resmi Mengantar.
- **Panduan Framework Baru:**
  - `docs/13-integration-php.md`: Implementasi PHP Native (`MengantarClient.php`, `webhook.php`) & Laravel Controller.
  - `docs/14-integration-node-js.md`: Implementasi Node.js Vanilla `fetch`, Express (raw body signature handling), dan Fastify.
  - Pembaruan `docs/05-integration-astro.md` & `docs/06-integration-nextjs.md` dengan route webhook & payload validation.
- **Dukungan Kurir Baru & Aturan Bisnis:**
  - Kurir **POS Indonesia (`pos`)** resmi aktif untuk cek ongkir dan pembuatan order.
  - Parameter `isDangerousGoods: boolean` di `/order/estimate` & `/order` (JT, SiCepat HALU, iDexpress Regular).
  - Opsi `orders[].cargo` (docs resmi: `JNE`, `SiCepat`, `Sap`, `iDexpress`).

### Changed
- `spec/openapi.yaml` diperbarui ke versi `0.3.0` mencakup 24 operasi endpoint resmi Mengantar.
- Client TypeScript (`examples/mengantar-client.ts`) dilengkapi method CRUD Address, Dropshippers, Label Generation, dan Webhook Verification.
- Aturan konkurensi batch `409 Conflict` diperbarui khusus untuk `JT Premium` dan `SiCepat`.

### Deprecated / Discontinued / Unsupported
- **Ninja Xpress:** Resmi **Discontinued per 1 September 2026** di seluruh API publik Mengantar.
- ~~**SPX (Shopee Express):** Dikonfirmasi tidak tersedia di public API Mengantar.~~ **Dikoreksi di 0.3.1** — SPX muncul di estimasi live.

### Audited (2026-08-07 — Official Contract Alignment)
- Aligned write endpoints, OpenAPI request bodies, cURL examples, REST-client examples, smoke tooling, and the TypeScript client with the official JSON payload contract.
- Fixed unpaid-order guidance: successful `isPaid:false` responses are no longer treated as exceptions or blindly polled; the documented recovery uses `batch_id` with `/order/pay-unpaid`.
- Added strict pickup-date validation, correct `POST /time` object typing, preserved invoice/create-order envelope metadata, nullable coverage flags, WooCommerce `x-client-source` support, and runnable client contract tests.
- Reworked Astro/Next.js guides to reuse the shared client and removed unsafe public shipment proxies; create-order examples now require trusted jobs, ownership/idempotency validation, and per-account serialization.
- Added reusable OpenAPI 4XX responses, conditional pickup/payment schemas, and request boundary constraints; the specification passes Redocly's recommended lint rules without warnings.

### Audited (2026-08-05 — Sandbox & Architecture Constraints)
- **Sandbox Limits:** Documented strict limitations for JNE (Jakarta origin only) and SAP (Jakarta → Jakarta Non-COD only) to prevent developer confusion.
- **Client Validation:** Documented the required `x-client-source: woocommerce` header for payload sources originating from WooCommerce.
- Reflected these updates into `docs/01-api-reference.md`, `docs/02-couriers-and-rules.md`, and `README.md`.

### Verified (live, produksi 2026-07-19 — integrasi Formalin)
- Base URL `https://api-public.mengantar.com` **dikonfirmasi ulang bekerja live** (upgrade tanda `[plugin]`
  → live-verified di `docs/01` §1).
- `GET /order/estimate?courier=all` mengembalikan `data` sebagai **objek/map di-key nama kurir**
  (bukan array); tiap value = objek rate (`price`, `estimatedPrice`, `estimatedSpecialPrice`,
  `unsupported`, `unsupported_cod`, …). Bentuk ini ditulis eksplisit di `docs/01` §5.1.
- **Gotcha:** response `/order/estimate` **tidak punya field ETD/durasi** — hanya harga; konsumen
  menyediakan label waktu antar sendiri. Didokumentasikan di `docs/01` §5.1 & `docs/10` §0c.
- Di-affirm ulang: `estimatedSpecialPrice` = harga diskon (volume akun) vs `estimatedPrice` = standar;
  field `/address/search` (`_id`, `*_NAME`, `ZIP_CODE`, `DESTINATION_CODE`); aturan dua "origin" ID.
- Detail: `docs/10` §0c.

### Verified (live, akun produksi read-only 2026-07-03)
- Base URL `https://api-public.mengantar.com` **terbukti bekerja**; format key `API-…`.
- **Fixed (bug toolkit):** estimate `origin_id`/`destination_id` = **`_id` WILAYAH** (dari `/address/search`,
  atau `PICKUP_AUTOFILL` alamat pickup) — **bukan** `_id` objek alamat pickup. `smoke.sh`, glosarium
  (`docs/07`), `docs/01` §5.1, contoh integrasi (`docs/05`,`06`, dua env var terpisah), dan client
  (`estimate()` + helper `originWilayah()`) diperbaiki.
- `estimate?courier=all` mengembalikan 14–15 key kurir (termasuk `paxel`, `pos`); field order nyata
  memuat `FULL_RECEIVER_ADDRESS` (ditambah ke `docs/03` §0). Detail: `docs/10` §0b.

## [0.2.0] — 2026-07-03

Penyelarasan penuh dengan **dokumentasi resmi** `app.mengantar.com/docs` + repo dijadikan siap-development.

### Added
- **8 endpoint** yang sebelumnya hilang: `GET /my-users`, `POST /order/getPerformancePublic`,
  `POST /order/pay-unpaid`, `GET /order` (list+filter), `DELETE /order`, `GET /batch`,
  `DELETE /batch`, `GET /getReceiverScoreByNumberUser`.
- **Kode error resmi** `X000`–`X003` + aturan **`409 Conflict`** konkurensi batch (JT Premium/Ninja/SiCepat).
- Toolkit: `examples/mengantar-client.ts` (client TS no-dep, 18 endpoint, lolos `tsc --strict`),
  `requests.http`, `scripts/smoke.sh`, `scripts/check-links.sh`, `Makefile`, CI GitHub Actions.
- Meta repo: `AGENTS.md` (+ `CLAUDE.md` symlink), `CONTRIBUTING.md`, `LICENSE`, `.env.example`,
  `.gitignore`, `.editorconfig`, `CHANGELOG.md`.

### Changed
- **Struktur**: doc → `docs/`, spec → `spec/openapi.yaml`, tambah `examples/` & `scripts/`.
- `spec/openapi.yaml` diperluas ke 18 endpoint (OpenAPI 3.1, versi 0.2.0).
- Response estimasi dilengkapi (`coverage_cod`, `discountPercent`, `codFee`, `estimatedSpecialPrice`, dst).

### Fixed
- `POST /time` `date` = **`mm-dd-yyyy`** (sebelumnya salah ditulis `YYYY-MM-DD`).
- Param COD estimasi = **`COD_AMOUNT`** (huruf besar), diperbaiki di docs & contoh integrasi.
- Default param `courier` estimasi = `JNE` (bukan `all`).

## [0.1.0] — 2026-06-30

- Rilis awal: dokumentasi hasil reverse-engineer plugin WooCommerce *Woo Mengantar* v1.0.32
  (01–10 + OpenAPI draft + integrasi Astro/Next.js). Belum dicocokkan dengan docs resmi.
