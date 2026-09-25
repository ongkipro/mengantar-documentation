# examples/ — Toolkit siap-pakai

Kode contoh server-only untuk integrasi Mengantar. **Bukan** paket npm — salin/adaptasi ke proyekmu.

| File | Isi |
|------|-----|
| [`mengantar-client.ts`](mengantar-client.ts) | Client TypeScript tanpa dependensi (fetch global). Semua 24 endpoint, typed, key di path, helper verifikasi webhook Web Crypto, error terstruktur. |
| [`mengantar-client.test.ts`](mengantar-client.test.ts) | Suite pengujian kontrak (10 test cases) memvalidasi normalisasi tanggal, test vector webhook resmi, parameter safety, endpoint envelopes, filter ketersediaan rate (SPX), dan error kurir. |

Untuk contoh berbasis framework:
- **Astro:** [`../docs/05-integration-astro.md`](../docs/05-integration-astro.md) (Server Endpoints & Webhook APIRoute)
- **Next.js:** [`../docs/06-integration-nextjs.md`](../docs/06-integration-nextjs.md) (App Router Route Handlers & Server Actions)
- **PHP Native & Laravel:** [`../docs/13-integration-php.md`](../docs/13-integration-php.md) (`MengantarClient.php` & Controller)
- **Node.js, Express, & Fastify:** [`../docs/14-integration-node-js.md`](../docs/14-integration-node-js.md) (Raw body HMAC signature handling)

## Pakai client

> ⚠️ **Server-only.** Jangan import ke bundle browser — API key ada di path URL.

```ts
import { MengantarClient, MengantarError } from "./mengantar-client";

const mgt = new MengantarClient({
  apiKey: process.env.MENGANTAR_API_KEY!,   // dari env, JANGAN hardcode
  // baseUrl: "https://api-public.mengantar.com",  // konfirmasi dengan tim Mengantar
  // clientSource: "woocommerce", // wajib untuk integrasi WooCommerce
  onRequest: ({ method, url }) => console.log(method, url),  // url sudah diredaksi
});

// 1) Cari wilayah → dapat _id
const [dest] = await mgt.searchAddress("Menteng");
const [pickupAddress] = await mgt.listOrigins();
const originWilayahId = pickupAddress.PICKUP_AUTOFILL; // wilayah _id untuk estimate

// 2) Estimasi semua kurir
const rates = await mgt.estimate({
  originId: originWilayahId, destinationId: dest._id, courier: "all", weight: 2,
});
// Sebelum ditampilkan: filter dengan isRateAvailable(rate, cod) — membuang `unsupported`,
// `unsupportedOriginSpx` (entri spx), dan untuk COD juga `unsupported_cod`.
// Key map (mis. "SAP", "SAPLite", "spx") ≠ nama shipment ("Sap", "spx") — petakan via docs/02 §1.1.

// 3) (opsional) skor performa kurir untuk kota tujuan
const perf = await mgt.getCourierPerformance(dest.CITY_NAME!, rates as Record<string, any>);
console.log("rekomendasi:", perf.recommended);

// 4) Jadwal pickup (date otomatis → mm-dd-yyyy)
const slot = await mgt.addPickupTime(pickupAddress._id, "2026-07-10", "13:00");

// 5) Buat shipment — resi di data[].cnote_no
try {
  const created = await mgt.createOrder({
    courier: "JNE",
    pickup: { type: "scheduledPickup", address_id: pickupAddress._id, time_id: slot._id, volume: "volumeMobil" },
    orders: [{
      customerAddressDataId: dest._id,
      customerAddress: "Jl. Tujuan No. 5, Bandung, Jawa Barat 40123",
      customerName: "Siti", customerPhone: "08111111111",
      parcelContent: "Kaos katun", weight: 2, quantity: 1, goodsValue: 150000,
    }],
  });
  console.log("resi:", created.data?.[0]?.cnote_no, "batch:", created.batch_id);
} catch (e) {
  if (e instanceof MengantarError) {
    // e.code: "X001"/"X002"/"X003"/"409" bila terdeteksi
    console.error("Mengantar gagal:", e.code, e.message);
  }
}
```

