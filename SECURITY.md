# Kebijakan Keamanan

## Penanganan API key (paling penting)

API Mengantar menaruh key di **path URL** (`/api/public/{API_KEY}/…`). Konsekuensinya:

- **Server-only.** Jangan pernah memanggil API dari kode browser/klien atau menaruh key di bundle
  frontend, env `NEXT_PUBLIC_*` / `PUBLIC_*`, atau HTML. Selalu proxy lewat server.
- **Jangan commit key.** Repo ini hanya berisi placeholder. `.env` dan `.env.*` diabaikan Git;
  `.env.example` adalah satu-satunya pengecualian dan wajib tetap placeholder. Simpan key di secret
  manager / env server (Vercel, Cloudflare, dst).
- **Jangan source credential file.** `scripts/smoke.sh` hanya membaca process environment dan tidak
  memuat `.env`; injeksikan satu secret ke process melalui secret manager.
- **Redaksi di log.** Karena key ada di URL dan query dapat memuat telepon/alamat/order ID, client
  contoh meredaksi key serta seluruh nilai query di `onRequest`. Jangan log URL request mentah.
- **Rotasi** bila key pernah bocor; minta key baru ke tim Mengantar.

Bila kamu menemukan key nyata ter-commit (di repo mana pun), anggap **bocor** → rotasi segera.
`scripts/check-links.sh` menjalankan heuristic scan; hasil bersih bukan pengganti secret scanning platform.

## Melaporkan kerentanan

Ini repo **dokumentasi + contoh kode**, bukan layanan. Bila menemukan:

- **Masalah pada dokumen/contoh di repo ini** (mis. contoh yang membocorkan key, saran tak aman):
  buka issue atau hubungi **[ongki.pro](https://ongki.pro)**.
- **Kerentanan pada API/platform Mengantar sendiri:** laporkan ke tim resmi **Mengantar**, bukan ke sini.

Mohon jangan sertakan kredensial nyata dalam laporan.
