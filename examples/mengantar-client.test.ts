import assert from "node:assert/strict";
import test from "node:test";

import {
  isRateAvailable,
  MengantarClient,
  MengantarError,
  toMengantarDate,
  verifyMengantarWebhookSignature,
} from "./mengantar-client.ts";

test("toMengantarDate normalizes supported formats and rejects impossible dates", () => {
  assert.equal(toMengantarDate("2026-07-10"), "07-10-2026");
  assert.equal(toMengantarDate("07-10-2026"), "07-10-2026");
  assert.throws(() => toMengantarDate("2026-02-30"), /Tanggal pickup tidak valid/);
  assert.throws(() => toMengantarDate("13-10-2026"), /Tanggal pickup tidak valid/);
  assert.throws(() => toMengantarDate("July 10, 2026"), /Tanggal pickup tidak valid/);
});

test("verifyMengantarWebhookSignature validates official test vector and rejects tampered data", async () => {
  const secret = "testsecret";
  const timestamp = "1787548800000";
  const rawBody = `{"cnote_no":"JNE1234567890","order_id":"ORD-000123","courier":"JNE","status_category":"DELIVERED"}`;
  const validSignature = "05826dec707ea7164801d952cb7eaf7ce9adc0c8aa0b93366480434164a1a111";

  // 1. Official test vector should pass
  const valid = await verifyMengantarWebhookSignature(rawBody, timestamp, validSignature, secret);
  assert.equal(valid, true);

  // 2. Modified body should fail
  const tampered = await verifyMengantarWebhookSignature(rawBody + " ", timestamp, validSignature, secret);
  assert.equal(tampered, false);

  // 3. Modified secret should fail
  const wrongSecret = await verifyMengantarWebhookSignature(rawBody, timestamp, validSignature, "wrongsecret");
  assert.equal(wrongSecret, false);

  // 4. Invalid signature hex should fail
  const wrongSig = await verifyMengantarWebhookSignature(rawBody, timestamp, "0000000000000000000000000000000000000000000000000000000000000000", secret);
  assert.equal(wrongSig, false);
});

test("write methods send JSON and never leak client-only request options", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ success: true, data: { _id: "slot-id", date: "2026-07-10", time: "13:00" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  const client = new MengantarClient({ apiKey: "test-key", fetchImpl, clientSource: "woocommerce" });

  const slot = await client.addPickupTime("pickup-id", "2026-07-10", "13:00");
  await client.payUnpaid("batch-id", "JNE");
  assert.equal(slot._id, "slot-id");

  assert.equal(calls.length, 2);
  for (const { init } of calls) {
    assert.equal(new Headers(init?.headers).get("Content-Type"), "application/json");
    assert.equal(new Headers(init?.headers).get("x-client-source"), "woocommerce");
    assert.equal("unwrap" in (init ?? {}), false);
  }
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
    address_id: "pickup-id",
    date: "07-10-2026",
    time: "13:00",
  });
  assert.deepEqual(JSON.parse(String(calls[1].init?.body)), {
    batch_id: "batch-id",
    courier: "JNE",
  });
});

