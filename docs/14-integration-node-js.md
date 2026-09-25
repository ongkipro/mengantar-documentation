# Integrasi Mengantar di Node.js & JavaScript (Express, Fastify, Vanilla)

Panduan integrasi Mengantar Public API untuk backend berbasis **Node.js**, **Express.js**, **Fastify**, dan vanilla JavaScript runtime (Node 18+, Bun, Deno).

---

## 1. Webhook Handler di Express.js

Di Express, middleware bawaan `express.json()` mem-parsing body menjadi objek JS dan membuang raw stream asli.
Agar signature HMAC-SHA256 Mengantar dapat dihitung dengan presisi, pasang opsi `verify` untuk menyimpan buffer raw body.

```javascript
// server.js
const express = require('express');
const crypto = require('crypto');

const app = express();

// Tangkap raw body string untuk verifikasi webhook
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

app.post('/api/webhook/mengantar', (req, res) => {
  const secret = process.env.MENGANTAR_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: 'Secret not configured' });

  const timestamp = req.headers['x-timestamp'] || '';
  const receivedSig = req.headers['x-signature'] || '';
  const rawBody = req.rawBody || '';

  // 1. Hitung HMAC-SHA256 dari "{x-timestamp}.{rawBody}"
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  // 2. Verifikasi constant-time comparison
  const isValid =
    receivedSig.length === expectedSig.length &&
    crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig));

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 3. Batasi usia request maks 5 menit
  const age = Math.abs(Date.now() - Number(timestamp));
  if (isNaN(age) || age > 5 * 60 * 1000) {
    return res.status(401).json({ error: 'Timestamp expired' });
  }

  // 4. Proses data pesanan
  const { cnote_no, order_id, courier, status_category } = req.body;
  console.log(`[Webhook Event] ${order_id} (${cnote_no}) -> ${status_category}`);

  // 5. Kembalikan 200 OK sesegera mungkin (< 5 detik)
  res.status(200).json({ received: true });
});

app.listen(3000, () => console.log('Server berjalan di port 3000'));
```

---

## 2. Webhook Handler di Fastify

```javascript
const fastify = require('fastify')();
const crypto = require('crypto');

// Simpan raw body di Fastify
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  req.rawBody = body;
  try {
    const json = JSON.parse(body);
    done(null, json);
  } catch (err) {
    done(err, undefined);
  }
});

fastify.post('/api/webhook/mengantar', async (request, reply) => {
  const secret = process.env.MENGANTAR_WEBHOOK_SECRET;
  const timestamp = request.headers['x-timestamp'] || '';
  const receivedSig = request.headers['x-signature'] || '';
  const rawBody = request.rawBody || '';

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  const isValid =
    receivedSig.length === expectedSig.length &&
    crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig));

  if (!isValid) {
    return reply.status(401).send({ error: 'Invalid signature' });
  }

  const { cnote_no, order_id, status_category } = request.body;
  console.log(`[Fastify Webhook] ${order_id} (${cnote_no}) -> ${status_category}`);

  return { received: true };
});
```

---

## 3. Pemanggilan API Mengantar Menggunakan Vanilla JavaScript (`fetch`)

Pada Node.js 18+, Bun, atau Deno, Anda dapat menggunakan `fetch` native tanpa dependensi pihak ketiga:

```javascript
const API_KEY = process.env.MENGANTAR_API_KEY;
const BASE_URL = 'https://api-public.mengantar.com';

// 1. Cek Ongkir (Estimate)
async function getShippingRates(originId, destinationId, weight = 1, isDangerousGoods = false) {
  const params = new URLSearchParams({
    origin_id: originId,
    destination_id: destinationId,
    courier: 'all',
    weight: String(weight),
    isDangerousGoods: String(isDangerousGoods),
  });

  const res = await fetch(`${BASE_URL}/api/public/${API_KEY}/order/estimate?${params}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengambil ongkir');

  return json.data; // Map: { JNE: { ... }, SiCepat: { ... } }
}

// 2. Buat Order Shipment
async function createShipment(orderPayload) {
  const res = await fetch(`${BASE_URL}/api/public/${API_KEY}/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal membuat order');
  return json;
}
```

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
