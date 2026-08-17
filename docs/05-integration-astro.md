# Integrasi Mengantar di Astro

Pola: **API key hanya di server**. Browser memanggil Astro server-endpoint kita,
endpoint itu yang memanggil Mengantar (key ada di path URL — tidak boleh bocor ke client).

Asumsi: Astro mode `server` / `hybrid` (output endpoints), atau adapter Cloudflare/Node.

## 1. Environment

`.env` (jangan commit):
```dotenv
MENGANTAR_API_KEY=your_environment_key
MENGANTAR_BASE_URL=https://api-public.mengantar.com
MENGANTAR_ORIGIN_WILAYAH_ID=your_pickup_PICKUP_AUTOFILL   # _id WILAYAH asal → untuk estimate
MENGANTAR_PICKUP_ADDRESS_ID=your_pickup_address__id       # _id alamat pickup → untuk pickup.address_id
MENGANTAR_CLIENT_SOURCE=direct              # isi "woocommerce" hanya untuk integrasi WooCommerce
```

Untuk sandbox, ganti key dan base URL sebagai satu pasangan deployment. Host sandbox berasal dari
plugin v1.0.32 dan wajib dikonfirmasi di dashboard/tim Mengantar sebelum dipakai.

> Di Astro, variabel tanpa prefix `PUBLIC_` hanya tersedia di server (`import.meta.env`). Bagus untuk secret.

> ⚠️ **Dua ID berbeda:** estimate `origin_id` = **`_id` wilayah** (dari `PICKUP_AUTOFILL` alamat pickup,
> atau `/address/search`); `pickup.address_id` = **`_id` objek alamat pickup** (dari `/address`).
> Filter opsional `/time?address=` juga memakai pickup address `_id` (live-verified 2026-07-03).

## 2. Client Mengantar (server-only)

Salin [`../examples/mengantar-client.ts`](../examples/mengantar-client.ts) ke
`src/lib/mengantar-client.ts`; jangan membuat request helper kedua.

`src/lib/mengantar.ts`:
```ts
import { MengantarClient } from './mengantar-client';

const apiKey = import.meta.env.MENGANTAR_API_KEY;
const baseUrl = import.meta.env.MENGANTAR_BASE_URL;

if (!apiKey || !baseUrl) {
  throw new Error('MENGANTAR_API_KEY dan MENGANTAR_BASE_URL wajib dikonfigurasi');
}

export const mengantar = new MengantarClient({
  apiKey,
  baseUrl,
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

## 4. Pemakaian di komponen (client → endpoint kita)

```ts
// Autocomplete alamat
const res = await fetch(`/api/shipping/search?q=${encodeURIComponent(input)}`);
const options = await res.json(); // [{ id, DISTRICT_NAME, CITY_NAME, PROVINCE_NAME }]

// Estimasi ongkir setelah pilih tujuan
const r = await fetch(`/api/shipping/estimate?destination_id=${destId}&weight=${kg}`);
const rates = await r.json(); // map: { JNE: { price, estimatedSpecialPrice, ... }, ... }

// Normalisasi rate untuk ditampilkan; pada checkout COD, filter unsupported_cod juga.
const cod = paymentMethod === 'COD';
const list = Object.entries(rates)
  .filter(([, d]: any) => !d.unsupported && (!cod || !d.unsupported_cod))
  .filter(([, d]: any) => (d.estimatedSpecialPrice ?? d.price ?? 0) > 0)
  .map(([key, d]: any) => ({
    courier: key,
    price: d.estimatedSpecialPrice ?? d.price,
  }))
  .sort((a, b) => a.price - b.price);
```

## 5. Membaca hasil create order

Response `POST /order` punya `data` berupa **array** (lihat [01-api-reference.md](01-api-reference.md) §7.5).
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
`JT`, `Ninja`, `lion`, `anteraja` (ikuti kapitalisasinya).

## 6. Catatan

- **Validasi sisi server** sebelum `createOrder`: ownership order/merchant, status belum dikirim,
  alamat ≥ 10 char, berat ≤ batas service, dan COD dalam rentang kurir.
- Public search/estimate endpoint perlu rate limit, batas panjang query, dan cache; jangan meneruskan
  pesan upstream mentah ke browser.
- **Normalisasi nama wilayah** dari `/address/search` sebelum dipakai (lihat [03-data-model.md](03-data-model.md) §6).
- Cache hasil `estimate`/`search` sekitar 5 menit untuk mengurangi abuse dan panggilan berulang.
- Buat shipment lewat **queue/job** dengan idempotency key/order state; serialkan create per akun untuk
  JT Premium/Ninja/SiCepat, lalu polling resi dengan backoff hanya bila `isPaid` bukan `false`.
- Simpan konfigurasi `origin_id` dan daftar kurir aktif di satu tempat, bukan di banyak callsite.

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
