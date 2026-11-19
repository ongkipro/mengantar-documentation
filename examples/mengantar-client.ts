/**
 * Mengantar API — client TypeScript server-only, framework-agnostic.
 * Tanpa dependensi pihak ketiga (pakai global `fetch` & `crypto.subtle`, Node 18+ / Cloudflare Workers / Deno / Bun).
 *
 * ⚠️  SERVER-ONLY. API key ada di PATH URL — JANGAN import file ini ke bundle browser.
 *
 * Kontrak mengikuti docs/01-api-reference.md & spec/openapi.yaml (sinkron dengan docs resmi v2.0.0, 2026-11-19).
 * Casing param disengaja: `COD_AMOUNT` (huruf besar), nama kurir persis, `date` = MM-DD-YYYY, jam slot dua digit (`09:00`).
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
   * SPX Express (Shopee Express). Docs resmi v2: estimate, create order, pay-unpaid, delete, simulasi.
   * Estimasi single-courier `spx` → 200 (sandbox 2026-11-19). Sandbox: hanya area Jakarta.
   */
  | "spx"
  /** @deprecated Discontinued per 1 September 2026. */
  | "Ninja";

/** Nilai `courier` untuk estimasi single/all (Ninja → 400 COURIER_DISABLED). */
export type EstimateCourier = Exclude<Courier, "Ninja"> | "all";
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
    /**
     * Kode mesin bila ada: field `code` body (mis. "COURIER_DISABLED", "IDEMPOTENCY_REQUEST_IN_PROGRESS"), atau "409"/"429".
     * Docs resmi v2 tidak memakai X000–X003; key/izin/IP/whitelist yang ditolak selalu 403 "Not allowed" (lihat isNotAllowed()).
     */
    readonly code?: string,
    /** Header `Retry-After` (detik), mis. pada 409 IDEMPOTENCY_REQUEST_IN_PROGRESS. */
    readonly retryAfter?: string,
    /** true bila respons adalah replay idempotency (header `Idempotent-Replayed: true`). */
    readonly idempotentReplayed = false,
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
    let text: string;
    try {
      text = await res.text();
    } catch (e) {
      throw new MengantarError(`Request gagal: ${(e as Error).message}`, 0, null);
    }
    let body: unknown = text;
    try { body = text ? JSON.parse(text) : {}; } catch { /* biarkan string */ }
    const env = body as Envelope<T>;
    if (!res.ok || (env && env.success === false)) {
      const msg = env?.errorsFront || env?.message || `HTTP ${res.status}`;
      // A body `code` (idempotency, COURIER_DISABLED, ...) is more specific than the bare status.
      const bodyCode = typeof env?.code === "string" && env.code ? env.code : undefined;
      const code = bodyCode ?? (res.status === 409 ? "409" : res.status === 429 ? "429" : undefined);
      throw new MengantarError(msg, res.status, body, code, res.headers.get("Retry-After") ?? undefined,
        res.headers.get("Idempotent-Replayed") === "true");
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

  /** List alamat pickup. Tanpa parameter → semua. `page` & `size` hanya berlaku bila keduanya dikirim (size ≤ 100). */
  listOrigins(params: { keyword?: string; page?: number; size?: number; fields?: string } = {}) {
    if ((params.page === undefined) !== (params.size === undefined)) {
      throw new Error("listOrigins: page dan size harus dikirim bersama (API mengabaikan salah satunya)");
    }
    return this.request<PickupAddress[]>("GET", this.keyed(`/address${this.qs(params)}`));
  }

  /** Tambah alamat pickup (`POST /address`). Untuk mengubah alamat yang sudah ada, pakai updateAddress(). */
  addOrigin(input: PickupAddressInput) {
    return this.upsertOrigin(input);
  }

  /** @deprecated Nama lama — sama dengan addOrigin(). Docs v2: POST /address hanya menambah; ubah alamat lewat updateAddress(). */
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

  /** Update alamat by ID (`PUT /address/{id}`): hanya field yang dikirim; wilayah diganti lewat PICKUP_AUTOFILL. */
  updateAddress(id: string, input: PickupAddressUpdateInput) {
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

  /**
   * Jadwal pickup mendatang. Tanpa `addressId` → semua alamat. `courier` menyembunyikan slot yang tak bisa dipakai
   * kurir itu (JNE: tanpa Minggu & 19/20; anteraja: tanpa Minggu; iDexpress: tanpa 20:00 & hanya > 90 menit).
   * `date` di respons = Unix ms dengan jam Jakarta ditulis seolah UTC → baca dengan getUTC*().
   */
  listPickupTimes(addressId?: string, courier?: Exclude<Courier, "Ninja">) {
    return this.request<PickupTime[]>("GET", this.keyed(`/time${this.qs({ address: addressId, courier })}`));
  }

  /**
   * Tambah slot pickup. `date` menerima Date/`YYYY-MM-DD`/`MM-DD-YYYY`. Setiap panggilan membuat slot BARU
   * (meski sama) — simpan & pakai ulang `_id`. Batas 90 menit dicek saat createOrder, bukan di sini.
   */
  addPickupTime(addressId: string, date: Date | string, time: PickupTimeSlot) {
    return this.request<PickupTime>("POST", this.keyed(`/time`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ address_id: addressId, date: toMengantarDate(date), time }),
    });
  }

  // ── 3. Estimasi ongkir ─────────────────────────────────────────────────────

  /**
   * Cek ongkir akun (dengan diskon akun). courier default "JNE"; "all" → map per kurir (+ `JTEco` bila rute punya
   * tarif J&T ECO). Entri `spx` membawa `pickupSchedule`.
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

  /**
   * Estimasi publik semua kurir (diskon dasar 20%). TANPA key. `withCourierServices: true` → ikut `JTEco`.
   * Hanya memeriksa format id: id valid yang tidak cocok alamat tetap mengembalikan tarif.
   */
  estimatePublic(p: {
    originId: string;
    destinationId: string;
    weight?: number;
    codAmount?: number;
    isDangerousGoods?: boolean;
    withCourierServices?: boolean;
  }) {
    return this.request<Record<string, CourierRate>>(
      "GET",
      `${this.base}/api/order/allEstimatePublic${this.qs({
        origin_id: p.originId,
        destination_id: p.destinationId,
        weight: p.weight ?? 1,
        COD_AMOUNT: p.codAmount,
        isDangerousGoods: p.isDangerousGoods,
        withCourierServices: p.withCourierServices,
      })}`,
    );
  }

  /** Estimasi 3PL (harga standar tanpa diskon/flat). TANPA key. `null` pada flag cakupan = kurir tidak menjawab. */
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

  /**
   * Skor performa kurir untuk sebuah kota (whitelist di produksi). `city` = CITY_NAME persis (case-sensitive),
   * `allEstimateData` = hasil estimate({courier:"all"}) atau estimatePublic(). Pakai `bestCourier`, bukan `recommended`.
   */
  getCourierPerformance(city: string, allEstimateData: Record<string, CourierRate>) {
    return this.request<CourierPerformance>("POST", this.keyed(`/order/getPerformancePublic`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ city, allEstimateData }),
    });
  }

  // ── 4. Invoice / assignee ──────────────────────────────────────────────────

  /** Invoice + saldo. Untuk daftar panjang pakai `cursor` (= `nextCursor` sebelumnya); page & size ≤ 100. */
  listInvoices(params: {
    page?: number; size?: number; cursor?: string; keyword?: string; ids?: string;
    dateRange?: string; invoiceFilter?: InvoiceType | "all";
  } = {}) {
    return this.request<InvoiceEnvelope>("GET", this.keyed(`/invoices${this.qs(params)}`), { unwrap: false });
  }

  /** Iterasi semua invoice lewat cursor (tidak melewati batas page 100). */
  async *iterateInvoices(params: Omit<Parameters<MengantarClient["listInvoices"]>[0] & object, "page" | "cursor"> = {}) {
    let cursor: string | undefined;
    do {
      const res = await this.listInvoices({ ...params, cursor });
      for (const inv of res.data ?? []) yield inv;
      cursor = res.nextCursor || undefined;
    } while (cursor);
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
  createOrder(payload: CreateOrderRequest, opts: { idempotencyKey?: string } = {}) {
    const key = opts.idempotencyKey?.trim();
    if (opts.idempotencyKey !== undefined && (!key || key.length > 50)) {
      throw new MengantarError("idempotencyKey harus 1–50 karakter", 0, null, "IDEMPOTENCY_KEY_INVALID");
    }
    return this.request<CreateOrderResponse>("POST", this.keyed(`/order`), {
      headers: {
        "Content-Type": "application/json", Accept: "application/json",
        ...(key && { idempotencyKey: key }),
      },
      body: JSON.stringify(payload),
      unwrap: false,
    });
  }

  /**
   * SANDBOX SAJA (`POST /order/simulation`): pindahkan order sendiri ke ON DELIVERY / DELIVERED / RTS
   * dan picu satu webhook. Produksi menjawab 404. Kirim tepat satu dari orderId / trackingId.
   */
  simulateOrderStatus(input: {
    courier: Exclude<Courier, "Ninja">;
    statusCategory: "ON DELIVERY" | "DELIVERED" | "RTS";
  } & ({ orderId: string; trackingId?: never } | { trackingId: string; orderId?: never })) {
    return this.request<unknown>("POST", this.keyed(`/order/simulation`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input),
    });
  }

  /**
   * Bayar order unpaid satu batch (`batch_id` = `_id` batch). `courier` WAJIB untuk selain JNE.
   * Bentuk respons beda per kurir — pakai paidResult() untuk menormalkan ke `{ count, cnote_no }`.
   */
  payUnpaid(batchId: string, courier?: Courier) {
    return this.request<PayUnpaidResponse>("POST", this.keyed(`/order/pay-unpaid`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ batch_id: batchId, ...(courier && { courier }) }),
      unwrap: false,
    });
  }

  /**
   * Lacak satu order (by order_id / tracking_id → ada `history`; `proofHistory` hanya via order_id) atau list dengan filter.
   * Mengembalikan array `data`. Untuk `nextCursor` pakai listOrders().
   */
  getOrders(params: OrderQuery = {}) {
    return this.request<OrderRecord[]>("GET", this.keyed(`/order${this.qs(params as Record<string, string | number | boolean | undefined>)}`));
  }

  /** Seperti getOrders() tetapi mengembalikan envelope lengkap (dengan `nextCursor`). */
  listOrders(params: OrderQuery = {}) {
    return this.request<OrderListEnvelope>("GET", this.keyed(`/order${this.qs(params as Record<string, string | number | boolean | undefined>)}`), { unwrap: false });
  }

  /** Iterasi semua order lewat cursor (aman melewati batas page 100 dan page×size 1500). */
  async *iterateOrders(params: Omit<OrderQuery, "page" | "cursor" | "order_id" | "tracking_id"> = {}) {
    let cursor: string | undefined;
    do {
      const res = await this.listOrders({ ...params, cursor });
      for (const o of res.data ?? []) yield o;
      cursor = res.nextCursor || undefined;
    } while (cursor);
  }

  trackByOrderId(orderId: string) { return this.getOrders({ order_id: orderId }); }
  trackByResi(cnoteNo: string) { return this.getOrders({ tracking_id: cnoteNo }); }

  /**
   * Hapus order (by `_id`). ⚠️ Cek `deletedCount`, bukan `success`: 200 bisa menghapus 0/sebagian.
   * `courier` WAJIB untuk selain JNE (tanpa itu API mencari di order JNE dan tidak menghapus apa pun).
   * Anteraja: hanya ≥ 5 menit setelah dibuat. Order hasil simulasi tidak bisa dihapus.
   * Catatan: "Orders already deleted" (tidak ada yang cocok, JNE/SiCepat/Sap/iDexpress/JT) datang sebagai 200 success:false
   * → dilempar sebagai MengantarError status 200.
   */
  deleteOrders(ids: string[], courier?: Courier) {
    return this.request<DeleteOrdersResult>("DELETE", this.keyed(`/order`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ids, ...(courier && { courier }) }),
      unwrap: false,
    });
  }

  /** Hapus order by `ORDER_ID` (field `orderIds`). Aturan sama dengan deleteOrders(). */
  deleteOrdersByOrderId(orderIds: string[], courier?: Courier) {
    return this.request<DeleteOrdersResult>("DELETE", this.keyed(`/order`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ orderIds, ...(courier && { courier }) }),
      unwrap: false,
    });
  }

  /** List batch (terbaru dulu; tanpa cursor, page & size ≤ 100). `batchFilter: "unpaid"` → batch untuk payUnpaid(). */
  listBatches(params: {
    page?: number; size?: number; courier?: Courier; dateRange?: string;
    batchFilter?: "unpaid" | "error" | "active" | "delivered" | "undelivered" | "rts" | "reconciled";
    keyword?: string; address_id?: string;
  } = {}) {
    return this.request<BatchRecord[]>("GET", this.keyed(`/batch${this.qs(params)}`));
  }

  /**
   * Hapus batch (`id` = `_id` atau nomor batch). ⚠️ Cek `deletedCount`/`unDeletedCount`, bukan `success`.
   * `courier` WAJIB untuk selain JNE.
   */
  deleteBatch(id: string, courier?: Courier) {
    return this.request<DeleteBatchResult>("DELETE", this.keyed(`/batch`), {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id, ...(courier && { courier }) }),
      unwrap: false,
    });
  }

  // ── 8. Skor penerima ───────────────────────────────────────────────────────

  /** Skor riwayat penerima per kurir — cek risiko RTS sebelum kirim COD besar. */
  getReceiverScore(phone: string) {
    return this.request<ReceiverScore>("GET", this.keyed(`/getReceiverScoreByNumberUser${this.qs({ search: phone })}`));
  }
}

