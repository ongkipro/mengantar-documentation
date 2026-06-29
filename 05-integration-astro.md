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
MENGANTAR_ORIGIN_ID=your_default_origin_id
```

> Di Astro, variabel tanpa prefix `PUBLIC_` hanya tersedia di server (`import.meta.env`). Bagus untuk secret.

## 2. Client Mengantar (server-only)

`src/lib/mengantar.ts`:
```ts
const SANDBOX = import.meta.env.MENGANTAR_SANDBOX === 'true';
const BASE_URL = SANDBOX
  ? 'https://sandbox.mengantar.com'
  : 'https://api-public.mengantar.com';
const API_KEY = (SANDBOX && import.meta.env.MENGANTAR_SANDBOX_KEY)
  ? import.meta.env.MENGANTAR_SANDBOX_KEY
  : import.meta.env.MENGANTAR_API_KEY;

const PREFIX = `${BASE_URL}/api/public/${API_KEY}`;

type MengantarResponse<T = any> = { success: boolean; message?: string; data?: T };

async function request<T = any>(
  path: string,
  init: { method?: string; json?: unknown; form?: Record<string, string>; absolute?: boolean } = {},
): Promise<MengantarResponse<T>> {
  const url = init.absolute ? `${BASE_URL}${path}` : `${PREFIX}${path}`;
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (init.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
    body = JSON.stringify(init.json);
  } else if (init.form) {
    body = new URLSearchParams(init.form);
  }

  const res = await fetch(url, { method: init.method ?? 'GET', headers, body });
  const data = (await res.json()) as MengantarResponse<T>;
  if (data?.success === false) {
    throw new Error(data.message ?? 'Mengantar API error');
  }
  return data;
}

// --- Alamat ---
export const searchAddress = (keyword: string) =>
  request(`/address/search?keyword=${encodeURIComponent(keyword)}`);

export const listOrigins = () => request(`/address`);

// --- Estimasi ongkir ---
export function estimate(opts: {
  originId: string; destinationId: string; courier?: string; weight?: number; codAmount?: number;
}) {
  const q = new URLSearchParams({
    origin_id: opts.originId,
    destination_id: opts.destinationId,
    courier: opts.courier ?? 'all',
    weight: String(opts.weight ?? 1),
  });
  if (opts.codAmount && opts.codAmount > 0) q.set('cod_amount', String(opts.codAmount));
  return request(`/order/estimate?${q.toString()}`);
}

// --- Buat shipment ---
export function createOrder(payload: {
  courier: string;
  pickup: { type: string; address_id: string; time_id?: string; volume?: string; origin_label?: string };
  orders: Array<Record<string, unknown>>;
  assignee?: string;
}) {
  return request(`/order`, { method: 'POST', json: payload });
}

// --- Tracking ---
export const trackByTrackingId = (id: string) =>
  request(`/order?tracking_id=${encodeURIComponent(id)}`);
```

## 3. Server endpoints (proxy)

`src/pages/api/shipping/search.ts`:
```ts
import type { APIRoute } from 'astro';
import { searchAddress } from '../../../lib/mengantar';

export const GET: APIRoute = async ({ url }) => {
  const keyword = url.searchParams.get('q') ?? '';
  if (keyword.length < 3) {
    return new Response(JSON.stringify({ data: [] }), { status: 200 });
  }
  try {
    const result = await searchAddress(keyword);
    return Response.json(result.data ?? []);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
};
```

`src/pages/api/shipping/estimate.ts`:
```ts
import type { APIRoute } from 'astro';
import { estimate } from '../../../lib/mengantar';

export const GET: APIRoute = async ({ url }) => {
  const destinationId = url.searchParams.get('destination_id');
  const weight = Number(url.searchParams.get('weight') ?? '1');
  if (!destinationId) {
    return Response.json({ error: 'destination_id wajib' }, { status: 400 });
  }
  const result = await estimate({
    originId: import.meta.env.MENGANTAR_ORIGIN_ID,
    destinationId,
    courier: 'all',
    weight,
  });
  return Response.json(result.data ?? {});
};
```

`src/pages/api/shipping/create.ts`:
```ts
import type { APIRoute } from 'astro';
import { createOrder } from '../../../lib/mengantar';

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json();
  // TODO: validasi & otorisasi sebelum membuat shipment asli
  try {
    const result = await createOrder(payload);
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
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

// Normalisasi rate untuk ditampilkan
const list = Object.entries(rates)
  .filter(([, d]: any) => !d.unsupported && (d.estimatedSpecialPrice ?? d.price) > 0)
  .map(([key, d]: any) => ({
    courier: key,
    price: d.estimatedSpecialPrice ?? d.price,
    eta: d.estimate_delivery ?? d.estimatedDate ?? '',
  }))
  .sort((a, b) => a.price - b.price);
```

## 5. Membaca hasil create order

Response `POST /order` punya `data` berupa **array** (lihat [01-api-reference.md](01-api-reference.md) §5.3).
Ambil resi dari `cnote_no`, bukan `tracking_id`:

```ts
const r = await createOrder(payload);
const entry = (r.data ?? [])[0] ?? {};
const shipment = {
  orderId: entry.ORDER_ID ?? null,
  tracking: entry.cnote_no ?? null,     // resi; bisa null bila belum tersedia
  status: entry.status ?? '',
  paymentStatus: entry.payment_status ?? '',
  batch: r.batch ?? '',
};
// Jika tracking null → simpan status "pending_tracking" lalu polling /order?order_id= berkala.
```

`payload.courier` harus salah satu nama shipment resmi: `JNE`, `SiCepat`, `Sap`, `iDexpress`,
`JT`, `Ninja`, `lion`, `anteraja` (ikuti kapitalisasinya).

## 6. Catatan

- **Validasi sisi server** sebelum `createOrder`: panjang alamat ≥ 10 char, berat ≤ batas
  service type, COD dalam rentang kurir (lihat [02-couriers-and-rules.md](02-couriers-and-rules.md)).
- **Normalisasi nama wilayah** dari `/address/search` sebelum dipakai (lihat [03-data-model.md](03-data-model.md) §6).
- Pertimbangkan **cache** hasil `estimate`/`search` (mis. KV / Cache API Cloudflare) ~5 menit,
  meniru perilaku plugin, untuk hemat panggilan.
- Buat shipment lewat **queue/job** (bukan saat request checkout) + retry, dan **polling resi**
  dengan backoff — lihat [04-how-it-works.md](04-how-it-works.md).
- Untuk store besar, simpan `origin_id` & daftar kurir aktif di config, bukan hardcode di banyak tempat.

---
<sub>Bagian dari <a href="README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
