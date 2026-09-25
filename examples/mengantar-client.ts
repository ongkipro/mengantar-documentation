/**
 * Mengantar API — client TypeScript server-only, framework-agnostic.
 * Tanpa dependensi pihak ketiga (pakai global `fetch` & `crypto.subtle`, Node 18+ / Cloudflare Workers / Deno / Bun).
 *
 * ⚠️  SERVER-ONLY. API key ada di PATH URL — JANGAN import file ini ke bundle browser.
 *
 * Kontrak mengikuti docs/01-api-reference.md & spec/openapi.yaml (sinkron dengan api-public.mengantar.com/docs).
 * Casing param disengaja: `COD_AMOUNT` (huruf besar), nama kurir persis, `date` = mm-dd-yyyy.
 */

// ── Tipe dasar ──────────────────────────────────────────────────────────────

export type Courier =
  | "JNE"
  | "SiCepat"
  | "Sap"
  | "iDexpress"
  | "JT"
  | "lion"
  | "anteraja"
  | "pos"
  /**
   * SPX Express (Shopee Express). Dikonfirmasi support Mengantar untuk `POST /order`, belum ada di docs resmi
   * dan belum teramati di create-order live (2026-09-25). Tarifnya hanya muncul di `estimate({ courier: "all" })`.
   */
  | "spx"
  /** @deprecated Discontinued per 1 September 2026. */
  | "Ninja";

/**
 * Nilai `courier` untuk estimasi single/all. `spx` dikecualikan: estimasi single-courier menolak semua ejaan SPX
 * dengan `400 Invalid courier` (teramati 2026-09-25) — ambil tarif SPX dari `all`.
 */
export type EstimateCourier = Exclude<Courier, "spx"> | "all";
export type Volume = "volumeMotor" | "volumeMobil" | "volumeTruck";

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
    /** Kode resmi bila terdeteksi: X000/X001/X002/X003, "409", "429", atau field `code` body (mis. "COURIER_DISABLED"). */
    readonly code?: string,
  ) {
    super(message);
    this.name = "MengantarError";
  }
}

export interface ClientOptions {
  apiKey: string;
  /** Default: https://api-public.mengantar.com */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  /** Wajib `"woocommerce"` untuk request yang berasal dari integrasi WooCommerce. */
  clientSource?: "woocommerce";
  /** Dipanggil untuk tiap request (log). Key sudah diredaksi. */
  onRequest?: (info: { method: string; url: string }) => void;
}

// ── Helper ──────────────────────────────────────────────────────────────────

const DEFAULT_BASE = "https://api-public.mengantar.com";
const redact = (url: string) => url.replace(/\/api\/public\/[^/]+/, "/api/public/**redacted**");

/** Ubah Date/`YYYY-MM-DD`/`mm-dd-yyyy` → format Mengantar `mm-dd-yyyy` untuk POST /time. */
export function toMengantarDate(d: Date | string): string {
  if (typeof d === "string") {
    const match = d.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? d.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!match) throw new Error("Tanggal pickup tidak valid");

    const ymd = match[1].length === 4;
    const year = Number(match[ymd ? 1 : 3]);
    const month = Number(match[ymd ? 2 : 1]);
    const day = Number(match[ymd ? 3 : 2]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
      throw new Error("Tanggal pickup tidak valid");
    }
    return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}-${year}`;
  }

  if (Number.isNaN(d.getTime())) throw new Error("Tanggal pickup tidak valid");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}-${d.getFullYear()}`;
}

/**
 * Verifikasi signature Webhook Mengantar resmi (HMAC-SHA256 hex dari "{timestamp}.{rawBody}").
 * Menggunakan Web Crypto bawaan runtime (Node 18+, Bun, Deno, Cloudflare Workers).
 */