/**
 * true untuk penolakan seragam docs v2: 403 `{"success":false,"message":"Not allowed"}` — key tidak dikenal/nonaktif,
 * key tanpa permission endpoint, IP di luar allowlist key, atau endpoint whitelist. Ini masalah konfigurasi,
 * bukan transient: jangan retry, periksa key/permission/IP. (403 lain — Pos COD, fitur Dropshipper, order milik akun
 * lain — punya message berbeda.)
 */
export function isNotAllowed(error: unknown): boolean {
  if (!(error instanceof MengantarError) || error.status !== 403) return false;
  const msg = (error.body as { message?: unknown } | null)?.message;
  return msg === "Not allowed";
}

/** Normalkan respons payUnpaid() (dua bentuk resmi) ke `{ count, cnote_no }`. */
export function paidResult(res: PayUnpaidResponse): { count: number; cnote_no: string[] } {
  if (typeof res.data === "number") return { count: res.data, cnote_no: res.cnote_no ?? [] };
  if (res.data && typeof res.data === "object") return { count: res.data.count ?? 0, cnote_no: res.data.cnote_no ?? [] };
  return { count: 0, cnote_no: res.cnote_no ?? [] };
}

// ── Tipe response ───────────────────────────────────────────────────────────

/** Hasil cari wilayah. Field lain (kode kurir, flag cakupan) data internal — rujuk alamat dengan `_id` saja. */
export interface AddressSearchItem {
  _id: string;
  COUNTRY_NAME?: string; PROVINCE_NAME?: string; CITY_NAME?: string; DISTRICT_NAME?: string; SUBDISTRICT_NAME?: string;
  ZIP_CODE?: string; fullAddress?: string; fullAddressWithoutDistrict?: string;
  [k: string]: unknown;
}
export interface PickupAddress {
  _id: string; PICKUP_NAME?: string; PICKUP_PIC?: string; PICKUP_PIC_PHONE?: string;
  PICKUP_ADDRESS?: string; PICKUP_AUTOFILL?: string; PICKUP_FULL_AUTOFILL?: string;
  PICKUP_DISTRICT?: string; PICKUP_SUBDISTRICT?: string; PICKUP_REGION?: string; PICKUP_CITY?: string; PICKUP_ZIP?: string;
  pinpointData?: { lat: number; lng: number };
  createdAt?: string; updatedAt?: string;
}
/** Koordinat pickup — wajib bila alamat dipakai untuk scheduled pickup Pos Indonesia (`pos`). */
export type PinpointData = { lat: number; lng: number };
export interface PickupAddressInput {
  PICKUP_AUTOFILL: string; PICKUP_ADDRESS: string; PICKUP_PIC_PHONE: string;
  PICKUP_PIC: string; PICKUP_NAME: string;
  pinpointData?: PinpointData | null;
  SHIPPER_ADDR1?: string; SHIPPER_AUTOFILL?: string; SHIPPER_CONTACT?: string; SHIPPER_PHONE?: string;
  /** @deprecated Tidak ada di docs v2 (POST /address hanya menambah). Ubah alamat lewat updateAddress(). */
  _id?: string;
}
/** Body PUT /address/{id}: semua opsional; field lain diabaikan API. */
export type PickupAddressUpdateInput = Partial<Omit<PickupAddressInput, "_id">>;
/** Jam pickup resmi (selalu dua digit; "9:00" ditolak API). */
export type PickupTimeSlot =
  | "09:00" | "10:00" | "11:00" | "12:00" | "13:00" | "14:00" | "15:00" | "16:00" | "17:00" | "18:00" | "19:00" | "20:00";