test("dropshipper and address CRUD operations call correct paths and methods", async () => {
  const calls: Array<{ method: string; url: string; body?: unknown }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({
      method: init?.method ?? "GET",
      url: String(url),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    return new Response(JSON.stringify({ success: true, data: { id: "mock-id", name: "Partner" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  const client = new MengantarClient({ apiKey: "test-key", fetchImpl });

  await client.deleteAddress("addr-123");
  await client.updateAddress("addr-123", { PICKUP_NAME: "New Warehouse" });
  await client.addDropshipper({ name: "Toko Partner", phone: "081234567890" });
  await client.searchDropshippers({ search: "Toko", page: 1, perPage: 10 });

  assert.equal(calls.length, 4);
  assert.equal(calls[0].method, "DELETE");
  assert.match(calls[0].url, /\/address$/);
  assert.deepEqual(calls[0].body, { id: "addr-123" });

  assert.equal(calls[1].method, "PUT");
  assert.match(calls[1].url, /\/address\/addr-123$/);
  assert.deepEqual(calls[1].body, { PICKUP_NAME: "New Warehouse" });

  assert.equal(calls[2].method, "POST");
  assert.match(calls[2].url, /\/dropshippers$/);
  assert.deepEqual(calls[2].body, { name: "Toko Partner", phone: "081234567890" });

  assert.equal(calls[3].method, "GET");
  assert.match(calls[3].url, /\/dropshippers\?search=Toko&page=1&perPage=10$/);
});

test("label generation operations call correct endpoints and accept formats", async () => {
  const calls: Array<{ method: string; url: string; body?: unknown }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({
      method: init?.method ?? "GET",
      url: String(url),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    return new Response(JSON.stringify({
      success: true,
      data: { labelGenerationId: "gen-123", status: "PENDING" },
    }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  };
  const client = new MengantarClient({ apiKey: "test-key", fetchImpl });

  const req = await client.requestLabelGeneration({
    orderId: "ORD-001",
    courier: "JNE",
    format: "thermal-10x15",
  });
  assert.equal(req.status, "PENDING");
  assert.equal(req.labelGenerationId, "gen-123");

  await client.getLabelGenerationStatus("gen-123");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].method, "POST");
  assert.match(calls[0].url, /\/label-generation$/);
  assert.deepEqual(calls[0].body, {
    orderId: "ORD-001",
    courier: "JNE",
    format: "thermal-10x15",
  });

  assert.equal(calls[1].method, "GET");
  assert.match(calls[1].url, /\/label-generation\/gen-123$/);
});

test("listInvoices preserves top-level count and balance", async () => {
  const client = new MengantarClient({
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify({ success: true, data: [], count: 2, balance: 150_000 })),
  });

  const invoices = await client.listInvoices({ keyword: "ORD-001" });
  assert.equal(invoices.count, 2);
  assert.equal(invoices.balance, 150_000);
  assert.deepEqual(invoices.data, []);
});

test("createOrder preserves batch metadata and partial errors", async () => {
  const response = {
    success: true,
    data: [{ ORDER_ID: "order-id", cnote_no: null, isPaid: false, batch_id: "batch-id" }],
    batch: "batch-code",
    batch_id: "batch-id",
    errors: [{ order: 2, message: "invalid recipient" }],
  };
  const client = new MengantarClient({
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify(response)),
  });

  const created = await client.createOrder({
    courier: "pos",
    pickup: { type: "dropOff", address_id: "pickup-id" },
    orders: [{
      customerAddressDataId: "destination-id",
      customerAddress: "Jl. Tujuan No. 5",
      customerName: "Siti",
      customerPhone: "08111111111",
      parcelContent: "Kaos",
      weight: 1,
      quantity: 1,
      goodsValue: 100_000,
      isDangerousGoods: false,
      dropShipper: { id: "drop-1", name: "Toko Partner", phone: "081234567890" },
    }],
  });

  assert.equal(created.batch_id, "batch-id");
  assert.equal(created.data?.[0].isPaid, false);
  assert.deepEqual(created.errors, response.errors);
});

test("originWilayah fails explicitly when pickup metadata is missing", async () => {
  const client = new MengantarClient({
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify({ success: true, data: [] })),
  });

  await assert.rejects(() => client.originWilayah(), /PICKUP_AUTOFILL/);
});

test("isRateAvailable drops unsupported, SPX-unsupported origins, and COD-blocked rates", () => {
  // Bentuk entri `spx` teramati live 2026-09-25 (dipangkas).
  const spx = { price: 13700, unsupported: false, unsupported_cod: false, unsupportedOriginSpx: false, unsupportedPickup: false };
  assert.equal(isRateAvailable(spx), true);
  assert.equal(isRateAvailable(spx, true), true);
  assert.equal(isRateAvailable({ ...spx, unsupportedOriginSpx: true }), false);
  assert.equal(isRateAvailable({ ...spx, unsupported: true }), false);
  assert.equal(isRateAvailable({ price: 9000, unsupported: false, unsupported_cod: true }), true);
  assert.equal(isRateAvailable({ price: 9000, unsupported: false, unsupported_cod: true }, true), false);
  assert.equal(isRateAvailable({ price: 9000, unsupported: null, unsupported_cod: null }, true), true);
});

test("estimate surfaces Invalid courier and COURIER_DISABLED as MengantarError", async () => {
  const invalid = new MengantarClient({
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify({ success: false, message: "Invalid courier" }), { status: 400 }),
  });
  await assert.rejects(
    invalid.estimate({ originId: "o", destinationId: "d", courier: "Sap" }),
    (e: unknown) => e instanceof MengantarError && e.status === 400 && e.message === "Invalid courier",
  );

  const disabled = new MengantarClient({
    apiKey: "test-key",
    fetchImpl: async () => new Response(
      JSON.stringify({ success: false, message: "Courier is not available", code: "COURIER_DISABLED" }),
      { status: 400 },
    ),
  });
  await assert.rejects(
    disabled.estimate({ originId: "o", destinationId: "d", courier: "Ninja" }),
    (e: unknown) => e instanceof MengantarError && e.code === "COURIER_DISABLED",
  );
});
