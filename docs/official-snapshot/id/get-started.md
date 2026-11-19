# Mulai

Untuk memakai API ini, kamu butuh **API key**. API key mengidentifikasi akunmu di setiap request.

## Dapatkan API key

Buka **Pengaturan Akun (Account Settings)** → **Integrasi Public API** di aplikasi Mengantar, lalu pilih **Generate API Key**. Tombolnya aktif setelah email dan nomor teleponmu terverifikasi.

- API key diawali `API-` diikuti 16 huruf dan angka acak. API key menjadi bagian dari alamat setiap request, bukan header.
- Setiap akun punya satu API key. Regenerate langsung mengganti API key lama, jadi perbarui API key di sistemmu. Kalau kamu memakai Webhook URL, regenerate juga mengganti Webhook Secret.
- Sandbox dan production memakai API key yang berbeda.

## Base URL

- Production: `https://api-public.mengantar.com`
- Sandbox: `https://sandbox.mengantar.com`

Alamat setiap request berbentuk `{BASE_URL}/api/public/{API_KEY}`. Base URL di contoh mengikuti host yang sedang kamu buka.

## Untuk AI agent

Setiap halaman juga tersedia sebagai Markdown biasa. Arahkan agent-mu ke `llms.txt` untuk melihat semuanya, atau pindah ke tampilan **Agent** di halaman mana pun.

```text
{BASE_URL}/docs/llms.txt
```

## Hak akses

| Hak akses | Bawaan | Fungsinya |
| --- | --- | --- |
| `Create order` | Aktif | Membuat dan menghapus order, membayar order yang belum dibayar, menghapus batch, mencari, membaca, menambah, dan menghapus alamat, membaca dan menambah waktu pickup, serta menambah dan mencari dropshipper. |
| `Check order status` | Aktif | Membaca daftar order dan daftar batch. Simulasi status order (hanya sandbox). |
| `Check shipping fee` | Aktif | Ongkos kirim dengan API key, dan performa kurir. |
| `Check balance` | Aktif | Membaca invoice dan saldo. |
| `Check batch load` | Nonaktif | Hak akses khusus yang diatur admin. Endpoint yang dikontrolnya tidak dipublikasikan. |

My Users dan Update address hanya memeriksa bahwa API key dikenali, aktif, dan dipanggil dari IP yang diizinkan.

## Akses whitelist

Beberapa endpoint hanya terbuka untuk akun yang masuk whitelist, selain hak akses di atas. API key dari akun yang tidak ada di daftar mendapat `403 Not allowed`. Akses diberikan lewat permintaan: hubungi Customer Service (CS) Mengantar.

| Endpoint | Siapa yang bisa memanggil |
| --- | --- |
| [Get Courier Performance](#get-courier-performance) | Hanya akun whitelist. Tidak berlaku di sandbox. |
| [Get Receiver Score Number](#get-receiver-score-number) | Hanya akun whitelist, dengan batas harian. Keduanya tidak berlaku di sandbox. |
| [Print Label PDF (BETA)](#print-label-pdf-beta) | Hanya akun whitelist. |
| [Webhook](#webhook) | Diaktifkan per akun di production selama rollout bertahap. Terbuka untuk semua akun sandbox. |

> [!IMPORTANT]
> **403 Not allowed.** Panggilan ditolak kalau API key tidak dikenali atau tidak aktif, API key tidak punya hak akses yang dibutuhkan endpoint, IP-mu tidak ada di daftar IP yang diizinkan untuk API key tersebut (minta whitelist IP lewat CS), atau endpoint hanya untuk akun whitelist dan akunmu belum terdaftar.

> [!NOTE]
> **Sandbox vs production.** Endpoint simulasi status order hanya ada di sandbox. Base URL di contoh mengikuti host yang sedang kamu buka.

> [!NOTE]
> **Ninja Express sudah tidak tersedia.** Ninja Express berhenti bekerja sama dengan Mengantar per 1 September 2026. Endpoint yang membuat atau membayar pengiriman, seperti [Create order](#create-order), [Pay unpaid](#pay-unpaid), dan [Check shipping fee](#check-shipping-fee), tidak lagi menerimanya. Endpoint baca seperti [Get orders](#get-orders) dan [Get batches](#get-batches) tetap mengembalikan data Ninja yang dibuat sebelum tanggal itu.