/** `date`: ISO 8601 dari POST /time; Unix ms (jam Jakarta ditulis seolah UTC) dari GET /time. */
export interface PickupTime { _id: string; date: string | number; time: string; isSunday?: boolean; }

export interface CourierRate {
  price?: number; estimatedPrice?: number; estimatedSpecialPrice?: number;
  discount?: number; discountPercent?: number; codFee?: number; currency?: string;
  estimate_delivery?: string; estimatedDate?: string;
  unsupported?: boolean | null; unsupported_cod?: boolean | null;
  isDangerousGoodsSupported?: boolean;
  discountExtraPercent?: number; discountExtra?: number;
  minimumWeightCargo?: number;
  /** 3PL: hanya entri anteraja. */
  isFlat?: boolean;
  /** Tidak ada di docs resmi; teramati live pada entri `spx` (2026-09-25) → perlakukan seperti `unsupported`. */
  unsupportedOriginSpx?: boolean;
  /** Tidak ada di docs resmi; teramati live pada entri `spx` (2026-09-25). Arti belum dipastikan. */
  unsupportedPickup?: boolean;
  /** Hanya entri `spx` (docs resmi): slot hari ini s.d. lusa per tanggal `YYYY-MM-DD`; `timeEpoch` Unix detik. */
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
export type PosCodBlockStatus = "new_seller" | "insufficient" | "blocked";
export interface PosCodIneligibility {
  status: PosCodBlockStatus;
  deliveredRate: number | null;
  minimumDeliveredRate: number | null;
}

/**
 * Kenali penolakan COD Pos Indonesia per akun (docs resmi): `POST /order` COD `pos` → 403 dengan
 * `status` `new_seller`/`insufficient`/`blocked` dan `message` yang sama. Mengembalikan `null` untuk error lain,
 * termasuk 403 tanpa salah satu status itu. Lihat docs/02 §3.3.
 */
export function posCodIneligibility(error: unknown): PosCodIneligibility | null {
  if (!(error instanceof MengantarError) || error.status !== 403) return null;
  const body = error.body as Record<string, unknown> | null;
  const status = body?.status;
  if (status !== "new_seller" && status !== "insufficient" && status !== "blocked") return null;
  const rate = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return { status, deliveredRate: rate(body?.deliveredRate), minimumDeliveredRate: rate(body?.minimumDeliveredRate) };
}
export interface CourierPerformance {
  couriers: { key: string; score: number }[];
  /** Kurir skor tertinggi yang bisa melayani rute (JNE bila tidak ada). */
  bestCourier: string;
  /** Terbaik di antara kurir isDangerousGoodsSupported (iDexpress bila tidak ada). */
  recommendedDGCourier?: string;
  /** Saat ini selalu "JNE" — pakai bestCourier. */
  recommended: string;
}
export type InvoiceType = "typePayment" | "typeRefund" | "typeAddBalance" | "typeWithdraw" | "typeReconciliation";
export interface Invoice {
  _id: string; inv_number?: string; type?: InvoiceType | string; amount?: number; total?: number;
  status?: "statusCleared" | "statusPending" | "statusProcessing" | "statusFailed" | "statusExpired" | string;
  courier?: string; description?: string; balanceAmount?: number; createdAt?: string; [k: string]: unknown;
}
export interface InvoiceEnvelope extends Envelope<Invoice[]> { count?: number; balance?: number; nextCursor?: string; }
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

/** `data` dari POST /label-generation (client mengembalikan `data`, bukan envelope). Tidak pernah ada downloadUrl. */
export interface LabelGenerationPendingResponse {
  labelGenerationId: string;
  /** Biasanya PENDING; job aktif yang sama bisa dipakai ulang. */
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
}

/** `data` dari GET /label-generation/{id}. downloadUrl hanya saat COMPLETED, berlaku 15 menit per polling. */
export interface LabelGenerationStatusResponse {
  labelGenerationId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  format?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

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
  /** Hanya SiCepat (HALU) & iDexpress; tidak bisa dengan cargo/eco. */
  isDangerousGoods?: boolean;
  /** Hanya courier JT: true → J&T ECO. Tidak bisa dengan cargo/isDangerousGoods; rute tanpa ECO → ordersClosedDestination. */
  eco?: boolean | null;
  dropShipper?: { id: string; name: string; phone: string };
  customProducts?: { name: string; variant?: string; qty?: number; price?: number; weight?: number }[];
} & (
  | { goodsValue: number; COD?: never }
  | { COD: number; goodsValue?: never }
);
export interface CreatedOrder {
  _id?: string;
  ORDER_ID: string;
  /** "REG", atau "ECO" untuk J&T ECO. */
  SERVICE_CODE?: string;
  price?: number; estimatedSpecialPrice?: number;
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
  /** Order yang TIDAK dibuat karena tujuan tidak dilayani kurir (tidak ada di `data`). */
  ordersClosedDestination?: unknown[];
  /** true bila ini replay dari request sebelumnya dengan idempotencyKey yang sama (bukan state terkini). */
  idempotentReplayed?: boolean;
}

export interface OrderQuery {
  order_id?: string; tracking_id?: string;
  /** ≤ 100; tanpa courier page×size ≤ 1500. Untuk daftar panjang pakai cursor / iterateOrders(). */
  page?: number;
  /** ≤ 100 (lebih → 400). */
  size?: number;
  /** `nextCursor` dari respons sebelumnya; page diabaikan bila dikirim. */
  cursor?: string;
  courier?: Courier; batch?: string; cod?: "COD" | "NON_COD";
  status?: string; dateRange?: string;
  /** ORDER_ID, resi, nama penerima — dibaca sebagai regex (escape `[`, `(`, `+`). */
  keyword?: string;
  /** @deprecated Tidak ada di docs resmi v2 (asal: plugin). */
  category?: string;
  /** @deprecated Tidak ada di docs resmi v2. */
  ticketFilter?: string;
  /** @deprecated Tidak ada di docs resmi v2. */
  receiverFilter?: string;
  /** @deprecated Tidak ada di docs resmi v2. */
  no_update_after_hour?: string;
  /** @deprecated Tidak ada di docs resmi v2. */
  no_update_after_day?: string;
  /** @deprecated Tidak ada di docs resmi v2. */
  reseller?: boolean;
}
export interface OrderRecord {
  _id: string; ORDER_ID?: string; cnote_no?: string | null; status?: string; SERVICE_CODE?: string; isPaid?: boolean;
  history?: { date: string; desc: string; code?: string; location?: string; proofUrl?: string; [k: string]: unknown }[];
  proofHistory?: { status?: string; date?: string; photo?: string; video?: string }[];
  [k: string]: unknown;
}
export interface OrderListEnvelope extends Envelope<OrderRecord[]> { nextCursor?: string; }
export interface BatchRecord {
  _id: string; id?: string; courier?: string; orders?: number; error?: number; unpaid?: number; delivered?: number;
  active?: number; undelivered?: number; rts?: number; reconciled?: number; totalToPay?: number; totalToPaySpecial?: number;
  orderData?: { orderId: string; cnote_no: string | null; status: string; SPECIAL_INS?: string | null }[];
  [k: string]: unknown;
}
export interface DeleteOrdersResult extends Envelope<unknown> {
  deletedCount?: number; deletedOrderIds?: string[]; deletedOrderIdsHumanReadable?: string[];
  /** lion, anteraja, pos, spx */
  errorMessages?: unknown[]; ordersCount?: number; totalBalanceRefund?: number;
}
export interface DeleteBatchResult extends Envelope<unknown> {
  deletedCount?: number; unDeletedCount?: number; totalCount?: number; isBatchDraft?: boolean;
  /** lion, anteraja, pos, spx */
  errorMessages?: unknown[]; ordersCount?: number; totalBalanceRefund?: number;
}
/** JNE/SiCepat/Sap/iDexpress/JT: data = jumlah + cnote_no top-level; lion/anteraja/pos/spx: data = { cnote_no, count }. */
export interface PayUnpaidResponse extends Envelope<number | { cnote_no?: string[]; count?: number }> { cnote_no?: string[]; }
export interface ReceiverScore {
  phone: string;
  summary?: { average_number: number | null; average_score: string };
  [courier: string]: unknown;
}
