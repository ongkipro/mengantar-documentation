# Berkontribusi

Repo ini **dokumentasi + toolkit** (bukan aplikasi). Tujuannya: siapa pun — manusia atau AI agent —
bisa membangun integrasi Mengantar tanpa menebak. Baca **[AGENTS.md](AGENTS.md)** untuk kontrak & aturan emas.

## Setup

```bash
git clone https://github.com/ongkipro/mengantar-documentation
cd mengantar-documentation
cp .env.example .env     # isi MENGANTAR_API_KEY bila mau smoke-test
make help                # daftar perintah
```

Prasyarat: `bash`, `python3` + `pyyaml` (validasi spec), `jq` (smoke-test), `node`/`npx` (typecheck client).

## Alur kerja

```bash
make check          # wajib: validasi spec + link + tidak ada key bocor
make client-check   # typecheck examples/mengantar-client.ts (tsc --strict)
make smoke          # opsional: smoke-test READ-ONLY (butuh .env)
make all            # yang dijalankan CI
```

CI (`.github/workflows/ci.yml`) menjalankan `check` + `client-check` di tiap push/PR.

## Aturan

1. **Sumber kebenaran = docs resmi + `docs/`.** Beri tanda kepercayaan tiap fakta baru:
   default = docs resmi, `[plugin]` = dari plugin WooCommerce, `[verifikasi]` = belum diuji akun asli.
2. **Konsistensi lintas file.** Endpoint/param/enum hidup di beberapa tempat —
   `docs/01`, `docs/07`, `spec/openapi.yaml`, `examples/mengantar-client.ts`, `requests.http`.
   Ubah satu → sinkronkan semua, lalu `make check && make client-check`.
3. **Jangan pernah commit kredensial.** Hanya placeholder. `.env` sudah di-gitignore.
4. **Casing param persis** (`COD_AMOUNT`), nama kurir persis, `date` = `mm-dd-yyyy`. Lihat AGENTS.md.
5. **Bahasa Indonesia** untuk dokumen internal (README publik boleh campur EN). Ikuti gaya file yang disunting.
6. **Footer** tiap file `docs/` (`<sub>… ../README.md …</sub>`) dipertahankan.

## Commit & PR

- Pesan commit gaya Conventional Commits (`docs:`, `feat:`, `fix:`, `chore:`) — Bahasa Indonesia OK.
- Satu PR = satu perubahan logis. Pastikan `make all` hijau sebelum push.
- Perubahan kontrak API (endpoint/param/response) → update **semua** file terkait + `CHANGELOG.md`.

---
<sub>oleh <a href="https://ongki.pro">ongki.pro</a> — Official Partner Mengantar</sub>
