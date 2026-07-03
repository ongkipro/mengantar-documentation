# Kebijakan Keamanan

## Penanganan API key (paling penting)

API Mengantar menaruh key di **path URL** (`/api/public/{API_KEY}/…`). Konsekuensinya:

- **Server-only.** Jangan pernah memanggil API dari kode browser/klien atau menaruh key di bundle
  frontend, env `NEXT_PUBLIC_*` / `PUBLIC_*`, atau HTML. Selalu proxy lewat server.
- **Jangan commit key.** Repo ini hanya berisi placeholder. `.env` sudah di-`.gitignore`. Simpan key
  di secret manager / env server (Vercel, Cloudflare, dst).
- **Redaksi di log.** Karena key ada di URL, sensor sebelum logging — client contoh melakukannya
  otomatis (`/api/public/**redacted**`). Jangan log URL mentah.
- **Rotasi** bila key pernah bocor; minta key baru ke tim Mengantar.

Bila kamu menemukan key nyata ter-commit (di repo mana pun), anggap **bocor** → rotasi segera.
`scripts/check-links.sh` menjalankan cek higiene sederhana untuk mendeteksi pola key di repo ini.

## Melaporkan kerentanan

Ini repo **dokumentasi + contoh kode**, bukan layanan. Bila menemukan:

- **Masalah pada dokumen/contoh di repo ini** (mis. contoh yang membocorkan key, saran tak aman):
  buka issue atau hubungi **[ongki.pro](https://ongki.pro)**.
- **Kerentanan pada API/platform Mengantar sendiri:** laporkan ke tim resmi **Mengantar**, bukan ke sini.

Mohon jangan sertakan kredensial nyata dalam laporan.
