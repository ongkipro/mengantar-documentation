# Webhook

Daripada polling `GET {BASE_URL}/api/public/{API_KEY}/order`, kamu bisa meminta Mengantar mengirim pembaruan status order ke URL milikmu sendiri.

Environment: Sandbox dan production

> [!SANDBOX]
> Webhook terbuka untuk semua akun sandbox, tanpa whitelist dan tanpa perlu meminta akses. Order sandbox tidak pernah bergerak sendiri, jadi kamu yang memicu pengirimannya: setiap panggilan [Simulate order status](#simulate-order-status) yang berhasil mengirim satu webhook berisi `status_category` baru, meskipun nilainya sama seperti sebelumnya. Setiap pengiriman dari sandbox membawa header `x-environment: sandbox`, sedangkan pengiriman production tidak membawa header itu. Tetap pakai Webhook URL yang berbeda di sandbox dan production, supaya uji coba tidak pernah tertukar dengan pembaruan pengiriman yang asli. Semua penjelasan di bawah berlaku sama di kedua environment.

## Atur Webhook URL

Atur Webhook URL kamu di **Pengaturan Akun → Integrasi Public API**. Menyimpannya butuh kode verifikasi, dan **Webhook Secret** kamu dibuat saat pertama kali menyimpan. URL wajib memakai HTTPS, tidak boleh mengarah ke alamat internal, dan maksimal 512 karakter.

Di **sandbox**, setiap akun bisa mengaturnya tanpa perlu meminta akses. Di **production**, webhook diaktifkan per akun selama rollout bertahap, jadi bagian Webhook baru muncul setelah akunmu diaktifkan. Tanyakan ke tim Mengantar kalau bagian itu belum muncul.

## Yang kami kirim

Kami mengirim `POST` dengan body JSON setiap kali status order berubah.

```http
POST https://your-domain.com/webhook
Content-Type: application/json
x-timestamp: 1787548800000
x-signature: 05826dec707ea7164801d952cb7eaf7ce9adc0c8aa0b93366480434164a1a111

{
    "cnote_no": "JNE1234567890",
    "order_id": "ORD-000123",
    "courier": "JNE",
    "status_category": "DELIVERED"
}
```

| Field | Deskripsi |
| --- | --- |
| `cnote_no` | Nomor resi (AWB) order. |
| `order_id` | Nomor order Mengantar. |
| `courier` | Kurir yang menangani order. |
| `service_code` | Layanan kurir order, nilainya sama dengan `SERVICE_CODE` di [Get orders](#get-orders), misalnya `REG` untuk layanan reguler atau `ECO` untuk order J&T ECO (`courier` tetap `JT` untuk keduanya). `null` kalau order tidak punya service code. Contoh di halaman ini tidak memuat field ini supaya langkah verifikasi signature tetap ringkas; body asli selalu memuatnya, dan signature mencakup seluruh body mentah yang kamu terima. |
| `status_category` | Satu-satunya status yang kami kirim, dan status yang sebaiknya jadi dasar logikamu. Status mentah dari kurir sengaja tidak disertakan: kata-katanya tidak terbatas dan berbeda di tiap kurir, jadi membuat percabangan dari status itu berarti menulis penanganan per kurir. Ini adalah status category yang sama dengan yang sudah ada di order kamu, jadi nilainya berbeda per kurir. Untuk daftar lengkap per kurir, lihat [Order Status Reference Sheet](https://docs.google.com/spreadsheets/d/1Z9MV8PEsqBCp7nNUyPdhypYSneVnzDR8pw3JDf6nQSw/edit?usp=sharing). Nilai yang paling sering muncul adalah `PENDING PICKUP`, `PICKED UP`, `ON DELIVERY`, `DELIVERED`, `UNDELIVERED`, `PICKUP FAILED`, dan `RTS`. Dua nilai berasal dari kami, bukan dari kurir: `ACTIVE/WAITING NEXT PROCESS` (kami sudah menerima order tapi kurir belum melaporkan apa pun) dan `ERROR` (kami tidak punya status yang bisa dipakai untuk order ini). Keduanya tidak ada di reference sheet. **Anggap daftar ini tidak terbatas.** Kurir menambah status dari waktu ke waktu, jadi selalu sediakan cabang bawaan, jangan hanya mencocokkan dengan daftar yang dianggap lengkap. Satu kasus perlu perhatian khusus: pembatalan datang sebagai `CANCELED` dari sebagian kurir dan `CANCELLED` dari kurir lain, jadi tangani kedua ejaan itu. |

## Membedakan sandbox dari production

Pengiriman dari environment sandbox membawa satu header tambahan, `x-environment: sandbox`. Pengiriman production sama sekali tidak membawa header `x-environment`. Body-nya identik di kedua environment dan header itu bukan bagian dari signature, jadi penerima yang mengabaikannya tetap berjalan. Penerima yang membacanya bisa menolak memproses pembaruan sandbox, meskipun pembaruan itu sampai ke URL production. Kami tetap menyarankan Webhook URL terpisah per environment, bukan hanya mengandalkan header.

```http
POST https://your-domain.com/webhook
Content-Type: application/json
x-environment: sandbox
x-timestamp: 1787548800000
x-signature: 05826dec707ea7164801d952cb7eaf7ce9adc0c8aa0b93366480434164a1a111
```

## Memverifikasi request

Setiap request membawa `x-signature` dan `x-timestamp`. Memeriksanya **opsional**, karena endpoint-mu tetap menerima pembaruan dengan atau tanpa pemeriksaan. Tapi kami sangat menyarankannya, dan hanya butuh sekitar sepuluh baris.

### Kenapa ini penting

Webhook URL kamu ada di internet publik, dan siapa pun yang tahu URL-nya bisa mengirim request ke sana. Log yang bocor, screenshot di tiket bantuan, mantan karyawan, atau path yang mudah ditebak sudah cukup.

Kalau kamu memproses semua yang masuk, orang yang tahu URL-mu bisa mengirim `DELIVERED` palsu dan menandai order selesai di sistemmu sebelum barangnya dikirim. Kami tidak mengirim dari kumpulan alamat IP yang tetap, jadi allowlist IP bukan pilihan. Shared secret adalah satu-satunya hal yang membedakan pembaruan asli dari yang dipalsukan.

Kedua header memberi dua jaminan yang berbeda:

| Header | Yang dibuktikan |
| --- | --- |
| `x-signature` | Request berasal dari Mengantar dan body-nya tidak diubah di perjalanan. Hanya pemegang Webhook Secret kamu yang bisa membuatnya. |
| `x-timestamp` | Kapan kami mengirimnya. Dengan ini, kamu bisa menolak request lama yang asli, yang ditangkap seseorang lalu dikirim ulang sekarang. |

### Cara memverifikasi

Signature adalah HMAC-SHA256, dalam hex, dari `{x-timestamp}.{raw request body}`, dengan Webhook Secret kamu sebagai key. Ada tiga langkah:

1. Ambil **raw request body**, sebelum JSON di-parse.
2. Hitung HMAC dari `{x-timestamp}.{raw body}` dengan Webhook Secret kamu sebagai key.
3. Bandingkan dengan `x-signature` memakai perbandingan constant-time, dan tolak request kalau hasilnya berbeda.

Hitung dari **raw body persis seperti yang diterima**. JSON yang sudah di-parse lalu diserialisasi ulang bisa berubah urutan atau formatnya, sehingga hasilnya tidak cocok.

### Test vector

Cek implementasimu dengan contoh ini sebelum go live. Kalau kodemu menghasilkan signature yang sama dari input ini, kodemu akan memverifikasi request asli kami dengan benar. Secret di bawah hanya untuk contoh ini. Di production, pakai Webhook Secret milikmu sendiri.

```text
Webhook Secret : testsecret
x-timestamp    : 1787548800000

raw body, exactly these bytes, one line, no spaces:
{"cnote_no":"JNE1234567890","order_id":"ORD-000123","courier":"JNE","status_category":"DELIVERED"}

the string you sign, {x-timestamp} + "." + raw body:
1787548800000.{"cnote_no":"JNE1234567890","order_id":"ORD-000123","courier":"JNE","status_category":"DELIVERED"}

expected x-signature:
05826dec707ea7164801d952cb7eaf7ce9adc0c8aa0b93366480434164a1a111
```

Contoh request di atas memakai vector yang sama, jadi kamu bisa mengirim ulang ke endpoint-mu dan hasilnya harus lolos. **Perhatikan bahwa body di sana hanya diberi indentasi supaya mudah dibaca.** Yang sebenarnya kami kirim, dan yang wajib kamu sign, adalah satu baris di atas.

Dari terminal, tanpa menulis kode:

```bash
echo -n '1787548800000.{"cnote_no":"JNE1234567890","order_id":"ORD-000123","courier":"JNE","status_category":"DELIVERED"}' \
    | openssl dgst -sha256 -hmac 'testsecret'

SHA2-256(stdin)= 05826dec707ea7164801d952cb7eaf7ce9adc0c8aa0b93366480434164a1a111
```

### Contoh kode

Node.js (Express):

```javascript
const crypto = require('crypto');

// express: keep the raw body so the signature can be checked
app.use(express.json({
    verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));

app.post('/webhook', (req, res) => {
    const expected = crypto
        .createHmac('sha256', process.env.MENGANTAR_WEBHOOK_SECRET)
        .update(`${req.get('x-timestamp')}.${req.rawBody}`)
        .digest('hex');

    const received = req.get('x-signature') || '';

    const valid =
        expected.length === received.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));

    if (!valid) return res.sendStatus(401);

    // optional: reject anything older than a few minutes
    if (Date.now() - Number(req.get('x-timestamp')) > 5 * 60 * 1000) {
        return res.sendStatus(401);
    }

    // ... update your order here ...
    res.sendStatus(200);
});
```

PHP:

```php
<?php
$secret = getenv('MENGANTAR_WEBHOOK_SECRET');

// raw body, before json_decode
$rawBody   = file_get_contents('php://input');
$timestamp = $_SERVER['HTTP_X_TIMESTAMP'] ?? '';
$received  = $_SERVER['HTTP_X_SIGNATURE'] ?? '';

$expected = hash_hmac('sha256', $timestamp . '.' . $rawBody, $secret);

if (!hash_equals($expected, $received)) {
    http_response_code(401);
    exit;
}

// optional: reject anything older than a few minutes
if (abs(round(microtime(true) * 1000) - (int) $timestamp) > 5 * 60 * 1000) {
    http_response_code(401);
    exit;
}

$payload = json_decode($rawBody, true);

// ... update your order here ...
http_response_code(200);
```

Python (Flask):

```python
import hashlib, hmac, os, time
from flask import Flask, request

app = Flask(__name__)
SECRET = os.environ['MENGANTAR_WEBHOOK_SECRET'].encode()

@app.post('/webhook')
def webhook():
    raw = request.get_data()          # bytes, before any JSON parsing
    timestamp = request.headers.get('x-timestamp', '')
    received = request.headers.get('x-signature', '')

    expected = hmac.new(
        SECRET, f'{timestamp}.'.encode() + raw, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, received):
        return '', 401

    # optional: reject anything older than a few minutes
    if abs(time.time() * 1000 - int(timestamp)) > 5 * 60 * 1000:
        return '', 401

    payload = request.get_json()

    # ... update your order here ...
    return '', 200
```

## Kalau signature tidak pernah cocok

Hampir semua integrasi yang gagal disebabkan salah satu hal ini:

- **Menandatangani body yang diserialisasi ulang.** Ini penyebab paling umum. Mem-parse JSON lalu menuliskannya lagi mengubah urutan key dan spasi, jadi byte yang kamu sign bukan byte yang kami sign. Simpan raw body.
- **Framework sudah memakai body lebih dulu.** Di Express kamu butuh hook `verify` seperti contoh di atas, karena `express.json()` membuang raw stream. Laravel menyimpannya, jadi pakai `$request->getContent()`.
- **Lupa awalan timestamp.** String yang di-sign adalah `{x-timestamp}.{raw body}`, bukan body saja. Pemisahnya satu titik.
- **Memakai secret yang salah.** Membuat ulang API key juga mengganti Webhook Secret. Kalau verifikasi tiba-tiba gagal dan tidak ada hal lain yang berubah, cek ini dulu.
- **Perbandingan `==` biasa.** Cara ini jalan, tapi membocorkan informasi timing. Pakai `hash_equals`, `hmac.compare_digest`, atau `crypto.timingSafeEqual`.

Kalau kamu memilih tidak memverifikasi sama sekali, setidaknya buat path Webhook URL-mu panjang dan sulit ditebak. Itu hanya penghambat, bukan pengganti, karena path ikut terkirim di setiap request kami dan bukan rahasia.

## Merespons dan retry

Balas dengan status `2xx` apa pun. Kami menunggu maksimal 5 detik, jadi konfirmasi dulu, baru proses setelahnya. Redirect tidak diikuti.

Pengiriman yang gagal di-retry sampai 3 kali, kira-kira 1 detik, 5 detik, dan 15 detik kemudian. Pengiriman bersifat best effort: kalau semua percobaan gagal, pembaruan tidak dikirim ulang, jadi tetap pakai `GET {BASE_URL}/api/public/{API_KEY}/order` sebagai jalur rekonsiliasimu.

Setiap pengiriman berdiri sendiri, jadi bisa tiba tidak berurutan setelah retry. Pakai `x-timestamp` untuk menentukan pembaruan mana yang lebih baru, bukan urutan kedatangan, dan siap menerima status yang sama lebih dari sekali.

## Kalau pengiriman dijeda

Kalau endpoint-mu gagal menerima 20 pembaruan berturut-turut dalam 24 jam, kami menjeda pengiriman ke endpoint itu secara otomatis. Kalau tidak, URL yang sudah berhenti merespons akan memakan empat percobaan keluar di setiap perubahan status, tanpa batas waktu. Pengiriman yang berhasil mana pun mengatur ulang hitungan, jadi kegagalan sesekali tidak pernah menumpuk sampai batas itu.

Selama pengiriman dijeda, **Pengaturan Akun → Integrasi Public API** menampilkan pemberitahuan soal itu beserta waktunya, dan kami mengirim notifikasi ke ikon lonceng di dashboard kamu. Kalau pembaruan berhenti masuk, cek di sana dulu.

Untuk melanjutkan, pastikan endpoint-mu sudah menerima request lagi, lalu tekan **Aktifkan kembali** ("Reactivate") di bagian yang sama. Menyimpan ulang Webhook URL punya efek yang sama. Dengan cara mana pun, Webhook URL dan Webhook Secret kamu tetap seperti semula, dan melanjutkan pengiriman tidak butuh kode verifikasi.

Pembaruan untuk status yang berubah saat pengiriman dijeda **tidak** dikirim ulang. Pakai `GET {BASE_URL}/api/public/{API_KEY}/order` untuk merekonsiliasi pembaruan yang terlewat.

Jeda hanya memengaruhi pengiriman webhook. API key kamu tetap berfungsi, jadi pembuatan order dan semua endpoint lain tidak terpengaruh.

## Mengganti secret

Kamu bisa membuat ulang Webhook Secret sendiri, tanpa mengubah API key. Perlu diingat, membuat ulang **API key** juga mengganti Webhook Secret. Webhook URL kamu tetap tersimpan, tapi kamu perlu memperbarui secret di sistemmu.
