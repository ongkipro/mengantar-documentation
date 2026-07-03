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
```

Variabel tanpa prefix `NEXT_PUBLIC_` tidak terekspos ke browser — aman untuk secret.

> ⚠️ **Dua ID berbeda:** estimate `origin_id` = **`_id` wilayah** (ambil dari `PICKUP_AUTOFILL` alamat
> pickup, atau `/address/search`); sedangkan `pickup.address_id` di create order & `/time?address=` =
> **`_id` objek alamat pickup** (dari `/address`). Jangan tertukar (live-verified).

## 2. Client Mengantar (server-only)

`lib/mengantar.ts`:
```ts
import 'server-only';

const SANDBOX = process.env.MENGANTAR_SANDBOX === 'true';
const BASE_URL = SANDBOX
  ? 'https://sandbox.mengantar.com'
  : 'https://api-public.mengantar.com';
const API_KEY = (SANDBOX && process.env.MENGANTAR_SANDBOX_KEY)
  ? process.env.MENGANTAR_SANDBOX_KEY
  : process.env.MENGANTAR_API_KEY;

const PREFIX = `${BASE_URL}/api/public/${API_KEY}`;

export type MengantarResponse<T = any> = { success: boolean; message?: string; data?: T };

async function request<T = any>(
  path: string,
  init: { method?: string; json?: unknown; form?: Record<string, string>; revalidate?: number } = {},
): Promise<MengantarResponse<T>> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (init.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
    body = JSON.stringify(init.json);
  } else if (init.form) {
    body = new URLSearchParams(init.form);
  }

  const res = await fetch(`${PREFIX}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body,
    // GET di-cache mirip plugin (5 menit). POST jangan di-cache.
    next: init.method && init.method !== 'GET' ? undefined : { revalidate: init.revalidate ?? 300 },
    cache: init.method && init.method !== 'GET' ? 'no-store' : undefined,
  });

  const data = (await res.json()) as MengantarResponse<T>;
  if (data?.success === false) throw new Error(data.message ?? 'Mengantar API error');
  return data;
}

export const searchAddress = (keyword: string) =>
  request(`/address/search?keyword=${encodeURIComponent(keyword)}`);

export const listOrigins = () => request(`/address`);

export function estimate(opts: {
  originId: string; destinationId: string; courier?: string; weight?: number; codAmount?: number;
}) {
  const q = new URLSearchParams({
    origin_id: opts.originId,
    destination_id: opts.destinationId,
    courier: opts.courier ?? 'all',
    weight: String(opts.weight ?? 1),
  });
  if (opts.codAmount && opts.codAmount > 0) q.set('COD_AMOUNT', String(opts.codAmount)); // docs resmi: huruf besar
  return request(`/order/estimate?${q.toString()}`);
}

export function createOrder(payload: {
  courier: string;
  pickup: { type: string; address_id: string; time_id?: string; volume?: string; origin_label?: string };
  orders: Array<Record<string, unknown>>;
  assignee?: string;
}) {
  return request(`/order`, { method: 'POST', json: payload });
}

export const trackByTrackingId = (id: string) =>
  request(`/order?tracking_id=${encodeURIComponent(id)}`);
```

## 3. Route Handlers

`app/api/shipping/search/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { searchAddress } from '@/lib/mengantar';

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get('q') ?? '';
  if (keyword.length < 3) return NextResponse.json([]);
  try {
    const result = await searchAddress(keyword);
    return NextResponse.json(result.data ?? []);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
```

`app/api/shipping/estimate/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { estimate } from '@/lib/mengantar';

export async function GET(req: NextRequest) {
  const destinationId = req.nextUrl.searchParams.get('destination_id');
  const weight = Number(req.nextUrl.searchParams.get('weight') ?? '1');
  if (!destinationId) {
    return NextResponse.json({ error: 'destination_id wajib' }, { status: 400 });
  }
  const result = await estimate({
    originId: process.env.MENGANTAR_ORIGIN_WILAYAH_ID!,
    destinationId,
    courier: 'all',
    weight,
  });
  return NextResponse.json(result.data ?? {});
}
```

`app/api/shipping/create/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/mengantar';

export async function POST(req: NextRequest) {
  const payload = await req.json();
  // TODO: otorisasi + validasi sebelum membuat shipment asli
  try {
    const result = await createOrder(payload);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
```

## 4. Alternatif: Server Action

`app/actions/shipping.ts`:
```ts
'use server';
import { estimate, createOrder } from '@/lib/mengantar';

export async function getRates(destinationId: string, weight: number) {
  const r = await estimate({
    originId: process.env.MENGANTAR_ORIGIN_WILAYAH_ID!,
    destinationId,
    courier: 'all',
    weight,
  });
  const data = (r.data ?? {}) as Record<string, any>;
  return Object.entries(data)
    .filter(([, d]) => !d.unsupported && (d.estimatedSpecialPrice ?? d.price) > 0)
    .map(([courier, d]) => ({
      courier,
      price: d.estimatedSpecialPrice ?? d.price,
      eta: d.estimate_delivery ?? d.estimatedDate ?? '',
    }))
    .sort((a, b) => a.price - b.price);
}

export async function placeShipment(payload: Parameters<typeof createOrder>[0]) {
  return createOrder(payload);
}
```

## 5. Contoh payload create (referensi)

```ts
await placeShipment({
  courier: 'JNE',
  pickup: { type: 'scheduledPickup', address_id: process.env.MENGANTAR_PICKUP_ADDRESS_ID!, time_id: 'TIME_ID', volume: 'volumeMobil' },
  orders: [{
    customerAddressDataId: 'DEST_ID',
    customerAddress: 'Jl. Tujuan No. 5, RT 01 / RW 02, ...',
    customerName: 'Siti',
    customerPhone: '08111111111',
    weight: 2,
    quantity: 1,
    parcelContent: 'Kaos katun',
    goodsValue: 150000,        // non-COD
    // COD: 150000,            // gunakan ini menggantikan goodsValue bila order COD
  }],
});
```

## 6. Membaca hasil create order

`POST /order` mengembalikan `data` berupa **array**; resi ada di `cnote_no` (lihat [01-api-reference.md](01-api-reference.md) §7.5):

```ts
const r = await placeShipment(payload);
const entry = (r.data ?? [])[0] ?? {};
const shipment = {
  orderId: entry.ORDER_ID ?? null,
  tracking: entry.cnote_no ?? null,   // null bila resi belum tersedia
  status: entry.status ?? '',
  paymentStatus: entry.payment_status ?? '',
};
```

`payload.courier` harus nama shipment resmi: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`,
`Ninja`, `lion`, `anteraja`.

## 7. Catatan

- Validasi server: alamat ≥ 10 char, berat ≤ batas service type, COD dalam rentang kurir
  (lihat [02-couriers-and-rules.md](02-couriers-and-rules.md)).
- **Normalisasi nama wilayah** dari `/address/search` (lihat [03-data-model.md](03-data-model.md) §6).
- Buat shipment via job/queue + retry, dan polling resi dengan backoff — lihat [04-how-it-works.md](04-how-it-works.md).
- `next: { revalidate: 300 }` meniru cache 5 menit plugin untuk GET; POST selalu `no-store`.
- Jangan pernah letakkan `MENGANTAR_API_KEY` di komponen client atau `NEXT_PUBLIC_*`.

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
