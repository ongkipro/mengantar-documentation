# Checklist Verifikasi (saat API key tersedia)

Hal-hal yang **belum bisa dipastikan dari kode plugin** dan harus dikonfirmasi dengan akun/sandbox.
Jalankan cURL di [09-curl-examples.md](09-curl-examples.md), tempel response apa adanya, lalu
perbarui [01-api-reference.md](01-api-reference.md) / [03-data-model.md](03-data-model.md).

> Cara pakai: centang `[x]` bila sudah diverifikasi, isi blok "Hasil" dengan JSON nyata (redaksi data pribadi).

## 1. Kredensial & lingkungan
- [ ] Dapatkan **API key produksi**.
- [ ] Dapatkan **sandbox key** + konfirmasi host `https://sandbox.mengantar.com` aktif.
- [ ] Konfirmasi ID origin/destination sandbox untuk testing (atau buat sendiri).
- [ ] Perilaku saat key salah: `success:false`? HTTP berapa? (401/200?)

```
Hasil:

```

## 2. Schema response (rekam JSON nyata)
- [ ] `GET /` (ping) — bentuk response.
- [ ] `GET /address/search` — semua field item (`id` vs `_id`, `*_NAME`, `zip`, dll) + tipe.
- [ ] `GET /address` — semua field alamat pickup.
- [ ] `GET /order/estimate` (single & `all`) — field per kurir lengkap (`price`, `estimatedSpecialPrice`, `estimate_delivery`, `estimatedDate`, `unsupported`, `unsupported_cod`, `discount`, `origin_data`, dll).
- [ ] `POST /order` — bentuk lengkap `data[]` (`ORDER_ID`, `cnote_no`, `status`, `statusCategory`, `payment_status`, `error`) + `batch`/`batch_id`.
- [ ] `GET /order?order_id=` & `?tracking_id=` — field tracking + struktur `history[]`.
- [ ] `GET /time` — field slot (`time_id`?, `date`, `time`, label).
- [ ] `GET /invoices` — struktur lengkap.

```
Hasil (per endpoint):

```

## 3. Perilaku HTTP & error
- [ ] Status code untuk sukses (selalu 200?) dan untuk error (4xx/5xx?).
- [ ] Isi nyata `message`, `errors`, `errorsFront` saat gagal (mis. kurir unsupported, COD over limit).
- [ ] Pesan/format error spesifik "pickup time rejected" (untuk deteksi pending).
- [ ] Apakah ada **rate limit**/kuota? Header (`X-RateLimit-*`)? Respon saat terlampaui?

```
Hasil:

```

## 4. Aturan & enum yang perlu dikonfirmasi
- [ ] Nilai `type` pickup yang diterima server: `scheduledPickup` vs `scheduled`? `dropOff` vs `dropoff`?
- [ ] Nilai `volume` yang valid (`volumeMotor/Mobil/Truck`) — apakah memengaruhi harga/validasi?
- [ ] Format `customerPhone` yang diterima (awalan `0` / `62` / `+62`?). Plugin: digit, maks 15.
- [ ] Panjang alamat minimum sebenarnya (plugin pakai konstanta 10; ada jejak 15 di Blocks).
- [ ] Field `assignee`: format nilai & efeknya.
- [ ] Apakah `goodsValue` & `COD` benar-benar mutually exclusive di server?
- [ ] Daftar courier key yang benar-benar dikembalikan untuk akunmu (vs whitelist plugin).

```
Hasil:

```

## 5. Webhook vs polling
- [ ] Konfirmasi apakah Mengantar menyediakan **webhook/callback** status (plugin hanya polling → kemungkinan tidak ada).
- [ ] Jika ada: endpoint daftar webhook, format payload, verifikasi signature.
- [ ] Jika tidak ada: pastikan strategi polling (`/order?order_id=`) + backoff sudah memadai.

```
Hasil:

```

## 6. Alamat & wilayah
- [ ] Apakah `destination_id` stabil lintas waktu (boleh disimpan) atau bisa berubah?
- [ ] Variasi nama provinsi/kota yang muncul untuk wilayah yang kamu layani (lengkapi tabel alias di [03-data-model.md](03-data-model.md) §6).
- [ ] Apakah `/address/search` mendukung pencarian by kodepos / kombinasi?

```
Hasil:

```

## 7. Operasional
- [ ] Konfirmasi endpoint estimasi mana yang dipakai untuk akunmu: `/order/estimate` vs `allEstimate3PL` vs `allEstimatePublic` (perbedaan hasil/akses).
- [ ] TTL caching aman (plugin pakai 5–10 menit) — apakah harga sering berubah?
- [ ] Halaman tracking publik Mengantar: format URL untuk ditautkan ke customer.

```
Hasil:

```

---

### Setelah verifikasi
Perbarui dokumen ini → pindahkan temuan ke `01`/`03`, dan tandai versi: "Diverifikasi dengan
akun X pada tanggal Y (mode sandbox/produksi)". Hapus catatan "tebakan/perlu verifikasi" yang sudah terbukti.

---
<sub>Bagian dari <a href="README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
