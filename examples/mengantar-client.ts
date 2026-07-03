/**
 * Mengantar API — client TypeScript server-only, framework-agnostic.
 * Tanpa dependensi (pakai global `fetch`, Node 18+ / Cloudflare Workers / Deno / Bun).
 *
 * ⚠️  SERVER-ONLY. API key ada di PATH URL — JANGAN import file ini ke bundle browser.
 *
 * Kontrak mengikuti docs/01-api-reference.md (dicocokkan dengan docs resmi app.mengantar.com/docs).
 * Casing param disengaja: `COD_AMOUNT` (huruf besar), nama kurir persis, `date` = mm-dd-yyyy.
 */

// ── Tipe dasar ──────────────────────────────────────────────────────────────

export type Courier =
  | "JNE" | "SiCepat" | "Sap" | "iDexpress" | "JT" | "Ninja" | "lion" | "anteraja";

export type EstimateCourier = Courier | "all";
export type Volume = "volumeMotor" | "volumeMobil" | "volumeTruck";
export type PickupType = "scheduledPickup" | "dropOff";

/** Amplop response standar Mengantar. */
export interface Envelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
  errorsFront?: string;
  courier?: string;
  [k: string]: unknown;
}

/** Error API — dilempar saat `success:false` atau HTTP non-2xx. */
export class MengantarError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
    /** Kode resmi bila terdeteksi: X000/X001/X002/X003, atau "409". */
    readonly code?: string,
  ) {
    super(message);
    this.name = "MengantarError";
  }
}

export interface ClientOptions {
  apiKey: string;
  /** Default host dari plugin — KONFIRMASI base URL final dengan tim Mengantar. */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  /** Dipanggil untuk tiap request (log). Key sudah diredaksi. */
  onRequest?: (info: { method: string; url: string }) => void;
}

// ── Helper ──────────────────────────────────────────────────────────────────

const DEFAULT_BASE = "https://api-public.mengantar.com";
const redact = (url: string) => url.replace(/\/api\/public\/[^/]+/, "/api/public/**redacted**");

