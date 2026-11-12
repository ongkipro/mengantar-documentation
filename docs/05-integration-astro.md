# Integrasi Mengantar di Astro

Pola: **API key hanya di server**. Browser memanggil Astro server-endpoint kita,
endpoint itu yang memanggil Mengantar (key ada di path URL — tidak boleh bocor ke client).

Asumsi: Astro mode `server` / `hybrid` (output endpoints), atau adapter Cloudflare/Node.

## 1. Environment

`.env` (jangan commit):
```
MENGANTAR_API_KEY=your_production_key
MENGANTAR_SANDBOX_KEY=your_sandbox_key
MENGANTAR_SANDBOX=true
MENGANTAR_ORIGIN_WILAYAH_ID=your_pickup_PICKUP_AUTOFILL   # _id WILAYAH asal → untuk estimate
MENGANTAR_PICKUP_ADDRESS_ID=your_pickup_address__id       # _id alamat pickup → untuk pickup.address_id & /time
MENGANTAR_CLIENT_SOURCE=direct              # isi "woocommerce" hanya untuk integrasi WooCommerce
```

> Di Astro, variabel tanpa prefix `PUBLIC_` hanya tersedia di server (`import.meta.env`). Bagus untuk secret.

> ⚠️ **Dua ID berbeda:** estimate `origin_id` = **`_id` wilayah** (dari `PICKUP_AUTOFILL` alamat pickup,
> atau `/address/search`); `pickup.address_id` di create order & `/time?address=` = **`_id` objek alamat
> pickup** (dari `/address`). Jangan tertukar (live-verified).

## 2. Client Mengantar (server-only)

Salin [`../examples/mengantar-client.ts`](../examples/mengantar-client.ts) ke
`src/lib/mengantar-client.ts`; jangan membuat request helper kedua.

`src/lib/mengantar.ts`:
```ts
import { MengantarClient } from './mengantar-client';

const sandbox = import.meta.env.MENGANTAR_SANDBOX === 'true';
const apiKey = sandbox
  ? import.meta.env.MENGANTAR_SANDBOX_KEY
  : import.meta.env.MENGANTAR_API_KEY;

if (!apiKey) throw new Error('MENGANTAR_API_KEY belum dikonfigurasi');

export const mengantar = new MengantarClient({
  apiKey,
  baseUrl: sandbox
    ? 'https://sandbox.mengantar.com'
    : 'https://api-public.mengantar.com',
  clientSource: import.meta.env.MENGANTAR_CLIENT_SOURCE === 'woocommerce'
    ? 'woocommerce'
    : undefined,
});
```

Client bersama ini menangani URL/key redaction, JSON payload, error envelope, `COD_AMOUNT`,
date pickup, WooCommerce header, serta response types. Semua callsite harus memakai instance yang sama.

## 3. Server endpoints (proxy)

`src/pages/api/shipping/search.ts`:
```ts
import type { APIRoute } from 'astro';
import { mengantar } from '../../../lib/mengantar';

export const GET: APIRoute = async ({ url }) => {
  const keyword = url.searchParams.get('q')?.trim() ?? '';
  if (keyword.length < 3) return Response.json([]);

  try {
    return Response.json(await mengantar.searchAddress(keyword));
  } catch {
    return Response.json({ error: 'Gagal mencari wilayah' }, { status: 502 });
  }
};
```

`src/pages/api/shipping/estimate.ts`:
```ts
import type { APIRoute } from 'astro';
import { mengantar } from '../../../lib/mengantar';

export const GET: APIRoute = async ({ url }) => {
  const destinationId = url.searchParams.get('destination_id');
  const weight = Number(url.searchParams.get('weight') ?? '1');
  const originId = import.meta.env.MENGANTAR_ORIGIN_WILAYAH_ID;
  if (!destinationId || !originId || !Number.isFinite(weight) || weight <= 0) {
    return Response.json({ error: 'Parameter estimasi tidak valid' }, { status: 400 });
  }

  try {
    return Response.json(await mengantar.estimate({
      originId,
      destinationId,
      courier: 'all',
      weight,
    }));
  } catch {
    return Response.json({ error: 'Gagal mengambil ongkir' }, { status: 502 });
  }
};
```

## 3.1 Create shipment hanya dari trusted job

Jangan menyediakan public `POST /api/shipping/create` yang meneruskan body browser ke Mengantar.
Job harus memuat order milik merchant dari database, memvalidasi ulang alamat/berat/pembayaran, lalu
membangun `CreateOrderRequest` di server.

`src/jobs/create-shipment.ts`:
```ts
import type { CreateOrderRequest } from '../lib/mengantar-client';
import { mengantar } from '../lib/mengantar';

export async function createShipmentFromJob(payload: CreateOrderRequest) {
  return mengantar.createOrder(payload);
}
```

## 3.2 Webhook APIRoute (Notifikasi Status Resi Real-Time)

