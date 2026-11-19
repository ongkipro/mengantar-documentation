import assert from "node:assert/strict";
import test from "node:test";

import {
  isNotAllowed,
  isRateAvailable,
  paidResult,
  MengantarClient,
  MengantarError,
  posCodIneligibility,
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

test("posCodIneligibility recognises only the documented Pos COD 403 statuses", async () => {
  const refusing = (status: number, body: unknown) =>
    new MengantarClient({ apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify(body), { status }) });
  const order = { courier: "pos" as const, pickup: { type: "dropOff" as const, address_id: "a" }, orders: [] };
  const caught = (client: MengantarClient) => client.createOrder(order).then(() => null, (e: unknown) => e);

  const blocked = await caught(refusing(403, {
    success: false, message: "Pos Indonesia COD is not available for this account",
    status: "blocked", deliveredRate: 70, minimumDeliveredRate: 82,
  }));
  assert.deepEqual(posCodIneligibility(blocked), { status: "blocked", deliveredRate: 70, minimumDeliveredRate: 82 });

  const newSeller = await caught(refusing(403, { success: false, message: "x", status: "new_seller", deliveredRate: 0 }));
  assert.deepEqual(posCodIneligibility(newSeller), { status: "new_seller", deliveredRate: 0, minimumDeliveredRate: null });

  assert.equal(posCodIneligibility(await caught(refusing(403, { success: false, message: "Forbidden" }))), null);
  assert.equal(posCodIneligibility(await caught(refusing(400, { success: false, message: "x", status: "blocked" }))), null);
  assert.equal(posCodIneligibility(new Error("x")), null);
});

test("createOrder sends idempotencyKey as a header and validates its length", async () => {
  const seen: Headers[] = [];
  const client = new MengantarClient({
    apiKey: "test-key",
    fetchImpl: async (_url, init) => {
      seen.push(new Headers(init?.headers));
      return new Response(JSON.stringify({ success: true, data: [], batch_id: "b1", idempotentReplayed: true }),
        { headers: { "Idempotent-Replayed": "true" } });
    },
  });
  const order = {
    courier: "JNE" as const,
    pickup: { type: "dropOff" as const, address_id: "pickup-id" },
    orders: [{ customerAddressDataId: "d", customerAddress: "a", customerName: "n", customerPhone: "08111111111",
      parcelContent: "x", weight: 1, quantity: 1, goodsValue: 1000 }],
  };
  const replay = await client.createOrder(order, { idempotencyKey: "  INV-2026-0001  " });
  assert.equal(seen[0].get("idempotencyKey"), "INV-2026-0001");
  assert.equal(replay.idempotentReplayed, true);
  await client.createOrder(order);
  assert.equal(seen[1].get("idempotencyKey"), null);
  for (const bad of ["", "   ", "x".repeat(51)]) {
    assert.throws(() => client.createOrder(order, { idempotencyKey: bad }),
      (e: unknown) => e instanceof MengantarError && e.code === "IDEMPOTENCY_KEY_INVALID");
  }
  assert.equal(seen.length, 2, "an invalid key must not reach the network");
});

test("idempotency 409s keep their body code and Retry-After", async () => {
  const client = new MengantarClient({
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify({ success: false, code: "IDEMPOTENCY_REQUEST_IN_PROGRESS",
      message: "still processing" }), { status: 409, headers: { "Retry-After": "10" } }),
  });
  const err = await client.createOrder({ courier: "JNE", pickup: { type: "dropOff", address_id: "p" }, orders: [] },
    { idempotencyKey: "INV-1" }).then(() => null, (e: unknown) => e);
  assert.ok(err instanceof MengantarError);
  assert.equal(err.code, "IDEMPOTENCY_REQUEST_IN_PROGRESS");
  assert.equal(err.retryAfter, "10");
  const plain = new MengantarClient({ apiKey: "k", fetchImpl: async () =>
    new Response(JSON.stringify({ success: false, message: "Sedang ada proses pembuatan order JT Premium" }), { status: 409 }) });
  const e2 = await plain.createOrder({ courier: "JT", pickup: { type: "dropOff", address_id: "p" }, orders: [] })
    .then(() => null, (e: unknown) => e);
  assert.ok(e2 instanceof MengantarError);
  assert.equal(e2.code, "409", "batch-concurrency 409 without a body code stays 409");
});

test("simulateOrderStatus posts to the sandbox-only simulation route", async () => {
  const calls: { url: string; body: string }[] = [];
  const client = new MengantarClient({
    apiKey: "test-key",
    fetchImpl: async (url, init) => { calls.push({ url: String(url), body: String(init?.body) });
      return new Response(JSON.stringify({ success: true, data: { statusCategory: "DELIVERED" } })); },
  });
  await client.simulateOrderStatus({ courier: "JNE", orderId: "240429Q34UPQ", statusCategory: "DELIVERED" });
  assert.match(calls[0].url, /\/api\/public\/test-key\/order\/simulation$/);
  assert.deepEqual(JSON.parse(calls[0].body), { courier: "JNE", orderId: "240429Q34UPQ", statusCategory: "DELIVERED" });
});