/** Ubah Date/‘YYYY-MM-DD’ → format Mengantar `mm-dd-yyyy` untuk POST /time. */
export function toMengantarDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${mm}-${dd}-${dt.getFullYear()}`;
}

// ── Client ──────────────────────────────────────────────────────────────────

export class MengantarClient {
  private readonly apiKey: string;
  private readonly base: string;
  private readonly f: typeof fetch;
  private readonly onRequest?: ClientOptions["onRequest"];

  constructor(opts: ClientOptions) {
    if (!opts.apiKey) throw new Error("MengantarClient: apiKey wajib diisi");
    this.apiKey = opts.apiKey;
    this.base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, "");
    this.f = opts.fetchImpl ?? fetch;
    this.onRequest = opts.onRequest;
  }

  /** URL ber-prefix key: {base}/api/public/{key}{path} */
  private keyed(path: string): string {
    return `${this.base}/api/public/${this.apiKey}${path}`;
  }

  private async request<T>(method: string, url: string, init?: RequestInit): Promise<T> {
    this.onRequest?.({ method, url: redact(url) });
    let res: Response;
    try {
      res = await this.f(url, { method, ...init });
    } catch (e) {
      throw new MengantarError(`Request gagal: ${(e as Error).message}`, 0, null);
    }
    const text = await res.text();
    let body: unknown = text;
    try { body = text ? JSON.parse(text) : {}; } catch { /* biarkan string */ }

    const env = body as Envelope<T>;
    if (!res.ok || (env && env.success === false)) {
      const msg = env?.errorsFront || env?.message || `HTTP ${res.status}`;
      const code = res.status === 409 ? "409" : detectErrorCode(env);
      throw new MengantarError(msg, res.status, body, code);
    }
    return (env?.data ?? (body as T)) as T;
  }

  private form(fields: Record<string, unknown>): URLSearchParams {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== null) p.set(k, String(v));
    return p;
  }

  private qs(params: Record<string, string | number | boolean | undefined>): string {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") p.set(k, String(v));
    const s = p.toString();
    return s ? `?${s}` : "";
  }

  // ── 1. Alamat ────────────────────────────────────────────────────────────

  /** Cari data wilayah → `_id` dipakai sebagai origin_id / destination_id. */
  searchAddress(keyword: string) {
    return this.request<AddressSearchItem[]>("GET", this.keyed(`/address/search${this.qs({ keyword })}`));
  }

  listOrigins() {
    return this.request<PickupAddress[]>("GET", this.keyed(`/address`));
  }

  /** Buat / update alamat pickup. Sertakan `_id` untuk update. */
  upsertOrigin(input: PickupAddressInput) {
    return this.request<PickupAddress>("POST", this.keyed(`/address`), { body: this.form({ ...input }) });
  }

  /**
   * `_id` WILAYAH asal untuk dipakai sebagai estimate `originId` (= PICKUP_AUTOFILL alamat pickup).
   * Tanpa argumen → alamat pickup pertama. Gunakan hasilnya di estimate()/estimatePublic()/estimate3PL().
   */
  async originWilayah(pickupAddressId?: string): Promise<string | undefined> {
    const origins = await this.listOrigins();
    const a = pickupAddressId ? origins.find((o) => o._id === pickupAddressId) : origins[0];
    return a?.PICKUP_AUTOFILL;
  }

  // ── 2. Jadwal pickup ───────────────────────────────────────────────────────

  listPickupTimes(addressId: string) {
    return this.request<PickupTime[]>("GET", this.keyed(`/time${this.qs({ address: addressId })}`));
  }

  /** Tambah slot pickup. `date` diterima Date/‘YYYY-MM-DD’ → dikonversi ke mm-dd-yyyy. */
  addPickupTime(addressId: string, date: Date | string, time: PickupTimeSlot) {
    return this.request<PickupTime[]>("POST", this.keyed(`/time`), {
      body: this.form({ address_id: addressId, date: toMengantarDate(date), time }),
    });
  }

  // ── 3. Estimasi ongkir ─────────────────────────────────────────────────────

  /**
   * Cek ongkir. courier default "JNE"; "all" → map per kurir. codAmount → COD_AMOUNT.
   * ⚠️ originId & destinationId = `_id` WILAYAH (dari searchAddress), BUKAN `_id` alamat pickup.
   * Untuk asal, pakai `PICKUP_AUTOFILL` dari listOrigins() — lihat originWilayah().
   * (Live-verified: memakai pickup `_id` di sini → success:false.)
   */
  estimate(p: { originId: string; destinationId: string; courier?: EstimateCourier; weight?: number; codAmount?: number }) {
    return this.request<CourierRate | Record<string, CourierRate>>(
      "GET",
      this.keyed(`/order/estimate${this.qs({
        origin_id: p.originId, destination_id: p.destinationId,
        courier: p.courier ?? "JNE", weight: p.weight ?? 1, COD_AMOUNT: p.codAmount,
      })}`),
    );
  }

  /** Estimasi publik semua kurir (flat diskon 20%). TANPA prefix key. */
  estimatePublic(p: { originId: string; destinationId: string; weight?: number; codAmount?: number }) {
    return this.request<Record<string, CourierRate>>(
      "GET",
      `${this.base}/api/order/allEstimatePublic${this.qs({
        origin_id: p.originId, destination_id: p.destinationId, weight: p.weight ?? 1, COD_AMOUNT: p.codAmount,
      })}`,
    );
  }

  /** Estimasi 3PL (harga standar tanpa promo). TANPA prefix key. */
  estimate3PL(p: { originId: string; destinationId: string; weight?: number }) {
    return this.request<Record<string, CourierRate>>(
      "GET",
      `${this.base}/api/order/allEstimate3PL${this.qs({
        origin_id: p.originId, destination_id: p.destinationId, weight: p.weight ?? 1,
      })}`,
    );
  }

  /** Skor performa kurir untuk sebuah kota. `allEstimateData` = hasil estimate(courier:"all"). */
  getCourierPerformance(city: string, allEstimateData: Record<string, CourierRate>) {
    return this.request<CourierPerformance>("POST", this.keyed(`/order/getPerformancePublic`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ city, allEstimateData }),
    });
  }

  // ── 4. Invoice / assignee ──────────────────────────────────────────────────

  listInvoices() {
    return this.request<Invoice[]>("GET", this.keyed(`/invoices`));
  }

  listAssignees() {
    return this.request<Assignee[]>("GET", this.keyed(`/my-users`));
  }

  // ── 5. Order & batch ───────────────────────────────────────────────────────

  /**
   * Buat shipment (batch). `data` yang dikembalikan = ARRAY per order; resi di `.cnote_no`.
   * ⚠️ JT Premium / Ninja / SiCepat: JANGAN panggil paralel — gabung semua order ke satu request
   * (request konkuren → 409). Saldo kurang → order unpaid (cnote_no kosong) → pakai payUnpaid().
   */
  createOrder(payload: CreateOrderRequest) {
    // Docs resmi memakai form dengan pickup/orders sebagai JSON-string. JSON body juga diterima
    // (perilaku plugin) — di sini kirim JSON agar sederhana; ganti ke form bila perlu.
    return this.request<CreatedOrder[]>("POST", this.keyed(`/order`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  }

  payUnpaid(batchId: string, courier?: Courier) {
    return this.request<unknown>("POST", this.keyed(`/order/pay-unpaid`), {
      body: this.form({ batch_id: batchId, courier }),
    });
  }

  /** Lacak satu order (by order_id / tracking_id) atau list dengan filter. */
  getOrders(params: OrderQuery = {}) {
    return this.request<OrderRecord[]>("GET", this.keyed(`/order${this.qs(params as Record<string, string | number | boolean | undefined>)}`));
  }

  trackByOrderId(orderId: string) { return this.getOrders({ order_id: orderId }); }
  trackByResi(cnoteNo: string) { return this.getOrders({ tracking_id: cnoteNo }); }

  /** Hapus order. Anteraja: hanya bisa 5 menit setelah dibuat. */
  deleteOrders(ids: string[], courier?: Courier) {
    return this.request<unknown>("DELETE", this.keyed(`/order`), {
      body: this.form({ courier, ids: JSON.stringify(ids) }),
    });
  }

  listBatches(params: { page?: number; size?: number; courier?: Courier } = {}) {
    return this.request<BatchRecord[]>("GET", this.keyed(`/batch${this.qs(params)}`));
  }

  deleteBatch(id: string, courier?: Courier) {
    return this.request<unknown>("DELETE", this.keyed(`/batch`), { body: this.form({ id, courier }) });
  }

  // ── 6. Skor penerima ───────────────────────────────────────────────────────

  /** Skor riwayat penerima per kurir — cek risiko RTS sebelum kirim COD besar. */
  getReceiverScore(phone: string) {
    return this.request<ReceiverScore>("GET", this.keyed(`/getReceiverScoreByNumberUser${this.qs({ search: phone })}`));
  }
}

// ── Deteksi kode error resmi dari body ──────────────────────────────────────
function detectErrorCode(env: Envelope<unknown> | undefined): string | undefined {
  const hay = JSON.stringify(env?.errors ?? "") + " " + (env?.message ?? "");
  const m = hay.match(/\bX00[0-3]\b/);
  return m?.[0];
}

// ── Tipe response (subset praktis; lihat docs/01 & spec/openapi.yaml untuk lengkap) ──

export interface AddressSearchItem {
  _id: string;
  PROVINCE_NAME?: string; CITY_NAME?: string; DISTRICT_NAME?: string; SUBDISTRICT_NAME?: string;
  ZIP_CODE?: string; ORIGIN_CODE?: string; DESTINATION_CODE?: string; CODE_SAP?: string;
}
export interface PickupAddress {
  _id: string; PICKUP_NAME?: string; PICKUP_PIC?: string; PICKUP_PIC_PHONE?: string;
  PICKUP_ADDRESS?: string; PICKUP_AUTOFILL?: string; PICKUP_FULL_AUTOFILL?: string;
}
export interface PickupAddressInput {
  PICKUP_AUTOFILL: string; PICKUP_ADDRESS: string; PICKUP_PIC_PHONE: string;
  PICKUP_PIC: string; PICKUP_NAME: string;
  SHIPPER_ADDR1?: string; SHIPPER_AUTOFILL?: string; SHIPPER_CONTACT?: string; SHIPPER_PHONE?: string;
  _id?: string; // untuk update
}
export type PickupTimeSlot =
  | "9:00" | "10:00" | "11:00" | "12:00" | "13:00" | "14:00" | "15:00" | "16:00" | "17:00" | "18:00";
export interface PickupTime { _id: string; date: string; time: string; }

export interface CourierRate {
  price?: number; estimatedPrice?: number; estimatedSpecialPrice?: number;
  discount?: number; discountPercent?: number; codFee?: number; currency?: string;
  estimate_delivery?: string; estimatedDate?: string;
  unsupported?: boolean; unsupported_cod?: boolean; coverage_cod?: boolean;
  minimumWeightCargo?: number;
}
export interface CourierPerformance {
  couriers: { key: string; score: number }[]; bestCourier: string; recommended: string;
}
export interface Invoice { _id: string; inv_number?: string; type?: string; amount?: number; total?: number; status?: string; }
export interface Assignee { _id: string; name: string; email: string; }

export interface CreateOrderRequest {
  courier: Courier;
  pickup: { type: PickupType; address_id: string; time_id?: string; volume?: Volume };
  orders: OrderItem[];
}
export interface OrderItem {
  customerAddressDataId: string; customerAddress: string; customerName: string; customerPhone: string;
  parcelContent: string; weight: number; quantity: number;
  goodsValue?: number;   // NON-COD
  COD?: number;          // COD = Nilai Barang + Ongkir + COD Fee (wajib bila goodsValue kosong)
  assignee?: string; destinationMark?: string; deliveryInstruction?: string;
  dontIncludeSubdistrict?: boolean; cargo?: boolean;
  customProducts?: { name: string; variant?: string; qty?: number; price?: number; weight?: number }[];
}
export interface CreatedOrder { ORDER_ID: string; cnote_no: string; status?: string; statusCategory?: string; isPaid?: boolean; batch_id?: string; }

export interface OrderQuery {
  order_id?: string; tracking_id?: string; page?: number; size?: number;
  courier?: Courier; batch?: string; cod?: "COD" | "NON_COD";
  status?: string; category?: string; ticketFilter?: string; receiverFilter?: string;
  no_update_after_hour?: string; no_update_after_day?: string; dateRange?: string; reseller?: boolean;
}
export interface OrderRecord { _id: string; ORDER_ID?: string; cnote_no?: string; status?: string; [k: string]: unknown; }
export interface BatchRecord { _id: string; id?: string; orders?: number; delivered?: number; [k: string]: unknown; }
export interface ReceiverScore { phone: string; [courier: string]: unknown; }
