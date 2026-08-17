# Berkontribusi

Repo ini **dokumentasi + toolkit** (bukan aplikasi). Tujuannya: siapa pun — manusia atau AI agent —
bisa membangun integrasi Mengantar tanpa menebak. Baca **[AGENTS.md](AGENTS.md)** untuk kontrak & aturan emas.

## Setup

```bash
git clone https://github.com/ongkipro/mengantar-documentation
cd mengantar-documentation
npm ci --ignore-scripts
make help
```

Prasyarat: Node.js `>=20.19 <21` atau `>=22.12`, npm 10+, dan `bash`; `curl` + `jq` hanya untuk smoke test.

## Alur kerja

```bash
make all            # sama dengan CI: spec + links/hygiene + strict TS + contract tests
make smoke          # opsional, READ-ONLY; key diinjeksikan secret manager ke environment
```

CI (`.github/workflows/ci.yml`) menjalankan `npm ci --ignore-scripts` + `make all` di tiap push/PR.
Smoke test tidak membaca `.env` dan tidak pernah menjalankan operasi tulis.

## Aturan

1. **Sumber harus eksplisit.** Kontrak publik = snapshot docs resmi; response live berlaku hanya
   untuk akun/environment/tanggal; fakta plugin diberi `[plugin]`; yang belum pasti `[verifikasi]`.
2. **Konsistensi lintas file.** Endpoint/param/enum hidup di beberapa tempat —
   `docs/01`, `docs/07`, `spec/openapi.yaml`, `examples/mengantar-client.ts`, `requests.http`.
   Ubah satu → sinkronkan semua, lalu `make all`.
3. **Jangan pernah commit kredensial.** `.env.example` hanya nama konfigurasi dan placeholder;
   `.env` serta `.env.*` lain diabaikan Git.
4. **Casing param persis** (`COD_AMOUNT`), nama kurir persis, `date` = `mm-dd-yyyy`. Lihat AGENTS.md.
5. **Bahasa Indonesia** untuk dokumen internal (README publik boleh campur EN). Ikuti gaya file yang disunting.
6. **Footer** tiap file `docs/` (`<sub>… ../README.md …</sub>`) dipertahankan.

## Commit & PR

- Pesan commit gaya Conventional Commits (`docs:`, `feat:`, `fix:`, `chore:`) — Bahasa Indonesia OK.
- Satu PR = satu perubahan logis. Pastikan `make all` hijau sebelum push.
- Perubahan kontrak API (endpoint/param/response) → update **semua** file terkait + `CHANGELOG.md`.

---
<sub>oleh <a href="https://ongki.pro">ongki.pro</a> — Official Partner Mengantar</sub>
