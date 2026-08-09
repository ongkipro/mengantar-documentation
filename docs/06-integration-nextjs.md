# Integrasi Mengantar di Next.js (App Router)

Pola sama dengan versi Astro: **API key hanya di server**. Browser memanggil Route Handler
kita; Route Handler memanggil Mengantar. Cocok dengan Next.js App Router + deploy Vercel.

## 1. Environment

`.env.local` (jangan commit):
```
MENGANTAR_API_KEY=your_production_key
MENGANTAR_SANDBOX_KEY=your_sandbox_key
MENGANTAR_SANDBOX=true
MENGANTAR_ORIGIN_WILAYAH_ID=your_pickup_PICKUP_AUTOFILL   # _id WILAYAH asal → untuk estimate
MENGANTAR_PICKUP_ADDRESS_ID=your_pickup_address__id       # _id alamat pickup → untuk pickup.address_id & /time
MENGANTAR_CLIENT_SOURCE=direct              # isi "woocommerce" hanya untuk integrasi WooCommerce
```

Variabel tanpa prefix `NEXT_PUBLIC_` tidak terekspos ke browser — aman untuk secret.

> ⚠️ **Dua ID berbeda:** estimate `origin_id` = **`_id` wilayah** (ambil dari `PICKUP_AUTOFILL` alamat
> pickup, atau `/address/search`); sedangkan `pickup.address_id` di create order & `/time?address=` =
> **`_id` objek alamat pickup** (dari `/address`). Jangan tertukar (live-verified).

## 2. Client Mengantar (server-only)

Salin [`../examples/mengantar-client.ts`](../examples/mengantar-client.ts) ke
`lib/mengantar-client.ts`; jangan membuat request helper kedua.

`lib/mengantar.ts`:
```ts
import 'server-only';
import { MengantarClient } from './mengantar-client';

const sandbox = process.env.MENGANTAR_SANDBOX === 'true';
const apiKey = sandbox
  ? process.env.MENGANTAR_SANDBOX_KEY
  : process.env.MENGANTAR_API_KEY;

if (!apiKey) throw new Error('MENGANTAR_API_KEY belum dikonfigurasi');

export const mengantar = new MengantarClient({
  apiKey,
  baseUrl: sandbox
    ? 'https://sandbox.mengantar.com'
    : 'https://api-public.mengantar.com',
  clientSource: process.env.MENGANTAR_CLIENT_SOURCE === 'woocommerce'
    ? 'woocommerce'
    : undefined,
});
```

Client bersama ini menangani URL/key redaction, JSON payload, error envelope, `COD_AMOUNT`,
date pickup, WooCommerce header, serta response types. Semua callsite harus memakai instance yang sama.

## 3. Route Handlers

`app/api/shipping/search/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { mengantar } from '@/lib/mengantar';

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (keyword.length < 3) return NextResponse.json([]);

  try {
    return NextResponse.json(await mengantar.searchAddress(keyword));
  } catch {
    return NextResponse.json({ error: 'Gagal mencari wilayah' }, { status: 502 });
  }
}
```

`app/api/shipping/estimate/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { mengantar } from '@/lib/mengantar';

export async function GET(req: NextRequest) {
  const destinationId = req.nextUrl.searchParams.get('destination_id');
  const weight = Number(req.nextUrl.searchParams.get('weight') ?? '1');
  const originId = process.env.MENGANTAR_ORIGIN_WILAYAH_ID;
  if (!destinationId || !originId || !Number.isFinite(weight) || weight <= 0) {
    return NextResponse.json({ error: 'Parameter estimasi tidak valid' }, { status: 400 });
  }

  try {
    return NextResponse.json(await mengantar.estimate({
      originId,
      destinationId,
      courier: 'all',
      weight,
    }));
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil ongkir' }, { status: 502 });
  }
}
```

## 3.1 Create shipment hanya dari trusted job

Jangan menyediakan public Route Handler yang meneruskan body browser ke `POST /order`.
Worker/job harus memuat order milik merchant dari database, memvalidasi ulang alamat/berat/pembayaran,
lalu membangun `CreateOrderRequest` di server.

