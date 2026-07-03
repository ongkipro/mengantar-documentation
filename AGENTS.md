# AGENTS.md — Kontrak untuk AI coding agent

> Dibaca oleh semua AI CLI (Claude Code / pi / codex). `CLAUDE.md` adalah symlink ke file ini.
> Tujuan: siapa pun (manusia atau agent) bisa membangun integrasi Mengantar dari repo ini **tanpa
> menebak-nebak**. Kalau ragu, **docs resmi + file di `docs/` adalah sumber kebenaran**, bukan ingatan model.

## Apa repo ini

Dokumentasi + toolkit integrasi **API Mengantar** (agregator kurir Indonesia: cek ongkir, buat shipment,
pickup, tracking). **Ini bukan aplikasi** — tidak ada build/test/runtime. Isi:

```
.
├── README.md              # ringkasan + peta dokumen (untuk manusia)
├── AGENTS.md / CLAUDE.md  # file ini — kontrak agent
├── Makefile               # entrypoint: make check | client-check | smoke | all
├── docs/                  # 01–10, dokumentasi kanonik (baca sesuai kebutuhan)
├── spec/openapi.yaml      # OpenAPI 3.1, 18 endpoint — sumber untuk codegen client
├── examples/              # client TypeScript no-dep (package.json + tsconfig) + cara pakai
├── scripts/               # check-links.sh (validasi) · smoke.sh (uji API read-only)
├── requests.http          # REST-client file (VS Code / JetBrains)
├── .env.example           # template kredensial (→ .env, gitignored)
└── assets/                # banner
```

## Sumber kebenaran & tingkat kepercayaan

Tiap klaim di `docs/` ditandai tingkat kepercayaannya — **hormati tanda ini**:

| Tanda | Arti | Boleh diandalkan? |
|-------|------|-------------------|
| (default) | Dicocokkan dengan **docs resmi** `app.mengantar.com/docs` | ✅ Ya |
| **[plugin]** | Berasal dari pembedahan plugin WooCommerce *Woo Mengantar* v1.0.32 | ⚠️ Pola operasional; verifikasi nilai |
| **[verifikasi]** | Belum dipastikan; perlu akun/sandbox asli | ❌ Jangan diandalkan buta |

Kalau menambah fakta baru, **selalu beri tanda sumbernya**. Jangan turunkan fakta `[verifikasi]`
menjadi fakta pasti tanpa bukti dari akun asli.

## Aturan emas integrasi (jangan dilanggar)

1. **API key server-only.** Key ada di **path** (`/api/public/{API_KEY}/…`), bukan header. **JANGAN**
   panggil API dari browser/klien — selalu proxy lewat server. **Redaksi key** di semua log.
2. **Casing param persis.** `COD_AMOUNT` (huruf besar), bukan `cod_amount`. Nama kurir shipment
   persis: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `Ninja`, `lion`, `anteraja`.
3. **`POST /time` → `date` format `mm-dd-yyyy`** (bulan-tanggal-tahun), bukan ISO. `time` = slot
   tetap `9:00`–`18:00`.
4. **Konkurensi batch.** JT Premium / Ninja / SiCepat: **satu batch per akun**, jangan `POST /order`
   paralel → `409 Conflict`. Gabung semua order ke satu request.
5. **`data` create order = ARRAY.** Nomor resi = **`cnote_no`** (bukan `tracking_id`).
6. **Saldo kurang → order `unpaid`** (`cnote_no` kosong). Bayar via `POST /order/pay-unpaid`.
7. **Idempotensi & retry.** Simpan `ORDER_ID`; polling tracking pakai backoff. Jangan retry buta pada
   `success:false` dengan kode `X001`/`X002`/`X003` (masalah kredensial, bukan transient).
8. **Normalisasi wilayah.** Nama provinsi/kota dari API tidak standar — lihat `docs/03-data-model.md` §6.

## Kode error (docs resmi)

`X000` param wajib hilang · `X001` key invalid/expired · `X002` key salah domain · `X003` token invalid ·
`409` konkurensi batch. Penanganan lengkap: `docs/08-error-catalog.md`.

## Peta dokumen — baca yang relevan saja

| Butuh… | Baca |
|--------|------|
| Kontrak endpoint (param, response, curl) | `docs/01-api-reference.md` |
| Kurir, batas berat/COD, aturan bisnis | `docs/02-couriers-and-rules.md` |
| Skema DB / kamus data / normalisasi wilayah | `docs/03-data-model.md` |
| Arsitektur & alur end-to-end | `docs/04-how-it-works.md` |
| Contoh Astro / Next.js | `docs/05-…` / `docs/06-…` + `examples/` |
| Glosarium & enum lengkap | `docs/07-reference.md` |
| Error & pola penanganan | `docs/08-error-catalog.md` |
| cURL smoke-test | `docs/09-curl-examples.md` |
| Yang masih perlu diverifikasi | `docs/10-verification-checklist.md` |
| Client typed / codegen | `examples/mengantar-client.ts`, `spec/openapi.yaml` |

## Cara kerja saat mengubah repo ini

- **Konsistensi lintas file.** Endpoint/param/enum hidup di banyak tempat (01, 07, spec, examples).
  Ubah satu → sinkronkan semua. Setelah edit, jalankan **pengecekan** di bawah.
- **Bahasa.** Dokumentasi utama Bahasa Indonesia (README publik campur EN untuk discoverability).
  Ikuti gaya file yang kamu sunting.
- **Jangan simpan rahasia.** Tidak ada API key/token nyata di repo — hanya placeholder.
- **Footer.** Tiap file `docs/` diakhiri footer `<sub>… ../README.md …</sub>`. Pertahankan.

### Pengecekan sebelum selesai (wajib)

```bash
make check          # validasi OpenAPI + semua link internal + tidak ada key bocor
make client-check   # typecheck examples/mengantar-client.ts (tsc --strict)
# (opsional, butuh .env berisi MENGANTAR_API_KEY)
make smoke          # smoke-test READ-ONLY ke API nyata
```

`make all` = `check` + `client-check` (sama dengan yang dijalankan CI di `.github/workflows/ci.yml`).
Jangan tandai tugas selesai bila `make check`/`make client-check` masih merah.

## Yang BUKAN ada di sini

- Tidak ada API key / kredensial (minta ke tim Mengantar).
- Tidak ada webhook resmi (status via **polling** `/order?order_id=`) — lihat `docs/10` bila ingin cek.
- Base URL produksi/sandbox berasal dari plugin — **konfirmasi** sebelum dipakai produksi.

---
<sub>oleh <a href="https://ongki.pro">ongki.pro</a> — Official Partner Mengantar</sub>