test("a replayed 5xx keeps idempotentReplayed and an empty body code does not hide the status", async () => {
  const client = new MengantarClient({
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify({ success: false, message: "Error on createOrderFunction",
      idempotentReplayed: true }), { status: 500, headers: { "Idempotent-Replayed": "true" } }),
  });
  const err = await client.createOrder({ courier: "JNE", pickup: { type: "dropOff", address_id: "p" }, orders: [] },
    { idempotencyKey: "INV-1" }).then(() => null, (e: unknown) => e);
  assert.ok(err instanceof MengantarError);
  assert.equal(err.status, 500);
  assert.equal(err.idempotentReplayed, true, "a replayed 5xx must not be retried with the same key");
  const blank = new MengantarClient({ apiKey: "k", fetchImpl: async () =>
    new Response(JSON.stringify({ success: false, code: "", message: "busy" }), { status: 409 }) });
  const e2 = await blank.createOrder({ courier: "JT", pickup: { type: "dropOff", address_id: "p" }, orders: [] })
    .then(() => null, (e: unknown) => e);
  assert.ok(e2 instanceof MengantarError);
  assert.equal(e2.code, "409");
});

// ── Docs v2.0.0 sync (2026-11-19) ────────────────────────────────────────────

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

test("isNotAllowed recognises the uniform v2 403 and nothing else", async () => {
  const deny = new MengantarClient({ apiKey: "k", fetchImpl: async () => new Response(JSON.stringify({ success: false, message: "Not allowed" }), { status: 403 }) });
  await assert.rejects(deny.listOrigins(), (e: unknown) => isNotAllowed(e) && (e as MengantarError).code === undefined);
  const pos = new MengantarError("x", 403, { success: false, message: "Pos Indonesia COD is not available for this account", status: "blocked" });
  assert.equal(isNotAllowed(pos), false);
  assert.equal(isNotAllowed(new MengantarError("x", 400, { message: "Not allowed" })), false);
});

test("X000-X003 text in a message is no longer turned into a code", async () => {
  const c = new MengantarClient({ apiKey: "k", fetchImpl: async () => new Response(JSON.stringify({ success: false, message: "X001 key expired" }), { status: 400 }) });
  await assert.rejects(c.listOrigins(), (e: unknown) => e instanceof MengantarError && e.code === undefined);
});

test("pickup slots are two-digit and listPickupTimes sends optional address + courier", async () => {
  const urls: string[] = [];
  const c = new MengantarClient({ apiKey: "k", fetchImpl: async (u) => { urls.push(String(u)); return ok({ success: true, data: [] }); } });
  await c.addPickupTime("addr", "2026-11-30", "09:00");
  await c.listPickupTimes();
  await c.listPickupTimes("addr", "JNE");
  assert.match(urls[1], /\/time$/);
  assert.match(urls[2], /\/time\?address=addr&courier=JNE$/);
});

test("listOrigins forwards search/paging and refuses page without size", async () => {
  const urls: string[] = [];
  const c = new MengantarClient({ apiKey: "k", fetchImpl: async (u) => { urls.push(String(u)); return ok({ success: true, data: [] }); } });
  await c.listOrigins({ keyword: "gudang", page: 1, size: 20 });
  assert.match(urls[0], /\/address\?keyword=gudang&page=1&size=20$/);
  assert.throws(() => c.listOrigins({ page: 1 }), /page dan size/);
});

test("iterateOrders follows nextCursor until it is empty", async () => {
  const urls: string[] = [];
  const pages = [
    { success: true, data: [{ _id: "a" }, { _id: "b" }], nextCursor: "C1" },
    { success: true, data: [{ _id: "c" }], nextCursor: "" },
  ];
  const c = new MengantarClient({ apiKey: "k", fetchImpl: async (u) => { urls.push(String(u)); return ok(pages[urls.length - 1]); } });
  const ids: string[] = [];
  for await (const o of c.iterateOrders({ courier: "JT", size: 2 })) ids.push(o._id);
  assert.deepEqual(ids, ["a", "b", "c"]);
  assert.doesNotMatch(urls[0], /cursor=/);
  assert.match(urls[1], /cursor=C1/);
});

test("deleteOrders / deleteBatch return the full body so deletedCount can be checked", async () => {
  const c = new MengantarClient({ apiKey: "k", fetchImpl: async () => ok({ success: true, data: {}, message: "0 orders are deleted from 2 selected orders", deletedCount: 0, deletedOrderIds: [] }) });
  const r = await c.deleteOrders(["x", "y"], "JT");
  assert.equal(r.deletedCount, 0);
  const b = new MengantarClient({ apiKey: "k", fetchImpl: async () => ok({ success: true, data: { isDeleted: true }, deletedCount: 1, unDeletedCount: 2, totalCount: 3 }) });
  assert.equal((await b.deleteBatch("B", "JT")).unDeletedCount, 2);
});

test("paidResult normalises both official pay-unpaid shapes", async () => {
  const jt = new MengantarClient({ apiKey: "k", fetchImpl: async () => ok({ success: true, data: 2, cnote_no: ["JT1", "JT2"] }) });
  assert.deepEqual(paidResult(await jt.payUnpaid("b", "JT")), { count: 2, cnote_no: ["JT1", "JT2"] });
  const lion = new MengantarClient({ apiKey: "k", fetchImpl: async () => ok({ success: true, data: { cnote_no: ["L1"], count: 1 } }) });
  assert.deepEqual(paidResult(await lion.payUnpaid("b", "lion")), { count: 1, cnote_no: ["L1"] });
});

test("a body that fails mid-read is a MengantarError, not a raw exception", async () => {
  const c = new MengantarClient({ apiKey: "k", fetchImpl: async () => new Response(new ReadableStream({ start(ctl) { ctl.error(new Error("reset")); } }), { status: 200 }) });
  await assert.rejects(c.listOrigins(), (e: unknown) => e instanceof MengantarError && e.status === 0);
});
