import assert from "node:assert/strict";
import test from "node:test";

import { MengantarClient, toMengantarDate } from "./mengantar-client.ts";

test("toMengantarDate normalizes supported formats and rejects impossible dates", () => {
  assert.equal(toMengantarDate("2026-07-10"), "07-10-2026");
  assert.equal(toMengantarDate("07-10-2026"), "07-10-2026");
  assert.throws(() => toMengantarDate("2026-02-30"), /Tanggal pickup tidak valid/);
  assert.throws(() => toMengantarDate("13-10-2026"), /Tanggal pickup tidak valid/);
  assert.throws(() => toMengantarDate("July 10, 2026"), /Tanggal pickup tidak valid/);
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

test("listInvoices preserves top-level count and balance", async () => {
  const client = new MengantarClient({
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify({ success: true, data: [], count: 2, balance: 150_000 })),
  });

  const invoices = await client.listInvoices();
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
    courier: "JNE",
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