## Aturan yang sudah di-handle client

- Key di **path** + **redaksi** key otomatis di `onRequest`.
- `COD_AMOUNT` (huruf besar) dari param `codAmount`.
- `POST /time` `date` divalidasi lalu dikonversi ke **`mm-dd-yyyy`** via `toMengantarDate()`.
- Semua write endpoint memakai JSON sesuai kontrak resmi.
- Opsi `clientSource: "woocommerce"` menyuntikkan header `x-client-source` otomatis.
- `success:false` / HTTP non-2xx → `throw MengantarError` dengan `.code` (X000–X003 / 409 / 429, atau field `code` body seperti `COURIER_DISABLED`).
- `isRateAvailable(rate, cod)` — filter ketersediaan rate (termasuk `unsupportedOriginSpx` untuk SPX).
- Tipe `EstimateCourier` mengecualikan `spx`: estimasi single-courier SPX ditolak `400 Invalid courier` — ambil dari `courier: "all"`.
- `createOrder()` mempertahankan envelope: order ada di `.data[]`, sedangkan `.batch_id` dan `.errors` tetap tersedia untuk unpaid/partial failure.

**Belum di-handle (sengaja — logika app-mu):** caching GET, retry/backoff, queue create shipment,
polling tracking, perhitungan fee COD. Pola lengkap: [`../docs/04-how-it-works.md`](../docs/04-how-it-works.md).

## Recipes

Pola siap-pakai yang menggabungkan beberapa endpoint. Semua memakai instance `mgt` di atas.

### 1) Pilih kurir termurah yang tersedia

```ts
import { isRateAvailable, type CourierRate } from "./mengantar-client";

// `courier` yang dikembalikan = KEY estimasi (mis. "SAPLite"), bukan nama shipment — petakan dulu sebelum POST /order.
function cheapestCourier(rates: Record<string, CourierRate>, cod = false) {
  return Object.entries(rates)
    .filter(([, r]) => isRateAvailable(r, cod))
    .filter(([, r]) => (r.estimatedSpecialPrice ?? r.price ?? 0) > 0)
    .map(([courier, r]) => ({ courier, harga: r.estimatedSpecialPrice ?? r.price! }))
    .sort((a, b) => a.harga - b.harga)[0];
}

const rates = await mgt.estimate({ originId, destinationId, courier: "all", weight: 2 });
const pilihan = cheapestCourier(rates as Record<string, CourierRate>, paymentMethod === "COD");
```

### 2) Kurir "terbaik" via skor performa

```ts
const rates = await mgt.estimate({ originId, destinationId, courier: "all", weight: 2 });
const perf = await mgt.getCourierPerformance(destCity, rates as Record<string, any>);
// perf.recommended / perf.bestCourier — pakai untuk default pilihan customer
```

### 3) Gating COD berdasarkan risiko penerima (kurangi RTS)

```ts
const score = await mgt.getReceiverScore(receiverPhone);
const jne = (score as any).JNE;                 // per kurir: { rate: 0..10, rts, delivered }
const bolehCOD = !jne || jne.rate >= 6;         // ambang contoh; sesuaikan kebijakanmu
// bila !bolehCOD → paksa non-COD (kirim goodsValue, bukan COD)
```

### 4) Buat shipment lalu polling resi dengan backoff

```ts
const created = await mgt.createOrder({ courier, pickup, orders });
const order = created.data?.[0];
if (!order) throw new Error("Mengantar tidak mengembalikan order");
let resi = order.cnote_no;
if (!resi && order.isPaid !== false) {           // resi sedang diproses, bukan unpaid
  for (const wait of [15_000, 60_000, 300_000, 1_800_000]) {   // 15s→30m
    await new Promise(r => setTimeout(r, wait));
    const [fresh] = await mgt.trackByOrderId(order.ORDER_ID);
    if (fresh?.cnote_no) { resi = fresh.cnote_no; break; }
  }
}
```

