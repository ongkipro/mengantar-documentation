# examples/ — Toolkit siap-pakai

Kode contoh server-only untuk integrasi Mengantar. **Bukan** paket npm — salin/adaptasi ke proyekmu.

| File | Isi |
|------|-----|
| [`mengantar-client.ts`](mengantar-client.ts) | Client TypeScript tanpa dependensi (fetch global). Semua 18 endpoint, typed, key di path, error terstruktur. |

Untuk contoh berbasis framework (route handler / server endpoint), lihat
[`../docs/05-integration-astro.md`](../docs/05-integration-astro.md) dan
[`../docs/06-integration-nextjs.md`](../docs/06-integration-nextjs.md).

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
// Sebelum ditampilkan: buang rate `unsupported`; untuk COD, buang juga `unsupported_cod`.

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
- `success:false` / HTTP non-2xx → `throw MengantarError` dengan `.code` (X000–X003 / 409).
- `createOrder()` mempertahankan envelope: order ada di `.data[]`, sedangkan `.batch_id` dan `.errors` tetap tersedia untuk unpaid/partial failure.

**Belum di-handle (sengaja — logika app-mu):** caching GET, retry/backoff, queue create shipment,
polling tracking, perhitungan fee COD. Pola lengkap: [`../docs/04-how-it-works.md`](../docs/04-how-it-works.md).

## Recipes

Pola siap-pakai yang menggabungkan beberapa endpoint. Semua memakai instance `mgt` di atas.

### 1) Pilih kurir termurah yang tersedia

```ts
function cheapestCourier(
  rates: Record<string, {
    price?: number;
    estimatedSpecialPrice?: number;
    unsupported?: boolean | null;
    unsupported_cod?: boolean | null;
  }>,
  cod = false,
) {
  return Object.entries(rates)
    .filter(([, r]) => !r.unsupported && (!cod || !r.unsupported_cod))
    .filter(([, r]) => (r.estimatedSpecialPrice ?? r.price ?? 0) > 0)
    .map(([courier, r]) => ({ courier, harga: r.estimatedSpecialPrice ?? r.price! }))
    .sort((a, b) => a.harga - b.harga)[0];
}

const rates = await mgt.estimate({ originId, destinationId, courier: "all", weight: 2 });
const pilihan = cheapestCourier(rates as Record<string, any>, paymentMethod === "COD");
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

## ⚠️ Konkurensi batch

Untuk **JT Premium / Ninja / SiCepat**, jangan panggil `createOrder()` paralel per akun —
gabungkan semua order ke **satu** panggilan (`orders: [...]`). Request konkuren → `MengantarError` code `409`.