Astro API endpoint untuk menerima webhook dari Mengantar.
Mendukung runtime Node.js maupun Cloudflare Workers (memakai `crypto.subtle` atau Node `crypto`).

`src/pages/api/webhook/mengantar.ts`:
```ts
import type { APIRoute } from 'astro';
import crypto from 'node:crypto';

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.MENGANTAR_WEBHOOK_SECRET;
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Server secret unconfigured' }), { status: 500 });
  }

  // 1. Baca raw text body (sebelum JSON parse)
  const rawBody = await request.text();
  const timestamp = request.headers.get('x-timestamp') ?? '';
  const receivedSig = request.headers.get('x-signature') ?? '';

  // 2. Hitung HMAC-SHA256
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  // 3. Verifikasi signature constant-time
  const isValid =
    receivedSig.length === expectedSig.length &&
    crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig));

  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
  }

  // 4. Cegah replay attack (> 5 menit)
  const age = Math.abs(Date.now() - Number(timestamp));
  if (Number.isNaN(age) || age > 5 * 60 * 1000) {
    return new Response(JSON.stringify({ error: 'Timestamp expired' }), { status: 401 });
  }

  // 5. Update data pesanan
  try {
    const data = JSON.parse(rawBody);
    console.log(`[Mengantar Webhook Astro] Order ${data.order_id} -> ${data.status_category}`);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
};
```

## 4. Pemakaian di komponen (client → endpoint kita)

```ts
// Autocomplete alamat
const res = await fetch(`/api/shipping/search?q=${encodeURIComponent(input)}`);
const options = await res.json(); // [{ id, DISTRICT_NAME, CITY_NAME, PROVINCE_NAME }]

// Estimasi ongkir setelah pilih tujuan
const r = await fetch(`/api/shipping/estimate?destination_id=${destId}&weight=${kg}`);
const rates = await r.json(); // map: { JNE: { price, estimatedSpecialPrice, ... }, ... }

// Normalisasi rate untuk ditampilkan; pada checkout COD, filter unsupported_cod juga.
// `unsupportedOriginSpx` (entri spx) diperlakukan seperti `unsupported`. `key` = key estimasi
// (mis. "SAPLite"), bukan nama shipment — petakan via docs/02 §1.1 sebelum createOrder.
const cod = paymentMethod === 'COD';
const list = Object.entries(rates)
  .filter(([, d]: any) => !d.unsupported && !d.unsupportedOriginSpx && (!cod || !d.unsupported_cod))
  .filter(([, d]: any) => (d.estimatedSpecialPrice ?? d.price ?? 0) > 0)
  .map(([key, d]: any) => ({
    courier: key,
    price: d.estimatedSpecialPrice ?? d.price,
  }))
  .sort((a, b) => a.price - b.price);
```

## 5. Membaca hasil create order

Response `POST /order` punya `data` berupa **array** (lihat [01-api-reference.md](01-api-reference.md) §8).
Ambil resi dari `cnote_no`, bukan `tracking_id`:

```ts
const result = await createShipmentFromJob(payload);
const entry = result.data?.[0];
if (!entry) throw new Error('Mengantar tidak mengembalikan order');

const shipment = {
  orderId: entry.ORDER_ID,
  tracking: entry.cnote_no,                 // null bila unpaid/resi belum tersedia
  status: entry.status ?? '',
  isPaid: entry.isPaid,
  batchId: entry.batch_id ?? result.batch_id,
  errors: result.errors ?? [],
};
// isPaid === false → top-up lalu payUnpaid(batchId); jangan create ulang atau polling buta.
```

`payload.courier` harus salah satu nama shipment resmi: `JNE`, `SiCepat`, `Sap`, `iDexpress`,
`JT`, `lion`, `anteraja`, `pos`, `spx` (`spx` ada di docs resmi tetapi create-order belum teramati live)
([02](02-couriers-and-rules.md) §1.2). *(Ninja discontinued per 1 Sept 2026)*.

## 6. Catatan

- **Validasi sisi server** sebelum `createOrder`: ownership order/merchant, status belum dikirim,
  alamat ≥ 10 char, berat ≤ batas service, dan COD dalam rentang kurir.
- Public search/estimate endpoint perlu rate limit, batas panjang query, dan cache; jangan meneruskan
  pesan upstream mentah ke browser.
- **Normalisasi nama wilayah** dari `/address/search` sebelum dipakai (lihat [03-data-model.md](03-data-model.md) §6).
- Cache hasil `estimate`/`search` sekitar 5 menit untuk mengurangi abuse dan panggilan berulang.
- Buat shipment lewat **queue/job** dengan idempotency key/order state; serialkan create per akun untuk
  JT Premium & SiCepat.
- Simpan konfigurasi `origin_id` dan daftar kurir aktif di satu tempat, bukan di banyak callsite.

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