export async function verifyMengantarWebhookSignature(
  rawBody: string,
  timestamp: string | number,
  signature: string,
  secret: string,
): Promise<boolean> {
  if (!rawBody || !timestamp || !signature || !secret) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const data = encoder.encode(`${timestamp}.${rawBody}`);
    const sigBuffer = await crypto.subtle.sign("HMAC", key, data);
    const hashArray = Array.from(new Uint8Array(sigBuffer));
    const expectedSig = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    if (expectedSig.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expectedSig.length; i++) {
      diff |= expectedSig.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

// ── Client ──────────────────────────────────────────────────────────────────

export class MengantarClient {
  private readonly apiKey: string;
  private readonly base: string;
  private readonly f: typeof fetch;
  private readonly onRequest?: ClientOptions["onRequest"];
  private readonly clientSource?: ClientOptions["clientSource"];

  constructor(opts: ClientOptions) {
    if (!opts.apiKey) throw new Error("MengantarClient: apiKey wajib diisi");
    this.apiKey = opts.apiKey;
    this.base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, "");
    this.f = opts.fetchImpl ?? fetch;
    this.onRequest = opts.onRequest;
    this.clientSource = opts.clientSource;
  }

  /** URL ber-prefix key: {base}/api/public/{key}{path} */
  private keyed(path: string): string {
    return `${this.base}/api/public/${this.apiKey}${path}`;
  }

  private async request<T>(method: string, url: string, init?: RequestInit & { unwrap?: boolean }): Promise<T> {
    this.onRequest?.({ method, url: redact(url) });
    const { unwrap = true, ...requestInit } = init ?? {};
    const headers = new Headers(requestInit.headers);
    if (this.clientSource) headers.set("x-client-source", this.clientSource);
    let res: Response;
    try {
      res = await this.f(url, { ...requestInit, method, headers });
    } catch (e) {
      throw new MengantarError(`Request gagal: ${(e as Error).message}`, 0, null);
    }
    const text = await res.text();
    let body: unknown = text;
    try { body = text ? JSON.parse(text) : {}; } catch { /* biarkan string */ }
    const env = body as Envelope<T>;
    if (!res.ok || (env && env.success === false)) {
      const msg = env?.errorsFront || env?.message || `HTTP ${res.status}`;
      const code = res.status === 409 ? "409" : res.status === 429 ? "429" : detectErrorCode(env);
      throw new MengantarError(msg, res.status, body, code);
    }
    return (unwrap ? (env?.data ?? body) : body) as T;
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

  /** Buat / update alamat pickup. Sertakan `_id` untuk update in-place. */
  upsertOrigin(input: PickupAddressInput) {
    return this.request<PickupAddress>("POST", this.keyed(`/address`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input),
    });
  }

  /** Hapus alamat pickup berdasarkan ID alamat. */
  deleteAddress(id: string) {
    return this.request<PickupAddress>("DELETE", this.keyed(`/address`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  /** Update spesifik alamat pickup by ID. */
  updateAddress(id: string, input: Partial<PickupAddressInput>) {
    return this.request<PickupAddress>("PUT", this.keyed(`/address/${id}`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input),
    });
  }

  /**
   * `_id` WILAYAH asal untuk dipakai sebagai estimate `originId` (= PICKUP_AUTOFILL alamat pickup).
   * Tanpa argumen → alamat pickup pertama.
   */
  async originWilayah(pickupAddressId?: string): Promise<string> {
    const origins = await this.listOrigins();
    const address = pickupAddressId ? origins.find((item) => item._id === pickupAddressId) : origins[0];
    if (!address?.PICKUP_AUTOFILL) throw new Error("Alamat pickup tidak memiliki PICKUP_AUTOFILL");
    return address.PICKUP_AUTOFILL;
  }

  // ── 2. Jadwal pickup ───────────────────────────────────────────────────────

  listPickupTimes(addressId: string) {
    return this.request<PickupTime[]>("GET", this.keyed(`/time${this.qs({ address: addressId })}`));
  }

  /** Tambah slot pickup. `date` menerima Date/`YYYY-MM-DD`/`mm-dd-yyyy`. */
  addPickupTime(addressId: string, date: Date | string, time: PickupTimeSlot) {
    return this.request<PickupTime>("POST", this.keyed(`/time`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ address_id: addressId, date: toMengantarDate(date), time }),
    });
  }

  // ── 3. Estimasi ongkir ─────────────────────────────────────────────────────

  /**
   * Cek ongkir akun. courier default "JNE"; "all" → map per kurir.
   */
  estimate(p: {
    originId: string;
    destinationId: string;
    courier?: EstimateCourier;
    weight?: number;
    codAmount?: number;
    isDangerousGoods?: boolean;
  }) {
    return this.request<CourierRate | Record<string, CourierRate>>(
      "GET",
      this.keyed(`/order/estimate${this.qs({
        origin_id: p.originId,
        destination_id: p.destinationId,
        courier: p.courier ?? "JNE",
        weight: p.weight ?? 1,
        COD_AMOUNT: p.codAmount,
        isDangerousGoods: p.isDangerousGoods,
      })}`),
    );
  }

  /** Estimasi publik semua kurir (flat diskon 20%). TANPA prefix key. */
  estimatePublic(p: {
    originId: string;
    destinationId: string;
    weight?: number;
    codAmount?: number;
    isDangerousGoods?: boolean;
  }) {
    return this.request<Record<string, CourierRate>>(
      "GET",
      `${this.base}/api/order/allEstimatePublic${this.qs({
        origin_id: p.originId,
        destination_id: p.destinationId,
        weight: p.weight ?? 1,
        COD_AMOUNT: p.codAmount,
        isDangerousGoods: p.isDangerousGoods,
      })}`,
    );
  }

  /** Estimasi 3PL (harga standar tanpa promo). TANPA prefix key. */
  estimate3PL(p: {
    originId: string;
    destinationId: string;
    weight?: number;
    isDangerousGoods?: boolean;
  }) {
    return this.request<Record<string, CourierRate>>(
      "GET",
      `${this.base}/api/order/allEstimate3PL${this.qs({
        origin_id: p.originId,
        destination_id: p.destinationId,
        weight: p.weight ?? 1,
        isDangerousGoods: p.isDangerousGoods,
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

  listInvoices(params: { page?: number; size?: number; keyword?: string; dateRange?: string; invoiceFilter?: string } = {}) {
    return this.request<InvoiceEnvelope>("GET", this.keyed(`/invoices${this.qs(params)}`), { unwrap: false });
  }

  listAssignees() {
    return this.request<Assignee[]>("GET", this.keyed(`/my-users`));
  }

  // ── 5. Master Dropshipper ──────────────────────────────────────────────────

  addDropshipper(input: DropshipperInput) {
    return this.request<Dropshipper>("POST", this.keyed(`/dropshippers`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input),
    });
  }

  searchDropshippers(params: { search?: string; page?: number; perPage?: number } = {}) {
    return this.request<DropshipperListResponse>("GET", this.keyed(`/dropshippers${this.qs(params)}`));
  }

  // ── 6. Cetak Label PDF Asynchronous (BETA) ─────────────────────────────────

  requestLabelGeneration(input: LabelGenerationRequest) {
    return this.request<LabelGenerationPendingResponse>("POST", this.keyed(`/label-generation`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input),
    });
  }

  getLabelGenerationStatus(labelGenerationId: string) {
    return this.request<LabelGenerationStatusResponse>("GET", this.keyed(`/label-generation/${labelGenerationId}`));
  }

  // ── 7. Order & batch ───────────────────────────────────────────────────────

  /**
   * Buat shipment (batch). `data` yang dikembalikan = ARRAY per order; resi di `.cnote_no`.
   * ⚠️ JT Premium / SiCepat: JANGAN panggil paralel — gabung semua order ke satu request
   * (request konkuren → 409). Saldo kurang → order unpaid (cnote_no kosong) → pakai payUnpaid().
   */
  createOrder(payload: CreateOrderRequest) {
    return this.request<CreateOrderResponse>("POST", this.keyed(`/order`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      unwrap: false,
    });
  }

  payUnpaid(batchId: string, courier?: Courier) {
    return this.request<unknown>("POST", this.keyed(`/order/pay-unpaid`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ batch_id: batchId, ...(courier && { courier }) }),
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
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ids, ...(courier && { courier }) }),
    });
  }

  listBatches(params: { page?: number; size?: number; courier?: Courier } = {}) {
    return this.request<BatchRecord[]>("GET", this.keyed(`/batch${this.qs(params)}`));
  }

  deleteBatch(id: string, courier?: Courier) {
    return this.request<unknown>("DELETE", this.keyed(`/batch`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id, ...(courier && { courier }) }),
    });
  }

  // ── 8. Skor penerima ───────────────────────────────────────────────────────

  /** Skor riwayat penerima per kurir — cek risiko RTS sebelum kirim COD besar. */
  getReceiverScore(phone: string) {
    return this.request<ReceiverScore>("GET", this.keyed(`/getReceiverScoreByNumberUser${this.qs({ search: phone })}`));
  }
}

// ── Deteksi kode error resmi dari body ──────────────────────────────────────
function detectErrorCode(env: Envelope<unknown> | undefined): string | undefined {
  const hay = JSON.stringify(env?.errors ?? "") + " " + (env?.message ?? "");
  const m = hay.match(/\bX00[0-3]\b/);
  // Kode mesin di field `code`, mis. "COURIER_DISABLED" (docs resmi, kurir Ninja).
  return m?.[0] ?? (typeof env?.code === "string" ? env.code : undefined);
}

// ── Tipe response ───────────────────────────────────────────────────────────

export interface AddressSearchItem {
  _id: string;
  PROVINCE_NAME?: string; CITY_NAME?: string; DISTRICT_NAME?: string; SUBDISTRICT_NAME?: string;
  ZIP_CODE?: string; ORIGIN_CODE?: string; DESTINATION_CODE?: string; CODE_SAP?: string;
}
export interface PickupAddress {
  _id: string; PICKUP_NAME?: string; PICKUP_PIC?: string; PICKUP_PIC_PHONE?: string;
  PICKUP_ADDRESS?: string; PICKUP_AUTOFILL?: string; PICKUP_FULL_AUTOFILL?: string;
  pinpointData?: { lat: number; lng: number };
}
export interface PickupAddressInput {
  PICKUP_AUTOFILL: string; PICKUP_ADDRESS: string; PICKUP_PIC_PHONE: string;
  PICKUP_PIC: string; PICKUP_NAME: string;
  pinpointData?: { lat: number; lng: number };
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
  unsupported?: boolean | null; unsupported_cod?: boolean | null; coverage_cod?: boolean;
  isDangerousGoodsSupported?: boolean;
  discountExtraPercent?: number; discountExtra?: number;
  minimumWeightCargo?: number;
  /** Hanya entri `spx` (teramati 2026-09-25): origin tidak dilayani SPX → perlakukan seperti `unsupported`. */
  unsupportedOriginSpx?: boolean;
  /** Hanya entri `spx` (teramati 2026-09-25). Arti belum dipastikan. */
  unsupportedPickup?: boolean;
  /** Hanya entri `spx` (teramati 2026-09-25): tanggal `yyyy-mm-dd` → slot pickup. */
  pickupSchedule?: Record<string, { timeRangeId: number; start: string; end: string; timeEpoch: number }[]>;
}

/**
 * true bila rate boleh ditawarkan: tidak `unsupported`, tidak `unsupportedOriginSpx`, dan (untuk COD) tidak
 * `unsupported_cod`. Pakai sebelum menampilkan hasil `estimate({ courier: "all" })`.
 */
export function isRateAvailable(rate: CourierRate, cod = false): boolean {
  if (rate.unsupported === true || rate.unsupportedOriginSpx === true) return false;
  return !(cod && rate.unsupported_cod === true);
}
export interface CourierPerformance {
  couriers: { key: string; score: number }[]; bestCourier: string; recommended: string;
}
export interface Invoice { _id: string; inv_number?: string; type?: string; amount?: number; total?: number; status?: string; }
export interface InvoiceEnvelope extends Envelope<Invoice[]> { count?: number; balance?: number; }
export interface Assignee { _id: string; name: string; email: string; }

export interface DropshipperInput {
  name: string;
  phone: string;
}
export interface Dropshipper {
  id: string;
  name: string;
  phone: string;
}
export interface DropshipperListResponse extends Envelope<Dropshipper[]> {
  pagination?: { page: number; perPage: number };
}

export type LabelFormat =
  | "normal-1"
  | "normal-2"
  | "normal-4"
  | "normal-6"
  | "thermal-10x10"
  | "thermal-10x15"
  | "thermal-8x6"
  | "thermal-new-10x10"
  | "thermal-new-10x15";

export interface LabelGenerationRequest {
  orderId: string;
  courier: string;
  format: LabelFormat;
}

export interface LabelGenerationPendingResponse extends Envelope<{
  labelGenerationId: string;
  status: "PENDING";
}> {}

export interface LabelGenerationStatusResponse extends Envelope<{
  labelGenerationId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  format?: string;
  downloadUrl?: string;
  errorMessage?: string;
}> {}

export type PickupRequest =
  | { type: "scheduledPickup"; address_id: string; time_id: string; volume: Volume }
  | { type: "dropOff"; address_id: string };

export interface CreateOrderRequest {
  courier: Courier;
  pickup: PickupRequest;
  orders: OrderItem[];
}
export type OrderItem = {
  customerAddressDataId: string; customerAddress: string; customerName: string; customerPhone: string;
  parcelContent: string; weight: number; quantity: number;
  assignee?: string; destinationMark?: string; deliveryInstruction?: string;
  dontIncludeSubdistrict?: boolean; cargo?: boolean;
  isDangerousGoods?: boolean;
  dropShipper?: { id: string; name: string; phone: string };
  customProducts?: { name: string; variant?: string; qty?: number; price?: number; weight?: number }[];
} & (
  | { goodsValue: number; COD?: never }
  | { COD: number; goodsValue?: never }
);
export interface CreatedOrder {
  ORDER_ID: string;
  cnote_no: string | null;
  status?: string;
  statusCategory?: string;
  isPaid?: boolean;
  batch?: string;
  batch_id?: string;
  dropShipperId?: string;
  error?: unknown;
}
export interface CreateOrderResponse extends Envelope<CreatedOrder[]> {
  batch?: string;
  batch_id?: string;
  courier?: string;
  errors?: unknown[];
}

export interface OrderQuery {
  order_id?: string; tracking_id?: string; page?: number; size?: number;
  courier?: Courier; batch?: string; cod?: "COD" | "NON_COD";
  status?: string; category?: string; ticketFilter?: string; receiverFilter?: string;
  no_update_after_hour?: string; no_update_after_day?: string; dateRange?: string; reseller?: boolean;
}
export interface OrderRecord { _id: string; ORDER_ID?: string; cnote_no?: string | null; status?: string; [k: string]: unknown; }
export interface BatchRecord { _id: string; id?: string; orders?: number; delivered?: number; [k: string]: unknown; }
export interface ReceiverScore { phone: string; [courier: string]: unknown; }
