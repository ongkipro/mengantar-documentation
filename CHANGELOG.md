# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/). Versi mengacu ke spec (`spec/openapi.yaml`).

## [Unreleased]

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
