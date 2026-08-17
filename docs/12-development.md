# Panduan Pengembangan

Dokumen ini menjelaskan cara memelihara, menguji, dan memperluas repo **Mengantar API Integration Documentation & Toolkit** tanpa membuat sumber kebenaran ganda.

---

## 1. Struktur Repo

| Path | Fungsi |
| --- | --- |
| `README.md` | Overview publik, quick start, dan indeks dokumen. |
| `AGENTS.md` / `CLAUDE.md` | Kontrak kerja AI coding agent dan contributor. |
| `docs/01-api-reference.md` | Kontrak endpoint manusia: parameter, response, gotcha. |
| `docs/02-couriers-and-rules.md` | Mapping courier, COD/weight rules, sandbox traps. |
| `docs/03-data-model.md` | Kamus data, schema SQL contoh, provenance, normalisasi wilayah. |
| `docs/04-how-it-works.md` | Flow end-to-end integrasi checkout → shipment → tracking. |
| `docs/05-integration-astro.md` | Pola endpoint server-only Astro. |
| `docs/06-integration-nextjs.md` | Pola Route Handlers / Server Actions Next.js. |
| `docs/07-reference.md` | Glossary, enum, configuration matrix. |
| `docs/08-error-catalog.md` | Error code dan recovery pattern. |
| `docs/09-curl-examples.md` | cURL smoke sequence. |
| `docs/10-verification-checklist.md` | Checklist live/sandbox saat API key tersedia. |
| `docs/11-prd.md` | Product requirements untuk repo ini. |
| `docs/12-development.md` | Dokumen ini. |
| `spec/openapi.yaml` | Kontrak OpenAPI 3.1. |
| `examples/mengantar-client.ts` | Client TypeScript server-only tanpa runtime dependency. |
| `package.json` / `package-lock.json` | Tooling validasi yang dipin dan direproduksi CI. |
| `scripts/check-links.sh` | Offline validation: internal links dan credential hygiene. |
| `scripts/smoke.sh` | Read-only live smoke test; tidak memuat `.env` atau operasi tulis. |

---

## 2. Sumber Kebenaran

Gunakan sumber sesuai ruang lingkup, bukan urutan linear yang menyamarkan konflik:

1. **Kontrak publik:** dokumentasi resmi Mengantar, dengan tanggal snapshot dicatat.
2. **Perilaku runtime:** response live/sandbox yang disanitasi di `docs/10-verification-checklist.md`,
   berlaku untuk akun, environment, dan tanggal pengujian itu.
3. **Kompatibilitas:** fakta Woo Mengantar v1.0.32 harus ditandai `[plugin]`.
4. `spec/openapi.yaml`, `docs/01`, dan client adalah turunan yang harus tetap sinkron.

Jika docs resmi dan observasi berbeda, catat keduanya; jangan memilih diam-diam. Jika satu fakta
berubah, sinkronkan `01`, `07`, spec, client, tests, `requests.http`, dan README bila relevan.

---

## 3. Invarian Integrasi yang Tidak Boleh Rusak

- API key ada di path `/api/public/{API_KEY}` dan harus server-only.
- `GET /api/order/allEstimatePublic` dan `/api/order/allEstimate3PL` tidak memakai `/api/public/{key}`.
- `COD_AMOUNT` untuk estimasi memakai huruf besar.
- `COD` pada `orders[]` adalah total yang ditagih ke penerima; rumus nilai barang + porsi ongkir +
  fee COD berasal dari Woo Mengantar v1.0.32 **[plugin]**, bukan ketentuan rumus di docs resmi.
- `origin_id` estimasi = wilayah `_id`, biasanya `PICKUP_AUTOFILL` dari pickup address.
- `pickup.address_id` untuk `POST /order` dan `address_id` untuk `POST /time` = `_id` alamat pickup dari `GET /address`.
- `POST /time` memakai `date` format `mm-dd-yyyy`, slot jam `9:00`-`18:00`, minimal 90 menit dari sekarang.
- `POST /time` mengembalikan satu objek slot di `data`; contoh resmi `GET /time` mengembalikan array dengan date epoch milliseconds.
- `unsupported:true` menyembunyikan kurir; `unsupported_cod:true` menyembunyikan COD untuk kurir tersebut.
- `POST /order` menerima batch; jangan panggil paralel untuk JT Premium, Ninja, dan SiCepat.
- Pertahankan envelope create-order: `data[]`, `batch_id`, dan `errors[]` semuanya bagian kontrak.
- Saldo kurang menghasilkan response sukses dengan `isPaid=false` dan `cnote_no=null`; recovery via
  `/order/pay-unpaid`, bukan membuat ulang shipment.
- Shipment creation hanya dari trusted server job setelah ownership/idempotency validation; jangan
  meneruskan body browser langsung ke Mengantar.
- Request WooCommerce wajib menyertakan `x-client-source: woocommerce` agar analytics Mengantar tidak tercatat sebagai `directCall`.

---

## 4. Workflow Perubahan

### 4.1 Mengubah endpoint/parameter

1. Update `docs/01-api-reference.md` terlebih dahulu.
2. Update schema/operation di `spec/openapi.yaml`.
3. Update `examples/mengantar-client.ts` bila API client perlu method/typing baru.
4. Update `docs/09-curl-examples.md` dan `requests.http` bila contoh berubah.
5. Update `README.md` hanya jika indeks, endpoint count, atau quick start berubah.
6. Jalankan `make all`.

### 4.2 Menambah gotcha operasional

1. Tambahkan penjelasan ringkas di dokumen domain utama (`02`, `03`, `04`, atau `08`).
2. Tambahkan checklist verifikasi di `docs/10-verification-checklist.md` bila belum live-confirmed.
3. Jangan mengubah fakta `[verifikasi]` menjadi confirmed tanpa response aktual atau sumber resmi.

### 4.3 Mengubah TypeScript client

1. Pertahankan client tanpa **runtime dependency**: gunakan `fetch`, `URLSearchParams`, `Date`, dan type TS biasa.
2. Jangan import client ke browser bundle; semua contoh harus server-side.
3. Semua HTTP non-2xx dan `success:false` tetap melempar `MengantarError`.
4. Tambahkan contract test untuk observable behavior baru, lalu jalankan `make client-check client-test`.

---

## 5. Perintah Validasi

Install toolchain yang dipin satu kali:

```bash
npm ci --ignore-scripts
```

Lalu jalankan:

```bash
make all            # Redocly lint + links/hygiene + strict TS + contract tests; sama dengan CI
bash -n scripts/check-links.sh scripts/smoke.sh
```

`make check`, `make spec-lint`, `make client-check`, dan `make client-test` tersedia untuk
diagnosis terfokus. Jangan memakai `npx -y`: versi validator harus berasal dari lockfile.

Live API smoke test hanya saat key diinjeksikan ke process environment oleh secret manager:

```bash
make smoke          # selalu read-only; script tidak membaca .env
```

---

## 6. Release Checklist

- [ ] `make all` hijau, termasuk contract tests client.
- [ ] Tidak ada API key/token nyata di Markdown, TypeScript, YAML, `.http`, atau script.
- [ ] Link relatif Markdown valid.
- [ ] Endpoint count tetap 18 operasi bila tidak ada perubahan resmi.
- [ ] `origin_id` vs `pickup_address_id` tidak tercampur di contoh.
- [ ] Semua file `docs/` tetap memiliki footer `../README.md`.
- [ ] Perubahan live/sandbox sudah dicatat di `docs/10-verification-checklist.md` bila berasal dari pengujian akun.

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