### 5) Bayar order yang unpaid (saldo sempat kurang)

```ts
const created = await mgt.createOrder({ courier, pickup, orders });
const order = created.data?.[0];
if (!order) throw new Error("Mengantar tidak mengembalikan order");
if (order.isPaid === false) {
  // Order tetap berhasil dibuat; top-up saldo di luar flow ini.
  const batchId = order.batch_id ?? created.batch_id;
  if (!batchId) throw new Error("Response unpaid tidak memiliki batch_id");
  await mgt.payUnpaid(batchId, courier);
  const [paid] = await mgt.trackByOrderId(order.ORDER_ID);
  console.log("resi:", paid?.cnote_no);
}
```

### 6) Verifikasi Webhook Resmi (HMAC-SHA256)

```ts
import { verifyMengantarWebhookSignature } from "./mengantar-client";

// Dapatkan raw body string (jangan parsed JSON), header timestamp, dan signature
const rawBody = '{"cnote_no":"JNE1234567890","order_id":"ORD-000123","courier":"JNE","status_category":"DELIVERED"}';
const timestamp = req.headers["x-timestamp"] as string;
const signature = req.headers["x-signature"] as string;
const webhookSecret = process.env.MENGANTAR_WEBHOOK_SECRET!;

const isValid = await verifyMengantarWebhookSignature({
  rawBody,
  timestamp,
  signature,
  secret: webhookSecret,
});

if (!isValid) {
  throw new Error("Invalid signature: Webhook ditolak");
}
```

### 7) Pengiriman via Dropshipper

```ts
// 1. Simpan identitas dropshipper bila belum ada
const dropshipper = await mgt.addDropshipper({
  name: "Toko Cantik Official",
  phone: "081299887766",
});

// 2. Gunakan id dropshipper pada pembuatan order
const created = await mgt.createOrder({
  courier: "JNE",
  pickup: { type: "scheduledPickup", address_id: pickupAddress._id, volume: "volumeMobil" },
  orders: [{
    customerAddressDataId: dest._id,
    customerAddress: "Jl. Mawar No. 10, Surabaya",
    customerName: "Rina",
    customerPhone: "08123456789",
    parcelContent: "Dress Silk",
    weight: 1,
    quantity: 1,
    goodsValue: 250000,
    dropShipper: {
      id: dropshipper._id,
      name: dropshipper.name,
      phone: dropshipper.phone,
    },
  }],
});
```

### 8) Request & Polling Cetak Label PDF Asinkron

```ts
// 1. Request cetak label (return HTTP 202 dengan status PENDING)
const reqLabel = await mgt.requestLabelGeneration({
  courier: "JNE",
  orderIds: ["ORDER_OBJECT_ID_1", "ORDER_OBJECT_ID_2"],
  format: "A6", // "A6" thermal atau "A4"
  type: "multiple",
});
const labelJobId = reqLabel.data?.id!;

// 2. Polling status sampai COMPLETED (maks 8 aksi/menit)
for (let i = 0; i < 5; i++) {
  await new Promise(r => setTimeout(r, 10_000));
  const statusRes = await mgt.getLabelGenerationStatus(labelJobId);
  if (statusRes.data?.status === "COMPLETED") {
    console.log("Download URL label PDF (berlaku 15 menit):", statusRes.data.downloadUrl);
    break;
  }
}
```

## ⚠️ Konkurensi batch

Untuk **JT Premium / SiCepat**, jangan panggil `createOrder()` paralel per akun —
gabungkan semua order ke **satu** panggilan (`orders: [...]`). Request konkuren → `MengantarError` code `409`. *(Catatan: Ninja Xpress sudah discontinued per 1 Sept 2026)*.