`lib/create-shipment.ts`:
```ts
import 'server-only';
import type { CreateOrderRequest } from './mengantar-client';
import { mengantar } from './mengantar';

export async function createShipmentFromJob(payload: CreateOrderRequest) {
  return mengantar.createOrder(payload);
}
```

## 4. Alternatif rate lookup: Server Action

Server Action dapat dipanggil dari browser, jadi gunakan hanya untuk operasi read-only seperti rate lookup.
Shipment creation tetap harus dijalankan oleh trusted job.

`app/actions/shipping.ts`:
```ts
'use server';
import { mengantar } from '@/lib/mengantar';

export async function getRates(destinationId: string, weight: number, cod = false) {
  const originId = process.env.MENGANTAR_ORIGIN_WILAYAH_ID;
  if (!originId || !destinationId || !Number.isFinite(weight) || weight <= 0) {
    throw new Error('Parameter estimasi tidak valid');
  }
  const data = await mengantar.estimate({
    originId,
    destinationId,
    courier: 'all',
    weight,
  }) as Record<string, any>;

  return Object.entries(data)
    .filter(([, rate]) => !rate.unsupported && (!cod || !rate.unsupported_cod))
    .filter(([, rate]) => (rate.estimatedSpecialPrice ?? rate.price ?? 0) > 0)
    .map(([courier, rate]) => ({
      courier,
      price: rate.estimatedSpecialPrice ?? rate.price,
    }))
    .sort((a, b) => a.price - b.price);
}
```

## 5. Contoh payload trusted job

```ts
await createShipmentFromJob({
  courier: 'JNE',
  pickup: {
    type: 'scheduledPickup',
    address_id: process.env.MENGANTAR_PICKUP_ADDRESS_ID!,
    time_id: 'TIME_ID',
    volume: 'volumeMobil',
  },
  orders: [{
    customerAddressDataId: 'DEST_ID',
    customerAddress: 'Jl. Tujuan No. 5, RT 01 / RW 02, ...',
    customerName: 'Siti',
    customerPhone: '08111111111',
    weight: 2,
    quantity: 1,
    parcelContent: 'Kaos katun',
    goodsValue: 150000,
  }],
});
```

## 6. Membaca hasil create order

`POST /order` mengembalikan `data` berupa **array**; resi ada di `cnote_no` (lihat [01-api-reference.md](01-api-reference.md) §7.5):

```ts
const result = await createShipmentFromJob(payload);
const entry = result.data?.[0];
if (!entry) throw new Error('Mengantar tidak mengembalikan order');

const shipment = {
  orderId: entry.ORDER_ID,
  tracking: entry.cnote_no,
  status: entry.status ?? '',
  isPaid: entry.isPaid,
  batchId: entry.batch_id ?? result.batch_id,
  errors: result.errors ?? [],
};
// isPaid === false → top-up lalu payUnpaid(batchId); jangan create ulang atau polling buta.
```

`payload.courier` harus nama shipment resmi: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`,
`Ninja`, `lion`, `anteraja`.

## 7. Catatan

- Validasi server: ownership order/merchant, status belum dikirim, alamat ≥ 10 char, berat ≤ batas
  service, dan COD dalam rentang kurir.
- Public search/estimate Route Handler perlu rate limit, batas panjang query, dan cache; jangan
  meneruskan pesan upstream mentah ke browser.
- **Normalisasi nama wilayah** dari `/address/search` (lihat [03-data-model.md](03-data-model.md) §6).
- Buat shipment melalui queue/job dengan idempotency key/order state; serialkan create per akun untuk
  JT Premium/Ninja/SiCepat, lalu polling resi hanya bila `isPaid` bukan `false`.
- Cache rate/search secara eksplisit di Route Handler atau data layer; shared client tidak menetapkan
  kebijakan cache framework.
- Jangan pernah letakkan `MENGANTAR_API_KEY` di komponen client atau `NEXT_PUBLIC_*`.

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
